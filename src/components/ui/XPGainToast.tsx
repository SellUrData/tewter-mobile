import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { TrendUp } from 'phosphor-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { XPBreakdown } from '../../constants/xp';
import { FireAnimation } from './FireAnimation';

const starAnimation = require('../../../assets/animations/Star.json');

interface XPGainToastProps {
  amount: number;
  breakdown?: XPBreakdown;
  leveledUp?: boolean;
  newLevel?: number;
  visible: boolean;
  onHide?: () => void;
}

export function XPGainToast({
  amount,
  breakdown,
  leveledUp = false,
  newLevel,
  visible,
  onHide,
}: XPGainToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after delay
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, leveledUp ? 4000 : 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, leveledUp]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={leveledUp ? ['#7c3aed', '#4f46e5'] : [colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* XP Icon / Animation */}
          <View style={leveledUp ? styles.animationContainer : styles.iconContainer}>
            {leveledUp ? (
              <LottieView
                source={starAnimation}
                autoPlay
                loop
                style={styles.levelUpAnimation}
              />
            ) : (
              <TrendUp size={24} color={colors.white} weight="bold" />
            )}
          </View>

          {/* Main content */}
          <View style={styles.textContainer}>
            {leveledUp ? (
              <>
                <Text style={styles.levelUpText}>LEVEL UP!</Text>
                <Text style={styles.newLevelText}>Level {newLevel}</Text>
              </>
            ) : (
              <>
                <Text style={styles.xpAmount}>+{amount} XP</Text>
                {breakdown && (
                  <View style={styles.breakdownRow}>
                    {breakdown.accuracy > 0 && (
                      <Text style={styles.bonusText}>
                        +{breakdown.accuracy} accuracy
                      </Text>
                    )}
                    {breakdown.streak > 0 && (
                      <View style={styles.bonusItem}>
                        <FireAnimation size={16} />
                        <Text style={styles.bonusText}>+{breakdown.streak}</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  animationContainer: {
    width: 72,
    height: 72,
    marginRight: spacing.sm,
    marginLeft: -12,
    marginTop: -8,
    marginBottom: -8,
  },
  levelUpAnimation: {
    width: 72,
    height: 72,
  },
  fireAnimation: {
    width: 16,
    height: 16,
  },
  textContainer: {
    flex: 1,
  },
  xpAmount: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.white,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bonusText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  levelUpText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  newLevelText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});
