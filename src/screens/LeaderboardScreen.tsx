import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretUp, CaretDown, Minus, Clock, Trophy, Medal, Crown, Diamond, Star, Hexagon } from 'phosphor-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useLeague } from '../contexts/LeagueContext';
import { LEAGUES, formatTimeRemaining } from '../constants/leagues';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://tewter.vercel.app';

// League icon components
const LeagueIcons: Record<string, React.ComponentType<any>> = {
  'bronze': Medal,
  'silver': Medal,
  'gold': Trophy,
  'platinum': Diamond,
  'diamond': Diamond,
  'master': Crown,
};

interface Score {
  id: string;
  user_name: string;
  wpm?: number;
  score?: number;
  accuracy: number;
  device_type?: 'mobile' | 'desktop';
  created_at: string;
}

type LeaderboardTab = 'leagues' | 'scores';

export function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('leagues');
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { 
    currentLeague, 
    weeklyXP, 
    leagueUsers, 
    currentUserRank, 
    promotionStatus,
    timeRemaining,
    loading: leagueLoading,
    checkWeekReset,
  } = useLeague();

  const fetchScores = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/leaderboard/arithmetic`);
      const data = await response.json();
      setScores(data.scores || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setScores([
        { id: '1', user_name: 'MathWiz', score: 1250, wpm: 85, accuracy: 98, device_type: 'desktop', created_at: new Date().toISOString() },
        { id: '2', user_name: 'SpeedCalc', score: 1100, wpm: 72, accuracy: 95, device_type: 'mobile', created_at: new Date().toISOString() },
        { id: '3', user_name: 'NumNinja', score: 980, wpm: 68, accuracy: 92, device_type: 'desktop', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'scores') {
      setLoading(true);
      fetchScores();
    }
  }, [activeTab]);

  useEffect(() => {
    checkWeekReset();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'scores') {
      fetchScores();
    } else {
      checkWeekReset().then(() => setRefreshing(false));
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getZoneColor = (rank: number) => {
    if (rank <= currentLeague.promotionZone && currentLeague.promotionZone > 0) {
      return colors.success; // Promotion zone - green
    }
    if (rank > currentLeague.maxRank - currentLeague.demotionZone && currentLeague.demotionZone > 0) {
      return colors.error; // Demotion zone - red
    }
    return 'transparent'; // Safe zone
  };

  const getStatusIcon = () => {
    if (promotionStatus === 'promote') {
      return <CaretUp size={20} color={colors.success} weight="bold" />;
    }
    if (promotionStatus === 'demote') {
      return <CaretDown size={20} color={colors.error} weight="bold" />;
    }
    return <Minus size={20} color={colors.textMuted} weight="bold" />;
  };

  const getStatusText = () => {
    if (promotionStatus === 'promote') return 'Promotion Zone';
    if (promotionStatus === 'demote') return 'Demotion Zone';
    return 'Safe Zone';
  };

  const getStatusColor = () => {
    if (promotionStatus === 'promote') return colors.success;
    if (promotionStatus === 'demote') return colors.error;
    return colors.textMuted;
  };

  // Find league index for display
  const leagueIndex = LEAGUES.findIndex(l => l.id === currentLeague.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboards</Text>
        
        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'leagues' && styles.activeTab]}
            onPress={() => setActiveTab('leagues')}
          >
            <Medal size={18} color={activeTab === 'leagues' ? colors.primary : colors.textMuted} weight="fill" />
            <Text style={[styles.tabText, activeTab === 'leagues' && styles.activeTabText]}>
              Leagues
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'scores' && styles.activeTab]}
            onPress={() => setActiveTab('scores')}
          >
            <Trophy size={18} color={activeTab === 'scores' ? colors.primary : colors.textMuted} weight="fill" />
            <Text style={[styles.tabText, activeTab === 'scores' && styles.activeTabText]}>
              All-Time
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'leagues' ? (
          // League Leaderboard
          leagueLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {/* League Header Card */}
              <View style={[styles.leagueHeaderCard, { borderColor: currentLeague.color + '50' }]}>
                <View style={styles.leagueHeaderTop}>
                  <View style={styles.leagueInfo}>
                    <View style={[styles.leagueIconContainer, { backgroundColor: currentLeague.color + '20' }]}>
                      {(() => {
                        const LeagueIcon = LeagueIcons[currentLeague.id] || Medal;
                        return <LeagueIcon size={32} color={currentLeague.color} weight="fill" />;
                      })()}
                    </View>
                    <View>
                      <Text style={[styles.leagueName, { color: currentLeague.color }]}>
                        {currentLeague.name} League
                      </Text>
                      <Text style={styles.leagueSubtext}>
                        {leagueIndex < LEAGUES.length - 1 ? 'Top 10 promote to next league' : 'You\'re at the top!'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timeContainer}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.timeText}>{formatTimeRemaining()}</Text>
                  </View>
                </View>
                
                {/* User Status */}
                <View style={styles.userStatus}>
                  <View style={styles.userRankBadge}>
                    <Text style={styles.userRankText}>#{currentUserRank}</Text>
                  </View>
                  <View style={styles.userXPInfo}>
                    <Text style={styles.userXPValue}>{weeklyXP} XP</Text>
                    <Text style={styles.userXPLabel}>this week</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                    {getStatusIcon()}
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                      {getStatusText()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* League Progress Indicator */}
              <View style={styles.leagueProgressContainer}>
                {LEAGUES.map((league, index) => (
                  <View key={league.id} style={styles.leagueProgressItem}>
                    <View style={[
                      styles.leagueProgressDot,
                      index <= leagueIndex && { backgroundColor: league.color },
                      index === leagueIndex && styles.currentLeagueDot,
                    ]}>
                      {index === leagueIndex && (() => {
                        const ProgressIcon = LeagueIcons[league.id] || Medal;
                        return <ProgressIcon size={18} color={colors.white} weight="fill" />;
                      })()}
                    </View>
                    {index < LEAGUES.length - 1 && (
                      <View style={[
                        styles.leagueProgressLine,
                        index < leagueIndex && { backgroundColor: LEAGUES[index + 1].color },
                      ]} />
                    )}
                  </View>
                ))}
              </View>

              {/* League Rankings */}
              <Card padding="sm" style={styles.rankingsCard}>
                {leagueUsers.map((user, index) => {
                  const rank = index + 1;
                  const zoneColor = getZoneColor(rank);
                  const isCurrentUser = user.isCurrentUser;
                  
                  return (
                    <View
                      key={user.id}
                      style={[
                        styles.leagueRow,
                        isCurrentUser && styles.currentUserRow,
                        zoneColor !== 'transparent' && { borderLeftColor: zoneColor, borderLeftWidth: 3 },
                      ]}
                    >
                      <View style={styles.rankBadge}>
                        <Text style={[styles.rankNumber, rank <= 3 && { color: currentLeague.color }]}>
                          {getMedalEmoji(rank)}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                          {user.name}
                        </Text>
                      </View>
                      <View style={styles.xpBadge}>
                        <Text style={[styles.xpValue, isCurrentUser && styles.currentUserXP]}>
                          {user.weeklyXP}
                        </Text>
                        <Text style={styles.xpLabel}>XP</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>

              {/* Zone Legend */}
              <View style={styles.legendContainer}>
                {currentLeague.promotionZone > 0 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Promotion Zone (Top {currentLeague.promotionZone})</Text>
                  </View>
                )}
                {currentLeague.demotionZone > 0 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                    <Text style={styles.legendText}>Demotion Zone (Bottom {currentLeague.demotionZone})</Text>
                  </View>
                )}
              </View>
            </>
          )
        ) : (
          // All-Time Scores
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : scores.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No scores yet. Be the first!</Text>
            </Card>
          ) : (
            <Card padding="sm">
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, styles.rankCell]}>Rank</Text>
                <Text style={[styles.headerCell, styles.nameCell]}>Player</Text>
                <Text style={[styles.headerCell, styles.scoreCell]}>Score</Text>
                <Text style={[styles.headerCell, styles.accCell]}>Acc</Text>
              </View>
              {scores.slice(0, 50).map((score, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                return (
                  <View key={score.id} style={[styles.scoreRow, isTopThree && styles.topThreeRow]}>
                    <Text style={[styles.cell, styles.rankCell, styles.rankText]}>
                      {getMedalEmoji(rank)}
                    </Text>
                    <View style={[styles.nameCell, styles.nameContainer]}>
                      <Text style={styles.deviceIcon}>
                        {score.device_type === 'mobile' ? '📱' : '💻'}
                      </Text>
                      <Text style={styles.nameText} numberOfLines={1}>
                        {score.user_name || 'Anonymous'}
                      </Text>
                    </View>
                    <Text style={[styles.cell, styles.scoreCell, styles.scoreText]}>
                      {score.score}
                    </Text>
                    <Text style={[styles.cell, styles.accCell, styles.accText]}>
                      {score.accuracy}%
                    </Text>
                  </View>
                );
              })}
            </Card>
          )
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
  header: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  // League Header Card
  leagueHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  leagueHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  leagueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leagueIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  leagueSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  userRankBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  userRankText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  userXPInfo: {
    flex: 1,
  },
  userXPValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  userXPLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  // League Progress
  leagueProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  leagueProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueProgressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLeagueDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
    leagueProgressLine: {
    width: 20,
    height: 3,
    backgroundColor: colors.cardBorder,
  },
  // Rankings Card
  rankingsCard: {
    marginBottom: spacing.md,
  },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  currentUserRow: {
    backgroundColor: colors.primary + '15',
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  currentUserName: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  xpBadge: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text,
  },
  currentUserXP: {
    color: colors.primary,
  },
  xpLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  // All-Time Scores styles
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerCell: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  topThreeRow: {
    backgroundColor: colors.primary + '10',
  },
  cell: {
    fontSize: fontSize.md,
  },
  rankCell: {
    width: 50,
  },
  nameCell: {
    flex: 1,
  },
  scoreCell: {
    width: 60,
    textAlign: 'right',
  },
  accCell: {
    width: 50,
    textAlign: 'right',
  },
  rankText: {
    fontWeight: 'bold',
    color: colors.text,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceIcon: {
    fontSize: 12,
  },
  nameText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  scoreText: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  accText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
