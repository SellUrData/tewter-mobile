import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Animated, StyleSheet } from 'react-native';
import { House, PencilSimple, Trophy, User } from 'phosphor-react-native';
import LottieView from 'lottie-react-native';

const tewterAnimation = require('../../assets/animations/tewter ani.json');

import { HomeScreen } from '../screens/HomeScreen';
import { PracticeScreen } from '../screens/PracticeScreen';
import { ArithmeticScreen } from '../screens/ArithmeticScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { MultiplayerScreen } from '../screens/MultiplayerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.cardBorder,
  },
};

// Phosphor icon component type
type PhosphorIcon = typeof House;

// Animated Tab Icon with bounce and glow effect using Phosphor
function AnimatedTabIcon({ 
  IconComponent, 
  focused, 
}: { 
  IconComponent: PhosphorIcon; 
  focused: boolean; 
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Bounce animation when focused
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Glow fade in
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset when not focused
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [focused]);

  return (
    <View style={tabStyles.iconContainer}>
      {/* Glow background for active tab */}
      <Animated.View 
        style={[
          tabStyles.iconGlow,
          { 
            opacity: glowAnim,
            backgroundColor: colors.primary + '25',
          }
        ]} 
      />
      <Animated.View 
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <IconComponent 
          size={26} 
          color={focused ? colors.primary : colors.textMuted}
          weight={focused ? 'fill' : 'regular'}
        />
      </Animated.View>
    </View>
  );
}

// Custom Tab Label with animation
function AnimatedTabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[
      tabStyles.label,
      focused ? tabStyles.labelActive : tabStyles.labelInactive,
    ]}>
      {label}
    </Text>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
  },
  iconGlow: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderRadius: borderRadius.md,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
  },
  labelInactive: {
    color: colors.textMuted,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 10,
          height: 75,
          // Add subtle shadow for depth
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused }) => <AnimatedTabLabel label="Home" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon IconComponent={House} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Train"
        component={PracticeScreen}
        options={{
          tabBarLabel: ({ focused }) => <AnimatedTabLabel label="Train" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon IconComponent={PencilSimple} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Compete"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: ({ focused }) => <AnimatedTabLabel label="Compete" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon IconComponent={Trophy} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => <AnimatedTabLabel label="Profile" focused={focused} />,
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon IconComponent={User} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <LottieView
          source={tewterAnimation}
          autoPlay
          loop
          style={loadingStyles.animation}
        />
        <Text style={loadingStyles.text}>Tewter</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { 
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
          // Smooth slide animation for screen transitions
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      >
        {/* Main app screens - accessible to everyone */}
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Arithmetic" 
          component={ArithmeticScreen} 
          options={{ 
            title: 'Mental Math', 
            headerShown: true,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="Upload" 
          component={UploadScreen} 
          options={{ 
            title: 'Snap & Solve', 
            headerShown: true,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="Multiplayer" 
          component={MultiplayerScreen} 
          options={{ 
            title: 'Multiplayer', 
            headerShown: true,
            animation: 'slide_from_bottom',
          }}
        />
        
        {/* Auth screen - show when needed */}
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ 
            presentation: 'modal', 
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 150,
    height: 150,
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
});
