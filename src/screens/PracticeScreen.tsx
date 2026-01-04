import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Vibration, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MathOperations,
  Function,
  Infinity,
  ChartLine,
  Equals,
  GridFour,
  Radical,
  Percent,
  ArrowsClockwise,
  Link,
  Graph,
  Cube,
  Spiral,
  Waves,
  CaretRight,
  GraduationCap,
  BookOpen,
  Lightning,
  Target,
  Trophy,
  Star,
  ArrowLeft,
  Leaf,
  Flame,
} from 'phosphor-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TouchableCard } from '../components/ui/TouchableCard';
import { GradientCard } from '../components/ui/GradientCard';
import { MascotReaction, MascotMood } from '../components/ui/MascotReaction';
import { FeedbackAnimation } from '../components/ui/FeedbackAnimation';
import { colors, spacing, fontSize, borderRadius, shadows, gradients } from '../constants/theme';
import { icons } from '../constants/icons';
import { useProgress } from '../contexts/ProgressContext';
import { useXP } from '../contexts/XPContext';
import { useLeague } from '../contexts/LeagueContext';
import { XPGainToast } from '../components/ui/XPGainToast';
import { XPBreakdown } from '../constants/xp';

// Topic icon mapping using Phosphor icons
const TopicIcons: Record<string, React.ComponentType<any>> = {
  'algebra': MathOperations,
  'precalc': Function,
  'calc1': Infinity,
};

// Subtopic icon mapping
const SubtopicIcons: Record<string, React.ComponentType<any>> = {
  'linear-equations': Equals,
  'systems-equations': GridFour,
  'quadratic-equations': ChartLine,
  'factoring': Radical,
  'polynomials': Graph,
  'rational-expressions': Percent,
  'radical-expressions': Radical,
  'complex-numbers': Cube,
  'sequences-series': Link,
  'exponential-log': ChartLine,
  'functions-graphing': Graph,
  'trig-unit-circle': Spiral,
  'trig-identities': ArrowsClockwise,
  'trig-equations': Waves,
  'polynomial-functions': Graph,
  'rational-functions': Percent,
  'vectors-parametric': ArrowsClockwise,
  'polar-coordinates': Spiral,
  'limits': Infinity,
  'derivatives-basic': ChartLine,
  'chain-rule': Link,
  'trig-derivatives': Waves,
  'applications': Target,
  'integrals': Function,
  'integration-techniques': MathOperations,
  'area-volume': Cube,
};

// Topic solid colors (no gradients)
const TopicGradients: Record<string, [string, string]> = {
  'algebra': ['#8b5cf6', '#8b5cf6'],           // Purple
  'precalc': ['#06b6d4', '#06b6d4'],           // Cyan
  'calc1': ['#f59e0b', '#f59e0b'],             // Amber
  'linear-algebra': ['#10b981', '#10b981'],   // Emerald green
  'stats-probability': ['#f43f5e', '#f43f5e'], // Rose/pink
};

type ProblemMode = 'step-by-step' | 'full';

interface ProblemStep {
  instruction: string;
  answer: string;
  equationBefore?: string;
  equationAfter?: string;
}

interface Problem {
  question: string;
  steps: ProblemStep[];
  hint?: string;
  topic: string;
  subtopic: string;
  finalAnswer?: string;
}

