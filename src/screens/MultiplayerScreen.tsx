import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type MultiplayerScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function MultiplayerScreen({ navigation }: MultiplayerScreenProps) {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createRoom = async (gameType: 'math' | 'typing') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create multiplayer rooms.');
      return;
    }

    setCreating(true);
    try {
      const newRoomCode = generateRoomCode();
      // In a real app, this would create a room in the backend
      Alert.alert(
        'Room Created!',
        `Share this code with friends:\n\n${newRoomCode}`,
        [
          { text: 'Copy Code', onPress: () => {} },
          { text: 'Start Game', onPress: () => navigation.navigate('MultiplayerGame', { roomCode: newRoomCode, gameType }) },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Enter Code', 'Please enter a room code to join.');
      return;
    }

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join multiplayer rooms.');
      return;
    }

    setJoining(true);
    try {
      // In a real app, this would validate and join the room
      navigation.navigate('MultiplayerGame', { roomCode: roomCode.toUpperCase(), gameType: 'math' });
    } catch (error) {
      Alert.alert('Error', 'Room not found. Please check the code and try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🎮 Multiplayer</Text>
        <Text style={styles.subtitle}>Compete with friends in real-time</Text>

        {/* Join Room */}
        <Card style={styles.joinCard}>
          <Text style={styles.cardTitle}>Join a Room</Text>
          <Text style={styles.cardDescription}>
            Enter a 6-character room code to join a game
          </Text>
          <View style={styles.joinInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="ABCD12"
              placeholderTextColor={colors.textSecondary}
              maxLength={6}
              autoCapitalize="characters"
            />
            <Button
              title="Join"
              onPress={joinRoom}
              loading={joining}
              disabled={roomCode.length < 6}
            />
          </View>
        </Card>

        {/* Create Room */}
        <Text style={styles.sectionTitle}>Create a Room</Text>
        
        <Card style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameIcon}>🧮</Text>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>Math Sprint</Text>
              <Text style={styles.gameDescription}>
                Race to solve arithmetic problems
              </Text>
            </View>
          </View>
          <View style={styles.gameDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Players</Text>
              <Text style={styles.detailValue}>2-8</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>60s</Text>
            </View>
          </View>
          <Button
            title="Create Room"
            onPress={() => createRoom('math')}
            loading={creating}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Card style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameIcon}>⌨️</Text>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>Typing Race</Text>
              <Text style={styles.gameDescription}>
                See who can type the fastest
              </Text>
            </View>
          </View>
          <View style={styles.gameDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Players</Text>
              <Text style={styles.detailValue}>2-4</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>30s</Text>
            </View>
          </View>
          <Button
            title="Create Room"
            onPress={() => createRoom('typing')}
            loading={creating}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </Card>

        {/* How it works */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Multiplayer Works</Text>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Create a room or get a code from a friend</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Share the 6-character code with others</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Compete in real-time and see who wins!</Text>
          </View>
        </Card>
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
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  joinCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  joinInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  gameCard: {
    marginBottom: spacing.md,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gameIcon: {
    fontSize: 40,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  gameDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  gameDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  infoCard: {
    marginTop: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
