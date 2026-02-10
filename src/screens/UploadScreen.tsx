import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, ScrollView, Pressable, FlatList, Dimensions, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CaretLeft, CaretRight, Clock, Trash, X, Check, Crop } from 'phosphor-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { OfflineNotice } from '../components/ui/OfflineNotice';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { formatMathText } from '../utils/mathFormatter';
import { useNetwork } from '../contexts/NetworkContext';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://tewter.vercel.app';
const MAX_PROBLEMS = 5;
const HISTORY_STORAGE_KEY_PREFIX = 'tewter_problem_history_';
const HISTORY_GUEST_KEY = 'tewter_problem_history_guest';

interface SolutionStep {
  equationBefore: string;
  action: string;
  equationAfter: string;
}

interface AnalysisResult {
  id: string;
  extractedText: string;
  classification: string;
  solution: string;
  steps: SolutionStep[];
}

interface AnalysisResponse {
  results: AnalysisResult[];
  totalDetected: number;
  totalAnalyzed: number;
  wasCapped: boolean;
}

interface SavedProblem {
  id: string;
  imageUri: string;
  results: AnalysisResult[];
  timestamp: number;
  totalDetected: number;
}

export function UploadScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [showCropMode, setShowCropMode] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 20, y: 50, width: SCREEN_WIDTH - 80, height: 200 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const dragStart = useRef({ x: 0, y: 0, cropBox: { x: 0, y: 0, width: 0, height: 0 } });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedProblem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedProblem | null>(null);
  const cameraRef = useRef<CameraView>(null);
  
  const { isOffline } = useNetwork();
  const { user } = useAuth();

  // Get storage key for current user
  const getHistoryStorageKey = () => {
    return user ? `${HISTORY_STORAGE_KEY_PREFIX}${user.id}` : HISTORY_GUEST_KEY;
  };

  const currentResult = analysisResponse?.results[currentProblemIndex] || null;
  const totalProblems = analysisResponse?.results.length || selectedHistoryItem?.results.length || 0;

  // Load history on mount and when user changes
  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(getHistoryStorageKey());
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveToHistory = async (imageUri: string, response: AnalysisResponse) => {
    try {
      const newEntry: SavedProblem = {
        id: `problem-${Date.now()}`,
        imageUri,
        results: response.results,
        timestamp: Date.now(),
        totalDetected: response.totalDetected,
      };
      const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
      setHistory(updatedHistory);
      await AsyncStorage.setItem(getHistoryStorageKey(), JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      await AsyncStorage.setItem(getHistoryStorageKey(), JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error deleting from history:', error);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo) {
        setImageUri(photo.uri);
        setImageBase64(photo.base64 || null);
        setShowCamera(false);
        setPendingConfirmation(true); // Show confirmation screen with crop option
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // This enables cropping in the image picker
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
      setPendingConfirmation(true); // Don't analyze yet, wait for confirmation
    }
  };

  const openCropMode = () => {
    if (!imageUri) return;
    // Get image dimensions to calculate crop ratio
    Image.getSize(imageUri, (width, height) => {
      setImageSize({ width, height });
      // Set initial crop box centered
      const displayWidth = SCREEN_WIDTH - 40;
      const displayHeight = (height / width) * displayWidth;
      setCropBox({
        x: 20,
        y: 20,
        width: displayWidth - 40,
        height: Math.min(displayHeight - 40, 250),
      });
      setShowCropMode(true);
    });
  };

  const applyCrop = async () => {
    if (!imageUri || !imageSize.width) return;
    
    try {
      // Calculate the actual crop coordinates based on image dimensions
      const displayWidth = SCREEN_WIDTH - 40;
      const displayHeight = (imageSize.height / imageSize.width) * displayWidth;
      
      const scaleX = imageSize.width / displayWidth;
      const scaleY = imageSize.height / displayHeight;
      
      const cropRegion = {
        originX: Math.max(0, cropBox.x * scaleX),
        originY: Math.max(0, cropBox.y * scaleY),
        width: Math.min(cropBox.width * scaleX, imageSize.width),
        height: Math.min(cropBox.height * scaleY, imageSize.height),
      };
      
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: cropRegion }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      setImageUri(result.uri);
      setImageBase64(result.base64 || null);
      setShowCropMode(false);
    } catch (error) {
      console.error('Crop error:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    }
  };

  const confirmAndAnalyze = () => {
    if (imageBase64 && imageUri) {
      setPendingConfirmation(false);
      analyzeImage(imageBase64, imageUri);
    }
  };

  const cancelUpload = () => {
    setImageUri(null);
    setImageBase64(null);
    setPendingConfirmation(false);
    setShowCropMode(false);
  };

  const parseApiProblem = (problem: any): AnalysisResult => {
    let solutionText = 'See steps below';
    let stepsArray: SolutionStep[] = [];
    
    if (problem.solution) {
      if (typeof problem.solution === 'string') {
        solutionText = problem.solution;
        stepsArray = [{ equationBefore: '', action: problem.solution, equationAfter: '' }];
      } else if (typeof problem.solution === 'object') {
        solutionText = problem.solution.finalAnswer || problem.solution.title || 'See steps below';
        if (Array.isArray(problem.solution.steps)) {
          stepsArray = problem.solution.steps.map((step: any) => {
            if (typeof step === 'string') {
              return { equationBefore: '', action: step, equationAfter: '' };
            }
            // New PhotoMath-style format
            const equationBefore = step.equationBefore || '';
            const action = step.action || step.explanation || step.title || '';
            const equationAfter = step.equationAfter || step.visualUpdate || step.answer || '';
            return { equationBefore, action, equationAfter: String(equationAfter) };
          });
        }
      }
    }
    
    return {
      id: problem.id || `problem-${Date.now()}`,
      extractedText: formatMathText(problem.extractedText || 'Unable to extract text'),
      classification: `${problem.topic || 'Math'} - ${problem.subtopic || 'Problem'}`,
      solution: formatMathText(solutionText),
      steps: stepsArray.length > 0 
        ? stepsArray.map(s => ({ 
            equationBefore: formatMathText(s.equationBefore), 
            action: formatMathText(s.action), 
            equationAfter: formatMathText(s.equationAfter) 
          }))
        : [{ equationBefore: '', action: 'Solution analyzed successfully', equationAfter: '' }],
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
          const response: AnalysisResponse = {
            results: [result],
            totalDetected: data.totalProblemsDetected || 1,
            totalAnalyzed: 1,
            wasCapped: (data.totalProblemsDetected || 1) > 1,
          };
          setAnalysisResponse(response);
          
          // Save to history
          await saveToHistory(uri, response);
          
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
        
        const response: AnalysisResponse = {
          results,
          totalDetected: data.totalDetected || results.length,
          totalAnalyzed: data.totalAnalyzed || results.length,
          wasCapped: data.wasCapped || false,
        };
        setAnalysisResponse(response);
        
        // Save to history
        await saveToHistory(uri, response);
        
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
    setImageBase64(null);
    setAnalysisResponse(null);
    setCurrentProblemIndex(0);
    setShowCamera(false);
    setPendingConfirmation(false);
    setSelectedHistoryItem(null);
  };

  const viewHistoryItem = (item: SavedProblem) => {
    setSelectedHistoryItem(item);
    setShowHistory(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

  if (isOffline) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <OfflineNotice feature="Snap & Solve" />
      </SafeAreaView>
    );
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

  // History view
  if (showHistory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.historyHeader}>
          <Pressable onPress={() => setShowHistory(false)} style={styles.backButton}>
            <CaretLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.historyTitle}>Problem History</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Clock size={48} color={colors.textMuted} />
            <Text style={styles.emptyHistoryText}>No problems saved yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              Upload a problem to see it here
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyList}
            renderItem={({ item }) => (
              <Pressable onPress={() => viewHistoryItem(item)}>
                <Card style={styles.historyCard}>
                  <View style={styles.historyCardContent}>
                    <Image source={{ uri: item.imageUri }} style={styles.historyThumbnail} />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyProblemText} numberOfLines={2}>
                        {item.results[0]?.extractedText || 'Problem'}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {item.results.length} problem{item.results.length !== 1 ? 's' : ''} • {formatDate(item.timestamp)}
                      </Text>
                    </View>
                    <Pressable 
                      onPress={() => {
                        Alert.alert(
                          'Delete Problem',
                          'Are you sure you want to delete this from history?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteFromHistory(item.id) }
                          ]
                        );
                      }}
                      style={styles.deleteButton}
                    >
                      <Trash size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Selected history item view
  if (selectedHistoryItem) {
    const historyResult = selectedHistoryItem.results[currentProblemIndex];
    const historyTotalProblems = selectedHistoryItem.results.length;
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Compact Header with Image and Navigation */}
          <View style={styles.resultHeader}>
            <Image source={{ uri: selectedHistoryItem.imageUri }} style={styles.resultThumbnail} />
            <View style={styles.resultHeaderInfo}>
              {historyTotalProblems > 1 ? (
                <View style={styles.problemNavRow}>
                  <Pressable 
                    onPress={goToPreviousProblem} 
                    disabled={currentProblemIndex === 0}
                    style={styles.navArrow}
                  >
                    <CaretLeft size={20} color={currentProblemIndex === 0 ? colors.textMuted : colors.primary} />
                  </Pressable>
                  <Text style={styles.problemNavText}>
                    Problem {currentProblemIndex + 1}/{historyTotalProblems}
                  </Text>
                  <Pressable 
                    onPress={goToNextProblem} 
                    disabled={currentProblemIndex === historyTotalProblems - 1}
                    style={styles.navArrow}
                  >
                    <CaretRight size={20} color={currentProblemIndex === historyTotalProblems - 1 ? colors.textMuted : colors.primary} />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.singleProblemText}>Saved Problem</Text>
              )}
              <Pressable onPress={resetUpload}>
                <Text style={styles.uploadNewLink}>Back to Upload</Text>
              </Pressable>
            </View>
          </View>

          {historyResult && (
            <>
              {/* Problem Statement */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Problem</Text>
                <Text style={styles.problemText}>{historyResult.extractedText}</Text>
              </View>

              {/* Answer */}
              <View style={styles.answerContainer}>
                <Text style={styles.answerLabel}>Answer</Text>
                <Text style={styles.answerText}>{historyResult.solution}</Text>
              </View>

              {/* Steps */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Solving Steps</Text>
                {historyResult.steps.map((step, index) => (
                  <View key={`step-${index}`} style={styles.stepCardNew}>
                    {/* Equation Before */}
                    {step.equationBefore ? (
                      <Text style={styles.equationText}>{step.equationBefore}</Text>
                    ) : null}
                    
                    {/* Action Description */}
                    <View style={styles.actionRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.actionText}>{step.action}</Text>
                    </View>
                    
                    {/* Equation After */}
                    {step.equationAfter ? (
                      <View style={styles.resultRow}>
                        <Text style={styles.equationResultText}>{step.equationAfter}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Crop mode - interactive crop UI
  if (showCropMode && imageUri) {
    const displayWidth = SCREEN_WIDTH - 40;
    const displayHeight = imageSize.width ? (imageSize.height / imageSize.width) * displayWidth : 300;
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.cropHeader}>
          <Pressable onPress={() => setShowCropMode(false)} style={styles.cropHeaderButton}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.cropHeaderTitle}>Crop Photo</Text>
          <Pressable onPress={applyCrop} style={styles.cropHeaderButton}>
            <Check size={24} color={colors.primary} />
          </Pressable>
        </View>
        
        <Text style={styles.cropInstructions}>
          Drag the corners to adjust the crop area
        </Text>
        
        <View style={[styles.cropContainer, { height: displayHeight + 40 }]}>
          <Image 
            source={{ uri: imageUri }} 
            style={[styles.cropImage, { width: displayWidth, height: displayHeight }]} 
          />
          
          {/* Crop overlay - darkens area outside crop box */}
          <View style={[styles.cropOverlay, { width: displayWidth, height: displayHeight }]}>
            {/* Top dark area */}
            <View style={[styles.cropDark, { height: cropBox.y, width: displayWidth }]} />
            
            {/* Middle row with left dark, transparent center, right dark */}
            <View style={{ flexDirection: 'row', height: cropBox.height }}>
              <View style={[styles.cropDark, { width: cropBox.x }]} />
              <View style={[styles.cropArea, { width: cropBox.width, height: cropBox.height }]}>
                {/* Corner handles - Top Left */}
                <View 
                  style={[styles.cropHandle, styles.cropHandleTL]}
                  onTouchStart={(e) => {
                    dragStart.current = {
                      x: e.nativeEvent.pageX,
                      y: e.nativeEvent.pageY,
                      cropBox: { ...cropBox },
                    };
                  }}
                  onTouchMove={(e) => {
                    const deltaX = e.nativeEvent.pageX - dragStart.current.x;
                    const deltaY = e.nativeEvent.pageY - dragStart.current.y;
                    const initial = dragStart.current.cropBox;
                    
                    const newX = Math.max(0, Math.min(initial.x + deltaX, initial.x + initial.width - 60));
                    const newY = Math.max(0, Math.min(initial.y + deltaY, initial.y + initial.height - 60));
                    
                    setCropBox({
                      x: newX,
                      y: newY,
                      width: initial.width - (newX - initial.x),
                      height: initial.height - (newY - initial.y),
                    });
                  }}
                >
                  <View style={[styles.cornerMark, styles.cornerTL]} />
                </View>
                
                {/* Top Right */}
                <View 
                  style={[styles.cropHandle, styles.cropHandleTR]}
                  onTouchStart={(e) => {
                    dragStart.current = {
                      x: e.nativeEvent.pageX,
                      y: e.nativeEvent.pageY,
                      cropBox: { ...cropBox },
                    };
                  }}
                  onTouchMove={(e) => {
                    const deltaX = e.nativeEvent.pageX - dragStart.current.x;
                    const deltaY = e.nativeEvent.pageY - dragStart.current.y;
                    const initial = dragStart.current.cropBox;
                    
                    const newWidth = Math.max(60, Math.min(initial.width + deltaX, displayWidth - initial.x));
                    const newY = Math.max(0, Math.min(initial.y + deltaY, initial.y + initial.height - 60));
                    
                    setCropBox({
                      x: initial.x,
                      y: newY,
                      width: newWidth,
                      height: initial.height - (newY - initial.y),
                    });
                  }}
                >
                  <View style={[styles.cornerMark, styles.cornerTR]} />
                </View>
                
                {/* Bottom Left */}
                <View 
                  style={[styles.cropHandle, styles.cropHandleBL]}
                  onTouchStart={(e) => {
                    dragStart.current = {
                      x: e.nativeEvent.pageX,
                      y: e.nativeEvent.pageY,
                      cropBox: { ...cropBox },
                    };
                  }}
                  onTouchMove={(e) => {
                    const deltaX = e.nativeEvent.pageX - dragStart.current.x;
                    const deltaY = e.nativeEvent.pageY - dragStart.current.y;
                    const initial = dragStart.current.cropBox;
                    
                    const newX = Math.max(0, Math.min(initial.x + deltaX, initial.x + initial.width - 60));
                    const newHeight = Math.max(60, Math.min(initial.height + deltaY, displayHeight - initial.y));
                    
                    setCropBox({
                      x: newX,
                      y: initial.y,
                      width: initial.width - (newX - initial.x),
                      height: newHeight,
                    });
                  }}
                >
                  <View style={[styles.cornerMark, styles.cornerBL]} />
                </View>
                
                {/* Bottom Right */}
                <View 
                  style={[styles.cropHandle, styles.cropHandleBR]}
                  onTouchStart={(e) => {
                    dragStart.current = {
                      x: e.nativeEvent.pageX,
                      y: e.nativeEvent.pageY,
                      cropBox: { ...cropBox },
                    };
                  }}
                  onTouchMove={(e) => {
                    const deltaX = e.nativeEvent.pageX - dragStart.current.x;
                    const deltaY = e.nativeEvent.pageY - dragStart.current.y;
                    const initial = dragStart.current.cropBox;
                    
                    const newWidth = Math.max(60, Math.min(initial.width + deltaX, displayWidth - initial.x));
                    const newHeight = Math.max(60, Math.min(initial.height + deltaY, displayHeight - initial.y));
                    
                    setCropBox({
                      x: initial.x,
                      y: initial.y,
                      width: newWidth,
                      height: newHeight,
                    });
                  }}
                >
                  <View style={[styles.cornerMark, styles.cornerBR]} />
                </View>
              </View>
              <View style={[styles.cropDark, { width: displayWidth - cropBox.x - cropBox.width }]} />
            </View>
            
            {/* Bottom dark area */}
            <View style={[styles.cropDark, { height: displayHeight - cropBox.y - cropBox.height, width: displayWidth }]} />
          </View>
        </View>
        
        <View style={styles.cropActions}>
          <Button title="Cancel" onPress={() => setShowCropMode(false)} variant="secondary" />
          <Button title="Apply Crop" onPress={applyCrop} />
        </View>
      </SafeAreaView>
    );
  }

  // Confirmation step - show image preview before analyzing
  if (pendingConfirmation && imageUri) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>📷 Review Photo</Text>
          <Text style={styles.subtitle}>
            Make sure the problem is clear and readable
          </Text>

          <Card style={styles.imageCard} padding="sm">
            <Image source={{ uri: imageUri }} style={styles.previewImageLarge} />
          </Card>

          {/* Crop button */}
          <Pressable onPress={openCropMode} style={styles.cropButton}>
            <Crop size={20} color={colors.primary} />
            <Text style={styles.cropButtonText}>Crop Photo</Text>
          </Pressable>

          <View style={styles.confirmationButtons}>
            <Button
              title="Analyze Problem"
              onPress={confirmAndAnalyze}
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
          
          <Pressable onPress={cancelUpload} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>📷 Snap & Solve</Text>
        <Text style={styles.subtitle}>
          Take a photo or upload an image of a math problem
        </Text>

        {history.length > 0 && (
          <Pressable onPress={() => setShowHistory(true)} style={styles.historyBanner}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.historyBannerText}>
              View History ({history.length} saved problem{history.length !== 1 ? 's' : ''})
            </Text>
            <CaretRight size={18} color={colors.textMuted} />
          </Pressable>
        )}

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
            {/* Compact Header with Image and Navigation */}
            <View style={styles.resultHeader}>
              <Image source={{ uri: imageUri }} style={styles.resultThumbnail} />
              <View style={styles.resultHeaderInfo}>
                {totalProblems > 1 ? (
                  <View style={styles.problemNavRow}>
                    <Pressable 
                      onPress={goToPreviousProblem} 
                      disabled={currentProblemIndex === 0}
                      style={styles.navArrow}
                    >
                      <CaretLeft size={20} color={currentProblemIndex === 0 ? colors.textMuted : colors.primary} />
                    </Pressable>
                    <Text style={styles.problemNavText}>
                      Problem {currentProblemIndex + 1}/{totalProblems}
                    </Text>
                    <Pressable 
                      onPress={goToNextProblem} 
                      disabled={currentProblemIndex === totalProblems - 1}
                      style={styles.navArrow}
                    >
                      <CaretRight size={20} color={currentProblemIndex === totalProblems - 1 ? colors.textMuted : colors.primary} />
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.singleProblemText}>1 Problem Detected</Text>
                )}
                <Pressable onPress={resetUpload}>
                  <Text style={styles.uploadNewLink}>Upload New</Text>
                </Pressable>
              </View>
            </View>

            {analyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzingText}>Analyzing...</Text>
              </View>
            ) : currentResult ? (
              <>
                {/* Problem Statement */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Problem</Text>
                  <Text style={styles.problemText}>{currentResult.extractedText}</Text>
                </View>

                {/* Answer */}
                <View style={styles.answerContainer}>
                  <Text style={styles.answerLabel}>Answer</Text>
                  <Text style={styles.answerText}>{currentResult.solution}</Text>
                </View>

                {/* Steps */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Solving Steps</Text>
                  {currentResult.steps.map((step, index) => (
                    <View key={`step-${index}`} style={styles.stepCardNew}>
                      {/* Equation Before */}
                      {step.equationBefore ? (
                        <Text style={styles.equationText}>{step.equationBefore}</Text>
                      ) : null}
                      
                      {/* Action Description */}
                      <View style={styles.actionRow}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.actionText}>{step.action}</Text>
                      </View>
                      
                      {/* Equation After */}
                      {step.equationAfter ? (
                        <View style={styles.resultRow}>
                          <Text style={styles.equationResultText}>{step.equationAfter}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </>
            ) : null}
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
  // Header row for history button
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  historyButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
  },
  historyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  historyBannerText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  // History view styles
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.textMuted + '30',
  },
  backButton: {
    padding: spacing.sm,
  },
  historyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  historyList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  historyCard: {
    marginBottom: spacing.sm,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyThumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
  },
  historyInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  historyProblemText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  historyMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyHistoryText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  emptyHistorySubtext: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Confirmation step styles
  previewImageLarge: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    resizeMode: 'contain',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  confirmationSecondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  cropButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelLinkText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  // Crop mode styles
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cropHeaderButton: {
    padding: spacing.sm,
  },
  cropHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cropInstructions: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
  },
  cropImage: {
    resizeMode: 'contain',
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cropDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropArea: {
    borderWidth: 2,
    borderColor: colors.white,
    position: 'relative',
  },
  cropHandle: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHandleTL: {
    top: -10,
    left: -10,
  },
  cropHandleTR: {
    top: -10,
    right: -10,
  },
  cropHandleBL: {
    bottom: -10,
    left: -10,
  },
  cropHandleBR: {
    bottom: -10,
    right: -10,
  },
  cornerMark: {
    width: 20,
    height: 20,
    borderColor: colors.white,
    borderWidth: 3,
  },
  cornerTL: {
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  cropActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  // New cleaner results view styles
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  resultThumbnail: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  resultHeaderInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  problemNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navArrow: {
    padding: spacing.xs,
  },
  problemNavText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  singleProblemText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  uploadNewLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  problemText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 26,
  },
  answerContainer: {
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  answerLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  answerText: {
    fontSize: fontSize.xl,
    color: colors.success,
    fontWeight: 'bold',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  stepContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  stepContentWrapper: {
    flex: 1,
  },
  stepResultBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  stepResultText: {
    fontSize: fontSize.md,
    color: '#166534',
    fontFamily: 'monospace',
    fontWeight: '600',
    lineHeight: 24,
  },
  // PhotoMath-style step layout
  stepCardNew: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder || '#2A2A2A',
  },
  equationText: {
    fontSize: fontSize.lg,
    color: '#F87171',
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated || '#1A1A1A',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  actionText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  resultRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  equationResultText: {
    fontSize: fontSize.lg,
    color: '#4ADE80',
    fontFamily: 'monospace',
    fontWeight: '600',
    textAlign: 'center',
  },
});
