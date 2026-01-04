import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Vibration, Keyboard, Animated, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://tewter.vercel.app';

type Operation = '+' | '-' | '×' | '÷';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}

export function ArithmeticScreen() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeMode, setTimeMode] = useState(60);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalProblems, setTotalProblems] = useState(0);
  const [correctProblems, setCorrectProblems] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  const generateProblem = useCallback((): Problem => {
    const operations: Operation[] = ['+', '-', '×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number;
    
    const range = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * range) + 1;
        num2 = Math.floor(Math.random() * range) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * range) + 1;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * (range / 2)) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = Math.floor(Math.random() * 12) + 1;
        num1 = num2 * answer;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }
    
    return { num1, num2, operation, answer };
  }, [difficulty]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalProblems(0);
    setCorrectProblems(0);
    setTimeLeft(timeMode);
    setProblem(generateProblem());
    setUserAnswer('');
    setGameState('playing');
  };

  const checkAnswer = () => {
    if (!problem || userAnswer === '') return;
    
    const isCorrect = parseInt(userAnswer) === problem.answer;
    setTotalProblems(prev => prev + 1);
    
    if (isCorrect) {
      const streakBonus = Math.floor(streak / 5) * 5;
      setScore(prev => prev + 10 + streakBonus);
      setStreak(prev => prev + 1);
      setBestStreak(prev => Math.max(prev, streak + 1));
      setCorrectProblems(prev => prev + 1);
      Vibration.vibrate(50);
      // Pulse animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else {
      setStreak(0);
      Vibration.vibrate([0, 100, 50, 100]);
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    
    setProblem(generateProblem());
    setUserAnswer('');
    // Keep keyboard open by refocusing input
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (timeLeft <= 0) {
      setGameState('finished');
      Keyboard.dismiss();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const accuracy = totalProblems > 0 ? Math.round((correctProblems / totalProblems) * 100) : 0;

  const submitScore = async () => {
    if (!user || submitStatus === 'submitting') return;
    
    setSubmitStatus('submitting');
    try {
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous';
      const response = await fetch(`${API_BASE}/api/leaderboard/arithmetic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_name: displayName,
          score,
          problems_solved: correctProblems,
          accuracy,
          difficulty,
          time_mode: timeMode,
          device_type: 'mobile',
        }),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        Alert.alert('Score Submitted!', 'Your score has been added to the leaderboard.');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      setSubmitStatus('error');
    }
  };

  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.title}>🧮 Mental Math</Text>
          <Text style={styles.subtitle}>Test your arithmetic speed</Text>
          
          {/* Difficulty Selection */}
          <Card style={styles.optionCard}>
            <Text style={styles.optionTitle}>Difficulty</Text>
            <View style={styles.optionButtons}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <Button
                  key={d}
                  title={d.charAt(0).toUpperCase() + d.slice(1)}
                  onPress={() => setDifficulty(d)}
                  variant={difficulty === d ? 'primary' : 'secondary'}
                  size="sm"
                />
              ))}
            </View>
          </Card>
          
          {/* Time Selection */}
          <Card style={styles.optionCard}>
            <Text style={styles.optionTitle}>Time</Text>
            <View style={styles.optionButtons}>
              {[15, 30, 60, 120].map((t) => (
                <Button
                  key={t}
                  title={`${t}s`}
                  onPress={() => setTimeMode(t)}
                  variant={timeMode === t ? 'primary' : 'secondary'}
                  size="sm"
                />
              ))}
            </View>
          </Card>
          
          <Button
            title="Start Game"
            onPress={startGame}
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'finished') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.finishedTitle}>Time's Up!</Text>
          
          <Card style={styles.resultsCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Score</Text>
              <Text style={[styles.resultValue, styles.scoreHighlight]}>{score}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Problems</Text>
              <Text style={styles.resultValue}>{correctProblems}/{totalProblems}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Accuracy</Text>
              <Text style={styles.resultValue}>{accuracy}%</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Best Streak</Text>
              <Text style={styles.resultValue}>{bestStreak} 🔥</Text>
            </View>
          </Card>
          
          {user && submitStatus !== 'success' && (
            <Button
              title={submitStatus === 'submitting' ? 'Submitting...' : '🏆 Submit to Leaderboard'}
              onPress={submitScore}
              loading={submitStatus === 'submitting'}
              style={{ marginBottom: spacing.md }}
            />
          )}
          {submitStatus === 'success' && (
            <Text style={styles.successText}>✓ Score submitted!</Text>
          )}
          
          <View style={styles.finishedButtons}>
            <Button
              title="Play Again"
              onPress={() => { setSubmitStatus('idle'); startGame(); }}
              size="lg"
            />
            <Button
              title="Back to Menu"
              onPress={() => { setSubmitStatus('idle'); setGameState('menu'); }}
              variant="secondary"
              size="lg"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.playingContent}>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={[styles.statValue, timeLeft <= 10 && styles.statWarning]}>
                {timeLeft}s
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{streak} 🔥</Text>
            </View>
          </View>
          
          {/* Problem Display */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }}>
            <Card style={styles.problemCard}>
              {problem && (
                <Text style={styles.problemText}>
                  {problem.num1} {problem.operation} {problem.num2} = ?
                </Text>
              )}
            </Card>
          </Animated.View>
          
          {/* Answer Input */}
          <TextInput
            ref={inputRef}
            style={styles.answerInput}
            value={userAnswer}
            onChangeText={setUserAnswer}
            keyboardType="number-pad"
            placeholder="Your answer"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            onSubmitEditing={checkAnswer}
            blurOnSubmit={false}
            returnKeyType="done"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingContent: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  optionCard: {
    width: '100%',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statWarning: {
    color: colors.error,
  },
  problemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.xxl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  finishedTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  resultsCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  resultLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  resultValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  finishedButtons: {
    width: '100%',
    gap: spacing.md,
  },
  scoreHighlight: {
    color: colors.primary,
    fontSize: fontSize.xxl,
  },
  successText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
});
