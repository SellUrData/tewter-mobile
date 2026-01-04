import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { CaretLeft, CaretRight } from 'phosphor-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { formatMathText } from '../utils/mathFormatter';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://tewter.vercel.app';
const MAX_PROBLEMS = 5;

interface AnalysisResult {
  id: string;
  extractedText: string;
  classification: string;
  solution: string;
  steps: string[];
}

interface AnalysisResponse {
  results: AnalysisResult[];
  totalDetected: number;
  totalAnalyzed: number;
  wasCapped: boolean;
}

export function UploadScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const cameraRef = useRef<CameraView>(null);

  const currentResult = analysisResponse?.results[currentProblemIndex] || null;
  const totalProblems = analysisResponse?.results.length || 0;

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo) {
        setImageUri(photo.uri);
        setShowCamera(false);
        analyzeImage(photo.base64!, photo.uri);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].base64!, result.assets[0].uri);
    }
  };

  const parseApiProblem = (problem: any): AnalysisResult => {
    let solutionText = 'See steps below';
    let stepsArray: string[] = [];
    
    if (problem.solution) {
      if (typeof problem.solution === 'string') {
        solutionText = problem.solution;
        stepsArray = [problem.solution];
      } else if (typeof problem.solution === 'object') {
        solutionText = problem.solution.finalAnswer || problem.solution.title || 'See steps below';
        if (Array.isArray(problem.solution.steps)) {
          stepsArray = problem.solution.steps.map((step: any) => 
            typeof step === 'string' ? step : (step.explanation || step.title || JSON.stringify(step))
          );
        }
      }
    }
    
    return {
      id: problem.id || `problem-${Date.now()}`,
      extractedText: formatMathText(problem.extractedText || 'Unable to extract text'),
      classification: `${problem.topic || 'Math'} - ${problem.subtopic || 'Problem'}`,
      solution: formatMathText(solutionText),
      steps: (stepsArray.length > 0 ? stepsArray : ['Solution analyzed successfully']).map(formatMathText),
    };
  };

  const analyzeImage = async (base64: string, uri: string) => {
    setAnalyzing(true);
    setAnalysisResponse(null);
    setCurrentProblemIndex(0);
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: uri,
        type: 'image/jpeg',
        name: 'problem.jpg',
      } as any);
      
      // Try multi-problem endpoint first, fall back to single-problem
      let apiResponse = await fetch(`${API_BASE}/api/analyze-problems`, {
        method: 'POST',
        body: formData,
      });
      
      // If multi-problem endpoint doesn't exist (404), try single-problem endpoint
      if (apiResponse.status === 404) {
        console.log('Multi-problem endpoint not available, using single-problem endpoint');
        const singleFormData = new FormData();
        singleFormData.append('image', {
          uri: uri,
          type: 'image/jpeg',
          name: 'problem.jpg',
        } as any);
        
        apiResponse = await fetch(`${API_BASE}/api/analyze-problem`, {
          method: 'POST',
          body: singleFormData,
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log('Single API Response:', JSON.stringify(data, null, 2));
          
          // Convert single problem response to multi-problem format
          const result = parseApiProblem(data);
          setAnalysisResponse({
            results: [result],
            totalDetected: data.totalProblemsDetected || 1,
            totalAnalyzed: 1,
            wasCapped: (data.totalProblemsDetected || 1) > 1,
          });
          
          if (data.totalProblemsDetected > 1) {
            Alert.alert(
              'Multiple Problems Detected',
              `Found ${data.totalProblemsDetected} problems but only analyzed the first one. Multi-problem support coming soon!`
            );
          }
          return;
        }
      }
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        // Parse all problems from the response
        const results: AnalysisResult[] = (data.problems || []).map(parseApiProblem);
        
        if (results.length === 0) {
          Alert.alert('No Problems Found', 'Could not detect any math problems in the image. Please try again with a clearer image.');
          return;
        }
        
        setAnalysisResponse({
          results,
          totalDetected: data.totalDetected || results.length,
          totalAnalyzed: data.totalAnalyzed || results.length,
          wasCapped: data.wasCapped || false,
        });
        
        // Show info if problems were capped
        if (data.wasCapped) {
          Alert.alert(
            'Multiple Problems Detected',
            `Found ${data.totalDetected} problems but analyzed the first ${MAX_PROBLEMS} to save time. You can upload another image for the remaining problems.`
          );
        }
      } else {
        const errorData = await apiResponse.json().catch(() => ({}));
        Alert.alert('Error', errorData.error || 'Failed to analyze image. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Connection Error', 
        'Could not connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setImageUri(null);
    setAnalysisResponse(null);
    setCurrentProblemIndex(0);
    setShowCamera(false);
  };

  const goToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
    }
  };

  const goToNextProblem = () => {
    if (currentProblemIndex < totalProblems - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (showCamera) {
    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              We need camera permission to take photos of math problems
            </Text>
            <Button title="Grant Permission" onPress={requestPermission} />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraHint}>
              Position the math problem within the frame
            </Text>
          </View>
          <View style={styles.cameraControls}>
            <Button
              title="Cancel"
              onPress={() => setShowCamera(false)}
              variant="secondary"
            />
            <Button
              title="📷 Capture"
              onPress={takePicture}
              size="lg"
            />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>📷 Upload Problem</Text>
        <Text style={styles.subtitle}>
          Take a photo or upload an image of a math problem
        </Text>

        {!imageUri ? (
          <View style={styles.uploadOptions}>
            <Card style={styles.uploadCard}>
              <Text style={styles.uploadIcon}>📸</Text>
              <Text style={styles.uploadTitle}>Take Photo</Text>
              <Text style={styles.uploadDescription}>
                Use your camera to capture a problem
              </Text>
              <Button
                title="Open Camera"
                onPress={() => setShowCamera(true)}
                style={{ marginTop: spacing.md }}
              />
            </Card>

            <Card style={styles.uploadCard}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadTitle}>Choose Image</Text>
              <Text style={styles.uploadDescription}>
                Select from your photo library
              </Text>
              <Button
                title="Browse"
                onPress={pickImage}
                variant="secondary"
                style={{ marginTop: spacing.md }}
              />
            </Card>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {/* Image Preview */}
            <Card style={styles.imageCard} padding="sm">
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </Card>

            {analyzing ? (
              <Card style={styles.analyzingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzingText}>Analyzing problems...</Text>
                <Text style={styles.analyzingSubtext}>This may take a moment for multiple problems</Text>
              </Card>
            ) : currentResult ? (
              <>
                {/* Problem Navigation */}
                {totalProblems > 1 && (
                  <Card style={styles.navigationCard}>
                    <Pressable 
                      onPress={goToPreviousProblem} 
                      style={[styles.navButton, currentProblemIndex === 0 && styles.navButtonDisabled]}
                      disabled={currentProblemIndex === 0}
                    >
                      <CaretLeft size={24} color={currentProblemIndex === 0 ? colors.textMuted : colors.primary} />
                    </Pressable>
                    <View style={styles.navInfo}>
                      <Text style={styles.navText}>Problem {currentProblemIndex + 1} of {totalProblems}</Text>
                      {analysisResponse?.wasCapped && (
                        <Text style={styles.navSubtext}>
                          ({analysisResponse.totalDetected} detected, {MAX_PROBLEMS} max)
                        </Text>
                      )}
                    </View>
                    <Pressable 
                      onPress={goToNextProblem} 
                      style={[styles.navButton, currentProblemIndex === totalProblems - 1 && styles.navButtonDisabled]}
                      disabled={currentProblemIndex === totalProblems - 1}
                    >
                      <CaretRight size={24} color={currentProblemIndex === totalProblems - 1 ? colors.textMuted : colors.primary} />
                    </Pressable>
                  </Card>
                )}

                {/* Extracted Text */}
                <Card style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Detected Problem</Text>
                  <Text style={styles.extractedText}>{currentResult.extractedText}</Text>
                  <View style={styles.classificationBadge}>
                    <Text style={styles.classificationText}>
                      {currentResult.classification}
                    </Text>
                  </View>
                </Card>

                {/* Solution */}
                <Card style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Solution</Text>
                  <Text style={styles.solutionText}>{currentResult.solution}</Text>
                </Card>

                {/* Steps */}
                <Card style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Step-by-Step</Text>
                  {currentResult.steps.map((step, index) => (
                    <View key={`step-${index}`} style={styles.stepRow}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </Card>

                {/* Problem dots indicator */}
                {totalProblems > 1 && (
                  <View style={styles.dotsContainer}>
                    {analysisResponse?.results.map((_, index) => (
                      <Pressable 
                        key={`dot-${index}`} 
                        onPress={() => setCurrentProblemIndex(index)}
                        style={[
                          styles.dot,
                          index === currentProblemIndex && styles.dotActive
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : null}

            <Button
              title="Upload Another"
              onPress={resetUpload}
              variant="secondary"
              style={{ marginTop: spacing.md }}
            />
          </View>
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
  uploadOptions: {
    gap: spacing.md,
  },
  uploadCard: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  uploadTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  uploadDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  cameraHint: {
    color: colors.white,
    marginTop: spacing.md,
    fontSize: fontSize.sm,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resultContainer: {
    gap: spacing.md,
  },
  imageCard: {
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    resizeMode: 'contain',
  },
  analyzingCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  analyzingText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  analyzingSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navInfo: {
    alignItems: 'center',
  },
  navText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  navSubtext: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resultCard: {
    gap: spacing.sm,
  },
  resultLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  extractedText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '500',
  },
  classificationBadge: {
    backgroundColor: colors.primary + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  classificationText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  solutionText: {
    fontSize: fontSize.xl,
    color: colors.success,
    fontWeight: 'bold',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
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
    fontSize: fontSize.md,
    color: colors.text,
  },
});
