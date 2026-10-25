/**
 * Design Tokens — Source unique de vérité pour tout le design system
 * Utilisé par : Tailwind v4 (via CSS variables), composants React, animations
 */

// ============================================================================
// COULEURS — Échelles complètes (50-950) + alias sémantiques
// ============================================================================

export const color = {
  // --- Vermilion (accent principal) ---
  vermilion: {
    50:  '#fff4ed',
    100: '#ffe5d7',
    200: '#ffd0b8',
    300: '#ffb28e',
    400: '#ff9064',
    500: '#ef6d3e',
    600: '#d4512c',
    700: '#b13f25',
    800: '#8e3625',
    900: '#702d22',
    950: '#4a201c',
  },

  // --- Cobalt (accent secondaire) ---
  cobalt: {
    300: '#cad4ff',
    400: '#9eafff',
    500: '#7188f2',
    600: '#5068d0',
  },

  // --- Cyan (support) ---
  cyan: {
    300: '#c2e5ed',
    400: '#83ccdc',
    500: '#3e9db4',
  },

  // --- Gold (highlight) ---
  gold: {
    300: '#f6df9b',
    400: '#edc85f',
    500: '#d5a638',
    600: '#b98325',
  },

  // --- Mint (feedback positif) ---
  mint: {
    100: '#e0f9e4',
    200: '#c9f6d4',
    300: '#b3f0c3',
    400: '#8de8a8',
    500: '#6de08e',
    600: '#4dc872',
    700: '#38a056',
    800: '#2c7d43',
    900: '#1e5a37',
    deep: '#1e5a37',
    glow: 'rgba(224, 249, 228, 0.34)',
  },

  // --- Ink (texte principal) ---
  ink: {
    DEFAULT: '#0b0b0c',
    soft: '#1d1d1f',
    muted: '#55524b',
  },

  // --- Paper (fond principal) ---
  paper: {
    DEFAULT: '#f4f2ec',
    deep: '#e4e0d6',
  },

  // --- Void (neutre foncé / dark mode) ---
  void: {
    50:  '#f7f4ee',
    100: '#e8e4dc',
    200: '#d2d0ca',
    300: '#b5b9b8',
    400: '#929b9e',
    500: '#707b83',
    600: '#53606b',
    700: '#3a4652',
    800: '#2c3743',
    900: '#202a35',
    950: '#171e28',
  },

  // --- Line (bordures) ---
  line: {
    DEFAULT: '#b9b5aa',
    strong: 'rgba(244, 242, 236, 0.26)',
    focus: '#e0f9e4',
  },

  // --- Feedback ---
  feedback: {
    success: { light: '#4ade80', dark: '#22c55e' },
    error:   { light: '#f87171', dark: '#ef4444' },
    warning: { light: '#fbbf24', dark: '#f59e0b' },
    info:    { light: '#60a5fa', dark: '#3b82f6' },
  },

  // --- Sémantiques (light) ---
  semanticLight: {
    bg: '#0b0b0c',
    bgSubtle: '#131314',
    bgMuted: '#1c1c1e',
    bgInverted: '#f4f2ec',
    surface: '#161617',
    surfaceRaised: '#1e1e20',
    surfaceSunken: '#08080a',
    surfaceOverlay: '#161617',
    fg: '#f4f2ec',
    fgMuted: '#cac6bc',
    fgSubtle: '#a29d93',
    fgInverted: '#0b0b0c',
    border: 'rgba(244, 242, 236, 0.14)',
    borderStrong: 'rgba(244, 242, 236, 0.26)',
    borderFocus: '#e0f9e4',
    primary: '#e0f9e4',
    primaryHover: '#c9f6d4',
    primaryActive: '#b3f0c3',
    primarySolid: '#e0f9e4',
    primarySolidHover: '#c9f6d4',
    primarySolidFg: '#0b0b0c',
    primarySubtle: 'rgba(224, 249, 228, 0.14)',
  },

  // --- Sémantiques (dark) ---
  semanticDark: {
    bg: '#0b0b0c',
    bgSubtle: '#131314',
    bgMuted: '#1c1c1e',
    bgInverted: '#f4f2ec',
    surface: '#161617',
    surfaceRaised: '#1e1e20',
    surfaceSunken: '#08080a',
    surfaceOverlay: '#161617',
    fg: '#f4f2ec',
    fgMuted: '#cac6bc',
    fgSubtle: '#a29d93',
    fgInverted: '#0b0b0c',
    border: 'rgba(244, 242, 236, 0.14)',
    borderStrong: 'rgba(244, 242, 236, 0.26)',
    borderFocus: '#e0f9e4',
    primary: '#e0f9e4',
    primaryHover: '#c9f6d4',
    primaryActive: '#b3f0c3',
    primarySolid: '#e0f9e4',
    primarySolidHover: '#c9f6d4',
    primarySolidFg: '#0b0b0c',
    primarySubtle: 'rgba(224, 249, 228, 0.14)',
  },
} as const;

