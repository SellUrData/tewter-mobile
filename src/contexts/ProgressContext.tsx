import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { fetchCloudProgress, syncProgressToCloud, mergeProgress, LocalProgress } from '../lib/progressSync';

const STORAGE_KEY_PREFIX = '@tewter_progress_';
const GUEST_STORAGE_KEY = '@tewter_progress_guest';
const MAX_TIME_PER_PROBLEM_SECONDS = 600; // 10 minute cap per problem
const SYNC_DEBOUNCE_MS = 5000; // Sync to cloud after 5 seconds of inactivity

interface DailyStats {
  date: string; // YYYY-MM-DD
  problemsCompleted: number;
  timeSpentSeconds: number;
}

interface ProgressData {
  totalProblemsCompleted: number;
  totalTimeSpentSeconds: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null; // YYYY-MM-DD
  dailyStats: DailyStats[];
  problemsByTopic: Record<string, number>;
}

interface ProgressContextType {
  progress: ProgressData;
  loading: boolean;
  syncing: boolean;
  // Actions
  startProblem: () => void;
  completeProblem: (topicId: string) => void;
  getTodayStats: () => DailyStats | null;
  getWeekStats: () => { problems: number; timeMinutes: number };
  refreshFromCloud: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const defaultProgress: ProgressData = {
  totalProblemsCompleted: 0,
  totalTimeSpentSeconds: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  dailyStats: [],
  problemsByTopic: {},
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isConsecutiveDay(lastDate: string | null, today: string): boolean {
  if (!lastDate) return false;
  const yesterday = getYesterday();
  return lastDate === yesterday || lastDate === today;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<string>('');
  const hasSyncedOnLoginRef = useRef(false);
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  // Get storage key for current user
  const getStorageKey = () => {
    return user ? `${STORAGE_KEY_PREFIX}${user.id}` : GUEST_STORAGE_KEY;
  };

  // Load progress on mount and when user changes
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    // Always load on first render (lastUserIdRef starts as undefined sentinel)
    // Or when user actually changes
    if (lastUserIdRef.current === undefined || currentUserId !== lastUserIdRef.current) {
      lastUserIdRef.current = currentUserId;
      hasSyncedOnLoginRef.current = false;
      loadProgress();
    }
  }, [user?.id]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        syncWithCloud();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);

  // Sync when user logs in
  useEffect(() => {
    if (user && !loading && !hasSyncedOnLoginRef.current) {
      hasSyncedOnLoginRef.current = true;
      syncWithCloud();
    }
    if (!user) {
      hasSyncedOnLoginRef.current = false;
    }
  }, [user?.id, loading]);

