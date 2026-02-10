import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Switch, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Star, Camera, Bell, SpeakerHigh, Vibrate, Target, CaretRight, Gear, User, SignOut, Info, Trash, Shield, FileText } from 'phosphor-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { useXP } from '../contexts/XPContext';
import { useSettings } from '../contexts/SettingsContext';
import { getXPForLevel } from '../constants/xp';
import { supabase } from '../lib/supabase';

const PRIVACY_POLICY_URL = 'https://tewter.vercel.app/privacy';
const TERMS_OF_SERVICE_URL = 'https://tewter.vercel.app/terms';
const mascot = require('../../assets/mascot.png');

// Format seconds into a readable time string
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};

export function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const { progress, getWeekStats, resetProgress } = useProgress();
  const { totalXP, level, levelProgress, xpToNextLevel, levelTitle, resetXP } = useXP();
  const { settings, updateSetting } = useSettings();
  const navigation = useNavigation<any>();
  const weekStats = getWeekStats();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);

  // Fetch avatar from user_profiles table (same source as website)
  React.useEffect(() => {
    if (user) {
      supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) {
            setDbAvatarUrl(data.avatar_url);
          }
        });
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will clear all your local progress data. Cloud data will not be affected. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive', 
          onPress: async () => {
            await resetProgress();
            await resetXP();
            Alert.alert('Done', 'Progress has been reset.');
          }
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    if (!user) return;
    
    setUploadingPhoto(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      // Use user ID as folder name to match RLS policies
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Set local state immediately for instant feedback
      setLocalAvatarUrl(publicUrl);
      setDbAvatarUrl(publicUrl);
      setImageError(false); // Reset error state for new image
      
      // Update both user metadata and user_profiles table (for sync with website)
      await updateProfile({ avatarUrl: publicUrl });
      await supabase
        .from('user_profiles')
        .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' });
      
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest';
  // Priority: local upload > database > user metadata
  const avatarUrl = localAvatarUrl || dbAvatarUrl || user?.user_metadata?.avatar_url;

  // If not logged in, show sign in prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestContainer}>
          <Image source={mascot} style={styles.guestMascot} resizeMode="contain" />
          <Text style={styles.guestTitle}>Welcome to Tewter!</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to track your progress, compete on leaderboards, and sync across devices.
          </Text>
          <Button
            title="Sign In / Sign Up"
            onPress={() => navigation.navigate('Auth')}
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Pressable onPress={pickImage} style={styles.avatarContainer} disabled={uploadingPhoto}>
            {avatarUrl && !imageError ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraButton}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Camera size={16} color={colors.white} weight="fill" />
              )}
            </View>
          </Pressable>
          <Text style={styles.name}>{displayName}</Text>
          {user?.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
        </View>

        {/* Level Card */}
        <View style={styles.levelCardContainer}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Star size={20} color={colors.white} weight="fill" />
                <Text style={styles.levelNumber}>{level}</Text>
              </View>
              <View style={styles.levelTextContainer}>
                <Text style={styles.levelTitle}>{levelTitle}</Text>
                <Text style={styles.xpText}>{totalXP.toLocaleString()} XP</Text>
              </View>
            </View>
            <View style={styles.xpProgressContainer}>
              <View style={styles.xpProgressBar}>
                <View style={[styles.xpProgressFill, { width: `${levelProgress * 100}%` }]} />
              </View>
              <Text style={styles.xpToNext}>{xpToNextLevel.toLocaleString()} XP to Level {level + 1}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCardContainer}>
          <LinearGradient
            colors={progress.currentStreak > 0 ? ['#f97316', '#ea580c'] : [colors.card, colors.cardBorder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakContent}>
              <Text style={styles.streakIcon}>🔥</Text>
              <View style={styles.streakTextContainer}>
                <Text style={[styles.streakValue, progress.currentStreak > 0 && styles.streakValueActive]}>
                  {progress.currentStreak} Day Streak
                </Text>
                <Text style={[styles.streakSubtext, progress.currentStreak > 0 && styles.streakSubtextActive]}>
                  {progress.currentStreak > 0 
                    ? `Best: ${progress.longestStreak} days` 
                    : 'Complete a problem to start!'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.totalProblemsCompleted}</Text>
              <Text style={styles.statLabel}>Problems Solved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(progress.totalTimeSpentSeconds)}</Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weekStats.problems}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.primary} weight="fill" />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '60' }}
              thumbColor={settings.notifications ? colors.primary : colors.textMuted}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <SpeakerHigh size={20} color={colors.primary} weight="fill" />
              <Text style={styles.settingLabel}>Sound Effects</Text>
            </View>
            <Switch
              value={settings.soundEffects}
              onValueChange={(value) => updateSetting('soundEffects', value)}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '60' }}
              thumbColor={settings.soundEffects ? colors.primary : colors.textMuted}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Vibrate size={20} color={colors.primary} weight="fill" />
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(value) => updateSetting('hapticFeedback', value)}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '60' }}
              thumbColor={settings.hapticFeedback ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.primary} weight="fill" />
              <Text style={styles.settingLabel}>Daily Reminder</Text>
            </View>
            <Switch
              value={settings.dailyReminder}
              onValueChange={(value) => updateSetting('dailyReminder', value)}
              trackColor={{ false: colors.cardBorder, true: colors.primary + '60' }}
              thumbColor={settings.dailyReminder ? colors.primary : colors.textMuted}
            />
          </View>

          <Pressable style={styles.settingItemPressable}>
            <View style={styles.settingLeft}>
              <Target size={20} color={colors.primary} weight="fill" />
              <Text style={styles.settingLabel}>Daily Goal</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{settings.dailyGoal} problems</Text>
              <CaretRight size={16} color={colors.textMuted} />
            </View>
          </Pressable>
        </Card>

        {/* About & Legal */}
        <Card style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Info size={20} color={colors.textMuted} />
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          
          <Pressable 
            style={styles.aboutRowPressable} 
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            <Shield size={20} color={colors.textMuted} />
            <Text style={styles.aboutLabel}>Privacy Policy</Text>
            <CaretRight size={16} color={colors.textMuted} style={styles.aboutArrow} />
          </Pressable>
          
          <Pressable 
            style={styles.aboutRowPressable} 
            onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          >
            <FileText size={20} color={colors.textMuted} />
            <Text style={styles.aboutLabel}>Terms of Service</Text>
            <CaretRight size={16} color={colors.textMuted} style={styles.aboutArrow} />
          </Pressable>
        </Card>

        {/* Reset Progress (for debugging/testing) */}
        {user && (
          <Pressable style={styles.resetButton} onPress={handleResetProgress}>
            <Trash size={20} color={colors.warning || '#FFA500'} />
            <Text style={styles.resetText}>Reset Local Progress</Text>
          </Pressable>
        )}

        {/* Sign Out */}
        {user && (
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <SignOut size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  guestMascot: {
    width: 150,
    height: 150,
    marginBottom: spacing.lg,
  },
  guestTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  guestSubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  // Level card styles
  levelCardContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  levelCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  levelNumber: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.white,
    marginLeft: spacing.xs,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  xpText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  xpProgressContainer: {
    marginTop: spacing.xs,
  },
  xpProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  xpToNext: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  // Streak card styles
  streakCardContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  streakCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  streakValueActive: {
    color: colors.white,
  },
  streakSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  streakSubtextActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  settingsCard: {
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  settingItemPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingValue: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  aboutCard: {
    marginBottom: spacing.md,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aboutRowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  aboutArrow: {
    marginLeft: 'auto',
  },
  aboutLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  aboutValue: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: '#FFA50015',
    borderRadius: borderRadius.lg,
  },
  resetText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#FFA500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.error + '15',
    borderRadius: borderRadius.lg,
  },
  signOutText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
});
