import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  XP_REWARDS,
  calculateProblemXP,
  getLevelFromXP,
  getLevelProgress,
  getXPToNextLevel,
  getLevelTitle,
  XPBreakdown,
} from '../constants/xp';

const XP_STORAGE_KEY = '@tewter_xp_data';

interface XPData {
  totalXP: number;
  level: number;
  masteredTopics: string[];      // Topics with mastery bonus claimed
  masteredSubtopics: string[];   // Subtopics with mastery bonus claimed
  firstProblemTopics: string[];  // Topics where first problem bonus was claimed
}

interface XPGain {
  amount: number;
  breakdown: XPBreakdown;
  newLevel?: number;  // Set if leveled up
  leveledUp: boolean;
}

interface XPContextType {
  // Current state
  totalXP: number;
  level: number;
  levelProgress: number;
  xpToNextLevel: number;
  levelTitle: string;
  
  // Actions
  addXP: (amount: number) => Promise<{ leveledUp: boolean; newLevel: number }>;
  awardProblemXP: (params: {
    accuracy: number;
    difficulty: 'easy' | 'medium' | 'hard';
    streakDays: number;
    stepsCompleted?: number;
    topicId: string;
    subtopicId: string;
  }) => Promise<XPGain>;
  awardArithmeticXP: (correctAnswers: number, streak: number) => Promise<XPGain>;
  awardMultiplayerXP: (won: boolean) => Promise<XPGain>;
  awardMasteryXP: (type: 'subtopic' | 'topic', id: string) => Promise<XPGain | null>;
  
  // Queries
  hasFirstProblemBonus: (topicId: string) => boolean;
  hasSubtopicMastery: (subtopicId: string) => boolean;
  hasTopicMastery: (topicId: string) => boolean;
  
  // Loading state
  loading: boolean;
}

const defaultXPData: XPData = {
  totalXP: 0,
  level: 1,
  masteredTopics: [],
  masteredSubtopics: [],
  firstProblemTopics: [],
};

const XPContext = createContext<XPContextType | undefined>(undefined);

