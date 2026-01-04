import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView, { AnimationObject } from 'lottie-react-native';

// Animation source type - matches lottie-react-native types
type AnimationSource = string | AnimationObject | { uri: string };

export interface LottieAnimationProps {
  source: AnimationSource;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: ViewStyle;
  size?: number | { width: number; height: number };
  onAnimationFinish?: () => void;
}

export function LottieAnimation({
  source,
  autoPlay = true,
  loop = true,
  speed = 1,
  style,
  size = 100,
  onAnimationFinish,
}: LottieAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  // Calculate dimensions
  const dimensions = typeof size === 'number' 
    ? { width: size, height: size }
    : size;

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  return (
    <View style={[styles.container, dimensions, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={styles.animation}
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
}

// Imperative control hook
export function useLottieAnimation() {
  const ref = useRef<LottieView>(null);

  return {
    ref,
    play: () => ref.current?.play(),
    pause: () => ref.current?.pause(),
    reset: () => ref.current?.reset(),
  };
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