interface Subtopic {
  id: string;
  name: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

interface Topic {
  id: string;
  name: string;
  icon: string;
  description: string;
  subtopics: Subtopic[];
}

// Topics matching the web app with full descriptions
const topics: Topic[] = [
  {
    id: 'algebra',
    name: 'Algebra',
    icon: '📊',
    description: 'Equations, factoring, polynomials',
    subtopics: [
      { id: 'linear-equations', name: 'Linear Equations', icon: '📏', difficulty: 'easy', description: 'Solve equations like 2x + 5 = 15. Practice isolating variables and working with one-step and multi-step equations.' },
      { id: 'systems-equations', name: 'Systems of Equations', icon: '🔢', difficulty: 'medium', description: 'Solve multiple equations with multiple variables using substitution and elimination methods.' },
      { id: 'quadratic-equations', name: 'Quadratic Equations', icon: '📐', difficulty: 'medium', description: 'Solve equations of the form ax² + bx + c = 0 using factoring, completing the square, or the quadratic formula.' },
      { id: 'factoring', name: 'Factoring', icon: '✂️', difficulty: 'medium', description: 'Factor polynomials including GCF, trinomials, difference of squares, and sum/difference of cubes.' },
      { id: 'polynomials', name: 'Polynomials', icon: '🧮', difficulty: 'medium', description: 'Add, subtract, multiply, and divide polynomials. Work with special products and polynomial long division.' },
      { id: 'rational-expressions', name: 'Rational Expressions', icon: '➗', difficulty: 'medium', description: 'Simplify, multiply, divide, and add/subtract rational expressions. Find restrictions and solve rational equations.' },
      { id: 'radical-expressions', name: 'Radical Expressions', icon: '√', difficulty: 'medium', description: 'Simplify radicals, rationalize denominators, and solve radical equations. Work with square roots and higher-order roots.' },
      { id: 'complex-numbers', name: 'Complex Numbers', icon: 'ℂ', difficulty: 'hard', description: 'Work with imaginary numbers (i = √-1). Add, subtract, multiply complex numbers and find complex conjugates.' },
      { id: 'sequences-series', name: 'Sequences & Series', icon: '🔗', difficulty: 'hard', description: 'Work with arithmetic and geometric sequences. Find nth terms, sums, and use sigma notation.' },
      { id: 'exponential-log', name: 'Exponential & Logarithmic', icon: '📊', difficulty: 'hard', description: 'Solve exponential and logarithmic equations. Apply log rules and work with growth/decay problems.' },
    ],
  },
  {
    id: 'precalc',
    name: 'Pre-Calculus',
    icon: '📐',
    description: 'Trig, functions, exponentials',
    subtopics: [
      { id: 'functions-graphing', name: 'Functions & Graphing', icon: '📈', difficulty: 'easy', description: 'Understand domain, range, function notation, and transformations. Graph and analyze various function types.' },
      { id: 'trig-unit-circle', name: 'Unit Circle & Trig', icon: '⭕', difficulty: 'medium', description: 'Master the unit circle, evaluate trig functions at special angles, and understand reference angles.' },
      { id: 'trig-identities', name: 'Trig Identities', icon: '🔄', difficulty: 'hard', description: 'Use Pythagorean, reciprocal, and quotient identities. Prove identities and simplify trig expressions.' },
      { id: 'trig-equations', name: 'Trig Equations', icon: '🔀', difficulty: 'hard', description: 'Solve trigonometric equations. Find all solutions in given intervals using identities and inverse functions.' },
      { id: 'exponential-log', name: 'Exponential & Log', icon: '📉', difficulty: 'medium', description: 'Graph and solve exponential and logarithmic functions. Apply to real-world growth and decay problems.' },
      { id: 'polynomial-functions', name: 'Polynomial Functions', icon: '📈', difficulty: 'medium', description: 'Analyze end behavior, find zeros and multiplicities, and graph polynomial functions of higher degree.' },
      { id: 'rational-functions', name: 'Rational Functions', icon: '➗', difficulty: 'medium', description: 'Find vertical and horizontal asymptotes, holes, and graph rational functions.' },
      { id: 'vectors-parametric', name: 'Vectors & Parametric', icon: '➡️', difficulty: 'hard', description: 'Perform vector operations, find magnitude and direction, and work with parametric equations.' },
      { id: 'polar-coordinates', name: 'Polar Coordinates', icon: '🌀', difficulty: 'hard', description: 'Convert between polar and rectangular coordinates. Graph polar equations and curves.' },
    ],
  },
  {
    id: 'calc1',
    name: 'Calculus I',
    icon: '∫',
    description: 'Limits, derivatives, integrals',
    subtopics: [
      { id: 'limits', name: 'Limits & Continuity', icon: '∞', difficulty: 'medium', description: 'Evaluate limits using direct substitution, factoring, and L\'Hôpital\'s rule. Understand continuity at a point.' },
      { id: 'derivatives-basic', name: 'Basic Derivatives', icon: '📐', difficulty: 'medium', description: 'Apply power rule, product rule, and quotient rule to find derivatives of polynomial and rational functions.' },
      { id: 'chain-rule', name: 'Chain Rule', icon: '🔗', difficulty: 'hard', description: 'Differentiate composite functions using the chain rule. Handle nested functions and implicit differentiation.' },
      { id: 'trig-derivatives', name: 'Trig Derivatives', icon: '🔄', difficulty: 'medium', description: 'Find derivatives of sin, cos, tan, and other trig functions. Combine with other differentiation rules.' },
      { id: 'applications', name: 'Applications of Derivatives', icon: '📈', difficulty: 'hard', description: 'Find critical points, optimize functions, solve related rates problems, and analyze curve behavior.' },
      { id: 'integrals', name: 'Basic Integrals', icon: '∫', difficulty: 'medium', description: 'Find antiderivatives using power rule. Evaluate definite integrals and understand the Fundamental Theorem.' },
      { id: 'u-substitution', name: 'U-Substitution', icon: '🔄', difficulty: 'hard', description: 'Use substitution to evaluate integrals of composite functions. Choose appropriate substitutions.' },
      { id: 'area-volume', name: 'Area & Volume', icon: '📊', difficulty: 'hard', description: 'Find area between curves and volumes of revolution using disk, washer, and shell methods.' },
    ],
  },
  {
    id: 'linear-algebra',
    name: 'Linear Algebra',
    icon: '🔢',
    description: 'Matrices, vectors, eigenvalues',
    subtopics: [
      { id: 'matrix-basics', name: 'Matrix Operations', icon: '🔢', difficulty: 'easy', description: 'Add, subtract, and scalar multiply matrices. Find transpose and understand matrix dimensions.' },
      { id: 'vectors', name: 'Vectors & Dot Product', icon: '➡️', difficulty: 'easy', description: 'Perform vector addition, find dot products, calculate magnitude, and normalize vectors.' },
      { id: 'matrix-multiplication', name: 'Matrix Multiplication', icon: '✖️', difficulty: 'medium', description: 'Multiply matrices and understand dimension requirements. Apply to linear transformations.' },
      { id: 'determinants', name: 'Determinants', icon: '📊', difficulty: 'medium', description: 'Calculate determinants of 2×2 and 3×3 matrices. Understand properties and applications.' },
      { id: 'linear-systems', name: 'Linear Systems', icon: '📐', difficulty: 'medium', description: 'Solve systems using row reduction and Gaussian elimination. Identify solution types.' },
      { id: 'eigenvalues', name: 'Eigenvalues & Eigenvectors', icon: '🎯', difficulty: 'hard', description: 'Find eigenvalues and eigenvectors. Understand their role in PCA and machine learning.' },
      { id: 'projections', name: 'Projections', icon: '📐', difficulty: 'hard', description: 'Calculate scalar and vector projections. Apply to least squares and dimensionality reduction.' },
    ],
  },
  {
    id: 'stats-probability',
    name: 'Stats & Probability',
    icon: '📈',
    description: 'Distributions, hypothesis testing',
    subtopics: [
      { id: 'descriptive-stats', name: 'Descriptive Statistics', icon: '📊', difficulty: 'easy', description: 'Calculate mean, median, mode, variance, and standard deviation. Find quartiles and detect outliers.' },
      { id: 'probability-basics', name: 'Probability Fundamentals', icon: '🎲', difficulty: 'medium', description: 'Calculate basic probabilities, conditional probability, and apply Bayes\' theorem.' },
      { id: 'distributions', name: 'Probability Distributions', icon: '📈', difficulty: 'medium', description: 'Work with binomial, normal, and Poisson distributions. Calculate probabilities and z-scores.' },
      { id: 'sampling-clt', name: 'Sampling & CLT', icon: '🎯', difficulty: 'medium', description: 'Understand sampling distributions, standard error, and the Central Limit Theorem.' },
      { id: 'confidence-intervals', name: 'Confidence Intervals', icon: '📊', difficulty: 'medium', description: 'Construct and interpret confidence intervals for means. Calculate margin of error.' },
      { id: 'hypothesis-testing', name: 'Hypothesis Testing', icon: '🔬', difficulty: 'hard', description: 'Conduct t-tests, interpret p-values, and understand Type I and Type II errors.' },
      { id: 'regression', name: 'Linear Regression', icon: '📉', difficulty: 'hard', description: 'Fit linear models, interpret coefficients, and calculate R-squared values.' },
    ],
  },
];

// Helper function for greatest common divisor (used for LCD calculation)
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

// Problem generators for each subtopic (now accept difficulty)
const problemGenerators: Record<string, (difficulty?: Difficulty) => Problem> = {
  // ALGEBRA
  'linear-equations': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Standard 2-step equations like 3x + 7 = 22
      const a = Math.floor(Math.random() * 6) + 2;
      const x = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 15) + 3;
      const c = a * x + b;
      return {
        question: `Solve for x: ${a}x + ${b} = ${c}`,
        steps: [
          { 
            instruction: `Subtract ${b} from both sides. What is ${a}x?`, 
            answer: `${c - b}`,
            equationBefore: `${a}x + ${b} = ${c}`,
            equationAfter: `${a}x = ${c - b}`,
          },
          { 
            instruction: `Divide both sides by ${a}. What is x?`, 
            answer: `${x}`,
            equationBefore: `${a}x = ${c - b}`,
            equationAfter: `x = ${x}`,
          },
        ],
        hint: `First isolate the term with x by subtracting ${b}`,
        topic: 'algebra',
        subtopic: 'linear-equations',
        finalAnswer: `${x}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Fractions with distribution like (2/3)(x + 6) - (1/2)x = 10
      // Use denominators that work nicely: 2, 3, 4, 6
      const denoms = [2, 3, 4, 6];
      const d1 = denoms[Math.floor(Math.random() * denoms.length)];
      const d2 = denoms[Math.floor(Math.random() * denoms.length)];
      const lcd = (d1 * d2) / gcd(d1, d2);
      
      // Pick x that gives clean integer results
      const x = Math.floor(Math.random() * 6) + 2;
      const n1 = Math.floor(Math.random() * 3) + 1; // numerator 1
      const n2 = Math.floor(Math.random() * 3) + 1; // numerator 2
      const innerConst = Math.floor(Math.random() * 6) + 2;
      
      // (n1/d1)(x + innerConst) + (n2/d2)x = result
      // Expand: (n1/d1)x + (n1/d1)*innerConst + (n2/d2)x = result
      const term1Coef = n1 / d1; // coefficient of x from first term
      const term1Const = (n1 * innerConst) / d1; // constant from distribution
      const term2Coef = n2 / d2; // coefficient of x from second term
      const totalXCoef = term1Coef + term2Coef;
      const result = Math.round(totalXCoef * x + term1Const);
      
      return {
        question: `Solve for x: (${n1}/${d1})(x + ${innerConst}) + (${n2}/${d2})x = ${result}`,
        steps: [
          { 
            instruction: `Distribute (${n1}/${d1}) to both terms in the parentheses. What is (${n1}/${d1}) × ${innerConst}?`, 
            answer: `${(n1 * innerConst) / d1}`,
            equationBefore: `(${n1}/${d1})(x + ${innerConst}) + (${n2}/${d2})x = ${result}`,
            equationAfter: `(${n1}/${d1})x + ${(n1 * innerConst) / d1} + (${n2}/${d2})x = ${result}`,
          },
          { 
            instruction: `Multiply all terms by ${lcd} to clear fractions. What is the new coefficient of x?`, 
            answer: `${Math.round(totalXCoef * lcd)}`,
            equationBefore: `(${n1}/${d1})x + ${term1Const} + (${n2}/${d2})x = ${result}`,
            equationAfter: `${Math.round(totalXCoef * lcd)}x + ${Math.round(term1Const * lcd)} = ${result * lcd}`,
          },
          { 
            instruction: `Subtract ${Math.round(term1Const * lcd)} from both sides. What is ${Math.round(totalXCoef * lcd)}x?`, 
            answer: `${Math.round((result - term1Const) * lcd)}`,
            equationBefore: `${Math.round(totalXCoef * lcd)}x + ${Math.round(term1Const * lcd)} = ${result * lcd}`,
            equationAfter: `${Math.round(totalXCoef * lcd)}x = ${Math.round((result - term1Const) * lcd)}`,
          },
          { 
            instruction: `Divide both sides by ${Math.round(totalXCoef * lcd)}. What is x?`, 
            answer: `${x}`,
            equationBefore: `${Math.round(totalXCoef * lcd)}x = ${Math.round((result - term1Const) * lcd)}`,
            equationAfter: `x = ${x}`,
          },
        ],
        hint: `Distribute first, then multiply by ${lcd} to clear all fractions`,
        topic: 'algebra',
        subtopic: 'linear-equations',
        finalAnswer: `${x}`,
      };
    } else {
      // Medium: Variables on both sides like 5x - 3 = 2x + 9
      const x = Math.floor(Math.random() * 8) + 2;
      const a1 = Math.floor(Math.random() * 4) + 3;
      const a2 = Math.floor(Math.random() * (a1 - 1)) + 1;
      const b1 = Math.floor(Math.random() * 10) + 2;
      const b2 = (a1 - a2) * x - b1;
      return {
        question: `Solve for x: ${a1}x - ${b1} = ${a2}x + ${b2}`,
        steps: [
          { 
            instruction: `Subtract ${a2}x from both sides. What do you get on the left?`, 
            answer: `${a1 - a2}x - ${b1}`,
            equationBefore: `${a1}x - ${b1} = ${a2}x + ${b2}`,
            equationAfter: `${a1 - a2}x - ${b1} = ${b2}`,
          },
          { 
            instruction: `Add ${b1} to both sides. What is ${a1 - a2}x?`, 
            answer: `${b2 + b1}`,
            equationBefore: `${a1 - a2}x - ${b1} = ${b2}`,
            equationAfter: `${a1 - a2}x = ${b2 + b1}`,
          },
          { 
            instruction: `Divide both sides by ${a1 - a2}. What is x?`, 
            answer: `${x}`,
            equationBefore: `${a1 - a2}x = ${b2 + b1}`,
            equationAfter: `x = ${x}`,
          },
        ],
        hint: `Get all x terms on one side first`,
        topic: 'algebra',
        subtopic: 'linear-equations',
        finalAnswer: `${x}`,
      };
    }
  },
  'systems-equations': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple substitution with one variable already isolated
      const x = Math.floor(Math.random() * 5) + 1;
      const y = Math.floor(Math.random() * 5) + 1;
      const c = x + y;
      return {
        question: `Solve the system:\ny = ${y}\nx + y = ${c}`,
        steps: [
          { 
            instruction: `Substitute y = ${y} into the second equation. What is x + ${y}?`, 
            answer: `${c}`,
            equationBefore: `x + y = ${c}`,
            equationAfter: `x + ${y} = ${c}`,
          },
          { 
            instruction: `Solve for x. What is x?`, 
            answer: `${x}`,
            equationBefore: `x + ${y} = ${c}`,
            equationAfter: `x = ${x}`,
          },
        ],
        hint: 'Substitute the known value of y into the second equation',
        topic: 'algebra',
        subtopic: 'systems-equations',
        finalAnswer: `x = ${x}, y = ${y}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Systems with coefficients requiring elimination with multiplication
      const x = Math.floor(Math.random() * 4) + 1;
      const y = Math.floor(Math.random() * 4) + 1;
      const a1 = Math.floor(Math.random() * 3) + 2;
      const b1 = Math.floor(Math.random() * 3) + 2;
      const a2 = Math.floor(Math.random() * 3) + 2;
      const b2 = Math.floor(Math.random() * 3) + 2;
      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      const multiplier = a1; // Multiply second equation by this
      return {
        question: `Solve the system:\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}`,
        steps: [
          { 
            instruction: `To eliminate x, multiply the second equation by ${a1} and the first by ${a2}. What is ${a1} × ${c2}?`, 
            answer: `${a1 * c2}`,
            equationBefore: `${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}`,
            equationAfter: `${a2 * a1}x + ${a2 * b1}y = ${a2 * c1}\n${a1 * a2}x + ${a1 * b2}y = ${a1 * c2}`,
          },
          { 
            instruction: `Subtract the equations. What is the coefficient of y?`, 
            answer: `${a2 * b1 - a1 * b2}`,
            equationBefore: `${a2 * a1}x + ${a2 * b1}y = ${a2 * c1}\n${a1 * a2}x + ${a1 * b2}y = ${a1 * c2}`,
            equationAfter: `${a2 * b1 - a1 * b2}y = ${a2 * c1 - a1 * c2}`,
          },
          { 
            instruction: `Solve for y. What is y?`, 
            answer: `${y}`,
            equationBefore: `${a2 * b1 - a1 * b2}y = ${a2 * c1 - a1 * c2}`,
            equationAfter: `y = ${y}`,
          },
          { 
            instruction: `Substitute y = ${y} back to find x. What is x?`, 
            answer: `${x}`,
            equationBefore: `${a1}x + ${b1}(${y}) = ${c1}`,
            equationAfter: `x = ${x}`,
          },
        ],
        hint: 'Multiply equations to get matching coefficients, then subtract',
        topic: 'algebra',
        subtopic: 'systems-equations',
        finalAnswer: `x = ${x}, y = ${y}`,
      };
    } else {
      // Medium: Standard elimination (add/subtract directly)
      const x = Math.floor(Math.random() * 5) + 1;
      const y = Math.floor(Math.random() * 5) + 1;
      const c1 = x + y;
      const c2 = x - y;
      return {
        question: `Solve the system:\nx + y = ${c1}\nx - y = ${c2}`,
        steps: [
          { 
            instruction: `Add both equations to eliminate y. What is 2x?`, 
            answer: `${c1 + c2}`,
            equationBefore: `x + y = ${c1}\nx - y = ${c2}`,
            equationAfter: `2x = ${c1 + c2}`,
          },
          { 
            instruction: `Divide by 2. What is x?`, 
            answer: `${x}`,
            equationBefore: `2x = ${c1 + c2}`,
            equationAfter: `x = ${x}`,
          },
          { 
            instruction: `Substitute x = ${x} into x + y = ${c1}. What is y?`, 
            answer: `${y}`,
            equationBefore: `${x} + y = ${c1}`,
            equationAfter: `y = ${y}`,
          },
        ],
        hint: 'Add the equations to eliminate y',
        topic: 'algebra',
        subtopic: 'systems-equations',
        finalAnswer: `x = ${x}, y = ${y}`,
      };
    }
  },
  'quadratic-equations': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Standard factorable quadratics with small numbers
      const r1 = Math.floor(Math.random() * 4) + 1;
      const r2 = Math.floor(Math.random() * 4) + 1;
      const b = -(r1 + r2);
      const c = r1 * r2;
      return {
        question: `Solve: x² ${b >= 0 ? '+' : ''}${b}x + ${c} = 0`,
        steps: [
          { 
            instruction: `Factor the quadratic. What are the two numbers that multiply to ${c} and add to ${b}? (Enter as: a, b)`, 
            answer: `${-r1}, ${-r2}`,
            equationBefore: `x² ${b >= 0 ? '+' : ''}${b}x + ${c} = 0`,
            equationAfter: `(x - ${r1})(x - ${r2}) = 0`,
          },
          { 
            instruction: `Set each factor to zero. What are the solutions? (Enter as: a, b)`, 
            answer: `${r1}, ${r2}`,
            equationBefore: `(x - ${r1})(x - ${r2}) = 0`,
            equationAfter: `x = ${r1} or x = ${r2}`,
          },
        ],
        hint: `Find two numbers that multiply to ${c} and add to ${b}`,
        topic: 'algebra',
        subtopic: 'quadratic-equations',
        finalAnswer: `x = ${Math.min(r1, r2)}, ${Math.max(r1, r2)}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Leading coefficient ≠ 1, requires grouping or AC method
      const a = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const r1 = Math.floor(Math.random() * 3) + 1;
      const r2 = Math.floor(Math.random() * 3) + 1;
      // (ax + r1)(x + r2) = ax² + (ar2 + r1)x + r1*r2
      const bCoef = a * r2 + r1;
      const cCoef = r1 * r2;
      return {
        question: `Solve: ${a}x² + ${bCoef}x + ${cCoef} = 0`,
        steps: [
          { 
            instruction: `Multiply a × c = ${a} × ${cCoef}. What is the product?`, 
            answer: `${a * cCoef}`,
            equationBefore: `${a}x² + ${bCoef}x + ${cCoef} = 0`,
            equationAfter: `Find factors of ${a * cCoef} that add to ${bCoef}`,
          },
          { 
            instruction: `Find two numbers that multiply to ${a * cCoef} and add to ${bCoef}. (Enter as: a, b)`, 
            answer: `${r1}, ${a * r2}`,
            equationBefore: `${r1} × ${a * r2} = ${a * cCoef}, ${r1} + ${a * r2} = ${bCoef}`,
            equationAfter: `${a}x² + ${r1}x + ${a * r2}x + ${cCoef} = 0`,
          },
          { 
            instruction: `Factor by grouping. What is the common binomial factor?`, 
            answer: `x + ${r2}`,
            equationBefore: `x(${a}x + ${r1}) + ${r2}(${a}x + ${r1}) = 0`,
            equationAfter: `(${a}x + ${r1})(x + ${r2}) = 0`,
          },
          { 
            instruction: `Set ${a}x + ${r1} = 0. What is x?`, 
            answer: `-${r1}/${a}`,
            equationBefore: `${a}x + ${r1} = 0`,
            equationAfter: `x = -${r1}/${a}`,
          },
        ],
        hint: `Use the AC method: multiply a×c, find factors that add to b`,
        topic: 'algebra',
        subtopic: 'quadratic-equations',
        finalAnswer: `x = -${r1}/${a}, -${r2}`,
      };
    } else {
      // Medium: Standard quadratic formula application
      const a = 1;
      const r1 = Math.floor(Math.random() * 5) + 1;
      const r2 = Math.floor(Math.random() * 5) + 1;
      const b = -(r1 + r2);
      const c = r1 * r2;
      const discriminant = b * b - 4 * a * c;
      return {
        question: `Solve using the quadratic formula: x² ${b >= 0 ? '+' : ''}${b}x + ${c} = 0`,
        steps: [
          { 
            instruction: `Identify a, b, c. What is b?`, 
            answer: `${b}`,
            equationBefore: `x² ${b >= 0 ? '+' : ''}${b}x + ${c} = 0`,
            equationAfter: `a = 1, b = ${b}, c = ${c}`,
          },
          { 
            instruction: `Calculate the discriminant: b² - 4ac = (${b})² - 4(1)(${c}). What is it?`, 
            answer: `${discriminant}`,
            equationBefore: `b² - 4ac`,
            equationAfter: `= ${b * b} - ${4 * c} = ${discriminant}`,
          },
          { 
            instruction: `Apply the formula: x = (-b ± √${discriminant}) / 2. What are the solutions? (Enter as: a, b)`, 
            answer: `${r1}, ${r2}`,
            equationBefore: `x = (${-b} ± ${Math.sqrt(discriminant)}) / 2`,
            equationAfter: `x = ${r1} or x = ${r2}`,
          },
        ],
        hint: `Quadratic formula: x = (-b ± √(b²-4ac)) / 2a`,
        topic: 'algebra',
        subtopic: 'quadratic-equations',
        finalAnswer: `x = ${Math.min(r1, r2)}, ${Math.max(r1, r2)}`,
      };
    }
  },
  'factoring': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Factor out GCF only
      const gcf = Math.floor(Math.random() * 4) + 2;
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Factor: ${gcf * a}x + ${gcf * b}`,
        steps: [
          { 
            instruction: `Find the GCF of ${gcf * a} and ${gcf * b}. What is it?`, 
            answer: `${gcf}`,
            equationBefore: `${gcf * a}x + ${gcf * b}`,
            equationAfter: `${gcf}(? + ?)`,
          },
          { 
            instruction: `Factor out ${gcf}. What is inside the parentheses?`, 
            answer: `${a}x + ${b}`,
            equationBefore: `${gcf * a}x + ${gcf * b}`,
            equationAfter: `${gcf}(${a}x + ${b})`,
          },
        ],
        hint: 'Find the greatest common factor of the coefficients',
        topic: 'algebra',
        subtopic: 'factoring',
        finalAnswer: `${gcf}(${a}x + ${b})`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Factor by grouping (4 terms)
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 3) + 1;
      const d = Math.floor(Math.random() * 3) + 1;
      // Create: ax³ + bx² + cx + d that factors as (ax + c)(x² + d/c) - needs careful construction
      // Simpler: (ax + b)(cx + d) = acx² + (ad + bc)x + bd
      const ac = a * c;
      const adPlusBc = a * d + b * c;
      const bd = b * d;
      return {
        question: `Factor: ${ac}x² + ${adPlusBc}x + ${bd}`,
        steps: [
          { 
            instruction: `Multiply a × c = ${ac} × 1 = ${ac}. We need factors of ${ac * bd} that add to ${adPlusBc}. What are they? (Enter as: a, b)`, 
            answer: `${a * d}, ${b * c}`,
            equationBefore: `${ac}x² + ${adPlusBc}x + ${bd}`,
            equationAfter: `${ac}x² + ${a * d}x + ${b * c}x + ${bd}`,
          },
          { 
            instruction: `Group and factor: (${ac}x² + ${a * d}x) + (${b * c}x + ${bd}). Factor ${a}x from the first group. What remains?`, 
            answer: `${c}x + ${d}`,
            equationBefore: `(${ac}x² + ${a * d}x) + (${b * c}x + ${bd})`,
            equationAfter: `${a}x(${c}x + ${d}) + ${b}(${c}x + ${d})`,
          },
          { 
            instruction: `Factor out the common binomial (${c}x + ${d}). What is the final factored form?`, 
            answer: `(${a}x + ${b})(${c}x + ${d})`,
            equationBefore: `${a}x(${c}x + ${d}) + ${b}(${c}x + ${d})`,
            equationAfter: `(${a}x + ${b})(${c}x + ${d})`,
          },
        ],
        hint: 'Use the AC method: split the middle term and factor by grouping',
        topic: 'algebra',
        subtopic: 'factoring',
        finalAnswer: `(${a}x + ${b})(${c}x + ${d})`,
      };
    } else {
      // Medium: Difference of squares or simple trinomial
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 2;
      // a² - b² = (a+b)(a-b)
      return {
        question: `Factor: x² - ${b * b}`,
        steps: [
          { 
            instruction: `This is a difference of squares: a² - b². What is b (the number being squared)?`, 
            answer: `${b}`,
            equationBefore: `x² - ${b * b}`,
            equationAfter: `x² - ${b}²`,
          },
          { 
            instruction: `Apply the formula: a² - b² = (a + b)(a - b). What is the factored form?`, 
            answer: `(x + ${b})(x - ${b})`,
            equationBefore: `x² - ${b}²`,
            equationAfter: `(x + ${b})(x - ${b})`,
          },
        ],
        hint: 'Difference of squares: a² - b² = (a + b)(a - b)',
        topic: 'algebra',
        subtopic: 'factoring',
        finalAnswer: `(x + ${b})(x - ${b})`,
      };
    }
  },
  'polynomials': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Add two binomials
      const a1 = Math.floor(Math.random() * 4) + 1;
      const b1 = Math.floor(Math.random() * 6) + 1;
      const a2 = Math.floor(Math.random() * 4) + 1;
      const b2 = Math.floor(Math.random() * 6) + 1;
      return {
        question: `Add: (${a1}x + ${b1}) + (${a2}x + ${b2})`,
        steps: [
          { 
            instruction: `Combine x terms: ${a1}x + ${a2}x = ?`, 
            answer: `${a1 + a2}x`,
            equationBefore: `(${a1}x + ${b1}) + (${a2}x + ${b2})`,
            equationAfter: `${a1 + a2}x + (${b1} + ${b2})`,
          },
          { 
            instruction: `Combine constants: ${b1} + ${b2} = ?`, 
            answer: `${b1 + b2}`,
            equationBefore: `${a1 + a2}x + (${b1} + ${b2})`,
            equationAfter: `${a1 + a2}x + ${b1 + b2}`,
          },
        ],
        hint: 'Combine like terms',
        topic: 'algebra',
        subtopic: 'polynomials',
        finalAnswer: `${a1 + a2}x + ${b1 + b2}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Multiply polynomials (FOIL extended)
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = Math.floor(Math.random() * 3) + 1;
      const d = Math.floor(Math.random() * 4) + 1;
      // (ax + b)(cx + d) = acx² + (ad + bc)x + bd
      return {
        question: `Expand: (${a}x + ${b})(${c}x + ${d})`,
        steps: [
          { 
            instruction: `First terms: ${a}x × ${c}x = ?`, 
            answer: `${a * c}x²`,
            equationBefore: `(${a}x + ${b})(${c}x + ${d})`,
            equationAfter: `${a * c}x² + ...`,
          },
          { 
            instruction: `Outer + Inner: ${a}x × ${d} + ${b} × ${c}x = ?`, 
            answer: `${a * d + b * c}x`,
            equationBefore: `Outer: ${a * d}x, Inner: ${b * c}x`,
            equationAfter: `${a * c}x² + ${a * d + b * c}x + ...`,
          },
          { 
            instruction: `Last terms: ${b} × ${d} = ?`, 
            answer: `${b * d}`,
            equationBefore: `${a * c}x² + ${a * d + b * c}x + ?`,
            equationAfter: `${a * c}x² + ${a * d + b * c}x + ${b * d}`,
          },
        ],
        hint: 'Use FOIL: First, Outer, Inner, Last',
        topic: 'algebra',
        subtopic: 'polynomials',
        finalAnswer: `${a * c}x² + ${a * d + b * c}x + ${b * d}`,
      };
    } else {
      // Medium: Add trinomials
      const a1 = Math.floor(Math.random() * 4) + 1;
      const b1 = Math.floor(Math.random() * 6) + 1;
      const c1 = Math.floor(Math.random() * 5) + 1;
      const a2 = Math.floor(Math.random() * 4) + 1;
      const b2 = Math.floor(Math.random() * 6) + 1;
      const c2 = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Add: (${a1}x² + ${b1}x + ${c1}) + (${a2}x² + ${b2}x + ${c2})`,
        steps: [
          { 
            instruction: `Combine x² terms: ${a1}x² + ${a2}x² = ?`, 
            answer: `${a1 + a2}x²`,
            equationBefore: `(${a1}x² + ${b1}x + ${c1}) + (${a2}x² + ${b2}x + ${c2})`,
            equationAfter: `${a1 + a2}x² + ...`,
          },
          { 
            instruction: `Combine x terms: ${b1}x + ${b2}x = ?`, 
            answer: `${b1 + b2}x`,
            equationBefore: `... + ${b1}x + ... + ${b2}x + ...`,
            equationAfter: `${a1 + a2}x² + ${b1 + b2}x + ...`,
          },
          { 
            instruction: `Combine constants: ${c1} + ${c2} = ?`, 
            answer: `${c1 + c2}`,
            equationBefore: `... + ${c1} + ... + ${c2}`,
            equationAfter: `${a1 + a2}x² + ${b1 + b2}x + ${c1 + c2}`,
          },
        ],
        hint: 'Combine like terms by degree',
        topic: 'algebra',
        subtopic: 'polynomials',
        finalAnswer: `${a1 + a2}x² + ${b1 + b2}x + ${c1 + c2}`,
      };
    }
  },
  'rational-expressions': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple cancellation
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 2;
      return {
        question: `Simplify: ${a * b}x / ${a}`,
        steps: [
          { instruction: `What is the GCF of ${a * b} and ${a}?`, answer: `${a}` },
          { instruction: `Divide both by ${a}. What is the simplified form?`, answer: `${b}x` },
        ],
        hint: 'Find the greatest common factor and cancel',
        topic: 'algebra',
        subtopic: 'rational-expressions',
        finalAnswer: `${b}x`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Add fractions with different denominators
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 3) + 2;
      const c = Math.floor(Math.random() * 4) + 1;
      const d = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Add: ${c}/x + ${d}/${a}x`,
        steps: [
          { 
            instruction: `Find the LCD of x and ${a}x. What is it?`, 
            answer: `${a}x`,
          },
          { 
            instruction: `Rewrite ${c}/x with denominator ${a}x. What is the numerator?`, 
            answer: `${c * a}`,
          },
          { 
            instruction: `Add the fractions: (${c * a} + ${d})/${a}x = ?`, 
            answer: `${c * a + d}/${a}x`,
          },
        ],
        hint: 'Find the LCD, then add the numerators',
        topic: 'algebra',
        subtopic: 'rational-expressions',
        finalAnswer: `${c * a + d}/${a}x`,
      };
    } else {
      // Medium: Factor and cancel
      const a = Math.floor(Math.random() * 4) + 2;
      const b = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Simplify: (x² - ${b * b}) / (x + ${b})`,
        steps: [
          { 
            instruction: `Factor the numerator (difference of squares). What is it?`, 
            answer: `(x + ${b})(x - ${b})`,
          },
          { 
            instruction: `Cancel the common factor (x + ${b}). What remains?`, 
            answer: `x - ${b}`,
          },
        ],
        hint: 'Factor the numerator first, then cancel common factors',
        topic: 'algebra',
        subtopic: 'rational-expressions',
        finalAnswer: `x - ${b}`,
      };
    }
  },
  'radical-expressions': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple perfect square roots
      const bases = [4, 9, 16, 25, 36, 49, 64, 81, 100];
      const base = bases[Math.floor(Math.random() * bases.length)];
      const root = Math.sqrt(base);
      return {
        question: `Simplify: √${base}`,
        steps: [
          { instruction: `What number squared equals ${base}?`, answer: `${root}` },
        ],
        hint: `Find a number n where n² = ${base}`,
        topic: 'algebra',
        subtopic: 'radical-expressions',
        finalAnswer: `${root}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Rationalize denominator with conjugate
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 3) + 1;
      return {
        question: `Rationalize: ${a} / (√${b} + 1)`,
        steps: [
          { 
            instruction: `Multiply by the conjugate (√${b} - 1)/(√${b} - 1). What is the new numerator?`, 
            answer: `${a}(√${b} - 1)`,
          },
          { 
            instruction: `Multiply (√${b} + 1)(√${b} - 1) using difference of squares. What is the denominator?`, 
            answer: `${b - 1}`,
          },
          { 
            instruction: `Simplify the expression. What is the final form?`, 
            answer: `${a}(√${b} - 1)/${b - 1}`,
          },
        ],
        hint: 'Multiply by the conjugate to rationalize',
        topic: 'algebra',
        subtopic: 'radical-expressions',
        finalAnswer: `${a}(√${b} - 1)/${b - 1}`,
      };
    } else {
      // Medium: Simplify with factors
      const bases = [4, 9, 16, 25];
      const base = bases[Math.floor(Math.random() * bases.length)];
      const root = Math.sqrt(base);
      const coef = Math.floor(Math.random() * 3) + 2;
      return {
        question: `Simplify: √${base * coef * coef}`,
        steps: [
          { 
            instruction: `Factor ${base * coef * coef} = ${coef * coef} × ${base}. What is √${coef * coef}?`, 
            answer: `${coef}`,
          },
          { 
            instruction: `√${base * coef * coef} = ${coef} × √${base} = ${coef} × ${root} = ?`, 
            answer: `${coef * root}`,
          },
        ],
        hint: 'Factor out perfect squares from under the radical',
        topic: 'algebra',
        subtopic: 'radical-expressions',
        finalAnswer: `${coef * root}`,
      };
    }
  },
  'complex-numbers': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Add complex numbers
      const a1 = Math.floor(Math.random() * 5) + 1;
      const b1 = Math.floor(Math.random() * 5) + 1;
      const a2 = Math.floor(Math.random() * 5) + 1;
      const b2 = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Add: (${a1} + ${b1}i) + (${a2} + ${b2}i)`,
        steps: [
          { instruction: `Add real parts: ${a1} + ${a2} = ?`, answer: `${a1 + a2}` },
          { instruction: `Add imaginary parts: ${b1}i + ${b2}i = ?`, answer: `${b1 + b2}i` },
        ],
        hint: 'Combine real parts and imaginary parts separately',
        topic: 'algebra',
        subtopic: 'complex-numbers',
        finalAnswer: `${a1 + a2} + ${b1 + b2}i`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Divide complex numbers
      const a1 = Math.floor(Math.random() * 4) + 2;
      const b1 = Math.floor(Math.random() * 4) + 1;
      const a2 = Math.floor(Math.random() * 3) + 1;
      const b2 = Math.floor(Math.random() * 3) + 1;
      const denom = a2 * a2 + b2 * b2;
      const realPart = (a1 * a2 + b1 * b2) / denom;
      const imagPart = (b1 * a2 - a1 * b2) / denom;
      return {
        question: `Divide: (${a1} + ${b1}i) / (${a2} + ${b2}i)`,
        steps: [
          { 
            instruction: `Multiply by conjugate: (${a2} - ${b2}i)/(${a2} - ${b2}i). What is the denominator (${a2})² + (${b2})²?`, 
            answer: `${denom}`,
          },
          { 
            instruction: `Expand numerator: (${a1} + ${b1}i)(${a2} - ${b2}i). Real part = ${a1}×${a2} + ${b1}×${b2} = ?`, 
            answer: `${a1 * a2 + b1 * b2}`,
          },
          { 
            instruction: `Imaginary part of numerator = ${b1}×${a2} - ${a1}×${b2} = ?`, 
            answer: `${b1 * a2 - a1 * b2}`,
          },
        ],
        hint: 'Multiply by the conjugate of the denominator',
        topic: 'algebra',
        subtopic: 'complex-numbers',
        finalAnswer: `${a1 * a2 + b1 * b2}/${denom} + ${b1 * a2 - a1 * b2}/${denom}i`,
      };
    } else {
      // Medium: Multiply complex numbers
      const a1 = Math.floor(Math.random() * 5) + 1;
      const b1 = Math.floor(Math.random() * 5) + 1;
      const a2 = Math.floor(Math.random() * 5) + 1;
      const b2 = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Multiply: (${a1} + ${b1}i)(${a2} + ${b2}i)`,
        steps: [
          { instruction: `Use FOIL. First terms: ${a1} × ${a2} = ?`, answer: `${a1 * a2}` },
          { instruction: `Outer + Inner: ${a1} × ${b2}i + ${b1}i × ${a2} = ?i`, answer: `${a1 * b2 + b1 * a2}` },
          { instruction: `Last terms: ${b1}i × ${b2}i = ${b1 * b2}i² = ?`, answer: `${-b1 * b2}` },
          { instruction: `Combine real parts: ${a1 * a2} + (${-b1 * b2}) = ?`, answer: `${a1 * a2 - b1 * b2}` },
        ],
        hint: 'Remember: i² = -1',
        topic: 'algebra',
        subtopic: 'complex-numbers',
        finalAnswer: `${a1 * a2 - b1 * b2} + ${a1 * b2 + b1 * a2}i`,
      };
    }
  },
  'sequences-series': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Find next term in arithmetic sequence
      const a1 = Math.floor(Math.random() * 5) + 2;
      const d = Math.floor(Math.random() * 4) + 2;
      const terms = [a1, a1 + d, a1 + 2 * d];
      const next = a1 + 3 * d;
      return {
        question: `Find the next term: ${terms.join(', ')}, ?`,
        steps: [
          { instruction: `Find the common difference: ${terms[1]} - ${terms[0]} = ?`, answer: `${d}` },
          { instruction: `Add the common difference to the last term: ${terms[2]} + ${d} = ?`, answer: `${next}` },
        ],
        hint: 'Find the pattern between consecutive terms',
        topic: 'algebra',
        subtopic: 'sequences-series',
        finalAnswer: `${next}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Sum of arithmetic series
      const a1 = Math.floor(Math.random() * 5) + 2;
      const d = Math.floor(Math.random() * 3) + 2;
      const n = Math.floor(Math.random() * 5) + 6;
      const an = a1 + (n - 1) * d;
      const sum = (n * (a1 + an)) / 2;
      return {
        question: `Find the sum of the first ${n} terms of an arithmetic sequence with a₁ = ${a1} and d = ${d}`,
        steps: [
          { 
            instruction: `First find a${n} using aₙ = a₁ + (n-1)d. What is a${n}?`, 
            answer: `${an}`,
          },
          { 
            instruction: `Use the sum formula: S = n(a₁ + aₙ)/2 = ${n}(${a1} + ${an})/2. What is ${a1} + ${an}?`, 
            answer: `${a1 + an}`,
          },
          { 
            instruction: `Calculate: ${n} × ${a1 + an} / 2 = ?`, 
            answer: `${sum}`,
          },
        ],
        hint: 'Sum formula: Sₙ = n(a₁ + aₙ)/2',
        topic: 'algebra',
        subtopic: 'sequences-series',
        finalAnswer: `${sum}`,
      };
    } else {
      // Medium: Find nth term
      const a1 = Math.floor(Math.random() * 5) + 2;
      const d = Math.floor(Math.random() * 4) + 2;
      const n = Math.floor(Math.random() * 5) + 5;
      const an = a1 + (n - 1) * d;
      return {
        question: `Find the ${n}th term of an arithmetic sequence with a₁ = ${a1} and d = ${d}`,
        steps: [
          { instruction: `The formula is aₙ = a₁ + (n-1)d. What is n - 1?`, answer: `${n - 1}` },
          { instruction: `What is (n-1) × d = ${n - 1} × ${d}?`, answer: `${(n - 1) * d}` },
          { instruction: `What is a₁ + (n-1)d = ${a1} + ${(n - 1) * d}?`, answer: `${an}` },
        ],
        hint: 'Use the formula: aₙ = a₁ + (n-1)d',
        topic: 'algebra',
        subtopic: 'sequences-series',
        finalAnswer: `${an}`,
      };
    }
  },

  // PRE-CALCULUS
  'functions-graphing': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Identify vertex from vertex form
      const h = Math.floor(Math.random() * 5) + 1;
      const k = Math.floor(Math.random() * 5) + 1;
      return {
        question: `For f(x) = (x - ${h})² + ${k}, find the vertex`,
        steps: [
          { instruction: `In vertex form f(x) = (x-h)² + k, what is h?`, answer: `${h}` },
          { instruction: `What is k?`, answer: `${k}` },
        ],
        hint: 'Vertex form: f(x) = (x-h)² + k, vertex is (h, k)',
        topic: 'precalc',
        subtopic: 'functions-graphing',
        finalAnswer: `(${h}, ${k})`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Complete the square to find vertex
      const a = Math.floor(Math.random() * 2) + 1;
      const b = 2 * a * (Math.floor(Math.random() * 4) + 1);
      const c = Math.floor(Math.random() * 10) + 1;
      const h = -b / (2 * a);
      const k = c - (b * b) / (4 * a);
      return {
        question: `Find the vertex of f(x) = ${a}x² + ${b}x + ${c} by completing the square`,
        steps: [
          { 
            instruction: `Factor out ${a} from first two terms: ${a}(x² + ${b/a}x) + ${c}. Half of ${b/a} is?`, 
            answer: `${b/(2*a)}`,
          },
          { 
            instruction: `Square it: (${b/(2*a)})² = ?`, 
            answer: `${(b/(2*a)) * (b/(2*a))}`,
          },
          { 
            instruction: `The x-coordinate of vertex (h) = -b/(2a) = ?`, 
            answer: `${h}`,
          },
          { 
            instruction: `The y-coordinate (k) = f(${h}) = ?`, 
            answer: `${k}`,
          },
        ],
        hint: 'Complete the square or use h = -b/(2a)',
        topic: 'precalc',
        subtopic: 'functions-graphing',
        finalAnswer: `(${h}, ${k})`,
      };
    } else {
      // Medium: Vertex form with coefficient
      const a = Math.floor(Math.random() * 3) + 1;
      const h = Math.floor(Math.random() * 5) - 2;
      const k = Math.floor(Math.random() * 5) - 2;
      return {
        question: `For f(x) = ${a}(x ${h >= 0 ? '-' : '+'} ${Math.abs(h)})² ${k >= 0 ? '+' : '-'} ${Math.abs(k)}, find the vertex`,
        steps: [
          { instruction: `In vertex form f(x) = a(x-h)² + k, h is the x-coordinate. What is h?`, answer: `${h}` },
          { instruction: `k is the y-coordinate. What is k?`, answer: `${k}` },
        ],
        hint: 'Vertex form: f(x) = a(x-h)² + k, vertex is (h, k)',
        topic: 'precalc',
        subtopic: 'functions-graphing',
        finalAnswer: `(${h}, ${k})`,
      };
    }
  },
  'trig-unit-circle': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Quadrantal angles only
      const angles = [0, 90, 180, 270];
      const angle = angles[Math.floor(Math.random() * angles.length)];
      const sinValues: Record<number, string> = { 0: '0', 90: '1', 180: '0', 270: '-1' };
      const cosValues: Record<number, string> = { 0: '1', 90: '0', 180: '-1', 270: '0' };
      return {
        question: `Evaluate sin(${angle}°) and cos(${angle}°)`,
        steps: [
          { instruction: `What is sin(${angle}°)?`, answer: sinValues[angle] },
          { instruction: `What is cos(${angle}°)?`, answer: cosValues[angle] },
        ],
        hint: 'Quadrantal angles lie on the axes',
        topic: 'precalc',
        subtopic: 'trig-unit-circle',
        finalAnswer: `sin=${sinValues[angle]}, cos=${cosValues[angle]}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Angles in all quadrants with radians
      const angles = [210, 225, 240, 300, 315, 330];
      const angle = angles[Math.floor(Math.random() * angles.length)];
      const sinValues: Record<number, string> = { 210: '-1/2', 225: '-√2/2', 240: '-√3/2', 300: '-√3/2', 315: '-√2/2', 330: '-1/2' };
      const cosValues: Record<number, string> = { 210: '-√3/2', 225: '-√2/2', 240: '-1/2', 300: '1/2', 315: '√2/2', 330: '√3/2' };
      const tanValues: Record<number, string> = { 210: '√3/3', 225: '1', 240: '√3', 300: '-√3', 315: '-1', 330: '-√3/3' };
      return {
        question: `Evaluate sin(${angle}°), cos(${angle}°), and tan(${angle}°)`,
        steps: [
          { instruction: `Reference angle for ${angle}° is?`, answer: `${angle <= 270 ? angle - 180 : 360 - angle}°` },
          { instruction: `What is sin(${angle}°)?`, answer: sinValues[angle] },
          { instruction: `What is cos(${angle}°)?`, answer: cosValues[angle] },
          { instruction: `What is tan(${angle}°)?`, answer: tanValues[angle] },
        ],
        hint: 'Find reference angle, then apply signs based on quadrant',
        topic: 'precalc',
        subtopic: 'trig-unit-circle',
        finalAnswer: `sin=${sinValues[angle]}, cos=${cosValues[angle]}, tan=${tanValues[angle]}`,
      };
    } else {
      // Medium: First quadrant special angles
      const angles = [30, 45, 60];
      const angle = angles[Math.floor(Math.random() * angles.length)];
      const sinValues: Record<number, string> = { 30: '1/2', 45: '√2/2', 60: '√3/2' };
      const cosValues: Record<number, string> = { 30: '√3/2', 45: '√2/2', 60: '1/2' };
      return {
        question: `Evaluate sin(${angle}°) and cos(${angle}°)`,
        steps: [
          { instruction: `What is sin(${angle}°)?`, answer: sinValues[angle] },
          { instruction: `What is cos(${angle}°)?`, answer: cosValues[angle] },
        ],
        hint: 'Use the unit circle values for special angles',
        topic: 'precalc',
        subtopic: 'trig-unit-circle',
        finalAnswer: `sin=${sinValues[angle]}, cos=${cosValues[angle]}`,
      };
    }
  },
  'trig-identities': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Basic Pythagorean identity
      const sin = Math.floor(Math.random() * 4) + 1;
      const hyp = 5;
      const cos = Math.sqrt(hyp * hyp - sin * sin);
      return {
        question: `If sin(θ) = ${sin}/${hyp} and θ is in Q1, find cos(θ)`,
        steps: [
          { instruction: `Use sin²θ + cos²θ = 1. What is sin²θ?`, answer: `${(sin/hyp) * (sin/hyp)}` },
          { instruction: `cos²θ = 1 - ${(sin/hyp) * (sin/hyp)} = ?`, answer: `${1 - (sin/hyp) * (sin/hyp)}` },
          { instruction: `cos(θ) = √(cos²θ) = ?`, answer: `${cos}/${hyp}` },
        ],
        hint: 'Use the Pythagorean identity: sin²θ + cos²θ = 1',
        topic: 'precalc',
        subtopic: 'trig-identities',
        finalAnswer: `${cos}/${hyp}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Double angle formulas
      const angle = [30, 45, 60][Math.floor(Math.random() * 3)];
      const sin2x: Record<number, string> = { 30: '√3/2', 45: '1', 60: '√3/2' };
      const cos2x: Record<number, string> = { 30: '1/2', 45: '0', 60: '-1/2' };
      return {
        question: `If x = ${angle}°, find sin(2x) and cos(2x) using double angle formulas`,
        steps: [
          { instruction: `sin(2x) = 2sin(x)cos(x). What is sin(${angle}°)?`, answer: angle === 30 ? '1/2' : angle === 45 ? '√2/2' : '√3/2' },
          { instruction: `What is cos(${angle}°)?`, answer: angle === 30 ? '√3/2' : angle === 45 ? '√2/2' : '1/2' },
          { instruction: `sin(2×${angle}°) = sin(${2*angle}°) = ?`, answer: sin2x[angle] },
          { instruction: `cos(2×${angle}°) = cos(${2*angle}°) = ?`, answer: cos2x[angle] },
        ],
        hint: 'sin(2x) = 2sin(x)cos(x), cos(2x) = cos²x - sin²x',
        topic: 'precalc',
        subtopic: 'trig-identities',
        finalAnswer: `sin(2x)=${sin2x[angle]}, cos(2x)=${cos2x[angle]}`,
      };
    } else {
      // Medium: Find all trig functions
      const values = [
        { sin: '3/5', cos: '4/5', tan: '3/4' },
        { sin: '5/13', cos: '12/13', tan: '5/12' },
      ];
      const v = values[Math.floor(Math.random() * values.length)];
      return {
        question: `If sin(θ) = ${v.sin} and θ is in Q1, find cos(θ) and tan(θ)`,
        steps: [
          { instruction: `Using sin²θ + cos²θ = 1, what is cos(θ)?`, answer: v.cos },
          { instruction: `Using tan(θ) = sin(θ)/cos(θ), what is tan(θ)?`, answer: v.tan },
        ],
        hint: 'Use the Pythagorean identity: sin²θ + cos²θ = 1',
        topic: 'precalc',
        subtopic: 'trig-identities',
        finalAnswer: `cos=${v.cos}, tan=${v.tan}`,
      };
    }
  },
  'exponential-log': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple logarithm evaluation
      const base = [2, 10][Math.floor(Math.random() * 2)];
      const exp = Math.floor(Math.random() * 3) + 1;
      const result = Math.pow(base, exp);
      return {
        question: `Evaluate: log_${base}(${result})`,
        steps: [
          { instruction: `${base} raised to what power equals ${result}?`, answer: `${exp}` },
        ],
        hint: `Ask yourself: ${base}^? = ${result}`,
        topic: 'precalc',
        subtopic: 'exponential-log',
        finalAnswer: `${exp}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Logarithm properties (product/quotient/power rules)
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 3) + 2;
      const base = 10;
      return {
        question: `Simplify: log(${a * b}) + log(${100/a}) - log(${b})`,
        steps: [
          { instruction: `log(${a * b}) = log(${a}) + log(${b}). What property is this?`, answer: `product rule` },
          { instruction: `Combine: log(${a}) + log(${b}) + log(${100/a}) - log(${b}) = log(${a}) + log(${100/a})`, answer: `log(${a}) + log(${100/a})` },
          { instruction: `log(${a}) + log(${100/a}) = log(${a} × ${100/a}) = log(?)`, answer: `100` },
          { instruction: `log(100) = log(10²) = ?`, answer: `2` },
        ],
        hint: 'Use log rules: log(ab) = log(a) + log(b), log(a/b) = log(a) - log(b)',
        topic: 'precalc',
        subtopic: 'exponential-log',
        finalAnswer: `2`,
      };
    } else {
      // Medium: Logarithm with various bases
      const base = [2, 3, 5][Math.floor(Math.random() * 3)];
      const exp = Math.floor(Math.random() * 3) + 2;
      const result = Math.pow(base, exp);
      return {
        question: `Evaluate: log_${base}(${result})`,
        steps: [
          { instruction: `${base}^1 = ${base}, ${base}^2 = ${base*base}. What is ${base}^${exp}?`, answer: `${result}` },
          { instruction: `So log_${base}(${result}) = ?`, answer: `${exp}` },
        ],
        hint: `Ask yourself: ${base}^? = ${result}`,
        topic: 'precalc',
        subtopic: 'exponential-log',
        finalAnswer: `${exp}`,
      };
    }
  },
  'polynomial-functions': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Identify degree and leading coefficient
      const lead = [2, 3, 4][Math.floor(Math.random() * 3)];
      const deg = [2, 3, 4][Math.floor(Math.random() * 3)];
      return {
        question: `For f(x) = ${lead}x^${deg} + 5x² - 3x + 1, find the degree and leading coefficient`,
        steps: [
          { instruction: `The degree is the highest power of x. What is it?`, answer: `${deg}` },
          { instruction: `The leading coefficient is the coefficient of the highest power. What is it?`, answer: `${lead}` },
        ],
        hint: 'Degree = highest exponent, Leading coefficient = coefficient of that term',
        topic: 'precalc',
        subtopic: 'polynomial-functions',
        finalAnswer: `degree=${deg}, leading coef=${lead}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Find zeros and their multiplicities
      const r1 = Math.floor(Math.random() * 3) + 1;
      const r2 = Math.floor(Math.random() * 3) + 1;
      const m1 = Math.floor(Math.random() * 2) + 1;
      const m2 = Math.floor(Math.random() * 2) + 1;
      return {
        question: `For f(x) = (x - ${r1})^${m1}(x + ${r2})^${m2}, find all zeros and their multiplicities`,
        steps: [
          { instruction: `Set (x - ${r1})^${m1} = 0. What is x?`, answer: `${r1}` },
          { instruction: `What is the multiplicity of x = ${r1}?`, answer: `${m1}` },
          { instruction: `Set (x + ${r2})^${m2} = 0. What is x?`, answer: `-${r2}` },
          { instruction: `What is the multiplicity of x = -${r2}?`, answer: `${m2}` },
        ],
        hint: 'Zero at x = a with multiplicity m means (x-a)^m is a factor',
        topic: 'precalc',
        subtopic: 'polynomial-functions',
        finalAnswer: `x=${r1} (mult ${m1}), x=-${r2} (mult ${m2})`,
      };
    } else {
      // Medium: End behavior
      const lead = [2, 3, -2, -3][Math.floor(Math.random() * 4)];
      const deg = [3, 4, 5][Math.floor(Math.random() * 3)];
      const leftBehavior = (lead > 0 && deg % 2 === 1) ? '-∞' : (lead < 0 && deg % 2 === 1) ? '+∞' : (lead > 0) ? '+∞' : '-∞';
      const rightBehavior = lead > 0 ? '+∞' : '-∞';
      return {
        question: `Determine the end behavior of f(x) = ${lead}x^${deg} + 2x - 1`,
        steps: [
          { instruction: `As x → -∞, f(x) → ?`, answer: leftBehavior },
          { instruction: `As x → +∞, f(x) → ?`, answer: rightBehavior },
        ],
        hint: 'End behavior is determined by the leading term',
        topic: 'precalc',
        subtopic: 'polynomial-functions',
        finalAnswer: `x→-∞: ${leftBehavior}, x→+∞: ${rightBehavior}`,
      };
    }
  },
  'rational-functions': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Find vertical asymptote only
      const a = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Find the vertical asymptote of f(x) = 1/(x - ${a})`,
        steps: [
          { instruction: `Set the denominator equal to zero: x - ${a} = 0. What is x?`, answer: `${a}` },
        ],
        hint: 'Vertical asymptotes occur where the denominator equals zero',
        topic: 'precalc',
        subtopic: 'rational-functions',
        finalAnswer: `x = ${a}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Find all asymptotes including oblique
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Find all asymptotes of f(x) = (${a}x² + ${b}x)/(x - ${c})`,
        steps: [
          { instruction: `Vertical asymptote: set x - ${c} = 0. VA is x = ?`, answer: `${c}` },
          { instruction: `Degree of numerator (2) > degree of denominator (1), so there's an oblique asymptote. Divide: ${a}x² ÷ x = ?`, answer: `${a}x` },
          { instruction: `The oblique asymptote is y = ${a}x + ?`, answer: `${a * c + b}` },
        ],
        hint: 'If degree(num) = degree(den) + 1, there is an oblique asymptote',
        topic: 'precalc',
        subtopic: 'rational-functions',
        finalAnswer: `VA: x=${c}, OA: y=${a}x+${a*c+b}`,
      };
    } else {
      // Medium: Find vertical and horizontal asymptotes
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Find the asymptotes of f(x) = ${a}x/(x - ${b})`,
        steps: [
          { instruction: `For vertical asymptote, set denominator = 0. x = ?`, answer: `${b}` },
          { instruction: `For horizontal asymptote, compare degrees. Both are degree 1, so HA = leading coef ratio = ${a}/1 = ?`, answer: `${a}` },
        ],
        hint: 'VA where denominator = 0, HA from degree comparison',
        topic: 'precalc',
        subtopic: 'rational-functions',
        finalAnswer: `VA: x=${b}, HA: y=${a}`,
      };
    }
  },
  'trig-equations': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Basic trig equation with one solution in given range
      const equations = [
        { eq: 'sin(x) = 1', answer: '90°' },
        { eq: 'cos(x) = 1', answer: '0°' },
        { eq: 'sin(x) = 0', answer: '0°' },
        { eq: 'cos(x) = -1', answer: '180°' },
      ];
      const prob = equations[Math.floor(Math.random() * equations.length)];
      return {
        question: `Solve ${prob.eq} for x in [0°, 360°). Give the smallest solution.`,
        steps: [
          { instruction: `At what angle does ${prob.eq}?`, answer: prob.answer },
        ],
        hint: 'Think about the unit circle',
        topic: 'precalc',
        subtopic: 'trig-equations',
        finalAnswer: prob.answer,
      };
    } else if (difficulty === 'hard') {
      // Hard: Trig equation requiring factoring or substitution
      const equations = [
        { eq: '2sin²(x) - 1 = 0', solutions: '45°, 135°, 225°, 315°', first: '45°' },
        { eq: '2cos²(x) - cos(x) = 0', solutions: '0°, 60°, 90°, 270°, 300°', first: '0°' },
        { eq: 'sin(2x) = 1', solutions: '45°, 225°', first: '45°' },
      ];
      const prob = equations[Math.floor(Math.random() * equations.length)];
      return {
        question: `Solve ${prob.eq} for all x in [0°, 360°)`,
        steps: [
          { instruction: `Rewrite and solve. What is the smallest solution?`, answer: prob.first },
          { instruction: `List all solutions in [0°, 360°)`, answer: prob.solutions },
        ],
        hint: 'Factor or use trig identities to solve',
        topic: 'precalc',
        subtopic: 'trig-equations',
        finalAnswer: prob.solutions,
      };
    } else {
      // Medium: Two solutions in range
      const equations = [
        { eq: 'sin(x) = 1/2', answers: '30°, 150°' },
        { eq: 'cos(x) = 1/2', answers: '60°, 300°' },
        { eq: 'tan(x) = 1', answers: '45°, 225°' },
      ];
      const prob = equations[Math.floor(Math.random() * equations.length)];
      return {
        question: `Solve ${prob.eq} for x in [0°, 360°)`,
        steps: [
          { instruction: `What angle in Q1 satisfies this equation?`, answer: prob.answers.split(', ')[0] },
          { instruction: `What other angle in [0°, 360°) satisfies this?`, answer: prob.answers.split(', ')[1] },
        ],
        hint: 'Use the unit circle to find reference angles, then consider all quadrants',
        topic: 'precalc',
        subtopic: 'trig-equations',
        finalAnswer: prob.answers,
      };
    }
  },
  'vectors-parametric': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Vector addition
      const v1 = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      const v2 = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      return {
        question: `Find u + v where u = <${v1[0]}, ${v1[1]}> and v = <${v2[0]}, ${v2[1]}>`,
        steps: [
          { instruction: `Add x-components: ${v1[0]} + ${v2[0]} = ?`, answer: `${v1[0] + v2[0]}` },
          { instruction: `Add y-components: ${v1[1]} + ${v2[1]} = ?`, answer: `${v1[1] + v2[1]}` },
        ],
        hint: 'Add corresponding components',
        topic: 'precalc',
        subtopic: 'vectors-parametric',
        finalAnswer: `<${v1[0] + v2[0]}, ${v1[1] + v2[1]}>`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Parametric equations to rectangular
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 3) + 1;
      return {
        question: `Eliminate the parameter: x = ${a}t + ${b}, y = ${c}t²`,
        steps: [
          { instruction: `From x = ${a}t + ${b}, solve for t. t = ?`, answer: `(x - ${b})/${a}` },
          { instruction: `Substitute into y = ${c}t². y = ${c}((x-${b})/${a})² = ?`, answer: `${c}(x - ${b})²/${a * a}` },
        ],
        hint: 'Solve one equation for t, substitute into the other',
        topic: 'precalc',
        subtopic: 'vectors-parametric',
        finalAnswer: `y = ${c}(x - ${b})²/${a * a}`,
      };
    } else {
      // Medium: Vector magnitude
      const v = [Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1];
      const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      const magRounded = Math.round(mag * 100) / 100;
      return {
        question: `Find the magnitude of v = <${v[0]}, ${v[1]}>`,
        steps: [
          { instruction: `|v| = √(${v[0]}² + ${v[1]}²) = √(${v[0]*v[0]} + ${v[1]*v[1]}) = √?`, answer: `${v[0]*v[0] + v[1]*v[1]}` },
          { instruction: `√${v[0]*v[0] + v[1]*v[1]} = ?`, answer: `${magRounded}` },
        ],
        hint: '|v| = √(x² + y²)',
        topic: 'precalc',
        subtopic: 'vectors-parametric',
        finalAnswer: `${magRounded}`,
      };
    }
  },
  'polar-coordinates': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Convert simple polar to rectangular
      const r = Math.floor(Math.random() * 5) + 2;
      const angles = [0, 90, 180, 270];
      const theta = angles[Math.floor(Math.random() * angles.length)];
      const xVals: Record<number, number> = { 0: r, 90: 0, 180: -r, 270: 0 };
      const yVals: Record<number, number> = { 0: 0, 90: r, 180: 0, 270: -r };
      return {
        question: `Convert polar (${r}, ${theta}°) to rectangular`,
        steps: [
          { instruction: `x = r·cos(${theta}°) = ${r}·cos(${theta}°) = ?`, answer: `${xVals[theta]}` },
          { instruction: `y = r·sin(${theta}°) = ${r}·sin(${theta}°) = ?`, answer: `${yVals[theta]}` },
        ],
        hint: 'x = r·cos(θ), y = r·sin(θ)',
        topic: 'precalc',
        subtopic: 'polar-coordinates',
        finalAnswer: `(${xVals[theta]}, ${yVals[theta]})`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Convert rectangular to polar
      const x = Math.floor(Math.random() * 4) + 1;
      const y = Math.floor(Math.random() * 4) + 1;
      const r = Math.sqrt(x * x + y * y);
      const rRounded = Math.round(r * 100) / 100;
      const theta = Math.round(Math.atan2(y, x) * 180 / Math.PI * 100) / 100;
      return {
        question: `Convert rectangular (${x}, ${y}) to polar coordinates`,
        steps: [
          { instruction: `r = √(x² + y²) = √(${x}² + ${y}²) = √${x*x + y*y} = ?`, answer: `${rRounded}` },
          { instruction: `θ = arctan(y/x) = arctan(${y}/${x}). θ in degrees ≈ ?`, answer: `${theta}°` },
        ],
        hint: 'r = √(x² + y²), θ = arctan(y/x)',
        topic: 'precalc',
        subtopic: 'polar-coordinates',
        finalAnswer: `(${rRounded}, ${theta}°)`,
      };
    } else {
      // Medium: Convert with special angles
      const r = Math.floor(Math.random() * 4) + 2;
      const angles = [30, 45, 60];
      const theta = angles[Math.floor(Math.random() * angles.length)];
      const rad = theta * Math.PI / 180;
      const x = Math.round(r * Math.cos(rad) * 100) / 100;
      const y = Math.round(r * Math.sin(rad) * 100) / 100;
      return {
        question: `Convert polar (${r}, ${theta}°) to rectangular coordinates`,
        steps: [
          { instruction: `x = r·cos(θ) = ${r}·cos(${theta}°) = ?`, answer: `${x}` },
          { instruction: `y = r·sin(θ) = ${r}·sin(${theta}°) = ?`, answer: `${y}` },
        ],
        hint: 'x = r·cos(θ), y = r·sin(θ)',
        topic: 'precalc',
        subtopic: 'polar-coordinates',
        finalAnswer: `(${x}, ${y})`,
      };
    }
  },

  // CALCULUS I
  'limits': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Direct substitution
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = Math.floor(Math.random() * 4) + 1;
      const result = a * c + b;
      return {
        question: `Evaluate: lim(x→${c}) (${a}x + ${b})`,
        steps: [
          { instruction: `Substitute x = ${c} directly. What is ${a}(${c}) + ${b}?`, answer: `${result}` },
        ],
        hint: 'For polynomials, direct substitution works',
        topic: 'calc1',
        subtopic: 'limits',
        finalAnswer: `${result}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Indeterminate form requiring algebraic manipulation
      const a = Math.floor(Math.random() * 3) + 1;
      // (x² - a²)/(x - a) as x→a = 2a
      return {
        question: `Evaluate: lim(x→${a}) (x² - ${a*a})/(x - ${a})`,
        steps: [
          { 
            instruction: `Direct substitution gives 0/0. Factor the numerator x² - ${a*a} = ?`, 
            answer: `(x + ${a})(x - ${a})`,
          },
          { 
            instruction: `Cancel (x - ${a}). The limit becomes lim(x→${a}) (x + ${a}) = ?`, 
            answer: `${2*a}`,
          },
        ],
        hint: 'Factor to cancel the term causing 0/0',
        topic: 'calc1',
        subtopic: 'limits',
        finalAnswer: `${2*a}`,
      };
    } else {
      // Medium: Limit at infinity
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 3) + 1;
      return {
        question: `Evaluate: lim(x→∞) (${a}x² + 1)/(${b}x² - 3)`,
        steps: [
          { instruction: `Both numerator and denominator are degree 2. The limit is ratio of leading coefficients. What is ${a}/${b}?`, answer: `${a/b}` },
        ],
        hint: 'For rational functions, compare degrees of numerator and denominator',
        topic: 'calc1',
        subtopic: 'limits',
        finalAnswer: `${a/b}`,
      };
    }
  },
  'derivatives-basic': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple power rule with single term
      const exp = Math.floor(Math.random() * 4) + 2;
      const newExp = exp - 1;
      return {
        question: `Find the derivative of f(x) = x^${exp}`,
        steps: [
          { instruction: `Apply power rule. Bring down the exponent. What coefficient goes in front?`, answer: `${exp}` },
          { instruction: `Reduce exponent by 1. What is the new exponent?`, answer: `${newExp}` },
        ],
        hint: 'Power rule: d/dx(x^n) = n·x^(n-1)',
        topic: 'calc1',
        subtopic: 'derivatives-basic',
        finalAnswer: `${exp}x^${newExp}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Product rule required
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 4) + 2;
      return {
        question: `Find the derivative of f(x) = ${a}x² · (x + ${b})`,
        steps: [
          { 
            instruction: `Use product rule: (fg)' = f'g + fg'. What is the derivative of ${a}x²?`, 
            answer: `${2*a}x`,
          },
          { 
            instruction: `What is the derivative of (x + ${b})?`, 
            answer: `1`,
          },
          { 
            instruction: `Apply product rule: ${2*a}x(x + ${b}) + ${a}x²(1). Expand and simplify. What is the coefficient of x²?`, 
            answer: `${3*a}`,
          },
        ],
        hint: 'Product rule: d/dx[f(x)·g(x)] = f\'(x)·g(x) + f(x)·g\'(x)',
        topic: 'calc1',
        subtopic: 'derivatives-basic',
        finalAnswer: `${3*a}x² + ${2*a*b}x`,
      };
    } else {
      // Medium: Power rule with coefficient
      const coef = Math.floor(Math.random() * 5) + 2;
      const exp = Math.floor(Math.random() * 4) + 2;
      const newCoef = coef * exp;
      const newExp = exp - 1;
      return {
        question: `Find the derivative of f(x) = ${coef}x^${exp}`,
        steps: [
          { instruction: `Apply power rule: multiply coefficient by exponent. What is ${coef} × ${exp}?`, answer: `${newCoef}` },
          { instruction: `Reduce exponent by 1. What is ${exp} - 1?`, answer: `${newExp}` },
          { instruction: `Write f'(x) = ?x^${newExp}`, answer: `${newCoef}` },
        ],
        hint: 'Power rule: d/dx(x^n) = n·x^(n-1)',
        topic: 'calc1',
        subtopic: 'derivatives-basic',
        finalAnswer: `${newCoef}x^${newExp}`,
      };
    }
  },
  'chain-rule': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple chain rule with square
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Find the derivative of f(x) = (x + ${b})²`,
        steps: [
          { instruction: `The outer function is u². Its derivative is?`, answer: '2u' },
          { instruction: `The inner function is x + ${b}. Its derivative is?`, answer: `1` },
          { instruction: `Multiply: 2(x + ${b}) × 1 = ?`, answer: `2(x + ${b})` },
        ],
        hint: 'Chain rule: d/dx[f(g(x))] = f\'(g(x)) × g\'(x)',
        topic: 'calc1',
        subtopic: 'chain-rule',
        finalAnswer: `2(x + ${b})`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Nested chain rule with trig
      const a = Math.floor(Math.random() * 3) + 2;
      return {
        question: `Find the derivative of f(x) = sin(${a}x²)`,
        steps: [
          { instruction: `Outer function: sin(u). Its derivative is?`, answer: 'cos(u)' },
          { instruction: `Inner function: ${a}x². Its derivative is?`, answer: `${2*a}x` },
          { instruction: `Apply chain rule: cos(${a}x²) × ${2*a}x = ?`, answer: `${2*a}x·cos(${a}x²)` },
        ],
        hint: 'Chain rule: d/dx[sin(g(x))] = cos(g(x)) × g\'(x)',
        topic: 'calc1',
        subtopic: 'chain-rule',
        finalAnswer: `${2*a}x·cos(${a}x²)`,
      };
    } else {
      // Medium: Chain rule with linear inner function
      const a = Math.floor(Math.random() * 4) + 2;
      const b = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Find the derivative of f(x) = (${a}x + ${b})²`,
        steps: [
          { instruction: `The outer function is u². Its derivative is?`, answer: '2u' },
          { instruction: `The inner function is ${a}x + ${b}. Its derivative is?`, answer: `${a}` },
          { instruction: `Multiply: 2(${a}x + ${b}) × ${a} = ?`, answer: `${2 * a}(${a}x + ${b})` },
        ],
        hint: 'Chain rule: d/dx[f(g(x))] = f\'(g(x)) × g\'(x)',
        topic: 'calc1',
        subtopic: 'chain-rule',
        finalAnswer: `${2 * a}(${a}x + ${b})`,
      };
    }
  },
  'applications': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Find where derivative is zero
      const a = Math.floor(Math.random() * 3) + 1;
      const b = 2 * a * (Math.floor(Math.random() * 3) + 1);
      const criticalPoint = b / (2 * a);
      return {
        question: `Find where f'(x) = 0 for f(x) = ${a}x² - ${b}x`,
        steps: [
          { instruction: `Find f'(x). What is it?`, answer: `${2 * a}x - ${b}` },
          { instruction: `Set ${2 * a}x - ${b} = 0. What is x?`, answer: `${criticalPoint}` },
        ],
        hint: 'Take derivative and set equal to zero',
        topic: 'calc1',
        subtopic: 'applications',
        finalAnswer: `x = ${criticalPoint}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Related rates problem
      const r = Math.floor(Math.random() * 3) + 2;
      const drdt = Math.floor(Math.random() * 2) + 1;
      const dAdt = 2 * Math.PI * r * drdt;
      return {
        question: `A circle's radius is ${r} cm and increasing at ${drdt} cm/s. How fast is the area increasing?`,
        steps: [
          { instruction: `Area formula: A = πr². Take derivative with respect to t. dA/dt = ?`, answer: `2πr(dr/dt)` },
          { instruction: `Substitute r = ${r} and dr/dt = ${drdt}. dA/dt = 2π(${r})(${drdt}) = ?`, answer: `${dAdt}π` },
        ],
        hint: 'Use implicit differentiation: dA/dt = dA/dr × dr/dt',
        topic: 'calc1',
        subtopic: 'applications',
        finalAnswer: `${dAdt}π cm²/s`,
      };
    } else {
      // Medium: Find and classify critical point
      const a = Math.floor(Math.random() * 2) + 1;
      const b = 2 * a * (Math.floor(Math.random() * 3) + 2);
      const criticalPoint = b / (2 * a);
      return {
        question: `Find the critical point of f(x) = ${a}x² - ${b}x + 3 and determine if it's a min or max`,
        steps: [
          { instruction: `Find f'(x). What is it?`, answer: `${2 * a}x - ${b}` },
          { instruction: `Set f'(x) = 0. What is x?`, answer: `${criticalPoint}` },
          { instruction: `f''(x) = ${2 * a} > 0, so it's a? (min or max)`, answer: `min` },
        ],
        hint: 'Critical points occur where f\'(x) = 0. Use second derivative test.',
        topic: 'calc1',
        subtopic: 'applications',
        finalAnswer: `x = ${criticalPoint} (minimum)`,
      };
    }
  },
  'integrals': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple power rule integration
      const exp = Math.floor(Math.random() * 3) + 1;
      const newExp = exp + 1;
      return {
        question: `Find ∫ x^${exp} dx`,
        steps: [
          { instruction: `Add 1 to the exponent. What is ${exp} + 1?`, answer: `${newExp}` },
          { instruction: `Divide by new exponent. x^${newExp}/${newExp} + C`, answer: `x^${newExp}/${newExp} + C` },
        ],
        hint: 'Power rule: ∫x^n dx = x^(n+1)/(n+1) + C',
        topic: 'calc1',
        subtopic: 'integrals',
        finalAnswer: `x^${newExp}/${newExp} + C`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Sum of terms
      const a = Math.floor(Math.random() * 3) + 2;
      const b = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Find ∫ (${a}x² + ${b}x - 1) dx`,
        steps: [
          { instruction: `Integrate ${a}x². What do you get?`, answer: `${a}x³/3` },
          { instruction: `Integrate ${b}x. What do you get?`, answer: `${b}x²/2` },
          { instruction: `Integrate -1. What do you get?`, answer: `-x` },
          { instruction: `Combine all terms with + C`, answer: `${a}x³/3 + ${b}x²/2 - x + C` },
        ],
        hint: 'Integrate term by term',
        topic: 'calc1',
        subtopic: 'integrals',
        finalAnswer: `${a}x³/3 + ${b}x²/2 - x + C`,
      };
    } else {
      // Medium: With coefficient
      const coef = Math.floor(Math.random() * 4) + 2;
      const exp = Math.floor(Math.random() * 3) + 1;
      const newExp = exp + 1;
      const newCoef = coef / newExp;
      return {
        question: `Find ∫ ${coef}x^${exp} dx`,
        steps: [
          { instruction: `Add 1 to the exponent. What is ${exp} + 1?`, answer: `${newExp}` },
          { instruction: `Divide coefficient by new exponent. What is ${coef}/${newExp}?`, answer: `${newCoef}` },
          { instruction: `Don't forget the constant of integration!`, answer: '+ C' },
        ],
        hint: 'Power rule for integration: ∫x^n dx = x^(n+1)/(n+1) + C',
        topic: 'calc1',
        subtopic: 'integrals',
        finalAnswer: `${newCoef}x^${newExp} + C`,
      };
    }
  },
  'trig-derivatives': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Basic trig derivative
      const funcs = [
        { f: 'sin(x)', df: 'cos(x)' },
        { f: 'cos(x)', df: '-sin(x)' },
      ];
      const func = funcs[Math.floor(Math.random() * funcs.length)];
      return {
        question: `Find the derivative of f(x) = ${func.f}`,
        steps: [
          { instruction: `What is d/dx[${func.f}]?`, answer: func.df },
        ],
        hint: 'd/dx[sin(x)] = cos(x), d/dx[cos(x)] = -sin(x)',
        topic: 'calc1',
        subtopic: 'trig-derivatives',
        finalAnswer: `${func.df}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Trig with chain rule
      const a = Math.floor(Math.random() * 3) + 2;
      const funcs = [
        { f: `sin(${a}x)`, df: `${a}cos(${a}x)` },
        { f: `cos(${a}x)`, df: `-${a}sin(${a}x)` },
        { f: `tan(${a}x)`, df: `${a}sec²(${a}x)` },
      ];
      const func = funcs[Math.floor(Math.random() * funcs.length)];
      return {
        question: `Find the derivative of f(x) = ${func.f}`,
        steps: [
          { instruction: `What is the derivative of the outer trig function?`, answer: func.f.includes('sin') ? 'cos' : func.f.includes('cos') ? '-sin' : 'sec²' },
          { instruction: `What is the derivative of the inner function ${a}x?`, answer: `${a}` },
          { instruction: `Apply chain rule. f'(x) = ?`, answer: func.df },
        ],
        hint: 'Use chain rule: derivative of outer × derivative of inner',
        topic: 'calc1',
        subtopic: 'trig-derivatives',
        finalAnswer: `${func.df}`,
      };
    } else {
      // Medium: Trig with coefficient
      const funcs = [
        { f: 'sin(x)', df: 'cos(x)' },
        { f: 'cos(x)', df: '-sin(x)' },
        { f: 'tan(x)', df: 'sec²(x)' },
      ];
      const coef = Math.floor(Math.random() * 4) + 2;
      const func = funcs[Math.floor(Math.random() * funcs.length)];
      return {
        question: `Find the derivative of f(x) = ${coef}${func.f}`,
        steps: [
          { instruction: `What is d/dx[${func.f}]?`, answer: func.df },
          { instruction: `Multiply by the coefficient. What is ${coef} × ${func.df}?`, answer: `${coef}${func.df}` },
        ],
        hint: 'd/dx[sin(x)] = cos(x), d/dx[cos(x)] = -sin(x), d/dx[tan(x)] = sec²(x)',
        topic: 'calc1',
        subtopic: 'trig-derivatives',
        finalAnswer: `${coef}${func.df}`,
      };
    }
  },
  'u-substitution': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Clear u-substitution
      const a = Math.floor(Math.random() * 3) + 2;
      return {
        question: `Evaluate ∫ ${a}x·e^(x²) dx`,
        steps: [
          { instruction: `Let u = x². What is du?`, answer: '2x dx' },
          { instruction: `So x dx = du/2. The integral becomes (${a}/2)∫e^u du = ?`, answer: `${a/2}e^u + C` },
          { instruction: `Substitute back u = x². Final answer?`, answer: `${a/2}e^(x²) + C` },
        ],
        hint: 'Choose u so that du appears in the integral',
        topic: 'calc1',
        subtopic: 'u-substitution',
        finalAnswer: `${a/2}e^(x²) + C`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Trig substitution setup
      const n = Math.floor(Math.random() * 2) + 2;
      return {
        question: `Evaluate ∫ sin^${n}(x)cos(x) dx`,
        steps: [
          { instruction: `Let u = sin(x). What is du?`, answer: 'cos(x) dx' },
          { instruction: `The integral becomes ∫u^${n} du = ?`, answer: `u^${n+1}/${n+1} + C` },
          { instruction: `Substitute back. Final answer?`, answer: `sin^${n+1}(x)/${n+1} + C` },
        ],
        hint: 'When you see sin^n(x)cos(x), let u = sin(x)',
        topic: 'calc1',
        subtopic: 'u-substitution',
        finalAnswer: `sin^${n+1}(x)/${n+1} + C`,
      };
    } else {
      // Medium: Power of linear function
      const a = Math.floor(Math.random() * 3) + 2;
      const n = Math.floor(Math.random() * 3) + 2;
      return {
        question: `Evaluate ∫ ${a}x(x² + 1)^${n} dx using u-substitution`,
        steps: [
          { instruction: `Let u = x² + 1. What is du/dx?`, answer: '2x' },
          { instruction: `So du = 2x dx. We have ${a}x dx = (${a}/2)du. What is ${a}/2?`, answer: `${a / 2}` },
          { instruction: `Now integrate (${a / 2})u^${n} du. The result is?`, answer: `${a / 2}u^${n + 1}/${n + 1} + C` },
        ],
        hint: 'Choose u so that du appears in the integral',
        topic: 'calc1',
        subtopic: 'u-substitution',
        finalAnswer: `(${a / (2 * (n + 1))})(x² + 1)^${n + 1} + C`,
      };
    }
  },
  'area-volume': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Area under constant
      const c = Math.floor(Math.random() * 4) + 2;
      const a = Math.floor(Math.random() * 2) + 1;
      const b = a + Math.floor(Math.random() * 3) + 2;
      const area = c * (b - a);
      return {
        question: `Find the area under f(x) = ${c} from x = ${a} to x = ${b}`,
        steps: [
          { instruction: `The antiderivative of ${c} is?`, answer: `${c}x` },
          { instruction: `Evaluate: ${c}(${b}) - ${c}(${a}) = ${c*b} - ${c*a} = ?`, answer: `${area}` },
        ],
        hint: 'Area = ∫[a,b] f(x) dx = F(b) - F(a)',
        topic: 'calc1',
        subtopic: 'area-volume',
        finalAnswer: `${area}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Area between curves
      const a = 0;
      const b = Math.floor(Math.random() * 2) + 2;
      // Area between x² and bx from 0 to b
      const area = (b * b * b) / 6;
      return {
        question: `Find the area between y = x² and y = ${b}x from x = 0 to x = ${b}`,
        steps: [
          { instruction: `Which function is on top in [0, ${b}]?`, answer: `${b}x` },
          { instruction: `Set up: ∫(${b}x - x²)dx. Integrate to get?`, answer: `${b}x²/2 - x³/3` },
          { instruction: `Evaluate from 0 to ${b}: (${b}·${b*b}/2 - ${b*b*b}/3) - 0 = ?`, answer: `${area}` },
        ],
        hint: 'Area = ∫[a,b] (top - bottom) dx',
        topic: 'calc1',
        subtopic: 'area-volume',
        finalAnswer: `${area}`,
      };
    } else {
      // Medium: Area under linear function
      const a = Math.floor(Math.random() * 2) + 1;
      const b = a + Math.floor(Math.random() * 2) + 2;
      const area = (b * b - a * a) / 2;
      return {
        question: `Find the area under f(x) = x from x = ${a} to x = ${b}`,
        steps: [
          { instruction: `The antiderivative of x is?`, answer: 'x²/2' },
          { instruction: `Evaluate at upper bound: ${b}²/2 = ?`, answer: `${b * b / 2}` },
          { instruction: `Evaluate at lower bound: ${a}²/2 = ?`, answer: `${a * a / 2}` },
          { instruction: `Subtract: ${b * b / 2} - ${a * a / 2} = ?`, answer: `${area}` },
        ],
        hint: 'Area = ∫[a,b] f(x) dx = F(b) - F(a)',
        topic: 'calc1',
        subtopic: 'area-volume',
        finalAnswer: `${area}`,
      };
    }
  },

  // LINEAR ALGEBRA
  'matrix-basics': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Add two 2x2 matrices
      const a1 = Math.floor(Math.random() * 5) + 1;
      const b1 = Math.floor(Math.random() * 5) + 1;
      const c1 = Math.floor(Math.random() * 5) + 1;
      const d1 = Math.floor(Math.random() * 5) + 1;
      const a2 = Math.floor(Math.random() * 5) + 1;
      const b2 = Math.floor(Math.random() * 5) + 1;
      const c2 = Math.floor(Math.random() * 5) + 1;
      const d2 = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Add: [[${a1}, ${b1}], [${c1}, ${d1}]] + [[${a2}, ${b2}], [${c2}, ${d2}]]`,
        steps: [
          { instruction: `Top-left: ${a1} + ${a2} = ?`, answer: `${a1 + a2}` },
          { instruction: `Top-right: ${b1} + ${b2} = ?`, answer: `${b1 + b2}` },
          { instruction: `Bottom-left: ${c1} + ${c2} = ?`, answer: `${c1 + c2}` },
          { instruction: `Bottom-right: ${d1} + ${d2} = ?`, answer: `${d1 + d2}` },
        ],
        hint: 'Add corresponding elements',
        topic: 'linear-algebra',
        subtopic: 'matrix-basics',
        finalAnswer: `[[${a1 + a2}, ${b1 + b2}], [${c1 + c2}, ${d1 + d2}]]`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Matrix transpose and operations
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = Math.floor(Math.random() * 4) + 1;
      const d = Math.floor(Math.random() * 4) + 1;
      const e = Math.floor(Math.random() * 4) + 1;
      const f = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Find AᵀA where A = [[${a}, ${b}], [${c}, ${d}], [${e}, ${f}]]`,
        steps: [
          { 
            instruction: `First find Aᵀ (transpose). What is the first row of Aᵀ?`, 
            answer: `${a}, ${c}, ${e}`,
          },
          { 
            instruction: `AᵀA is 2×2. Top-left entry: ${a}² + ${c}² + ${e}² = ?`, 
            answer: `${a*a + c*c + e*e}`,
          },
          { 
            instruction: `Top-right (= bottom-left): ${a}×${b} + ${c}×${d} + ${e}×${f} = ?`, 
            answer: `${a*b + c*d + e*f}`,
          },
          { 
            instruction: `Bottom-right: ${b}² + ${d}² + ${f}² = ?`, 
            answer: `${b*b + d*d + f*f}`,
          },
        ],
        hint: 'AᵀA swaps rows and columns of A, then multiplies',
        topic: 'linear-algebra',
        subtopic: 'matrix-basics',
        finalAnswer: `[[${a*a + c*c + e*e}, ${a*b + c*d + e*f}], [${a*b + c*d + e*f}, ${b*b + d*d + f*f}]]`,
      };
    } else {
      // Medium: Scalar multiplication
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = Math.floor(Math.random() * 5) + 1;
      const d = Math.floor(Math.random() * 5) + 1;
      const scalar = Math.floor(Math.random() * 3) + 2;
      return {
        question: `Multiply the matrix [[${a}, ${b}], [${c}, ${d}]] by ${scalar}`,
        steps: [
          { instruction: `What is ${scalar} × ${a}?`, answer: `${scalar * a}` },
          { instruction: `What is ${scalar} × ${b}?`, answer: `${scalar * b}` },
          { instruction: `What is ${scalar} × ${c}?`, answer: `${scalar * c}` },
          { instruction: `What is ${scalar} × ${d}?`, answer: `${scalar * d}` },
        ],
        hint: 'Multiply each element by the scalar',
        topic: 'linear-algebra',
        subtopic: 'matrix-basics',
        finalAnswer: `[[${scalar * a}, ${scalar * b}], [${scalar * c}, ${scalar * d}]]`,
      };
    }
  },
  'vectors': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Vector addition
      const v1 = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      const v2 = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      return {
        question: `Add the vectors: <${v1[0]}, ${v1[1]}> + <${v2[0]}, ${v2[1]}>`,
        steps: [
          { instruction: `Add first components: ${v1[0]} + ${v2[0]} = ?`, answer: `${v1[0] + v2[0]}` },
          { instruction: `Add second components: ${v1[1]} + ${v2[1]} = ?`, answer: `${v1[1] + v2[1]}` },
        ],
        hint: 'Add corresponding components',
        topic: 'linear-algebra',
        subtopic: 'vectors',
        finalAnswer: `<${v1[0] + v2[0]}, ${v1[1] + v2[1]}>`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Cross product (3D vectors)
      const v1 = [Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1];
      const v2 = [Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1];
      const cross = [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
      ];
      return {
        question: `Find the cross product: <${v1[0]}, ${v1[1]}, ${v1[2]}> × <${v2[0]}, ${v2[1]}, ${v2[2]}>`,
        steps: [
          { 
            instruction: `i component: (${v1[1]})(${v2[2]}) - (${v1[2]})(${v2[1]}) = ?`, 
            answer: `${cross[0]}`,
          },
          { 
            instruction: `j component: (${v1[2]})(${v2[0]}) - (${v1[0]})(${v2[2]}) = ?`, 
            answer: `${cross[1]}`,
          },
          { 
            instruction: `k component: (${v1[0]})(${v2[1]}) - (${v1[1]})(${v2[0]}) = ?`, 
            answer: `${cross[2]}`,
          },
        ],
        hint: 'Cross product: <a₂b₃-a₃b₂, a₃b₁-a₁b₃, a₁b₂-a₂b₁>',
        topic: 'linear-algebra',
        subtopic: 'vectors',
        finalAnswer: `<${cross[0]}, ${cross[1]}, ${cross[2]}>`,
      };
    } else {
      // Medium: Dot product
      const v1 = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      const v2 = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      const dot = v1[0] * v2[0] + v1[1] * v2[1];
      return {
        question: `Find the dot product: <${v1[0]}, ${v1[1]}> · <${v2[0]}, ${v2[1]}>`,
        steps: [
          { instruction: `Multiply first components: ${v1[0]} × ${v2[0]} = ?`, answer: `${v1[0] * v2[0]}` },
          { instruction: `Multiply second components: ${v1[1]} × ${v2[1]} = ?`, answer: `${v1[1] * v2[1]}` },
          { instruction: `Add the products. What is the dot product?`, answer: `${dot}` },
        ],
        hint: 'Dot product: a·b = a₁b₁ + a₂b₂',
        topic: 'linear-algebra',
        subtopic: 'vectors',
        finalAnswer: `${dot}`,
      };
    }
  },
  'matrix-multiplication': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: 2x2 matrix times a vector
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 3) + 1;
      const d = Math.floor(Math.random() * 3) + 1;
      const x = Math.floor(Math.random() * 3) + 1;
      const y = Math.floor(Math.random() * 3) + 1;
      return {
        question: `Multiply: [[${a}, ${b}], [${c}, ${d}]] × [[${x}], [${y}]]`,
        steps: [
          { instruction: `First row × column: ${a}(${x}) + ${b}(${y}) = ?`, answer: `${a * x + b * y}` },
          { instruction: `Second row × column: ${c}(${x}) + ${d}(${y}) = ?`, answer: `${c * x + d * y}` },
        ],
        hint: 'Each entry is the dot product of row and column',
        topic: 'linear-algebra',
        subtopic: 'matrix-multiplication',
        finalAnswer: `[[${a * x + b * y}], [${c * x + d * y}]]`,
      };
    } else if (difficulty === 'hard') {
      // Hard: 2x2 matrix times 2x2 matrix
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 3) + 1;
      const d = Math.floor(Math.random() * 3) + 1;
      const e = Math.floor(Math.random() * 3) + 1;
      const f = Math.floor(Math.random() * 3) + 1;
      const g = Math.floor(Math.random() * 3) + 1;
      const h = Math.floor(Math.random() * 3) + 1;
      const r11 = a * e + b * g;
      const r12 = a * f + b * h;
      const r21 = c * e + d * g;
      const r22 = c * f + d * h;
      return {
        question: `Multiply: [[${a}, ${b}], [${c}, ${d}]] × [[${e}, ${f}], [${g}, ${h}]]`,
        steps: [
          { instruction: `Top-left: (${a})(${e}) + (${b})(${g}) = ?`, answer: `${r11}` },
          { instruction: `Top-right: (${a})(${f}) + (${b})(${h}) = ?`, answer: `${r12}` },
          { instruction: `Bottom-left: (${c})(${e}) + (${d})(${g}) = ?`, answer: `${r21}` },
          { instruction: `Bottom-right: (${c})(${f}) + (${d})(${h}) = ?`, answer: `${r22}` },
        ],
        hint: 'Each entry is row of first × column of second',
        topic: 'linear-algebra',
        subtopic: 'matrix-multiplication',
        finalAnswer: `[[${r11}, ${r12}], [${r21}, ${r22}]]`,
      };
    } else {
      // Medium: 2x2 times 2x1 with explanation
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = Math.floor(Math.random() * 4) + 1;
      const d = Math.floor(Math.random() * 4) + 1;
      const x = Math.floor(Math.random() * 4) + 1;
      const y = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Multiply: [[${a}, ${b}], [${c}, ${d}]] × [[${x}], [${y}]]`,
        steps: [
          { instruction: `Row 1 · Column: ${a}×${x} + ${b}×${y} = ${a*x} + ${b*y} = ?`, answer: `${a * x + b * y}` },
          { instruction: `Row 2 · Column: ${c}×${x} + ${d}×${y} = ${c*x} + ${d*y} = ?`, answer: `${c * x + d * y}` },
        ],
        hint: 'Multiply each row by the column vector',
        topic: 'linear-algebra',
        subtopic: 'matrix-multiplication',
        finalAnswer: `[[${a * x + b * y}], [${c * x + d * y}]]`,
      };
    }
  },
  'determinants': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: 2x2 determinant with small numbers
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      const c = Math.floor(Math.random() * 4) + 1;
      const d = Math.floor(Math.random() * 4) + 1;
      const det = a * d - b * c;
      return {
        question: `Find det([[${a}, ${b}], [${c}, ${d}]])`,
        steps: [
          { instruction: `Calculate ad: ${a} × ${d} = ?`, answer: `${a * d}` },
          { instruction: `Calculate bc: ${b} × ${c} = ?`, answer: `${b * c}` },
          { instruction: `Determinant = ad - bc = ${a * d} - ${b * c} = ?`, answer: `${det}` },
        ],
        hint: 'For 2×2 matrix: det = ad - bc',
        topic: 'linear-algebra',
        subtopic: 'determinants',
        finalAnswer: `${det}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: 3x3 determinant using cofactor expansion
      const m = [
        [Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)],
        [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 3)],
        [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 1]
      ];
      const minor1 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
      const minor2 = m[1][0] * m[2][2] - m[1][2] * m[2][0];
      const minor3 = m[1][0] * m[2][1] - m[1][1] * m[2][0];
      const det = m[0][0] * minor1 - m[0][1] * minor2 + m[0][2] * minor3;
      return {
        question: `Find det([[${m[0].join(', ')}], [${m[1].join(', ')}], [${m[2].join(', ')}]])`,
        steps: [
          { 
            instruction: `Expand along row 1. Minor M₁₁ = det([[${m[1][1]}, ${m[1][2]}], [${m[2][1]}, ${m[2][2]}]]) = ?`, 
            answer: `${minor1}`,
          },
          { 
            instruction: `Minor M₁₂ = det([[${m[1][0]}, ${m[1][2]}], [${m[2][0]}, ${m[2][2]}]]) = ?`, 
            answer: `${minor2}`,
          },
          { 
            instruction: `Minor M₁₃ = det([[${m[1][0]}, ${m[1][1]}], [${m[2][0]}, ${m[2][1]}]]) = ?`, 
            answer: `${minor3}`,
          },
          { 
            instruction: `det = ${m[0][0]}(${minor1}) - ${m[0][1]}(${minor2}) + ${m[0][2]}(${minor3}) = ?`, 
            answer: `${det}`,
          },
        ],
        hint: 'Use cofactor expansion along the first row',
        topic: 'linear-algebra',
        subtopic: 'determinants',
        finalAnswer: `${det}`,
      };
    } else {
      // Medium: 2x2 determinant
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const c = Math.floor(Math.random() * 5) + 1;
      const d = Math.floor(Math.random() * 5) + 1;
      const det = a * d - b * c;
      return {
        question: `Find the determinant of [[${a}, ${b}], [${c}, ${d}]]`,
        steps: [
          { instruction: `Calculate ad: ${a} × ${d} = ?`, answer: `${a * d}` },
          { instruction: `Calculate bc: ${b} × ${c} = ?`, answer: `${b * c}` },
          { instruction: `Determinant = ad - bc = ?`, answer: `${det}` },
        ],
        hint: 'For 2×2 matrix: det = ad - bc',
        topic: 'linear-algebra',
        subtopic: 'determinants',
        finalAnswer: `${det}`,
      };
    }
  },
  'eigenvalues': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Diagonal matrix (eigenvalues are diagonal entries)
      const lambda1 = Math.floor(Math.random() * 5) + 1;
      const lambda2 = Math.floor(Math.random() * 5) + 1;
      return {
        question: `Find the eigenvalues of the diagonal matrix [[${lambda1}, 0], [0, ${lambda2}]]`,
        steps: [
          { instruction: `For a diagonal matrix, eigenvalues are the diagonal entries. First eigenvalue?`, answer: `${lambda1}` },
          { instruction: `Second eigenvalue?`, answer: `${lambda2}` },
        ],
        hint: 'Diagonal matrix eigenvalues are just the diagonal entries',
        topic: 'linear-algebra',
        subtopic: 'eigenvalues',
        finalAnswer: `λ = ${Math.min(lambda1, lambda2)}, ${Math.max(lambda1, lambda2)}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Find eigenvalues from characteristic polynomial
      const lambda1 = Math.floor(Math.random() * 3) + 1;
      const lambda2 = Math.floor(Math.random() * 3) + 1;
      // Create matrix with these eigenvalues: [[a, b], [c, d]] where a+d = λ₁+λ₂, ad-bc = λ₁λ₂
      const a = lambda1;
      const d = lambda2;
      const b = Math.floor(Math.random() * 3) + 1;
      const c = 0; // Keep it simple
      const trace = a + d;
      const det = a * d - b * c;
      return {
        question: `Find eigenvalues of [[${a}, ${b}], [${c}, ${d}]] using characteristic polynomial`,
        steps: [
          { 
            instruction: `Trace (sum of diagonal) = ${a} + ${d} = ?`, 
            answer: `${trace}`,
          },
          { 
            instruction: `Determinant = ${a}×${d} - ${b}×${c} = ?`, 
            answer: `${det}`,
          },
          { 
            instruction: `Characteristic equation: λ² - ${trace}λ + ${det} = 0. Solve for λ. (Enter as: a, b)`, 
            answer: `${lambda1}, ${lambda2}`,
          },
        ],
        hint: 'Characteristic polynomial: λ² - (trace)λ + det = 0',
        topic: 'linear-algebra',
        subtopic: 'eigenvalues',
        finalAnswer: `λ = ${Math.min(lambda1, lambda2)}, ${Math.max(lambda1, lambda2)}`,
      };
    } else {
      // Medium: Given trace and determinant
      const lambda1 = Math.floor(Math.random() * 4) + 1;
      const lambda2 = Math.floor(Math.random() * 4) + 1;
      const trace = lambda1 + lambda2;
      const det = lambda1 * lambda2;
      return {
        question: `A 2×2 matrix has trace = ${trace} and det = ${det}. Find its eigenvalues.`,
        steps: [
          { instruction: `Eigenvalues satisfy λ² - (trace)λ + det = 0. Sum of eigenvalues = trace = ?`, answer: `${trace}` },
          { instruction: `Product of eigenvalues = det = ?`, answer: `${det}` },
          { instruction: `Find two numbers with sum ${trace} and product ${det}. Smaller one?`, answer: `${Math.min(lambda1, lambda2)}` },
          { instruction: `Larger one?`, answer: `${Math.max(lambda1, lambda2)}` },
        ],
        hint: 'Eigenvalues: sum = trace, product = determinant',
        topic: 'linear-algebra',
        subtopic: 'eigenvalues',
        finalAnswer: `λ = ${Math.min(lambda1, lambda2)}, ${Math.max(lambda1, lambda2)}`,
      };
    }
  },
  'linear-systems': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple 2x2 system with obvious solution
      const x = Math.floor(Math.random() * 4) + 1;
      const y = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Solve the system:\nx + y = ${x + y}\nx - y = ${x - y}`,
        steps: [
          { instruction: `Add both equations to eliminate y. What is 2x?`, answer: `${2 * x}` },
          { instruction: `Divide by 2. What is x?`, answer: `${x}` },
          { instruction: `Substitute back. What is y?`, answer: `${y}` },
        ],
        hint: 'Add equations to eliminate y',
        topic: 'linear-algebra',
        subtopic: 'linear-systems',
        finalAnswer: `x = ${x}, y = ${y}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: 3x3 system using row reduction
      const x = Math.floor(Math.random() * 3) + 1;
      const y = Math.floor(Math.random() * 3) + 1;
      const z = Math.floor(Math.random() * 3) + 1;
      const eq1 = x + y + z;
      const eq2 = 2 * x + y;
      const eq3 = x + 2 * z;
      return {
        question: `Solve using row reduction:\nx + y + z = ${eq1}\n2x + y = ${eq2}\nx + 2z = ${eq3}`,
        steps: [
          { 
            instruction: `From equation 2: 2x + y = ${eq2}. From eq1: y = ${eq1} - x - z. Substitute and simplify for x in terms of z. What coefficient does x have?`, 
            answer: `1`,
          },
          { 
            instruction: `Using equation 3: x + 2z = ${eq3}, so x = ${eq3} - 2z. Find z from the equations. What is z?`, 
            answer: `${z}`,
          },
          { 
            instruction: `Now find x = ${eq3} - 2(${z}) = ?`, 
            answer: `${x}`,
          },
          { 
            instruction: `Finally, y = ${eq1} - ${x} - ${z} = ?`, 
            answer: `${y}`,
          },
        ],
        hint: 'Use elimination to reduce to simpler equations',
        topic: 'linear-algebra',
        subtopic: 'linear-systems',
        finalAnswer: `x = ${x}, y = ${y}, z = ${z}`,
      };
    } else {
      // Medium: 2x2 with coefficients
      const x = Math.floor(Math.random() * 4) + 1;
      const y = Math.floor(Math.random() * 4) + 1;
      return {
        question: `Solve using row reduction:\n2x + y = ${2 * x + y}\nx + y = ${x + y}`,
        steps: [
          { instruction: `Subtract row 2 from row 1 to eliminate y. What is x?`, answer: `${x}` },
          { instruction: `Substitute x = ${x} into x + y = ${x + y}. What is y?`, answer: `${y}` },
        ],
        hint: 'Use row operations to get row echelon form',
        topic: 'linear-algebra',
        subtopic: 'linear-systems',
        finalAnswer: `x = ${x}, y = ${y}`,
      };
    }
  },
  'projections': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Project onto a standard basis vector
      const a = [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1];
      return {
        question: `Project a = <${a[0]}, ${a[1]}> onto the x-axis (vector <1, 0>)`,
        steps: [
          { instruction: `a · <1, 0> = ${a[0]}×1 + ${a[1]}×0 = ?`, answer: `${a[0]}` },
          { instruction: `|<1, 0>|² = 1. Projection vector = (a·b/|b|²)b = ?`, answer: `<${a[0]}, 0>` },
        ],
        hint: 'Projecting onto x-axis keeps only the x-component',
        topic: 'linear-algebra',
        subtopic: 'projections',
        finalAnswer: `<${a[0]}, 0>`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Project onto a plane (using normal vector)
      const a = [Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1];
      const n = [0, 0, 1]; // Normal to xy-plane
      const dot = a[0] * n[0] + a[1] * n[1] + a[2] * n[2];
      return {
        question: `Project v = <${a[0]}, ${a[1]}, ${a[2]}> onto the xy-plane (normal n = <0, 0, 1>)`,
        steps: [
          { 
            instruction: `Calculate v · n = ${a[0]}×0 + ${a[1]}×0 + ${a[2]}×1 = ?`, 
            answer: `${dot}`,
          },
          { 
            instruction: `Projection onto plane = v - (v·n)n. The z-component becomes?`, 
            answer: `0`,
          },
          { 
            instruction: `The projection vector is?`, 
            answer: `<${a[0]}, ${a[1]}, 0>`,
          },
        ],
        hint: 'proj_plane(v) = v - proj_n(v)',
        topic: 'linear-algebra',
        subtopic: 'projections',
        finalAnswer: `<${a[0]}, ${a[1]}, 0>`,
      };
    } else {
      // Medium: Scalar projection
      const a = [Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 4) + 1];
      const b = [Math.floor(Math.random() * 4) + 1, 0];
      const dot = a[0] * b[0] + a[1] * b[1];
      const bMag = b[0];
      return {
        question: `Find the scalar projection of a = <${a[0]}, ${a[1]}> onto b = <${b[0]}, ${b[1]}>`,
        steps: [
          { instruction: `Calculate a · b = ${a[0]}×${b[0]} + ${a[1]}×${b[1]} = ?`, answer: `${dot}` },
          { instruction: `Calculate |b| = √(${b[0]}² + ${b[1]}²) = ?`, answer: `${bMag}` },
          { instruction: `Scalar projection = (a · b) / |b| = ${dot} / ${bMag} = ?`, answer: `${dot / bMag}` },
        ],
        hint: 'Scalar projection = (a · b) / |b|',
        topic: 'linear-algebra',
        subtopic: 'projections',
        finalAnswer: `${dot / bMag}`,
      };
    }
  },

  // STATISTICS & PROBABILITY
  'descriptive-stats': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Mean of small data set
      const data = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10) + 1);
      const sum = data.reduce((a, b) => a + b, 0);
      const mean = sum / data.length;
      return {
        question: `Find the mean of: ${data.join(', ')}`,
        steps: [
          { instruction: `Sum all values: ${data.join(' + ')} = ?`, answer: `${sum}` },
          { instruction: `Divide by count (${data.length}). Mean = ?`, answer: `${mean}` },
        ],
        hint: 'Mean = sum of values / count',
        topic: 'stats-probability',
        subtopic: 'descriptive-stats',
        finalAnswer: `${mean}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Mean, median, mode, and range
      const data = [2, 3, 3, 5, 7, 8, 8, 8, 10].sort(() => Math.random() - 0.5).slice(0, 7).sort((a, b) => a - b);
      const sum = data.reduce((a, b) => a + b, 0);
      const mean = Math.round((sum / data.length) * 100) / 100;
      const median = data[Math.floor(data.length / 2)];
      const range = data[data.length - 1] - data[0];
      // Find mode
      const freq: Record<number, number> = {};
      data.forEach(n => freq[n] = (freq[n] || 0) + 1);
      const maxFreq = Math.max(...Object.values(freq));
      const mode = Object.keys(freq).find(k => freq[Number(k)] === maxFreq);
      return {
        question: `Find mean, median, mode, and range of: ${data.join(', ')}`,
        steps: [
          { instruction: `Sum = ${sum}, count = ${data.length}. Mean = ?`, answer: `${mean}` },
          { instruction: `Middle value (median) = ?`, answer: `${median}` },
          { instruction: `Most frequent value (mode) = ?`, answer: `${mode}` },
          { instruction: `Range = max - min = ${data[data.length-1]} - ${data[0]} = ?`, answer: `${range}` },
        ],
        hint: 'Mode is most frequent, Range = max - min',
        topic: 'stats-probability',
        subtopic: 'descriptive-stats',
        finalAnswer: `mean=${mean}, median=${median}, mode=${mode}, range=${range}`,
      };
    } else {
      // Medium: Mean and median
      const data = Array.from({ length: 5 }, () => Math.floor(Math.random() * 20) + 1).sort((a, b) => a - b);
      const sum = data.reduce((a, b) => a + b, 0);
      const mean = sum / data.length;
      const median = data[2];
      return {
        question: `Find the mean and median of: ${data.join(', ')}`,
        steps: [
          { instruction: `Sum all values: ${data.join(' + ')} = ?`, answer: `${sum}` },
          { instruction: `Divide by count (${data.length}). Mean = ?`, answer: `${mean}` },
          { instruction: `The middle value (median) is?`, answer: `${median}` },
        ],
        hint: 'Mean = sum/count, Median = middle value',
        topic: 'stats-probability',
        subtopic: 'descriptive-stats',
        finalAnswer: `mean=${mean}, median=${median}`,
      };
    }
  },
  'probability-basics': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple probability
      const total = 10;
      const favorable = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
      return {
        question: `A bag has ${total} balls. ${favorable} are blue. What is P(blue)?`,
        steps: [
          { instruction: `P(blue) = favorable/total = ${favorable}/${total} = ?`, answer: `${favorable/10}` },
        ],
        hint: 'Probability = favorable outcomes / total outcomes',
        topic: 'stats-probability',
        subtopic: 'probability-basics',
        finalAnswer: `${favorable/10}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Conditional probability
      const total = 100;
      const A = 40; // Has property A
      const B = 30; // Has property B
      const AandB = 15; // Has both
      const pBgivenA = AandB / A;
      return {
        question: `Of ${total} people, ${A} like coffee, ${B} like tea, ${AandB} like both. Find P(tea | coffee).`,
        steps: [
          { instruction: `P(tea | coffee) = P(tea AND coffee) / P(coffee). P(both) = ${AandB}/${total} = ?`, answer: `${AandB/total}` },
          { instruction: `P(coffee) = ${A}/${total} = ?`, answer: `${A/total}` },
          { instruction: `P(tea | coffee) = (${AandB}/${total}) / (${A}/${total}) = ${AandB}/${A} = ?`, answer: `${pBgivenA}` },
        ],
        hint: 'P(B|A) = P(A and B) / P(A)',
        topic: 'stats-probability',
        subtopic: 'probability-basics',
        finalAnswer: `${pBgivenA}`,
      };
    } else {
      // Medium: Complement probability
      const total = [6, 10, 12][Math.floor(Math.random() * 3)];
      const favorable = Math.floor(Math.random() * (total - 2)) + 1;
      const complement = total - favorable;
      return {
        question: `A bag has ${total} marbles. ${favorable} are red. What is P(not red)?`,
        steps: [
          { instruction: `P(red) = ${favorable}/${total}. P(not red) = 1 - P(red) = ?`, answer: `${complement}/${total}` },
        ],
        hint: 'P(not A) = 1 - P(A)',
        topic: 'stats-probability',
        subtopic: 'probability-basics',
        finalAnswer: `${complement}/${total}`,
      };
    }
  },
  'distributions': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple z-score calculation
      const mean = 100;
      const std = 10;
      const x = mean + std * (Math.floor(Math.random() * 3) + 1);
      const z = (x - mean) / std;
      return {
        question: `For μ = ${mean}, σ = ${std}, find the z-score for x = ${x}`,
        steps: [
          { instruction: `z = (x - μ) / σ = (${x} - ${mean}) / ${std} = ?`, answer: `${z}` },
        ],
        hint: 'Z-score: z = (x - μ) / σ',
        topic: 'stats-probability',
        subtopic: 'distributions',
        finalAnswer: `z = ${z}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Binomial probability setup
      const n = [5, 6, 8][Math.floor(Math.random() * 3)];
      const p = 0.5;
      const k = Math.floor(Math.random() * 3) + 2;
      const nCk = factorial(n) / (factorial(k) * factorial(n - k));
      return {
        question: `For a binomial with n = ${n}, p = ${p}, find P(X = ${k}) setup`,
        steps: [
          { instruction: `P(X = k) = C(n,k) × p^k × (1-p)^(n-k). What is C(${n}, ${k})?`, answer: `${nCk}` },
          { instruction: `p^${k} = (${p})^${k} = ?`, answer: `${Math.pow(p, k)}` },
          { instruction: `(1-p)^${n-k} = (${1-p})^${n-k} = ?`, answer: `${Math.pow(1-p, n-k)}` },
        ],
        hint: 'Binomial: P(X=k) = C(n,k) × p^k × (1-p)^(n-k)',
        topic: 'stats-probability',
        subtopic: 'distributions',
        finalAnswer: `${nCk} × ${Math.pow(p, k)} × ${Math.pow(1-p, n-k)}`,
      };
    } else {
      // Medium: Z-score with interpretation
      const mean = [50, 70, 100][Math.floor(Math.random() * 3)];
      const std = [5, 10, 15][Math.floor(Math.random() * 3)];
      const z = [-2, -1, 1, 2][Math.floor(Math.random() * 4)];
      const x = mean + z * std;
      return {
        question: `For μ = ${mean}, σ = ${std}, find x when z = ${z}`,
        steps: [
          { instruction: `Rearrange z = (x - μ)/σ to get x = μ + zσ`, answer: `x = μ + zσ` },
          { instruction: `x = ${mean} + (${z})(${std}) = ?`, answer: `${x}` },
        ],
        hint: 'x = μ + zσ',
        topic: 'stats-probability',
        subtopic: 'distributions',
        finalAnswer: `x = ${x}`,
      };
    }
  },
  'confidence-intervals': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Interpret confidence interval
      const mean = Math.floor(Math.random() * 30) + 60;
      const margin = Math.floor(Math.random() * 3) + 2;
      return {
        question: `A 95% CI is (${mean - margin}, ${mean + margin}). What is the sample mean?`,
        steps: [
          { instruction: `The sample mean is the center of the interval. (${mean - margin} + ${mean + margin}) / 2 = ?`, answer: `${mean}` },
        ],
        hint: 'Sample mean is the midpoint of the confidence interval',
        topic: 'stats-probability',
        subtopic: 'confidence-intervals',
        finalAnswer: `${mean}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Calculate CI from data
      const xbar = Math.floor(Math.random() * 20) + 80;
      const s = Math.floor(Math.random() * 5) + 8;
      const n = 25;
      const se = s / Math.sqrt(n);
      const z = 1.96; // 95% CI
      const margin = Math.round(z * se * 100) / 100;
      return {
        question: `Sample: x̄ = ${xbar}, s = ${s}, n = ${n}. Find the 95% CI. (Use z = 1.96)`,
        steps: [
          { instruction: `Standard error = s/√n = ${s}/√${n} = ${s}/${Math.sqrt(n)} = ?`, answer: `${se}` },
          { instruction: `Margin of error = z × SE = 1.96 × ${se} ≈ ?`, answer: `${margin}` },
          { instruction: `CI = (x̄ - ME, x̄ + ME) = (${xbar} - ${margin}, ${xbar} + ${margin}) = ?`, answer: `(${xbar - margin}, ${xbar + margin})` },
        ],
        hint: 'CI = x̄ ± z(s/√n)',
        topic: 'stats-probability',
        subtopic: 'confidence-intervals',
        finalAnswer: `(${Math.round((xbar - margin)*100)/100}, ${Math.round((xbar + margin)*100)/100})`,
      };
    } else {
      // Medium: Point estimate and margin
      const mean = Math.floor(Math.random() * 50) + 50;
      const margin = Math.floor(Math.random() * 5) + 3;
      return {
        question: `A 95% CI is (${mean - margin}, ${mean + margin}). Find point estimate and margin of error.`,
        steps: [
          { instruction: `The point estimate (center) is?`, answer: `${mean}` },
          { instruction: `The margin of error (half the width) is?`, answer: `${margin}` },
        ],
        hint: 'Point estimate is the center, margin of error is half the width',
        topic: 'stats-probability',
        subtopic: 'confidence-intervals',
        finalAnswer: `point estimate = ${mean}, ME = ${margin}`,
      };
    }
  },
  'hypothesis-testing': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Simple p-value decision
      const pValue = [0.01, 0.03, 0.08, 0.12][Math.floor(Math.random() * 4)];
      const alpha = 0.05;
      const reject = pValue < alpha ? 'reject' : 'fail to reject';
      return {
        question: `If p-value = ${pValue} and α = ${alpha}, do we reject H₀?`,
        steps: [
          { instruction: `Is ${pValue} < ${alpha}?`, answer: pValue < alpha ? 'yes' : 'no' },
          { instruction: `Decision: ${reject} H₀`, answer: reject },
        ],
        hint: 'Reject H₀ if p-value < α',
        topic: 'stats-probability',
        subtopic: 'hypothesis-testing',
        finalAnswer: `${reject} H₀`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Calculate z-test statistic
      const mu0 = 100; // null hypothesis mean
      const xbar = [97, 103, 105, 95][Math.floor(Math.random() * 4)];
      const sigma = 10;
      const n = 25;
      const se = sigma / Math.sqrt(n);
      const z = (xbar - mu0) / se;
      return {
        question: `H₀: μ = ${mu0}. Sample: x̄ = ${xbar}, σ = ${sigma}, n = ${n}. Find the z-statistic.`,
        steps: [
          { instruction: `SE = σ/√n = ${sigma}/√${n} = ?`, answer: `${se}` },
          { instruction: `z = (x̄ - μ₀)/SE = (${xbar} - ${mu0})/${se} = ?`, answer: `${z}` },
          { instruction: `With z = ${z}, is this significant at α = 0.05? (|z| > 1.96?)`, answer: Math.abs(z) > 1.96 ? 'yes' : 'no' },
        ],
        hint: 'z = (x̄ - μ₀) / (σ/√n)',
        topic: 'stats-probability',
        subtopic: 'hypothesis-testing',
        finalAnswer: `z = ${z}`,
      };
    } else {
      // Medium: Decision with context
      const pValue = [0.03, 0.08, 0.15, 0.02, 0.06][Math.floor(Math.random() * 5)];
      const alpha = 0.05;
      const reject = pValue < alpha ? 'reject' : 'fail to reject';
      return {
        question: `With α = 0.05 and p-value = ${pValue}, what is the conclusion?`,
        steps: [
          { instruction: `Compare p-value to α. Is ${pValue} < ${alpha}?`, answer: pValue < alpha ? 'yes' : 'no' },
          { instruction: `Therefore, we _____ the null hypothesis.`, answer: reject },
        ],
        hint: 'If p-value < α, reject H₀',
        topic: 'stats-probability',
        subtopic: 'hypothesis-testing',
        finalAnswer: `${reject} H₀`,
      };
    }
  },
  'sampling-clt': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Standard error with perfect square n
      const sigma = [10, 20, 30][Math.floor(Math.random() * 3)];
      const n = [25, 100][Math.floor(Math.random() * 2)];
      const se = sigma / Math.sqrt(n);
      return {
        question: `If σ = ${sigma} and n = ${n}, what is the standard error?`,
        steps: [
          { instruction: `SE = σ/√n = ${sigma}/√${n} = ${sigma}/${Math.sqrt(n)} = ?`, answer: `${se}` },
        ],
        hint: 'Standard error = σ/√n',
        topic: 'stats-probability',
        subtopic: 'sampling-clt',
        finalAnswer: `${se}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: CLT application
      const mu = 50;
      const sigma = 12;
      const n = 36;
      const se = sigma / Math.sqrt(n);
      const xbar = 52;
      const z = (xbar - mu) / se;
      return {
        question: `Population: μ = ${mu}, σ = ${sigma}. For n = ${n}, find P(x̄ > ${xbar})`,
        steps: [
          { instruction: `SE = σ/√n = ${sigma}/√${n} = ?`, answer: `${se}` },
          { instruction: `z = (x̄ - μ)/SE = (${xbar} - ${mu})/${se} = ?`, answer: `${z}` },
          { instruction: `P(x̄ > ${xbar}) = P(z > ${z}). This is approximately?`, answer: z === 1 ? '0.1587' : z === 2 ? '0.0228' : '~0.16' },
        ],
        hint: 'By CLT, x̄ ~ N(μ, σ/√n)',
        topic: 'stats-probability',
        subtopic: 'sampling-clt',
        finalAnswer: `z = ${z}`,
      };
    } else {
      // Medium: Standard error calculation
      const mu = [50, 100, 200][Math.floor(Math.random() * 3)];
      const sigma = [10, 15, 20][Math.floor(Math.random() * 3)];
      const n = [25, 36, 100][Math.floor(Math.random() * 3)];
      const se = sigma / Math.sqrt(n);
      return {
        question: `Population has μ = ${mu}, σ = ${sigma}. For n = ${n}, find the standard error.`,
        steps: [
          { instruction: `Standard error = σ / √n. What is √${n}?`, answer: `${Math.sqrt(n)}` },
          { instruction: `SE = ${sigma} / ${Math.sqrt(n)} = ?`, answer: `${se}` },
        ],
        hint: 'Standard error = σ / √n',
        topic: 'stats-probability',
        subtopic: 'sampling-clt',
        finalAnswer: `${se}`,
      };
    }
  },
  'regression': (difficulty: Difficulty = 'medium') => {
    if (difficulty === 'easy') {
      // Easy: Predict from regression line
      const slope = Math.floor(Math.random() * 4) + 1;
      const intercept = Math.floor(Math.random() * 8) + 2;
      const x = Math.floor(Math.random() * 5) + 2;
      const yPred = slope * x + intercept;
      return {
        question: `Given ŷ = ${slope}x + ${intercept}, predict y when x = ${x}`,
        steps: [
          { instruction: `ŷ = ${slope}(${x}) + ${intercept} = ${slope * x} + ${intercept} = ?`, answer: `${yPred}` },
        ],
        hint: 'Substitute x into the equation',
        topic: 'stats-probability',
        subtopic: 'regression',
        finalAnswer: `ŷ = ${yPred}`,
      };
    } else if (difficulty === 'hard') {
      // Hard: Interpret slope and r²
      const slope = [1.5, 2.3, 0.8][Math.floor(Math.random() * 3)];
      const r2 = [0.64, 0.81, 0.49][Math.floor(Math.random() * 3)];
      const r = Math.sqrt(r2);
      return {
        question: `Regression: ŷ = ${slope}x + 10, r² = ${r2}. Interpret slope and find r.`,
        steps: [
          { instruction: `Slope interpretation: For each 1-unit increase in x, y increases by?`, answer: `${slope}` },
          { instruction: `r² = ${r2} means what % of variation is explained?`, answer: `${r2 * 100}%` },
          { instruction: `r = √(r²) = √${r2} = ?`, answer: `${r}` },
        ],
        hint: 'r = √(r²), slope = change in y per unit change in x',
        topic: 'stats-probability',
        subtopic: 'regression',
        finalAnswer: `slope=${slope} per unit, r=${r}`,
      };
    } else {
      // Medium: Prediction with explanation
      const slope = Math.floor(Math.random() * 5) + 1;
      const intercept = Math.floor(Math.random() * 10) + 5;
      const x = Math.floor(Math.random() * 5) + 3;
      const yPred = slope * x + intercept;
      return {
        question: `Given ŷ = ${slope}x + ${intercept}, predict y when x = ${x}`,
        steps: [
          { instruction: `Substitute x = ${x}: ŷ = ${slope}(${x}) + ${intercept}`, answer: `${slope * x} + ${intercept}` },
          { instruction: `Calculate: ${slope * x} + ${intercept} = ?`, answer: `${yPred}` },
        ],
        hint: 'Substitute the x value into the regression equation',
        topic: 'stats-probability',
        subtopic: 'regression',
        finalAnswer: `ŷ = ${yPred}`,
      };
    }
  },
};

// Helper for factorial (used in binomial)
const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);

// Difficulty type
type Difficulty = 'easy' | 'medium' | 'hard';

// Helper to compare answers flexibly (handles order-insensitive multi-value answers)
const compareAnswers = (userAnswer: string, correctAnswer: string): boolean => {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
  
  // Direct match first
  if (normalize(userAnswer) === normalize(correctAnswer)) {
    return true;
  }
  
  // Check if answer contains separators (comma or "and")
  const hasSeparator = (s: string) => s.includes(',') || s.toLowerCase().includes('and');
  
  if (hasSeparator(correctAnswer) || hasSeparator(userAnswer)) {
    // Split by comma or "and" and compare as sets
    const splitAnswer = (s: string): string[] => {
      return s
        .toLowerCase()
        .replace(/\s+and\s+/g, ',')  // Replace "and" with comma
        .split(',')
        .map(part => part.trim().replace(/\s+/g, ''))
        .filter(part => part.length > 0)
        .sort();
    };
    
    const userParts = splitAnswer(userAnswer);
    const correctParts = splitAnswer(correctAnswer);
    
    if (userParts.length === correctParts.length) {
      return userParts.every((part, i) => part === correctParts[i]);
    }
  }
  
  return false;
};

// Helper to generate problem for a subtopic with difficulty
const generateProblem = (topicId: string, subtopicId: string, difficulty: Difficulty = 'medium'): Problem => {
  const generator = problemGenerators[subtopicId];
  if (generator) {
    return generator(difficulty);
  }
  // Fallback to linear equations
  return problemGenerators['linear-equations'](difficulty);
};

export function PracticeScreen() {
  const { startProblem, completeProblem, progress } = useProgress();
  const { awardProblemXP, hasFirstProblemBonus } = useXP();
  const { addWeeklyXP } = useLeague();
  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [problemMode, setProblemMode] = useState<ProblemMode | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [loading, setLoading] = useState(false);
  const [problemCount, setProblemCount] = useState(0);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  
  // XP tracking state
  const [xpGain, setXpGain] = useState<{ amount: number; breakdown: XPBreakdown; leveledUp: boolean; newLevel?: number } | null>(null);
  const [showXpToast, setShowXpToast] = useState(false);
  const [attempts, setAttempts] = useState(0); // Track attempts for accuracy
  const [answerRevealed, setAnswerRevealed] = useState(false); // Track if answer was revealed (massive XP penalty)

  // Vibration feedback functions using React Native's built-in Vibration API
  const giveFeedback = useCallback((type: 'correct' | 'incorrect' | 'complete') => {
    try {
      switch (type) {
        case 'correct':
          // Short vibration for correct answer
          Vibration.vibrate(100);
          setMascotMood('happy');
          break;
        case 'incorrect':
          // Double short vibration for incorrect
          Vibration.vibrate([0, 50, 50, 50]);
          setMascotMood('encouraging');
          break;
        case 'complete':
          // Celebration pattern for problem complete
          Vibration.vibrate([0, 100, 100, 100, 100, 200]);
          setMascotMood('celebrating');
          break;
      }
    } catch (e) {
      // Vibration not available on this device
    }
    
    // Reset mascot mood after a delay
    setTimeout(() => setMascotMood('idle'), 2500);
  }, []);

  const loadProblem = (topicId: string, subtopicId: string, difficulty: Difficulty = 'medium') => {
    setLoading(true);
    // Start tracking time for this problem
    startProblem();
    setTimeout(() => {
      const newProblem = generateProblem(topicId, subtopicId, difficulty);
      setProblem(newProblem);
      setCurrentStep(0);
      setCompletedSteps([]);
      setUserAnswer('');
      setShowHint(false);
      setShowSolution(false);
      setFeedback(null);
      setLoading(false);
      setAttempts(0); // Reset attempts for new problem
      setAnswerRevealed(false); // Reset reveal state for new problem
    }, 200);
  };

  // Reveal answer function - gives massive XP penalty
  const revealAnswer = () => {
    setAnswerRevealed(true);
    if (problemMode === 'full') {
      const correctAnswer = problem?.finalAnswer || problem?.steps[problem.steps.length - 1]?.answer;
      setUserAnswer(correctAnswer || '');
    } else {
      // Step-by-step mode - reveal current step answer
      const currentAnswer = problem?.steps[currentStep]?.answer;
      setUserAnswer(currentAnswer || '');
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleSubtopicSelect = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
  };

  const handleModeSelect = (mode: ProblemMode) => {
    setProblemMode(mode);
    if (selectedTopic && selectedSubtopic && selectedDifficulty) {
      loadProblem(selectedTopic.id, selectedSubtopic.id, selectedDifficulty);
      setProblemCount(0);
    }
  };

  const checkAnswer = async () => {
    if (!problem) return;
    
    // Track attempt
    setAttempts(prev => prev + 1);
    
    if (problemMode === 'full') {
      // For full problem mode, check against finalAnswer
      const correctAnswer = problem.finalAnswer || problem.steps[problem.steps.length - 1]?.answer;
      const isCorrect = correctAnswer ? compareAnswers(userAnswer, correctAnswer) : false;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      
      if (isCorrect) {
        giveFeedback('complete');
        // Track progress
        if (selectedSubtopic) {
          completeProblem(selectedSubtopic.id);
        }
        
        // Award XP (massive penalty if answer was revealed)
        if (selectedTopic && selectedSubtopic && selectedDifficulty) {
          // If answer was revealed, accuracy is 0 (no XP multiplier bonus)
          const accuracy = answerRevealed ? 0 : Math.max(0, 100 - ((attempts) * 20));
          const xpResult = await awardProblemXP({
            accuracy,
            difficulty: selectedDifficulty, // Use user-selected difficulty for XP
            streakDays: answerRevealed ? 0 : progress.currentStreak, // No streak bonus if revealed
            stepsCompleted: 0,
            topicId: selectedTopic.id,
            subtopicId: selectedSubtopic.id,
          });
          // If revealed, reduce XP to just 10% (token amount for completion)
          if (answerRevealed) {
            xpResult.amount = Math.max(1, Math.floor(xpResult.amount * 0.1));
          } else {
            // Full mode bonus: 25% more XP for solving without step guidance
            xpResult.amount = Math.floor(xpResult.amount * 1.25);
          }
          // Add to weekly league XP
          await addWeeklyXP(xpResult.amount);
          setXpGain(xpResult);
          setShowXpToast(true);
        }
        
        setTimeout(() => {
          setShowSolution(true);
          setProblemCount(prev => prev + 1);
        }, 1000);
      } else {
        giveFeedback('incorrect');
      }
    } else {
      // Step-by-step mode
      if (!problem.steps) return;
      const currentAnswer = problem.steps[currentStep]?.answer;
      const isCorrect = currentAnswer ? compareAnswers(userAnswer, currentAnswer) : false;
      setFeedback(isCorrect ? 'correct' : 'incorrect');
      
      if (isCorrect) {
        // Mark this step as completed (avoid duplicates)
        setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep]);
        
        if (currentStep < problem.steps!.length - 1) {
          // More steps to go
          giveFeedback('correct');
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
            setUserAnswer('');
            setFeedback(null);
            setShowHint(false);
          }, 1000);
        } else {
          // Problem complete!
          giveFeedback('complete');
          // Track progress
          if (selectedSubtopic) {
            completeProblem(selectedSubtopic.id);
          }
          
          // Award XP with step bonus (massive penalty if answer was revealed)
          if (selectedTopic && selectedSubtopic && selectedDifficulty) {
            const accuracy = answerRevealed ? 0 : Math.max(0, 100 - ((attempts) * 20));
            const xpResult = await awardProblemXP({
              accuracy,
              difficulty: selectedDifficulty, // Use user-selected difficulty for XP
              streakDays: answerRevealed ? 0 : progress.currentStreak,
              stepsCompleted: problem.steps.length,
              topicId: selectedTopic.id,
              subtopicId: selectedSubtopic.id,
            });
            // If revealed, reduce XP to just 10%
            if (answerRevealed) {
              xpResult.amount = Math.max(1, Math.floor(xpResult.amount * 0.1));
            } else {
              // Step-by-step mode: 25% less XP (guided practice)
              xpResult.amount = Math.floor(xpResult.amount * 0.75);
            }
            // Add to weekly league XP
            await addWeeklyXP(xpResult.amount);
            setXpGain(xpResult);
            setShowXpToast(true);
          }
          
          setTimeout(() => {
            setShowSolution(true);
            setProblemCount(prev => prev + 1);
          }, 1000);
        }
      } else {
        giveFeedback('incorrect');
      }
    }
  };

  const handleNextProblem = () => {
    if (selectedTopic && selectedSubtopic && selectedDifficulty) {
      loadProblem(selectedTopic.id, selectedSubtopic.id, selectedDifficulty);
    }
  };

  const handleBackToSubtopics = () => {
    setSelectedSubtopic(null);
    setSelectedDifficulty(null);
    setProblemMode(null);
    setProblem(null);
  };

  const handleBackToDifficulty = () => {
    setSelectedDifficulty(null);
    setProblemMode(null);
    setProblem(null);
  };

  const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setProblemCount(0);
  };

  const handleBackToModeSelect = () => {
    setProblemMode(null);
    setProblem(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textMuted;
    }
  };

  // Topic Selection Screen
  if (!selectedTopic) {
    const TopicIcon = ({ topicId }: { topicId: string }) => {
      const Icon = TopicIcons[topicId] || MathOperations;
      return <Icon size={28} color={colors.white} weight="fill" />;
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.practiceHeader}>
            <View style={styles.practiceHeaderIcon}>
              <GraduationCap size={32} color={colors.primary} weight="fill" />
            </View>
            <View>
              <Text style={styles.practiceHeaderTitle}>Math Practice</Text>
              <Text style={styles.practiceHeaderSubtitle}>Master concepts step by step</Text>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Choose a Topic</Text>
          
          {topics.map((topic) => {
            const gradientColors = TopicGradients[topic.id] || [colors.primary, colors.accent];
            return (
              <Pressable 
                key={topic.id} 
                onPress={() => handleTopicSelect(topic)}
                style={({ pressed }) => [
                  styles.topicCard,
                  pressed && styles.topicCardPressed,
                ]}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topicGradient}
                >
                  <View style={styles.topicIconCircle}>
                    <TopicIcon topicId={topic.id} />
                  </View>
                  <View style={styles.topicTextContainer}>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <Text style={styles.topicDescription}>{topic.description}</Text>
                    <View style={styles.topicMeta}>
                      <View style={styles.topicSubtopicBadge}>
                        <BookOpen size={12} color="rgba(255,255,255,0.9)" weight="bold" />
                        <Text style={styles.topicSubtopicText}>{topic.subtopics.length} subtopics</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.topicChevron}>
                    <CaretRight size={24} color="rgba(255,255,255,0.8)" weight="bold" />
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Subtopic Selection Screen
  if (!selectedSubtopic) {
    const TopicIconComponent = TopicIcons[selectedTopic.id] || MathOperations;
    const topicGradient = TopicGradients[selectedTopic.id] || [colors.primary, colors.accent];

    const SubtopicIcon = ({ subtopicId }: { subtopicId: string }) => {
      const Icon = SubtopicIcons[subtopicId] || MathOperations;
      return <Icon size={22} color={colors.primary} weight="fill" />;
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back button */}
          <Pressable
            onPress={() => setSelectedTopic(null)}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <ArrowLeft size={20} color={colors.text} weight="bold" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          {/* Topic Header with gradient */}
          <LinearGradient
            colors={topicGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subtopicHeader}
          >
            <View style={styles.subtopicHeaderIconCircle}>
              <TopicIconComponent size={28} color={colors.white} weight="fill" />
            </View>
            <View style={styles.subtopicHeaderText}>
              <Text style={styles.subtopicHeaderTitle}>{selectedTopic.name}</Text>
              <Text style={styles.subtopicHeaderCount}>{selectedTopic.subtopics.length} subtopics available</Text>
            </View>
          </LinearGradient>
          
          <Text style={styles.sectionTitle}>Select a Subtopic</Text>
          
          {selectedTopic.subtopics.map((subtopic) => (
            <Pressable 
              key={subtopic.id} 
              onPress={() => handleSubtopicSelect(subtopic)}
              style={({ pressed }) => [
                styles.subtopicCardNew,
                pressed && styles.subtopicCardPressed,
              ]}
            >
              <View style={styles.subtopicIconBgNew}>
                <SubtopicIcon subtopicId={subtopic.id} />
              </View>
              <View style={styles.subtopicTextNew}>
                <View style={styles.subtopicNameRow}>
                  <Text style={styles.subtopicNameNew}>{subtopic.name}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(subtopic.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(subtopic.difficulty) }]}>
                      {subtopic.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtopicDescriptionNew} numberOfLines={2}>{subtopic.description}</Text>
              </View>
              <CaretRight size={20} color={colors.textMuted} weight="bold" />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Difficulty Selection Screen
  if (!selectedDifficulty) {
    const SubtopicIconDiff = SubtopicIcons[selectedSubtopic.id] || MathOperations;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back button */}
          <Pressable
            onPress={handleBackToSubtopics}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <ArrowLeft size={20} color={colors.text} weight="bold" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          {/* Subtopic Info Header */}
          <View style={styles.modeInfoCard}>
            <View style={styles.modeInfoHeader}>
              <View style={styles.modeInfoIconBg}>
                <SubtopicIconDiff size={28} color={colors.primary} weight="fill" />
              </View>
              <View style={styles.modeInfoText}>
                <Text style={styles.modeInfoTitle}>{selectedSubtopic.name}</Text>
              </View>
            </View>
            <Text style={styles.modeInfoDescription}>{selectedSubtopic.description}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Select Difficulty</Text>
          
          {/* Easy */}
          <Pressable 
            onPress={() => handleDifficultySelect('easy')} 
            style={({ pressed }) => [
              styles.difficultyCard,
              pressed && styles.difficultyCardPressed,
            ]}
          >
            <View style={[styles.difficultyIconBg, { backgroundColor: colors.success + '15' }]}>
              <Leaf size={26} color={colors.success} weight="fill" />
            </View>
            <View style={styles.difficultyCardText}>
              <Text style={styles.difficultyCardTitle}>Easy</Text>
              <Text style={styles.difficultyCardDesc}>
                Simple problems to build fundamentals
              </Text>
            </View>
            <View style={[styles.difficultyXpBadge, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.difficultyXpText, { color: colors.success }]}>1x XP</Text>
            </View>
          </Pressable>
          
          {/* Medium */}
          <Pressable 
            onPress={() => handleDifficultySelect('medium')} 
            style={({ pressed }) => [
              styles.difficultyCard,
              styles.difficultyCardRecommended,
              pressed && styles.difficultyCardPressed,
            ]}
          >
            <View style={[styles.difficultyIconBg, { backgroundColor: colors.warning + '15' }]}>
              <Flame size={26} color={colors.warning} weight="fill" />
            </View>
            <View style={styles.difficultyCardText}>
              <Text style={styles.difficultyCardTitle}>Medium</Text>
              <Text style={styles.difficultyCardDesc}>
                Balanced challenge for steady progress
              </Text>
            </View>
            <View style={[styles.difficultyXpBadge, { backgroundColor: colors.warning + '15' }]}>
              <Text style={[styles.difficultyXpText, { color: colors.warning }]}>1.5x XP</Text>
            </View>
          </Pressable>
          
          {/* Hard */}
          <Pressable 
            onPress={() => handleDifficultySelect('hard')} 
            style={({ pressed }) => [
              styles.difficultyCard,
              pressed && styles.difficultyCardPressed,
            ]}
          >
            <View style={[styles.difficultyIconBg, { backgroundColor: colors.error + '15' }]}>
              <Lightning size={26} color={colors.error} weight="fill" />
            </View>
            <View style={styles.difficultyCardText}>
              <Text style={styles.difficultyCardTitle}>Hard</Text>
              <Text style={styles.difficultyCardDesc}>
                Complex problems to master the topic
              </Text>
            </View>
            <View style={[styles.difficultyXpBadge, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.difficultyXpText, { color: colors.error }]}>2x XP</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mode Selection Screen
  if (!problemMode) {
    const SubtopicIconMode = SubtopicIcons[selectedSubtopic.id] || MathOperations;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back button */}
          <Pressable
            onPress={handleBackToDifficulty}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <ArrowLeft size={20} color={colors.text} weight="bold" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          {/* Subtopic Info Header */}
          <View style={styles.modeInfoCard}>
            <View style={styles.modeInfoHeader}>
              <View style={styles.modeInfoIconBg}>
                <SubtopicIconMode size={28} color={colors.primary} weight="fill" />
              </View>
              <View style={styles.modeInfoText}>
                <Text style={styles.modeInfoTitle}>{selectedSubtopic.name}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(selectedDifficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(selectedDifficulty) }]}>
                    {selectedDifficulty}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.modeInfoDescription}>{selectedSubtopic.description}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Choose Practice Mode</Text>
          
          {/* Step-by-Step Mode */}
          <Pressable 
            onPress={() => handleModeSelect('step-by-step')} 
            style={({ pressed }) => [
              styles.modeCardNew,
              pressed && styles.modeCardPressed,
            ]}
          >
            <View style={[styles.modeIconBgNew, { backgroundColor: colors.primary + '15' }]}>
              <BookOpen size={26} color={colors.primary} weight="fill" />
            </View>
            <View style={styles.modeCardTextNew}>
              <Text style={styles.modeCardTitleNew}>Step-by-Step</Text>
              <Text style={styles.modeCardDescNew}>
                Guided practice with hints at each step
              </Text>
            </View>
            <View style={[styles.difficultyXpBadge, { backgroundColor: colors.textMuted + '15' }]}>
              <Text style={[styles.difficultyXpText, { color: colors.textMuted }]}>0.75x XP</Text>
            </View>
          </Pressable>
          
          {/* Full Problem Mode */}
          <Pressable 
            onPress={() => handleModeSelect('full')} 
            style={({ pressed }) => [
              styles.modeCardNew,
              styles.modeCardRecommended,
              pressed && styles.modeCardPressed,
            ]}
          >
            <View style={[styles.modeIconBgNew, { backgroundColor: colors.success + '15' }]}>
              <Target size={26} color={colors.success} weight="fill" />
            </View>
            <View style={styles.modeCardTextNew}>
              <Text style={styles.modeCardTitleNew}>Full Problem</Text>
              <Text style={styles.modeCardDescNew}>
                Solve independently for bonus XP
              </Text>
            </View>
            <View style={[styles.difficultyXpBadge, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.difficultyXpText, { color: colors.success }]}>1.25x XP</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Problem Screen
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* XP Gain Toast */}
      <XPGainToast
        amount={xpGain?.amount || 0}
        breakdown={xpGain?.breakdown}
        leveledUp={xpGain?.leveledUp || false}
        newLevel={xpGain?.newLevel}
        visible={showXpToast}
        onHide={() => {
          setShowXpToast(false);
          setXpGain(null);
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.problemContent}>
          {/* Header */}
          <View style={styles.problemHeader}>
            <Button
              title="← Back"
              onPress={handleBackToSubtopics}
              variant="ghost"
              size="sm"
            />
            <View style={styles.problemHeaderInfo}>
              <Text style={styles.problemHeaderTopic}>{selectedTopic.name}</Text>
              <Text style={styles.problemHeaderSubtopic}>{selectedSubtopic.name}</Text>
            </View>
            <Text style={styles.problemCounter}>#{problemCount + 1}</Text>
          </View>
          
          {loading ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Generating problem...</Text>
            </Card>
          ) : problem ? (
            <>
              {/* Problem Question */}
              <Card style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionLabel}>Problem</Text>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>
                      {problemMode === 'step-by-step' ? '📝 Step-by-Step' : '🎯 Full Problem'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.questionText}>{problem.question}</Text>
              </Card>
              
              {/* Step-by-Step Mode */}
              {problemMode === 'step-by-step' && problem.steps && !showSolution && (
                <>
                  {/* Show completed steps with equation progression */}
                  {completedSteps.length > 0 && (
                    <Card style={styles.progressCard}>
                      <Text style={styles.progressTitle}>📈 Your Progress</Text>
                      {completedSteps.map((stepIndex, arrayIndex) => {
                        const step = problem.steps[stepIndex];
                        return (
                          <View key={`completed-step-${stepIndex}-${arrayIndex}`} style={styles.completedStep}>
                            <View style={styles.completedStepHeader}>
                              <Text style={styles.completedStepCheck}>✓</Text>
                              <Text style={styles.completedStepLabel}>Step {stepIndex + 1}</Text>
                            </View>
                            {step.equationAfter && (
                              <View style={styles.equationBox}>
                                <Text style={styles.equationText}>{step.equationAfter}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </Card>
                  )}

                  {/* Current step */}
                  <Card style={styles.stepCard}>
                    <Text style={styles.stepLabel}>
                      Step {currentStep + 1} of {problem.steps.length}
                    </Text>
                    
                    {/* Show current equation state */}
                    {problem.steps[currentStep]?.equationBefore && (
                      <View style={styles.currentEquationBox}>
                        <Text style={styles.currentEquationLabel}>Current equation:</Text>
                        <Text style={styles.currentEquationText}>
                          {problem.steps[currentStep].equationBefore}
                        </Text>
                      </View>
                    )}
                    
                    <Text style={styles.stepInstruction}>
                      {problem.steps[currentStep]?.instruction}
                    </Text>
                    
                    <TextInput
                      style={[
                        styles.answerInput,
                        feedback === 'correct' && styles.inputCorrect,
                        feedback === 'incorrect' && styles.inputIncorrect,
                      ]}
                      value={userAnswer}
                      onChangeText={setUserAnswer}
                      placeholder="Enter your answer"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    
                    <View style={styles.stepButtons}>
                      <Button
                        title="Check"
                        onPress={checkAnswer}
                        disabled={!userAnswer.trim()}
                      />
                      {!showHint && problem.hint && (
                        <Button
                          title="Hint"
                          onPress={() => setShowHint(true)}
                          variant="secondary"
                        />
                      )}
                      {!answerRevealed && (
                        <Button
                          title="Reveal"
                          onPress={revealAnswer}
                          variant="ghost"
                        />
                      )}
                    </View>
                    
                    {answerRevealed && (
                      <View style={styles.revealedWarning}>
                        <Text style={styles.revealedWarningText}>⚠️ Answer revealed - 90% XP penalty</Text>
                      </View>
                    )}
                    
                    {showHint && (
                      <View style={styles.hintBox}>
                        <Text style={styles.hintLabel}>💡 Hint</Text>
                        <Text style={styles.hintText}>{problem.hint}</Text>
                      </View>
                    )}
                    
                    {feedback && (
                      <View style={styles.feedbackContainer}>
                        <FeedbackAnimation 
                          type={feedback}
                          size="sm"
                          message={feedback === 'correct' ? 'Great job!' : 'Almost! Try again'}
                        />
                      </View>
                    )}
                  </Card>
                </>
              )}
              
              {/* Full Problem Mode */}
              {problemMode === 'full' && !showSolution && (
                <Card style={styles.stepCard}>
                  <Text style={styles.stepLabel}>Your Answer</Text>
                  <Text style={styles.stepInstruction}>
                    Solve the problem completely and enter your final answer below.
                  </Text>
                  
                  <TextInput
                    style={[
                      styles.answerInput,
                      feedback === 'correct' && styles.inputCorrect,
                      feedback === 'incorrect' && styles.inputIncorrect,
                    ]}
                    value={userAnswer}
                    onChangeText={setUserAnswer}
                    placeholder="Enter your final answer"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  
                  <View style={styles.stepButtons}>
                    <Button
                      title="Submit Answer"
                      onPress={checkAnswer}
                      disabled={!userAnswer.trim()}
                    />
                    {!showHint && problem.hint && (
                      <Button
                        title="Hint"
                        onPress={() => setShowHint(true)}
                        variant="secondary"
                      />
                    )}
                    {!answerRevealed && (
                      <Button
                        title="Reveal"
                        onPress={revealAnswer}
                        variant="ghost"
                      />
                    )}
                  </View>
                  
                  {answerRevealed && (
                    <View style={styles.revealedWarning}>
                      <Text style={styles.revealedWarningText}>⚠️ Answer revealed - 90% XP penalty</Text>
                    </View>
                  )}
                  
                  {showHint && (
                    <View style={styles.hintBox}>
                      <Text style={styles.hintLabel}>💡 Hint</Text>
                      <Text style={styles.hintText}>{problem.hint}</Text>
                    </View>
                  )}
                  
                  {feedback && (
                    <View style={styles.feedbackContainer}>
                      <FeedbackAnimation 
                        type={feedback}
                        size="sm"
                        message={feedback === 'correct' ? 'Perfect!' : 'Keep trying!'}
                      />
                    </View>
                  )}
                </Card>
              )}
              
              {/* Solution */}
              {showSolution && (
                <Card style={styles.solutionCard}>
                  <FeedbackAnimation type="correct" size="md" message="Amazing work!" />
                  <Text style={styles.solutionTitle}>Problem Complete!</Text>
                  <Text style={styles.solutionText}>
                    Great job! You've solved this problem.
                  </Text>
                  <Button
                    title="Next Problem"
                    onPress={handleNextProblem}
                    style={{ marginTop: spacing.md }}
                  />
                </Card>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  problemContent: {
    padding: spacing.md,
    flexGrow: 1,
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
  // Hero card styles
  heroCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Practice header styles
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  practiceHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  practiceHeaderTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  practiceHeaderSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Topic card styles
  topicCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  topicCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  topicGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  topicIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  topicDescription: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xs,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicSubtopicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  topicSubtopicText: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  topicChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  backButtonPressed: {
    backgroundColor: colors.cardElevated,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  // Subtopic header with gradient
  subtopicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  subtopicHeaderIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subtopicHeaderText: {
    flex: 1,
  },
  // New subtopic card styles
  subtopicCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  subtopicCardPressed: {
    backgroundColor: colors.cardElevated,
    transform: [{ scale: 0.99 }],
  },
  subtopicIconBgNew: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subtopicTextNew: {
    flex: 1,
  },
  subtopicNameNew: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  subtopicDescriptionNew: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  // Topic list styles
  topicListCard: {
    marginBottom: spacing.md,
  },
  topicListContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  topicListIcon: {
    fontSize: 28,
  },
  topicListText: {
    flex: 1,
  },
  topicListName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  topicListDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  subtopicBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  subtopicCount: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '600',
  },
  // Subtopic header styles
  topicHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  topicHeaderIconBg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subtopicHeaderIcon: {
    fontSize: 28,
  },
  subtopicHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  subtopicHeaderCount: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  subtopicIconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  // Subtopic card styles
  subtopicCard: {
    marginBottom: spacing.md,
  },
  subtopicContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subtopicIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: 2,
  },
  subtopicText: {
    flex: 1,
  },
  subtopicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  subtopicName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  subtopicDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Mode selection styles
  subtopicInfoCard: {
    marginBottom: spacing.lg,
  },
  subtopicInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subtopicInfoIconBg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  subtopicInfoText: {
    flex: 1,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeHeaderIcon: {
    fontSize: 28,
  },
  modeHeaderTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  descriptionCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary + '10',
  },
  descriptionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  // Mode info card styles
  modeInfoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modeInfoIconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modeInfoText: {
    flex: 1,
  },
  modeInfoTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modeInfoDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  // Difficulty card styles
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  difficultyCardRecommended: {
    borderColor: colors.warning + '40',
    backgroundColor: colors.warning + '08',
  },
  difficultyCardPressed: {
    backgroundColor: colors.cardElevated,
    transform: [{ scale: 0.98 }],
  },
  difficultyIconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  difficultyCardText: {
    flex: 1,
  },
  difficultyCardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  difficultyCardDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  difficultyXpBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  difficultyXpText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  // Mode card new styles
  modeCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeCardRecommended: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  modeCardPressed: {
    backgroundColor: colors.cardElevated,
    transform: [{ scale: 0.98 }],
  },
  modeIconBgNew: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modeCardTextNew: {
    flex: 1,
  },
  modeCardTitleNew: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  modeCardDescNew: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  modeSelectTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modeCard: {
    marginBottom: spacing.md,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modeIconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modeCardIcon: {
    fontSize: 26,
  },
  modeCardText: {
    flex: 1,
  },
  modeCardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modeCardDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  recommendedText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.white,
  },
  // Problem header styles
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  problemHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  problemHeaderTopic: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  problemHeaderSubtopic: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  problemCounter: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  // Problem card styles
  loadingCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  questionCard: {
    marginBottom: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  questionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  modeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  modeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  questionText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '500',
    lineHeight: 26,
  },
  stepCard: {
    marginBottom: spacing.md,
  },
  stepLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  stepInstruction: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  answerInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  inputIncorrect: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  stepButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hintBox: {
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  hintLabel: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  feedback: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  feedbackCorrect: {
    color: colors.success,
  },
  feedbackIncorrect: {
    color: colors.error,
  },
  feedbackContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  answerReveal: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  revealedWarning: {
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  revealedWarningText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '600',
  },
  solutionCard: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  solutionTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: spacing.sm,
  },
  solutionText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Equation progression styles
  progressCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.success + '08',
    borderColor: colors.success + '30',
  },
  progressTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  completedStep: {
    marginBottom: spacing.sm,
  },
  completedStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  completedStepCheck: {
    fontSize: 14,
    color: colors.success,
    marginRight: spacing.xs,
    fontWeight: 'bold',
  },
  completedStepLabel: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
  equationBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginLeft: spacing.lg,
  },
  equationText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  currentEquationBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  currentEquationLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  currentEquationText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
});
