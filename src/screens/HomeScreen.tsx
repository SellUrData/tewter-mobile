import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  CheckCircle, 
  ChartBar, 
  Star, 
  PencilSimple, 
  Brain, 
  Sparkle, 
  Lightning, 
  Trophy,
  CaretRight,
  Target,
} from 'phosphor-react-native';
import { FireAnimation } from '../components/ui/FireAnimation';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TouchableCard } from '../components/ui/TouchableCard';
import { colors, spacing, fontSize, borderRadius, shadows, gradients } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useXP } from '../contexts/XPContext';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const mascot = require('../../assets/mascot.png');

// Feature card type with Phosphor icon
type FeatureCard = {
  title: string;
  description: string;
  IconComponent: React.ComponentType<any>;
  screen: string;
  iconColor: string;
};

// Daily goal constant
const DAILY_GOAL = 5; // problems per day

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { progress, getTodayStats, getWeekStats } = useProgress();
  const { level, levelProgress, levelTitle } = useXP();
  
  const todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const problemsToday = todayStats?.problemsCompleted || 0;
  const problemsToGoal = Math.max(0, DAILY_GOAL - problemsToday);
  const goalCompleted = problemsToday >= DAILY_GOAL;

  // Get contextual hero content based on user state
  const getHeroContent = () => {
    // New user or no activity
    if (progress.totalProblemsCompleted === 0) {
      return {
        badge: 'GET STARTED',
        title: "Let's Begin!",
        description: 'Start your first practice session and build your math skills',
        buttonText: 'Start First Lesson',
      };
    }
    
    // Goal completed today
    if (goalCompleted) {
      return {
        badge: '🎉 GOAL COMPLETE',
        title: 'Amazing Work!',
        description: 'You hit your daily goal. Keep the momentum going!',
        buttonText: 'Practice More',
      };
    }
    
    // Close to goal
    if (problemsToGoal <= 2 && problemsToGoal > 0) {
      return {
        badge: 'ALMOST THERE',
        title: `${problemsToGoal} to Go!`,
        description: `Just ${problemsToGoal} more ${problemsToGoal === 1 ? 'problem' : 'problems'} to hit your daily goal`,
        buttonText: 'Finish Strong',
      };
    }
    
    // Has streak
    if (progress.currentStreak > 0) {
      return {
        badge: `🔥 ${progress.currentStreak} DAY STREAK`,
        title: 'Keep It Going!',
        description: `${problemsToGoal} problems to your daily goal. Don't break the chain!`,
        buttonText: 'Continue Practice',
      };
    }
    
    // Default - returning user
    return {
      badge: 'PICK UP WHERE YOU LEFT OFF',
      title: "Today's Practice",
      description: `${problemsToGoal} problems to your daily goal · Adaptive difficulty`,
      buttonText: 'Continue',
    };
  };

  const heroContent = getHeroContent();

  // Secondary features with Phosphor icons
  const secondaryFeatures: FeatureCard[] = [
    {
      title: 'Mental Math',
      description: 'Speed drills',
      IconComponent: Brain,
      screen: 'Arithmetic',
      iconColor: colors.accent,
    },
    {
      title: 'Snap & Solve',
      description: 'Instant answers',
      IconComponent: Sparkle,
      screen: 'Upload',
      iconColor: colors.warning,
    },
    {
      title: 'Multiplayer',
      description: 'Challenge friends',
      IconComponent: Lightning,
      screen: 'Multiplayer',
      iconColor: colors.success,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={mascot} style={styles.mascot} resizeMode="contain" />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {user 
                ? `Hey, ${user.user_metadata?.display_name || user.email?.split('@')[0]}! 👋`
                : 'Welcome to Tewter! 👋'
              }
            </Text>
            <Text style={styles.tagline}>What would you like to learn today?</Text>
          </View>
        </View>

        {/* Stats Row - Level, Streak, Today */}
        <View style={styles.statsRow}>
          {/* Level */}
          <View style={styles.statCard}>
            <View style={[styles.statGradient, styles.levelCard]}>
              <Star size={24} color={colors.white} weight="fill" />
              <Text style={[styles.statValue, styles.statValueActive]}>{level}</Text>
              <Text style={[styles.statLabel, styles.statLabelLight]}>Level</Text>
              {/* Mini progress bar */}
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${levelProgress * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Streak Counter */}
          <View style={[styles.statCard, progress.currentStreak > 0 && styles.statCardActive]}>
            <LinearGradient
              colors={progress.currentStreak > 0 ? ['#f97316', '#ea580c'] : [colors.card, colors.card]}
              style={styles.statGradient}
            >
              <FireAnimation size={32} />
              <Text style={[styles.statValue, progress.currentStreak > 0 && styles.statValueActive]}>
                {progress.currentStreak}
              </Text>
              <Text style={[styles.statLabel, progress.currentStreak > 0 && styles.statLabelLight]}>
                {progress.currentStreak === 1 ? 'day streak' : 'day streak'}
              </Text>
            </LinearGradient>
          </View>

          {/* Today's Problems */}
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <CheckCircle size={24} color={colors.success} weight="fill" />
              <Text style={styles.statValue}>{todayStats?.problemsCompleted || 0}</Text>
              <Text style={styles.statLabel}>
                {todayStats?.problemsCompleted === 1 ? 'problem today' : 'problems today'}
              </Text>
            </View>
          </View>
        </View>

        {/* HERO: Math Practice - The Main Action */}
        <Pressable 
          onPress={() => navigation.navigate('Train')}
          style={({ pressed }) => [
            styles.heroCardWrapper,
            pressed && styles.heroCardPressed,
          ]}
        >
          <LinearGradient
            colors={[gradients.primary[0], gradients.primary[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
                        
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{heroContent.badge}</Text>
                </View>
                <Text style={styles.heroTitle}>{heroContent.title}</Text>
                <Text style={styles.heroDescription}>
                  {heroContent.description}
                </Text>
                <View style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>{heroContent.buttonText}</Text>
                  <CaretRight size={16} color={colors.primary} weight="bold" />
                </View>
              </View>
              <View style={styles.heroIconContainer}>
                <PencilSimple size={48} color="rgba(255,255,255,0.9)" weight="duotone" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Daily Challenge Card */}
        <Pressable
          onPress={() => navigation.navigate('Train')}
          style={({ pressed }) => [
            styles.dailyChallengeCard,
            pressed && styles.dailyChallengePressed,
          ]}
        >
          <View style={styles.dailyChallengeContent}>
            <View style={styles.dailyChallengeLeft}>
              <View style={styles.dailyChallengeIconBg}>
                <Target size={24} color={colors.primary} weight="fill" />
              </View>
            </View>
            <View style={styles.dailyChallengeCenter}>
              <Text style={styles.dailyChallengeTitle}>Daily Goal</Text>
              <Text style={styles.dailyChallengeSubtitle}>
                {goalCompleted 
                  ? '✓ Completed!' 
                  : `${problemsToday}/${DAILY_GOAL} problems`
                }
              </Text>
            </View>
            <View style={styles.dailyChallengeRight}>
              {/* Progress ring */}
              <View style={styles.progressRing}>
                <View style={[
                  styles.progressRingFill,
                  { 
                    backgroundColor: goalCompleted ? colors.success : colors.primary,
                  }
                ]}>
                  <Text style={styles.progressRingText}>
                    {goalCompleted ? '🎉' : problemsToGoal}
                  </Text>
                </View>
              </View>
              {!goalCompleted && (
                <Text style={styles.progressRingLabel}>left</Text>
              )}
            </View>
          </View>
        </Pressable>

        {/* Secondary Features - Horizontal Row */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.secondaryGrid}>
          {secondaryFeatures.map((feature) => (
            <Pressable 
              key={feature.title} 
              onPress={() => navigation.navigate(feature.screen)}
              style={({ pressed }) => [
                styles.secondaryCard,
                pressed && styles.secondaryCardPressed,
              ]}
            >
              <View style={[
                styles.secondaryIconBg, 
                { backgroundColor: feature.iconColor + '25' }
              ]}>
                <feature.IconComponent size={26} color={feature.iconColor} weight="fill" />
              </View>
              <Text style={styles.secondaryTitle}>{feature.title}</Text>
              <Text style={styles.secondaryDescription}>{feature.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* Leaderboard - Motivational Card */}
        <Pressable 
          onPress={() => navigation.navigate('Compete')}
          style={({ pressed }) => [
            styles.leaderboardCard,
            pressed && styles.leaderboardCardPressed,
          ]}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.leaderboardGradient}
          >
            <View style={styles.leaderboardContent}>
              <View style={styles.leaderboardIconBg}>
                <Trophy size={28} color={colors.white} weight="fill" />
              </View>
              <View style={styles.leaderboardText}>
                <Text style={styles.leaderboardTitle}>Compete & Climb</Text>
                <Text style={styles.leaderboardDescription}>
                  Challenge friends • Earn your rank
                </Text>
              </View>
              <View style={styles.leaderboardChevron}>
                <CaretRight size={22} color={colors.white} weight="bold" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Sign in prompt for non-authenticated users */}
        {!user && (
          <Card style={styles.signInCard} variant="glow">
            <Text style={styles.signInText}>🔓 Sign in to track your progress</Text>
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Auth')}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  mascot: {
    width: 56,
    height: 56,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Stats row styles
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  statCardActive: {
    borderColor: '#f97316',
    borderWidth: 2,
  },
  statGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  statContent: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  statValueActive: {
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statLabelLight: {
    color: 'rgba(255,255,255,0.8)',
  },
  levelCard: {
    backgroundColor: colors.primary,
  },
  streakAnimation: {
    width: 32,
    height: 32,
  },
  miniProgressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  // Hero card styles - THE MAIN ACTION
  heroCardWrapper: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  heroCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 180,
    overflow: 'hidden',
  },
  heroShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  heroLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    gap: 4,
  },
  heroBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 44,
  },
  // Daily Challenge Card
  dailyChallengeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  dailyChallengePressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: colors.cardElevated,
  },
  dailyChallengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  dailyChallengeLeft: {
    marginRight: spacing.md,
  },
  dailyChallengeIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyChallengeCenter: {
    flex: 1,
  },
  dailyChallengeTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  dailyChallengeSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  dailyChallengeRight: {
    alignItems: 'center',
  },
  progressRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingFill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.white,
  },
  progressRingLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Section title
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Secondary features - smaller, horizontal
  secondaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryCardPressed: {
    transform: [{ scale: 1.04 }],
    backgroundColor: colors.cardElevated,
    borderColor: colors.primary + '40',
  },
  secondaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  secondaryIcon: {
    fontSize: 22,
  },
  secondaryTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  secondaryDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  // Leaderboard row
  leaderboardCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  leaderboardCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  leaderboardGradient: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  leaderboardIcon: {
    fontSize: 22,
  },
  leaderboardText: {
    flex: 1,
  },
  leaderboardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  leaderboardDescription: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  leaderboardChevron: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  // Sign in card
  signInCard: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  signInText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
