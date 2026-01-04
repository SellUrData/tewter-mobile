import React, { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

const fireAnimation = require('../../../assets/animations/Fire.json');

interface FireAnimationProps {
  size?: number;
  style?: ViewStyle;
}

export function FireAnimation({ size = 32, style }: FireAnimationProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Play only the first portion of the animation (frames 0-30 out of ~60)
    // This avoids the fade-out at the end
    if (animationRef.current) {
      animationRef.current.play(0, 30);
    }
    
    // Set up interval to restart the animation loop
    const interval = setInterval(() => {
      if (animationRef.current) {
        animationRef.current.play(0, 30);
      }
    }, 1000); // Restart every second
    
    return () => clearInterval(interval);
  }, []);

  return (
    <LottieView
      ref={animationRef}
      source={fireAnimation}
      loop={false}
      style={[{ width: size, height: size }, style]}
    />
  );
}

const styles = StyleSheet.create({});
