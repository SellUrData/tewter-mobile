import React from 'react';
import { IconProps as PhosphorIconProps } from 'phosphor-react-native';
import {
  House,
  PencilSimple,
  Trophy,
  User,
  Brain,
  Sparkle,
  Lightning,
  Fire,
  CheckCircle,
  ChartBar,
  Star,
  Target,
  Lightbulb,
  Timer,
  BookOpen,
  Function,
  Triangle,
  ChartLine,
  HashStraight,
  Gear,
  Play,
  ArrowRight,
  ArrowLeft,
  Lock,
  LockOpen,
  Medal,
  Barbell,
  GameController,
  Camera,
  Question,
  Chat,
  CaretRight,
  X,
  Check,
  Plus,
  Minus,
} from 'phosphor-react-native';
import { colors } from '../../constants/theme';

// Icon name type for type safety
export type IconName =
  | 'home'
  | 'practice'
  | 'trophy'
  | 'profile'
  | 'brain'
  | 'sparkle'
  | 'lightning'
  | 'fire'
  | 'check-circle'
  | 'chart-bar'
  | 'star'
  | 'target'
  | 'lightbulb'
  | 'timer'
  | 'book'
  | 'function'
  | 'triangle'
  | 'chart-line'
  | 'hash'
  | 'gear'
  | 'play'
  | 'arrow-right'
  | 'arrow-left'
  | 'lock'
  | 'lock-open'
  | 'medal'
  | 'barbell'
  | 'game'
  | 'camera'
  | 'question'
  | 'chat'
  | 'caret-right'
  | 'x'
  | 'check'
  | 'plus'
  | 'minus';

// Map icon names to Phosphor components
const iconMap: Record<IconName, React.ComponentType<PhosphorIconProps>> = {
  'home': House,
  'practice': PencilSimple,
  'trophy': Trophy,
  'profile': User,
  'brain': Brain,
  'sparkle': Sparkle,
  'lightning': Lightning,
  'fire': Fire,
  'check-circle': CheckCircle,
  'chart-bar': ChartBar,
  'star': Star,
  'target': Target,
  'lightbulb': Lightbulb,
  'timer': Timer,
  'book': BookOpen,
  'function': Function,
  'triangle': Triangle,
  'chart-line': ChartLine,
  'hash': HashStraight,
  'gear': Gear,
  'play': Play,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'lock': Lock,
  'lock-open': LockOpen,
  'medal': Medal,
  'barbell': Barbell,
  'game': GameController,
  'camera': Camera,
  'question': Question,
  'chat': Chat,
  'caret-right': CaretRight,
  'x': X,
  'check': Check,
  'plus': Plus,
  'minus': Minus,
};

// Size presets
const sizePresets = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

export interface IconProps {
  name: IconName;
  size?: keyof typeof sizePresets | number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

export function Icon({ 
  name, 
  size = 'md', 
  color = colors.text,
  weight = 'regular',  // Phosphor's regular is clean/rounded
}: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const pixelSize = typeof size === 'number' ? size : sizePresets[size];

  return (
    <IconComponent 
      size={pixelSize} 
      color={color} 
      weight={weight}
    />
  );
}

// Convenience components for common use cases
export function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Icon 
      name={name} 
      size="lg"
      color={focused ? colors.primary : colors.textMuted}
      weight={focused ? 'fill' : 'regular'}
    />
  );
}
