import React, { useRef } from 'react';
import { 
  Pressable, 
  View, 
  StyleSheet, 
  ViewStyle, 
  Animated 
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

interface TouchableCardProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'glow';
  disabled?: boolean;
}

export function TouchableCard({ 
  children, 
  onPress,
  style, 
  padding = 'md', 
  variant = 'default',
  disabled = false,
}: TouchableCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.card,
          styles[`padding_${padding}`],
          variant === 'elevated' && styles.elevated,
          variant === 'glow' && styles.glow,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        {/* Subtle inner highlight for depth */}
        <View style={styles.innerHighlight} pointerEvents="none" />
        
        <View style={styles.content}>
          {children}
        </View>
      </Pressable>
    </Animated.View>
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
    ...shadows.sm,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    position: 'relative',
  },
  pressed: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.primary + '40',
  },
  elevated: {
    backgroundColor: colors.cardElevated,
    ...shadows.md,
  },
  glow: {
    borderColor: colors.primary + '60',
    ...shadows.glow,
  },
  disabled: {
    opacity: 0.5,
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