export function XPProvider({ children }: { children: ReactNode }) {
  const [xpData, setXPData] = useState<XPData>(defaultXPData);
  const [loading, setLoading] = useState(true);

  // Load XP data from storage
  useEffect(() => {
    loadXPData();
  }, []);

  const loadXPData = async () => {
    try {
      const stored = await AsyncStorage.getItem(XP_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as XPData;
        setXPData(parsed);
      }
    } catch (error) {
      console.error('Failed to load XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveXPData = async (data: XPData) => {
    try {
      await AsyncStorage.setItem(XP_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save XP data:', error);
    }
  };

  // Core function to add XP and check for level up
  const addXP = useCallback(async (amount: number): Promise<{ leveledUp: boolean; newLevel: number }> => {
    const oldLevel = xpData.level;
    const newTotalXP = xpData.totalXP + amount;
    const newLevel = getLevelFromXP(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    const newData: XPData = {
      ...xpData,
      totalXP: newTotalXP,
      level: newLevel,
    };

    setXPData(newData);
    await saveXPData(newData);

    return { leveledUp, newLevel };
  }, [xpData]);

  // Award XP for completing a problem
  const awardProblemXP = useCallback(async (params: {
    accuracy: number;
    difficulty: 'easy' | 'medium' | 'hard';
    streakDays: number;
    stepsCompleted?: number;
    topicId: string;
    subtopicId: string;
  }): Promise<XPGain> => {
    const isFirstInTopic = !xpData.firstProblemTopics.includes(params.topicId);
    
    const { total, breakdown } = calculateProblemXP({
      accuracy: params.accuracy,
      difficulty: params.difficulty,
      streakDays: params.streakDays,
      stepsCompleted: params.stepsCompleted,
      isFirstInTopic,
    });

    // Update first problem topics if needed
    if (isFirstInTopic) {
      const newData = {
        ...xpData,
        firstProblemTopics: [...xpData.firstProblemTopics, params.topicId],
      };
      setXPData(newData);
    }

    const { leveledUp, newLevel } = await addXP(total);

    return {
      amount: total,
      breakdown,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }, [xpData, addXP]);

  // Award XP for arithmetic/mental math
  const awardArithmeticXP = useCallback(async (correctAnswers: number, streak: number): Promise<XPGain> => {
    let total = correctAnswers * XP_REWARDS.ARITHMETIC_CORRECT;
    
    // Streak bonuses
    if (streak >= 10) {
      total += XP_REWARDS.ARITHMETIC_STREAK_10;
    } else if (streak >= 5) {
      total += XP_REWARDS.ARITHMETIC_STREAK_5;
    }

    const { leveledUp, newLevel } = await addXP(total);

    return {
      amount: total,
      breakdown: {
        base: correctAnswers * XP_REWARDS.ARITHMETIC_CORRECT,
        accuracy: 0,
        streak: streak >= 10 ? XP_REWARDS.ARITHMETIC_STREAK_10 : (streak >= 5 ? XP_REWARDS.ARITHMETIC_STREAK_5 : 0),
        steps: 0,
        firstTopic: 0,
      },
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }, [addXP]);

  // Award XP for multiplayer games
  const awardMultiplayerXP = useCallback(async (won: boolean): Promise<XPGain> => {
    const total = won ? XP_REWARDS.MULTIPLAYER_WIN : XP_REWARDS.MULTIPLAYER_PARTICIPATION;
    
    const { leveledUp, newLevel } = await addXP(total);

    return {
      amount: total,
      breakdown: {
        base: total,
        accuracy: 0,
        streak: 0,
        steps: 0,
        firstTopic: 0,
      },
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }, [addXP]);

  // Award one-time mastery XP
  const awardMasteryXP = useCallback(async (type: 'subtopic' | 'topic', id: string): Promise<XPGain | null> => {
    if (type === 'subtopic') {
      if (xpData.masteredSubtopics.includes(id)) return null;
      
      const newData = {
        ...xpData,
        masteredSubtopics: [...xpData.masteredSubtopics, id],
      };
      setXPData(newData);
      await saveXPData(newData);
      
      const { leveledUp, newLevel } = await addXP(XP_REWARDS.SUBTOPIC_MASTERY);
      
      return {
        amount: XP_REWARDS.SUBTOPIC_MASTERY,
        breakdown: { base: XP_REWARDS.SUBTOPIC_MASTERY, accuracy: 0, streak: 0, steps: 0, firstTopic: 0 },
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
      };
    } else {
      if (xpData.masteredTopics.includes(id)) return null;
      
      const newData = {
        ...xpData,
        masteredTopics: [...xpData.masteredTopics, id],
      };
      setXPData(newData);
      await saveXPData(newData);
      
      const { leveledUp, newLevel } = await addXP(XP_REWARDS.TOPIC_MASTERY);
      
      return {
        amount: XP_REWARDS.TOPIC_MASTERY,
        breakdown: { base: XP_REWARDS.TOPIC_MASTERY, accuracy: 0, streak: 0, steps: 0, firstTopic: 0 },
        leveledUp,
        newLevel: leveledUp ? newLevel : undefined,
      };
    }
  }, [xpData, addXP]);

  // Query functions
  const hasFirstProblemBonus = useCallback((topicId: string): boolean => {
    return xpData.firstProblemTopics.includes(topicId);
  }, [xpData.firstProblemTopics]);

  const hasSubtopicMastery = useCallback((subtopicId: string): boolean => {
    return xpData.masteredSubtopics.includes(subtopicId);
  }, [xpData.masteredSubtopics]);

  const hasTopicMastery = useCallback((topicId: string): boolean => {
    return xpData.masteredTopics.includes(topicId);
  }, [xpData.masteredTopics]);

  const value: XPContextType = {
    totalXP: xpData.totalXP,
    level: xpData.level,
    levelProgress: getLevelProgress(xpData.totalXP),
    xpToNextLevel: getXPToNextLevel(xpData.totalXP),
    levelTitle: getLevelTitle(xpData.level),
    
    addXP,
    awardProblemXP,
    awardArithmeticXP,
    awardMultiplayerXP,
    awardMasteryXP,
    
    hasFirstProblemBonus,
    hasSubtopicMastery,
    hasTopicMastery,
    
    loading,
  };

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
}
