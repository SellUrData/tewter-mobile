import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows, gradients } from '../../constants/theme';

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'accent' | 'warm' | 'subtle';
}

export function GradientCard({ 
  children, 
  style, 
  padding = 'md', 
  variant = 'primary' 
}: GradientCardProps) {
  const getGradientColors = (): [string, string, ...string[]] => {
    switch (variant) {
      case 'success':
        return [gradients.success[0], gradients.success[1]];
      case 'accent':
        return [gradients.accent[0], gradients.accent[1]];
      case 'warm':
        return [gradients.warm[0], gradients.warm[1]];
      case 'subtle':
        return [colors.card, colors.cardElevated];
      default:
        return [gradients.primary[0], gradients.primary[1]];
    }
  };

  return (
    <View style={[styles.container, shadows.md, style]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, styles[`padding_${padding}`]]}
      >
        {/* Top shine effect */}
        <View style={styles.shine} pointerEvents="none" />
        
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    position: 'relative',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    position: 'relative',
  },
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
