import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, spacing, fontSize } from '../../constants/theme';

// Import animations
const correctAnimation = require('../../../assets/animations/Correct.json');
const incorrectAnimation = require('../../../assets/animations/incorrect.json');

export type FeedbackType = 'correct' | 'incorrect' | null;

interface FeedbackAnimationProps {
  type: FeedbackType;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 160,
};

export function FeedbackAnimation({ 
  type, 
  message,
  size = 'md',
  showMessage = true,
}: FeedbackAnimationProps) {
  if (!type) return null;

  const animationSize = sizeMap[size];
  const source = type === 'correct' ? correctAnimation : incorrectAnimation;
  
  const defaultMessage = type === 'correct' 
    ? 'Great job!' 
    : 'Try again!';

  return (
    <View style={styles.container}>
      <LottieView
        source={source}
        autoPlay
        loop={false}
        style={{ width: animationSize, height: animationSize }}
      />
      {showMessage && (
        <Text style={[
          styles.message,
          type === 'correct' ? styles.correctText : styles.incorrectText
        ]}>
          {message || defaultMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  correctText: {
    color: colors.success,
  },
  incorrectText: {
    color: colors.error,
  },
});
