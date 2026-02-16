import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

type GameType = 'math' | 'typing';

type Player = {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
};

type GameState = 'waiting' | 'countdown' | 'playing' | 'finished';

const generateMathProblem = () => {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
    default:
      a = 1;
      b = 1;
      answer = 2;
  }

  return { question: `${a} ${op} ${b}`, answer };
};

const typingPhrases = [
  'The quick brown fox jumps over the lazy dog',
  'Practice makes perfect',
  'Math is the language of the universe',
  'Keep calm and solve problems',
  'Every expert was once a beginner',
];

export function MultiplayerGameScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { roomCode, gameType } = route.params as { roomCode: string; gameType: GameType };
  const { user } = useAuth();
  
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(gameType === 'math' ? 60 : 30);
  const [score, setScore] = useState(0);
  const [userInput, setUserInput] = useState('');
  
  // Math game state
  const [currentProblem, setCurrentProblem] = useState(generateMathProblem());
  
  // Typing game state
  const [targetPhrase, setTargetPhrase] = useState(typingPhrases[0]);
  const [typedChars, setTypedChars] = useState(0);
  
  // Mock players (in real app, this would come from WebSocket)
  const [players, setPlayers] = useState<Player[]>([
    { id: user?.id || 'you', name: user?.user_metadata?.display_name || 'You', score: 0, isReady: true },
    { id: 'waiting', name: 'Waiting for players...', score: 0, isReady: false },
  ]);

  // Start game manually when host presses button
  const handleStartGame = () => {
    setGameState('countdown');
  };

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState('playing');
    }
  }, [gameState, countdown]);

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState('finished');
    }
  }, [gameState, timeLeft]);

  // Handle math answer submission
  const handleMathSubmit = useCallback(() => {
    const answer = parseInt(userInput, 10);
    if (answer === currentProblem.answer) {
      setScore(prev => prev + 10);
      setCurrentProblem(generateMathProblem());
      setUserInput('');
    }
  }, [userInput, currentProblem]);

  // Handle typing input
  const handleTypingInput = useCallback((text: string) => {
    setUserInput(text);
    
    // Check how many characters match
    let matches = 0;
    for (let i = 0; i < text.length && i < targetPhrase.length; i++) {
      if (text[i] === targetPhrase[i]) {
        matches++;
      } else {
        break;
      }
    }
    setTypedChars(matches);
    
    // If completed phrase, get new one and add score
    if (matches === targetPhrase.length) {
      setScore(prev => prev + targetPhrase.length);
      const nextPhrase = typingPhrases[Math.floor(Math.random() * typingPhrases.length)];
      setTargetPhrase(nextPhrase);
      setUserInput('');
      setTypedChars(0);
    }
  }, [targetPhrase]);

  const handlePlayAgain = () => {
    setGameState('waiting');
    setCountdown(3);
    setTimeLeft(gameType === 'math' ? 60 : 30);
    setScore(0);
    setUserInput('');
    setCurrentProblem(generateMathProblem());
    setTargetPhrase(typingPhrases[0]);
    setTypedChars(0);
    
    setTimeout(() => setGameState('countdown'), 1000);
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  // Waiting state
  if (gameState === 'waiting') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.waitingContainer}>
          <Text style={styles.roomCodeLabel}>Room Code</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
          <Text style={styles.waitingText}>Waiting for players...</Text>
          <View style={styles.playersList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerItem}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={[styles.playerStatus, player.isReady && styles.playerReady]}>
                  {player.isReady ? '✓ Ready' : 'Joining...'}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.waitingButtons}>
            <Button title="Start Game" onPress={handleStartGame} />
            <Button title="Leave" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Countdown state
  if (gameState === 'countdown') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdown || 'GO!'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Finished state
  if (gameState === 'finished') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>🏆</Text>
          <Text style={styles.finishedTitle}>Game Over!</Text>
          <Card style={styles.scoreCard}>
            <Text style={styles.finalScoreLabel}>Your Score</Text>
            <Text style={styles.finalScore}>{score}</Text>
          </Card>
          <View style={styles.finishedButtons}>
            <Button title="Play Again" onPress={handlePlayAgain} />
            <Button title="Leave" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Playing state - Math
  if (gameType === 'math') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.gameHeader}>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Time</Text>
            <Text style={[styles.headerValue, timeLeft <= 10 && styles.timeWarning]}>{timeLeft}s</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={styles.headerLabel}>Score</Text>
            <Text style={styles.headerValue}>{score}</Text>
          </View>
        </View>

        <View style={styles.gameContent}>
          <Card style={styles.problemCard}>
            <Text style={styles.problemText}>{currentProblem.question}</Text>
          </Card>

          <TextInput
            style={styles.answerInput}
            value={userInput}
            onChangeText={setUserInput}
            keyboardType="number-pad"
            placeholder="Your answer"
            placeholderTextColor={colors.textMuted}
            autoFocus
            onSubmitEditing={handleMathSubmit}
          />

          <Button title="Submit" onPress={handleMathSubmit} disabled={!userInput} />
        </View>

        <Button title="Leave Game" variant="ghost" onPress={handleLeave} style={styles.leaveButton} />
      </SafeAreaView>
    );
  }

  // Playing state - Typing
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.gameHeader}>
        <View style={styles.headerItem}>
          <Text style={styles.headerLabel}>Time</Text>
          <Text style={[styles.headerValue, timeLeft <= 10 && styles.timeWarning]}>{timeLeft}s</Text>
        </View>
        <View style={styles.headerItem}>
          <Text style={styles.headerLabel}>Score</Text>
          <Text style={styles.headerValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.gameContent}>
        <Card style={styles.typingCard}>
          <Text style={styles.typingTarget}>
            <Text style={styles.typedCorrect}>{targetPhrase.slice(0, typedChars)}</Text>
            <Text style={styles.typingCurrent}>{targetPhrase[typedChars] || ''}</Text>
            <Text style={styles.typingRemaining}>{targetPhrase.slice(typedChars + 1)}</Text>
          </Text>
        </Card>

        <TextInput
          style={styles.typingInput}
          value={userInput}
          onChangeText={handleTypingInput}
          placeholder="Start typing..."
          placeholderTextColor={colors.textMuted}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Button title="Leave Game" variant="ghost" onPress={handleLeave} style={styles.leaveButton} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  waitingContainer: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCodeLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  roomCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  waitingText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  playersList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  playerName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  playerStatus: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  playerReady: {
    color: colors.success,
  },
  waitingButtons: {
    width: '100%',
    gap: spacing.md,
  },
  countdownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 100,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerItem: {
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  headerValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  timeWarning: {
    color: colors.error,
  },
  gameContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  problemCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  problemText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
  },
  answerInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  typingCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  typingTarget: {
    fontSize: fontSize.lg,
    lineHeight: 28,
  },
  typedCorrect: {
    color: colors.success,
  },
  typingCurrent: {
    backgroundColor: colors.primary + '30',
    color: colors.text,
  },
  typingRemaining: {
    color: colors.textMuted,
  },
  typingInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  finishedContainer: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedEmoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  finishedTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  scoreCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
    width: '100%',
  },
  finalScoreLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  finalScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
  },
  finishedButtons: {
    gap: spacing.md,
    width: '100%',
  },
  leaveButton: {
    margin: spacing.lg,
  },
});
