import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

const mascot = require('../../../assets/mascot.png');

export type MascotMood = 'idle' | 'thinking' | 'happy' | 'celebrating' | 'encouraging' | 'hint';

interface MascotReactionProps {
  mood: MascotMood;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showBubble?: boolean;
}

const moodConfig: Record<MascotMood, { emoji: string; defaultMessage: string; color: string }> = {
  idle: {
    emoji: '',
    defaultMessage: '',
    color: colors.primary,
  },
  thinking: {
    emoji: '🤔',
    defaultMessage: 'Hmm...',
    color: colors.primary,
  },
  happy: {
    emoji: '✨',
    defaultMessage: 'Nice work!',
    color: colors.success,
  },
  celebrating: {
    emoji: '🎉',
    defaultMessage: 'Amazing!',
    color: colors.success,
  },
  encouraging: {
    emoji: '💪',
    defaultMessage: 'You got this!',
    color: colors.warning,
  },
  hint: {
    emoji: '💡',
    defaultMessage: 'Need a hint?',
    color: colors.accent,
  },
};

const sizeConfig = {
  sm: { mascot: 40, emoji: 16, bubble: 12 },
  md: { mascot: 60, emoji: 20, bubble: 14 },
  lg: { mascot: 80, emoji: 28, bubble: 16 },
};

export function MascotReaction({ 
  mood, 
  message, 
  size = 'md',
  showBubble = true,
}: MascotReactionProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  const config = moodConfig[mood];
  const sizes = sizeConfig[size];

  useEffect(() => {
    // Reset animations
    bounceAnim.setValue(0);
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    bubbleAnim.setValue(0);

    if (mood === 'idle') return;

    // Bubble fade in
    if (showBubble && config.defaultMessage) {
      Animated.spring(bubbleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }).start();
    }

    // Different animations for different moods
    switch (mood) {
      case 'happy':
      case 'celebrating':
        // Bounce up and down with excitement
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 200,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start();
        
        // Scale pulse
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
          }),
        ]).start();
        break;

      case 'encouraging':
        // Gentle nod/wiggle
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 0.05,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -0.05,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ).start();
        break;

      case 'thinking':
        // Slow side-to-side
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 0.03,
              duration: 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -0.03,
              duration: 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ).start();
        break;

      case 'hint':
        // Bounce once to get attention
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 0,
            useNativeDriver: true,
            speed: 20,
          }),
        ]).start();
        break;
    }
  }, [mood]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  const displayMessage = message || config.defaultMessage;

  return (
    <View style={styles.container}>
      {/* Speech Bubble */}
      {showBubble && displayMessage && mood !== 'idle' && (
        <Animated.View 
          style={[
            styles.bubble,
            { 
              backgroundColor: config.color + '20',
              borderColor: config.color + '40',
              opacity: bubbleAnim,
              transform: [
                { scale: bubbleAnim },
                { translateY: bubbleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                })},
              ],
            },
          ]}
        >
          <Text style={[styles.bubbleEmoji, { fontSize: sizes.emoji }]}>
            {config.emoji}
          </Text>
          <Text style={[styles.bubbleText, { fontSize: sizes.bubble, color: config.color }]}>
            {displayMessage}
          </Text>
        </Animated.View>
      )}

      {/* Mascot */}
      <Animated.View
        style={[
          styles.mascotContainer,
          {
            transform: [
              { translateY: bounceAnim },
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <Image 
          source={mascot} 
          style={[
            styles.mascot, 
            { width: sizes.mascot, height: sizes.mascot }
          ]} 
          resizeMode="contain" 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    // Size set dynamically
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  bubbleEmoji: {
    // Size set dynamically
  },
  bubbleText: {
    fontWeight: '600',
  },
});
