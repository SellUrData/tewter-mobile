import React from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'glow' | 'success' | 'interactive';
}

export function Card({ children, style, padding = 'md', variant = 'default' }: CardProps) {
  const cardStyles = [
    styles.card,
    styles[`padding_${padding}`],
    variant === 'elevated' && styles.elevated,
    variant === 'glow' && styles.glow,
    variant === 'success' && styles.success,
    variant === 'interactive' && styles.interactive,
    style,
  ];

  return (
    <View style={cardStyles}>
      {/* Subtle inner highlight for depth */}
      <View style={styles.innerHighlight} pointerEvents="none" />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    // Default subtle shadow
    ...shadows.sm,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    position: 'relative',
  },
  // Variants
  elevated: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.cardBorder,
    ...shadows.md,
  },
  glow: {
    backgroundColor: colors.card,
    borderColor: colors.primaryDark,
    ...shadows.glow,
  },
  success: {
    backgroundColor: colors.card,
    borderColor: colors.success + '40',
    ...shadows.success,
  },
  interactive: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  // Padding variants
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.md,
  },
  padding_lg: {
    padding: spacing.lg,
  },
});