// ============================================================================
// ESPACEMENT — Scale cohérente (4px base)
// ============================================================================

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
} as const;

// ============================================================================
// RAYONS — Scale cohérente
// ============================================================================

export const radius = {
  none: '0',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
  card: '14px',
  button: '10px',
  input: '10px',
  badge: '9999px',
  sheet: '24px',
} as const;

// ============================================================================
// OMBRES — Scale cohérente (paper-toned)
// ============================================================================

export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgba(11, 11, 12, 0.06)',
  sm: '0 2px 4px rgba(11, 11, 12, 0.08)',
  md: '0 4px 8px rgba(11, 11, 12, 0.10)',
  lg: '0 8px 16px rgba(11, 11, 12, 0.12)',
  xl: '0 16px 32px rgba(11, 11, 12, 0.14)',
  '2xl': '0 24px 48px rgba(11, 11, 12, 0.16)',
  card: '0 2px 8px rgba(11, 11, 12, 0.08), 0 1px 2px rgba(11, 11, 12, 0.06)',
  elevated: '0 8px 24px rgba(11, 11, 12, 0.12), 0 2px 6px rgba(11, 11, 12, 0.08)',
  modal: '0 24px 48px rgba(11, 11, 12, 0.20), 0 8px 16px rgba(11, 11, 12, 0.12)',
  press: '0 0 0 1px rgba(11, 11, 12, 0.08)',
  focus: '0 0 0 2px #e0f9e4, 0 0 0 4px rgba(11, 11, 12, 0.08)',
  inner: 'inset 0 1px 2px rgba(11, 11, 12, 0.06)',
} as const;

// ============================================================================
// MOTION — Durées, easings, keyframes
// ============================================================================

export const motion = {
  duration: {
    instant: '0ms',
    fast: '120ms',
    base: '180ms',
    slow: '280ms',
    slower: '400ms',
    slowest: '600ms',
  },
  easing: {
    linear: 'linear',
    spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
    'spring-sharp': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    'spring-soft': 'cubic-bezier(0.25, 1, 0.5, 1)',
    'out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  keyframes: {
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'fade-out': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    'slide-up': {
      '0%': { opacity: '0', transform: 'translateY(8px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'slide-down': {
      '0%': { opacity: '0', transform: 'translateY(-8px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'slide-left': {
      '0%': { opacity: '0', transform: 'translateX(8px)' },
      '100%': { opacity: '1', transform: 'translateX(0)' },
    },
    'slide-right': {
      '0%': { opacity: '0', transform: 'translateX(-8px)' },
      '100%': { opacity: '1', transform: 'translateX(0)' },
    },
    'scale-in': {
      '0%': { opacity: '0', transform: 'scale(0.96)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },
    'scale-out': {
      '0%': { opacity: '1', transform: 'scale(1)' },
      '100%': { opacity: '0', transform: 'scale(0.96)' },
    },
    'shimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    'pulse-soft': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.7' },
    },
    'bounce-subtle': {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-4px)' },
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHIE — Échelle + tracking + leading
// ============================================================================

export const typography = {
  fontFamily: {
    display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', 'Georgia', 'serif'],
    heading: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
    body: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'monospace'],
  },
  fontSize: {
    xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
    sm: ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
    base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
    lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
    '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
    '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
    '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.03em' }],
    '5xl': ['48px', { lineHeight: '52px', letterSpacing: '-0.04em' }],
    '6xl': ['60px', { lineHeight: '64px', letterSpacing: '-0.05em' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  letterSpacing: {
    tight: '-0.03em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
  },
  lineHeight: {
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

// ============================================================================
// Z-INDEX — Scale cohérente
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// TRANSITIONS — Raccourcis
// ============================================================================

export const transitions = {
  fast: `all ${motion.duration.fast} ${motion.easing.spring}`,
  base: `all ${motion.duration.base} ${motion.easing.spring}`,
  slow: `all ${motion.duration.slow} ${motion.easing.spring}`,
  colors: `color ${motion.duration.fast} ${motion.easing.out}, background-color ${motion.duration.fast} ${motion.easing.out}, border-color ${motion.duration.fast} ${motion.easing.out}`,
  transform: `transform ${motion.duration.base} ${motion.easing.spring}`,
  shadow: `box-shadow ${motion.duration.base} ${motion.easing.spring}`,
  opacity: `opacity ${motion.duration.fast} ${motion.easing.out}`,
} as const;

// ============================================================================
// EXPORT GLOBAL — Pour import facile
// ============================================================================

export const tokens = {
  color,
  spacing,
  radius,
  shadow,
  motion,
  typography,
  zIndex,
  breakpoints,
  transitions,
} as const;

export type Tokens = typeof tokens;
export type ColorScale = typeof color.vermilion;
export type SemanticColors = typeof color.semanticLight;