  const loadProgress = async () => {
    setLoading(true);
    // Reset to default first to clear old user's data
    setProgress(defaultProgress);
    
    try {
      const stored = await AsyncStorage.getItem(getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored) as ProgressData;
        
        // Check if streak should be reset (missed a day)
        const today = getToday();
        if (parsed.lastPracticeDate && 
            parsed.lastPracticeDate !== today && 
            parsed.lastPracticeDate !== getYesterday()) {
          // Streak broken - reset it
          parsed.currentStreak = 0;
        }
        
        setProgress(parsed);
      }
      // If no stored data, defaultProgress is already set
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithCloud = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const cloudProgress = await fetchCloudProgress(user.id);
      
      // Get current local progress
      const stored = await AsyncStorage.getItem(getStorageKey());
      const localProgress = stored ? JSON.parse(stored) as ProgressData : defaultProgress;
      
      if (cloudProgress) {
        // Merge cloud and local data
        const localData: LocalProgress = {
          totalProblemsCompleted: localProgress.totalProblemsCompleted,
          totalTimeSpentSeconds: localProgress.totalTimeSpentSeconds,
          currentStreak: localProgress.currentStreak,
          longestStreak: localProgress.longestStreak,
          lastPracticeDate: localProgress.lastPracticeDate,
          problemsByTopic: localProgress.problemsByTopic,
        };
        
        const merged = mergeProgress(localData, cloudProgress);
        
        // Update local state with merged data
        const newProgress: ProgressData = {
          ...localProgress,
          totalProblemsCompleted: merged.totalProblemsCompleted,
          totalTimeSpentSeconds: merged.totalTimeSpentSeconds,
          currentStreak: merged.currentStreak,
          longestStreak: merged.longestStreak,
          lastPracticeDate: merged.lastPracticeDate,
          problemsByTopic: merged.problemsByTopic,
        };
        
        setProgress(newProgress);
        await AsyncStorage.setItem(getStorageKey(), JSON.stringify(newProgress));
        
        // Also push local data to cloud to ensure both are in sync
        await triggerCloudSync(newProgress);
      } else {
        // No cloud data - push local to cloud
        if (localProgress.totalProblemsCompleted > 0) {
          await triggerCloudSync(localProgress);
        }
      }
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
    } finally {
      setSyncing(false);
    }
  };
  
  const refreshFromCloud = async () => {
    await syncWithCloud();
  };

  const resetProgress = async () => {
    // Clear local storage and reset to default
    try {
      await AsyncStorage.removeItem(getStorageKey());
      setProgress(defaultProgress);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  };

  const saveProgress = async (newProgress: ProgressData) => {
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(newProgress));
      
      // Debounced cloud sync when user is logged in
      if (user) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          triggerCloudSync(newProgress);
        }, SYNC_DEBOUNCE_MS);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const triggerCloudSync = async (progressData: ProgressData) => {
    if (!user) return;
    
    // Get XP data from storage for full sync
    try {
      const xpStored = await AsyncStorage.getItem('@tewter_xp_data');
      const xpData = xpStored ? JSON.parse(xpStored) : { totalXP: 0, level: 1, masteredTopics: [], masteredSubtopics: [], firstProblemTopics: [] };
      
      await syncProgressToCloud(user.id, {
        totalProblemsCompleted: progressData.totalProblemsCompleted,
        totalTimeSpentSeconds: progressData.totalTimeSpentSeconds,
        currentStreak: progressData.currentStreak,
        longestStreak: progressData.longestStreak,
        lastPracticeDate: progressData.lastPracticeDate,
        problemsByTopic: progressData.problemsByTopic,
      }, xpData);
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
    }
  };

  
  const startProblem = useCallback(() => {
    setProblemStartTime(Date.now());
  }, []);

  const completeProblem = useCallback((topicId: string) => {
    const today = getToday();
    const now = Date.now();
    
    // Calculate time spent (capped)
    let timeSpent = 0;
    if (problemStartTime) {
      const elapsed = Math.floor((now - problemStartTime) / 1000);
      timeSpent = Math.min(elapsed, MAX_TIME_PER_PROBLEM_SECONDS);
    }
    
    setProgress((prev) => {
      // Update or create today's stats
      const existingDayIndex = prev.dailyStats.findIndex(d => d.date === today);
      let newDailyStats = [...prev.dailyStats];
      
      if (existingDayIndex >= 0) {
        newDailyStats[existingDayIndex] = {
          ...newDailyStats[existingDayIndex],
          problemsCompleted: newDailyStats[existingDayIndex].problemsCompleted + 1,
          timeSpentSeconds: newDailyStats[existingDayIndex].timeSpentSeconds + timeSpent,
        };
      } else {
        newDailyStats.push({
          date: today,
          problemsCompleted: 1,
          timeSpentSeconds: timeSpent,
        });
      }
      
      // Keep only last 30 days of daily stats
      newDailyStats = newDailyStats
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);
      
      // Update streak
      let newStreak = prev.currentStreak;
      const isFirstProblemToday = !prev.dailyStats.find(d => d.date === today);
      
      if (isFirstProblemToday) {
        if (isConsecutiveDay(prev.lastPracticeDate, today)) {
          newStreak = prev.currentStreak + 1;
        } else if (prev.lastPracticeDate !== today) {
          newStreak = 1; // Starting fresh
        }
      }
      
      const newLongestStreak = Math.max(prev.longestStreak, newStreak);
      
      // Update problems by topic
      const newProblemsByTopic = {
        ...prev.problemsByTopic,
        [topicId]: (prev.problemsByTopic[topicId] || 0) + 1,
      };
      
      const newProgress: ProgressData = {
        totalProblemsCompleted: prev.totalProblemsCompleted + 1,
        totalTimeSpentSeconds: prev.totalTimeSpentSeconds + timeSpent,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPracticeDate: today,
        dailyStats: newDailyStats,
        problemsByTopic: newProblemsByTopic,
      };
      
      // Save to storage
      saveProgress(newProgress);
      
      return newProgress;
    });
    
    setProblemStartTime(null);
  }, [problemStartTime]);

  const getTodayStats = useCallback((): DailyStats | null => {
    const today = getToday();
    return progress.dailyStats.find(d => d.date === today) || null;
  }, [progress.dailyStats]);

  const getWeekStats = useCallback(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    
    const weekStats = progress.dailyStats.filter(d => d.date >= weekAgoStr);
    
    return {
      problems: weekStats.reduce((sum, d) => sum + d.problemsCompleted, 0),
      timeMinutes: Math.round(weekStats.reduce((sum, d) => sum + d.timeSpentSeconds, 0) / 60),
    };
  }, [progress.dailyStats]);

  return (
    <ProgressContext.Provider value={{ 
      progress, 
      loading,
      syncing,
      startProblem, 
      completeProblem,
      getTodayStats,
      getWeekStats,
      refreshFromCloud,
      resetProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
