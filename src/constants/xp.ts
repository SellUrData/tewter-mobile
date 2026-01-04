// XP System Configuration
// No level cap - exponential scaling makes higher levels progressively harder

// Base XP rewards
export const XP_REWARDS = {
  // Practice sessions
  PROBLEM_COMPLETE: 25,           // Base XP for completing a problem
  STEP_COMPLETE: 5,               // XP per step in step-by-step mode
  SESSION_COMPLETE: 50,           // Bonus for completing a practice session
  
  // Multiplayer
  MULTIPLAYER_WIN: 100,           // Winning a multiplayer game
  MULTIPLAYER_PARTICIPATION: 25,  // Just for playing
  
  // Mental Math (Arithmetic)
  ARITHMETIC_CORRECT: 10,         // Per correct answer in speed drills
  ARITHMETIC_STREAK_5: 25,        // Bonus for 5 in a row
  ARITHMETIC_STREAK_10: 75,       // Bonus for 10 in a row
  
  // One-time mastery bonuses (per subtopic)
  FIRST_PROBLEM_IN_TOPIC: 50,     // First problem completed in a topic
  SUBTOPIC_MASTERY: 200,          // Complete 10 problems in a subtopic with 80%+ accuracy
  TOPIC_MASTERY: 500,             // Complete all subtopics in a topic
};

// Accuracy multipliers - applied to problem completion XP
export const ACCURACY_MULTIPLIERS = {
  PERFECT: 2.0,      // 100% - no mistakes
  EXCELLENT: 1.5,    // 90-99%
  GOOD: 1.2,         // 80-89%
  AVERAGE: 1.0,      // 70-79%
  STRUGGLING: 0.8,   // 60-69%
  POOR: 0.5,         // Below 60%
};

// Difficulty multipliers - based on problem/topic difficulty
export const DIFFICULTY_MULTIPLIERS = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

// Streak bonuses - daily streak multiplier
export const STREAK_BONUSES = {
  BASE: 1.0,
  DAY_3: 1.1,    // 3+ day streak
  DAY_7: 1.25,   // 7+ day streak (1 week)
  DAY_14: 1.4,   // 14+ day streak (2 weeks)
  DAY_30: 1.5,   // 30+ day streak (1 month)
  DAY_60: 1.75,  // 60+ day streak (2 months)
  DAY_100: 2.0,  // 100+ day streak
};

// Level calculation using exponential scaling
// XP required = BASE * (level ^ EXPONENT)
// This means each level requires progressively more XP
const LEVEL_BASE = 100;
const LEVEL_EXPONENT = 1.5;

/**
 * Calculate XP required to reach a specific level
 * Level 1 = 0 XP (starting point)
 * Level 2 = 100 XP
 * Level 3 = 283 XP
 * Level 5 = 559 XP
 * Level 10 = 3,162 XP
 * Level 20 = 17,889 XP
 * Level 50 = 176,777 XP
 * Level 100 = 1,000,000 XP
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_BASE * Math.pow(level, LEVEL_EXPONENT));
}

/**
 * Calculate current level from total XP
 * Inverse of the level formula
 */
export function getLevelFromXP(totalXP: number): number {
  if (totalXP <= 0) return 1;
  const level = Math.floor(Math.pow(totalXP / LEVEL_BASE, 1 / LEVEL_EXPONENT));
  return Math.max(1, level);
}

/**
 * Get XP progress within current level (0-1)
 */
export function getLevelProgress(totalXP: number): number {
  const currentLevel = getLevelFromXP(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  
  const xpIntoLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  
  return Math.min(1, Math.max(0, xpIntoLevel / xpNeededForLevel));
}

/**
 * Get XP needed to reach next level
 */
export function getXPToNextLevel(totalXP: number): number {
  const currentLevel = getLevelFromXP(totalXP);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return Math.max(0, nextLevelXP - totalXP);
}

/**
 * Get accuracy multiplier based on percentage
 */
export function getAccuracyMultiplier(accuracy: number): number {
  if (accuracy >= 100) return ACCURACY_MULTIPLIERS.PERFECT;
  if (accuracy >= 90) return ACCURACY_MULTIPLIERS.EXCELLENT;
  if (accuracy >= 80) return ACCURACY_MULTIPLIERS.GOOD;
  if (accuracy >= 70) return ACCURACY_MULTIPLIERS.AVERAGE;
  if (accuracy >= 60) return ACCURACY_MULTIPLIERS.STRUGGLING;
  return ACCURACY_MULTIPLIERS.POOR;
}

/**
 * Get streak bonus multiplier based on current streak
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 100) return STREAK_BONUSES.DAY_100;
  if (streakDays >= 60) return STREAK_BONUSES.DAY_60;
  if (streakDays >= 30) return STREAK_BONUSES.DAY_30;
  if (streakDays >= 14) return STREAK_BONUSES.DAY_14;
  if (streakDays >= 7) return STREAK_BONUSES.DAY_7;
  if (streakDays >= 3) return STREAK_BONUSES.DAY_3;
  return STREAK_BONUSES.BASE;
}

/**
 * Calculate total XP for completing a problem
 */
export function calculateProblemXP(params: {
  baseXP?: number;
  accuracy: number;           // 0-100
  difficulty: 'easy' | 'medium' | 'hard';
  streakDays: number;
  stepsCompleted?: number;
  isFirstInTopic?: boolean;
}): { total: number; breakdown: XPBreakdown } {
  const {
    baseXP = XP_REWARDS.PROBLEM_COMPLETE,
    accuracy,
    difficulty,
    streakDays,
    stepsCompleted = 0,
    isFirstInTopic = false,
  } = params;

  const accuracyMult = getAccuracyMultiplier(accuracy);
  const difficultyMult = DIFFICULTY_MULTIPLIERS[difficulty];
  const streakMult = getStreakMultiplier(streakDays);

  // Calculate components
  const baseAmount = Math.floor(baseXP * difficultyMult);
  const accuracyBonus = Math.floor(baseAmount * (accuracyMult - 1));
  const streakBonus = Math.floor(baseAmount * (streakMult - 1));
  const stepBonus = stepsCompleted * XP_REWARDS.STEP_COMPLETE;
  const firstTopicBonus = isFirstInTopic ? XP_REWARDS.FIRST_PROBLEM_IN_TOPIC : 0;

  const total = baseAmount + accuracyBonus + streakBonus + stepBonus + firstTopicBonus;

  return {
    total,
    breakdown: {
      base: baseAmount,
      accuracy: accuracyBonus,
      streak: streakBonus,
      steps: stepBonus,
      firstTopic: firstTopicBonus,
    },
  };
}

export interface XPBreakdown {
  base: number;
  accuracy: number;
  streak: number;
  steps: number;
  firstTopic: number;
}

// Level titles for display
export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Grandmaster';
  if (level >= 75) return 'Master';
  if (level >= 50) return 'Expert';
  if (level >= 35) return 'Advanced';
  if (level >= 25) return 'Proficient';
  if (level >= 15) return 'Intermediate';
  if (level >= 10) return 'Apprentice';
  if (level >= 5) return 'Beginner';
  return 'Novice';
}
