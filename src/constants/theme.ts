export const colors = {
  // Primary brand colors - vibrant and engaging
  primary: '#6366f1',        // Indigo - more vibrant than plain blue
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryGlow: 'rgba(99, 102, 241, 0.3)',
  
  // Secondary accent - for variety and visual interest
  accent: '#f472b6',         // Pink accent for highlights
  accentLight: '#f9a8d4',
  accentDark: '#ec4899',
  
  // Background layers - subtle depth
  background: '#0f0f14',     // Slightly purple-tinted dark
  backgroundElevated: '#16161d',
  card: '#1c1c26',           // Warmer dark with slight purple
  cardElevated: '#242432',   // Lifted card state
  cardBorder: '#2a2a3c',     // Softer border
  cardGlow: 'rgba(99, 102, 241, 0.08)',
  
  // Text with better contrast
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textSecondary: '#64748b',
  
  // Status colors - more vibrant
  success: '#10b981',        // Emerald - feels more alive
  successLight: '#34d399',
  successGlow: 'rgba(16, 185, 129, 0.2)',
  
  error: '#f43f5e',          // Rose - warmer red
  errorLight: '#fb7185',
  errorGlow: 'rgba(244, 63, 94, 0.2)',
  
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningGlow: 'rgba(245, 158, 11, 0.2)',
  
  // Utility
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Gradient presets for focal points
export const gradients = {
  primary: ['#6366f1', '#8b5cf6'],        // Indigo to purple
  success: ['#10b981', '#14b8a6'],        // Emerald to teal
  accent: ['#f472b6', '#c084fc'],         // Pink to purple
  warm: ['#f59e0b', '#f97316'],           // Amber to orange
  card: ['#1c1c26', '#242432'],           // Subtle card gradient
  glow: ['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.05)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 6,       // Slightly softer
  md: 12,      // More rounded
  lg: 16,      // Friendly corners
  xl: 20,      // Very soft
  xxl: 28,     // For large elements
  full: 9999,
};

// Shadow presets for depth (iOS and Android compatible)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  success: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
