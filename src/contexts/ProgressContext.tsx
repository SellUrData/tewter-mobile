import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tewter_progress';
const MAX_TIME_PER_PROBLEM_SECONDS = 600; // 10 minute cap per problem

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
  // Actions
  startProblem: () => void;
  completeProblem: (topicId: string) => void;
  getTodayStats: () => DailyStats | null;
  getWeekStats: () => { problems: number; timeMinutes: number };
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
  const [progress, setProgress] = useState<ProgressData>(defaultProgress);
  const [loading, setLoading] = useState(true);
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);

  // Load progress from storage
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
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
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newProgress: ProgressData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Failed to save progress:', error);
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
      startProblem, 
      completeProblem,
      getTodayStats,
      getWeekStats,
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
