/**
 * Utility to convert LaTeX math notation to readable Unicode text
 */

// Superscript digits
const superscripts: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ', 'i': 'ⁱ', '+': '⁺', '-': '⁻',
};

// Subscript digits
const subscripts: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  'n': 'ₙ', 'x': 'ₓ', 'i': 'ᵢ', 'j': 'ⱼ',
};

// Greek letters
const greekLetters: Record<string, string> = {
  'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
  'epsilon': 'ε', 'zeta': 'ζ', 'eta': 'η', 'theta': 'θ',
  'iota': 'ι', 'kappa': 'κ', 'lambda': 'λ', 'mu': 'μ',
  'nu': 'ν', 'xi': 'ξ', 'pi': 'π', 'rho': 'ρ',
  'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ',
  'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
  'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
  'Theta': 'Θ', 'Lambda': 'Λ', 'Pi': 'Π', 'Sigma': 'Σ',
  'Phi': 'Φ', 'Psi': 'Ψ', 'Omega': 'Ω',
};

// Math symbols
const mathSymbols: Record<string, string> = {
  'times': '×', 'div': '÷', 'pm': '±', 'mp': '∓',
  'cdot': '·', 'ast': '∗', 'star': '⋆',
  'leq': '≤', 'geq': '≥', 'neq': '≠', 'approx': '≈',
  'equiv': '≡', 'sim': '∼', 'propto': '∝',
  'infty': '∞', 'partial': '∂', 'nabla': '∇',
  'sum': 'Σ', 'prod': 'Π', 'int': '∫',
  'sqrt': '√', 'cbrt': '∛',
  'in': '∈', 'notin': '∉', 'subset': '⊂', 'supset': '⊃',
  'cup': '∪', 'cap': '∩', 'emptyset': '∅',
  'forall': '∀', 'exists': '∃', 'neg': '¬',
  'land': '∧', 'lor': '∨', 'oplus': '⊕',
  'rightarrow': '→', 'leftarrow': '←', 'leftrightarrow': '↔',
  'Rightarrow': '⇒', 'Leftarrow': '⇐', 'Leftrightarrow': '⇔',
  'therefore': '∴', 'because': '∵',
  'angle': '∠', 'degree': '°', 'circ': '°',
  'prime': '′', 'dprime': '″',
};

/**
 * Convert a string to superscript
 */
function toSuperscript(str: string): string {
  return str.split('').map(c => superscripts[c] || c).join('');
}

/**
 * Convert a string to subscript
 */
function toSubscript(str: string): string {
  return str.split('').map(c => subscripts[c] || c).join('');
}

/**
 * Format a fraction for display
 */
function formatFraction(numerator: string, denominator: string): string {
  // For simple fractions, use Unicode fraction slash
  const num = numerator.trim();
  const den = denominator.trim();
  
  // Common fractions have Unicode characters
  const commonFractions: Record<string, string> = {
    '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
    '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
    '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
  };
  
  const key = `${num}/${den}`;
  if (commonFractions[key]) {
    return commonFractions[key];
  }
  
  // Otherwise use parentheses for clarity
  return `(${num})/(${den})`;
}

/**
 * Convert LaTeX math notation to readable Unicode text
 */
export function formatMathText(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Remove display math delimiters
  result = result.replace(/\$\$/g, '');
  result = result.replace(/\$/g, '');
  result = result.replace(/\\\[/g, '');
  result = result.replace(/\\\]/g, '');
  result = result.replace(/\\\(/g, '');
  result = result.replace(/\\\)/g, '');
  
  // Handle fractions: \frac{a}{b} -> (a)/(b)
  result = result.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
    return formatFraction(formatMathText(num), formatMathText(den));
  });
  
  // Handle nested fractions (do another pass)
  result = result.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, den) => {
    return formatFraction(formatMathText(num), formatMathText(den));
  });
  
  // Handle square roots: \sqrt{x} -> √(x)
  result = result.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  result = result.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, (_, n, content) => {
    if (n === '3') return `∛(${content})`;
    return `${toSuperscript(n)}√(${content})`;
  });
  
  // Handle exponents: x^{2} -> x², x^2 -> x²
  result = result.replace(/\^{([^{}]+)}/g, (_, exp) => toSuperscript(exp));
  result = result.replace(/\^(\d+)/g, (_, exp) => toSuperscript(exp));
  result = result.replace(/\^([a-z])/gi, (_, exp) => toSuperscript(exp));
  
  // Handle subscripts: x_{n} -> xₙ, x_n -> xₙ
  result = result.replace(/_{([^{}]+)}/g, (_, sub) => toSubscript(sub));
  result = result.replace(/_(\d+)/g, (_, sub) => toSubscript(sub));
  result = result.replace(/_([a-z])/gi, (_, sub) => toSubscript(sub));
  
  // Handle Greek letters: \alpha -> α
  for (const [latex, unicode] of Object.entries(greekLetters)) {
    result = result.replace(new RegExp(`\\\\${latex}\\b`, 'g'), unicode);
  }
  
  // Handle math symbols
  for (const [latex, unicode] of Object.entries(mathSymbols)) {
    result = result.replace(new RegExp(`\\\\${latex}\\b`, 'g'), unicode);
  }
  
  // Handle special functions
  result = result.replace(/\\sin\b/g, 'sin');
  result = result.replace(/\\cos\b/g, 'cos');
  result = result.replace(/\\tan\b/g, 'tan');
  result = result.replace(/\\sec\b/g, 'sec');
  result = result.replace(/\\csc\b/g, 'csc');
  result = result.replace(/\\cot\b/g, 'cot');
  result = result.replace(/\\log\b/g, 'log');
  result = result.replace(/\\ln\b/g, 'ln');
  result = result.replace(/\\exp\b/g, 'exp');
  result = result.replace(/\\lim\b/g, 'lim');
  
  // Handle text commands
  result = result.replace(/\\text\{([^{}]+)\}/g, '$1');
  result = result.replace(/\\textbf\{([^{}]+)\}/g, '$1');
  result = result.replace(/\\textit\{([^{}]+)\}/g, '$1');
  result = result.replace(/\\mathrm\{([^{}]+)\}/g, '$1');
  result = result.replace(/\\mathbf\{([^{}]+)\}/g, '$1');
  
  // Handle spacing commands
  result = result.replace(/\\quad/g, '  ');
  result = result.replace(/\\qquad/g, '    ');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\;/g, ' ');
  result = result.replace(/\\!/g, '');
  result = result.replace(/\\ /g, ' ');
  
  // Handle parentheses
  result = result.replace(/\\left\(/g, '(');
  result = result.replace(/\\right\)/g, ')');
  result = result.replace(/\\left\[/g, '[');
  result = result.replace(/\\right\]/g, ']');
  result = result.replace(/\\left\{/g, '{');
  result = result.replace(/\\right\}/g, '}');
  result = result.replace(/\\left\|/g, '|');
  result = result.replace(/\\right\|/g, '|');
  
  // Handle absolute value
  result = result.replace(/\\lvert/g, '|');
  result = result.replace(/\\rvert/g, '|');
  result = result.replace(/\\vert/g, '|');
  
  // Clean up remaining backslashes from unknown commands
  result = result.replace(/\\([a-zA-Z]+)/g, '$1');
  
  // Clean up extra braces
  result = result.replace(/\{([^{}]+)\}/g, '$1');
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ');
  
  return result.trim();
}

/**
 * Format an array of step explanations
 */
export function formatMathSteps(steps: string[]): string[] {
  return steps.map(step => formatMathText(step));
}
