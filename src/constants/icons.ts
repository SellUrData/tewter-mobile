/**
 * Consistent Icon System for Tewter
 * 
 * Design Philosophy:
 * - Use abstract/stylized emoji that feel playful and educational
 * - Avoid realistic objects (camera, controller) that break abstraction
 * - Group by function, not appearance
 * - All icons should feel cohesive and "Tewter-branded"
 */

export const icons = {
  // Navigation & Core Features
  home: '🏠',
  practice: '✏️',        // Pencil - universal learning symbol
  leaderboard: '🏆',
  profile: '👤',
  
  // Learning Modes
  mathPractice: '📐',    // Math/geometry - abstract
  mentalMath: '🧠',      // Brain - represents mental calculation
  snapSolve: '✨',       // Sparkle - magic/instant solution
  multiplayer: '⚡',     // Lightning - competition/speed
  
  // Progress & Achievements
  streak: '🔥',
  star: '⭐',
  trophy: '🏆',
  medal: '🥇',
  check: '✓',
  target: '🎯',
  
  // Feedback
  correct: '✨',
  incorrect: '💭',       // Thought bubble - "think again"
  hint: '💡',
  
  // Stats
  problems: '✅',
  time: '⏱️',
  weekly: '📊',
  
  // Topics (Abstract representations)
  algebra: '🔢',
  calculus: '∫',         // Integral symbol (text)
  geometry: '📐',
  trigonometry: '📈',
  precalculus: '🔣',
  
  // Difficulty
  easy: '🌱',            // Growing - beginner
  medium: '🌿',          // Growing more
  hard: '🌳',            // Full grown - mastery
  
  // Actions
  start: '▶️',
  next: '→',
  back: '←',
  settings: '⚙️',
  
  // Misc
  featured: '⭐',
  new: '✨',
  locked: '🔒',
  unlocked: '🔓',
};

// Topic icon mapping for consistent display
export const topicIcons: Record<string, string> = {
  'algebra': '🔢',
  'calculus': '📈',
  'geometry': '📐',
  'trigonometry': '📊',
  'precalculus': '🔣',
  'statistics': '📉',
};

// Subtopic icons - more specific but still abstract
export const subtopicIcons: Record<string, string> = {
  'linear-equations': '➗',
  'quadratic-equations': '📊',
  'systems-of-equations': '🔀',
  'polynomials': '📈',
  'derivatives': '📉',
  'integrals': '∫',
  'limits': '🎯',
  'triangles': '📐',
  'circles': '⭕',
  'unit-circle': '🔄',
  'trig-identities': '🔣',
};

// Get icon for a topic/subtopic with fallback
export const getTopicIcon = (id: string): string => {
  return topicIcons[id] || subtopicIcons[id] || '📚';
};
