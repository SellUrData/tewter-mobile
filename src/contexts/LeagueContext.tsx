import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { 
  League, 
  LEAGUES, 
  DEFAULT_LEAGUE, 
  getLeagueById, 
  getNextLeague, 
  getPreviousLeague,
  getPromotionStatus,
  getWeekStart,
  getTimeRemainingInWeek,
} from '../constants/leagues';

const LEAGUE_STORAGE_KEY_PREFIX = '@tewter_league_data_';
const LEAGUE_GUEST_KEY = '@tewter_league_data_guest';

interface LeagueUser {
  id: string;
  name: string;
  avatar?: string;
  weeklyXP: number;
  isCurrentUser?: boolean;
}

interface LeagueData {
  currentLeague: string;
  weeklyXP: number;
  weekStartDate: string;  // ISO string of when the week started
  lastPromotionCheck: string | null;
  leagueHistory: Array<{
    leagueId: string;
    weekStart: string;
    finalRank: number;
    result: 'promote' | 'demote' | 'safe';
  }>;
}

interface LeagueContextType {
  // Current state
  currentLeague: League;
  weeklyXP: number;
  leagueUsers: LeagueUser[];
  currentUserRank: number;
  promotionStatus: 'promote' | 'demote' | 'safe';
  timeRemaining: { days: number; hours: number; minutes: number };
  
  // Actions
  addWeeklyXP: (amount: number) => Promise<void>;
  checkWeekReset: () => Promise<boolean>;
  processWeekEnd: () => Promise<{ promoted: boolean; demoted: boolean; newLeague: League }>;
  
  // Loading state
  loading: boolean;
}

const defaultLeagueData: LeagueData = {
  currentLeague: DEFAULT_LEAGUE.id,
  weeklyXP: 0,
  weekStartDate: getWeekStart().toISOString(),
  lastPromotionCheck: null,
  leagueHistory: [],
};

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

// Get league users (only current user for now - would come from API in production)
const getLeagueUsers = (currentUserXP: number): LeagueUser[] => {
  return [{
    id: 'current_user',
    name: 'You',
    weeklyXP: currentUserXP,
    isCurrentUser: true,
  }];
};

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [leagueData, setLeagueData] = useState<LeagueData>(defaultLeagueData);
  const [leagueUsers, setLeagueUsers] = useState<LeagueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  // Get storage key for current user
  const getStorageKey = () => {
    return user ? `${LEAGUE_STORAGE_KEY_PREFIX}${user.id}` : LEAGUE_GUEST_KEY;
  };

  // Load league data from storage when user changes
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (lastUserIdRef.current === undefined || currentUserId !== lastUserIdRef.current) {
      lastUserIdRef.current = currentUserId;
      loadLeagueData();
    }
  }, [user?.id]);

  // Update league users when weekly XP changes
  useEffect(() => {
    const users = getLeagueUsers(leagueData.weeklyXP);
    setLeagueUsers(users);
  }, [leagueData.weeklyXP, leagueData.currentLeague]);

  // Update time remaining every minute
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemainingInWeek());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemainingInWeek());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadLeagueData = async () => {
    setLoading(true);
    // Reset to default first to clear old user's data
    setLeagueData(defaultLeagueData);
    
    try {
      const stored = await AsyncStorage.getItem(getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored) as LeagueData;
        
        // Check if we need to reset for a new week
        const storedWeekStart = new Date(parsed.weekStartDate);
        const currentWeekStart = getWeekStart();
        
        if (storedWeekStart < currentWeekStart) {
          // New week! Process the old week's results
          const processedData = await processWeekEndInternal(parsed);
          setLeagueData(processedData);
          await saveLeagueData(processedData);
        } else {
          setLeagueData(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load league data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLeagueData = async (data: LeagueData) => {
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save league data:', error);
    }
  };

  const processWeekEndInternal = async (data: LeagueData): Promise<LeagueData> => {
    const currentLeague = getLeagueById(data.currentLeague) || DEFAULT_LEAGUE;
    const users = getLeagueUsers(data.weeklyXP);
    const userRank = users.findIndex(u => u.isCurrentUser) + 1;
    const status = getPromotionStatus(currentLeague, userRank);
    
    let newLeagueId = data.currentLeague;
    
    if (status === 'promote') {
      const nextLeague = getNextLeague(data.currentLeague);
      if (nextLeague) {
        newLeagueId = nextLeague.id;
      }
    } else if (status === 'demote') {
      const prevLeague = getPreviousLeague(data.currentLeague);
      if (prevLeague) {
        newLeagueId = prevLeague.id;
      }
    }
    
    // Record history
    const historyEntry = {
      leagueId: data.currentLeague,
      weekStart: data.weekStartDate,
      finalRank: userRank,
      result: status,
    };
    
    return {
      currentLeague: newLeagueId,
      weeklyXP: 0,  // Reset for new week
      weekStartDate: getWeekStart().toISOString(),
      lastPromotionCheck: new Date().toISOString(),
      leagueHistory: [...data.leagueHistory, historyEntry].slice(-10), // Keep last 10 weeks
    };
  };

  const addWeeklyXP = useCallback(async (amount: number) => {
    const newData: LeagueData = {
      ...leagueData,
      weeklyXP: leagueData.weeklyXP + amount,
    };
    
    setLeagueData(newData);
    await saveLeagueData(newData);
  }, [leagueData]);

  const checkWeekReset = useCallback(async (): Promise<boolean> => {
    const storedWeekStart = new Date(leagueData.weekStartDate);
    const currentWeekStart = getWeekStart();
    
    if (storedWeekStart < currentWeekStart) {
      const processedData = await processWeekEndInternal(leagueData);
      setLeagueData(processedData);
      await saveLeagueData(processedData);
      return true;
    }
    return false;
  }, [leagueData]);

  const processWeekEnd = useCallback(async () => {
    const processedData = await processWeekEndInternal(leagueData);
    const oldLeague = getLeagueById(leagueData.currentLeague) || DEFAULT_LEAGUE;
    const newLeague = getLeagueById(processedData.currentLeague) || DEFAULT_LEAGUE;
    
    setLeagueData(processedData);
    await saveLeagueData(processedData);
    
    return {
      promoted: newLeague.id !== oldLeague.id && LEAGUES.indexOf(newLeague) > LEAGUES.indexOf(oldLeague),
      demoted: newLeague.id !== oldLeague.id && LEAGUES.indexOf(newLeague) < LEAGUES.indexOf(oldLeague),
      newLeague,
    };
  }, [leagueData]);

  // Calculate current user's rank
  const currentUserRank = leagueUsers.findIndex(u => u.isCurrentUser) + 1;
  const currentLeague = getLeagueById(leagueData.currentLeague) || DEFAULT_LEAGUE;
  const promotionStatus = getPromotionStatus(currentLeague, currentUserRank);

  const value: LeagueContextType = {
    currentLeague,
    weeklyXP: leagueData.weeklyXP,
    leagueUsers,
    currentUserRank,
    promotionStatus,
    timeRemaining,
    
    addWeeklyXP,
    checkWeekReset,
    processWeekEnd,
    
    loading,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}
