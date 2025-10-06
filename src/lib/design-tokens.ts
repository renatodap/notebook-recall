/**
 * Design Tokens - 2026 AI SaaS Standards
 *
 * Calm, consistent, and professional design system
 * Based on principles: invisible friction, high signal-to-noise ratio
 */

// Typography Scale (1.250 - Major Third)
export const typography = {
  // Sizes
  xs: '0.75rem',    // 12px - labels, captions
  sm: '0.875rem',   // 14px - body small, secondary text
  base: '1rem',     // 16px - body text, primary content
  lg: '1.125rem',   // 18px - emphasized text
  xl: '1.25rem',    // 20px - small headings
  '2xl': '1.5rem',  // 24px - section headings
  '3xl': '1.875rem', // 30px - page titles
  '4xl': '2.25rem', // 36px - hero text
  '5xl': '3rem',    // 48px - display text

  // Weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const

// Spacing Scale (4px base unit)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const

// Color System - Calm & Trustworthy
export const colors = {
  // Brand - Calm Blue/Purple
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // Primary brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  // Neutrals - High contrast, accessible
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    500: '#10b981',
    700: '#047857',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#b91c1c',
  },
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    700: '#1d4ed8',
  },

  // AI/Special
  ai: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glow: 'rgba(102, 126, 234, 0.3)',
    text: '#667eea',
  },
} as const

// Shadows - Subtle depth
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgba(102, 126, 234, 0.4)',
} as const

// Border Radius
export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

// Transitions - Smooth & professional
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  toast: 50,
  tooltip: 60,
} as const

// Button Variants
export const buttons = {
  sizes: {
    sm: {
      height: '2rem',      // 32px
      padding: '0 0.75rem', // 12px horizontal
      fontSize: typography.sm,
    },
    md: {
      height: '2.5rem',    // 40px
      padding: '0 1rem',   // 16px horizontal
      fontSize: typography.base,
    },
    lg: {
      height: '3rem',      // 48px
      padding: '0 1.5rem', // 24px horizontal
      fontSize: typography.lg,
    },
  },
  variants: {
    primary: {
      bg: colors.primary[600],
      hoverBg: colors.primary[700],
      text: colors.neutral[0],
      border: 'transparent',
    },
    secondary: {
      bg: colors.neutral[100],
      hoverBg: colors.neutral[200],
      text: colors.neutral[900],
      border: colors.neutral[300],
    },
    ghost: {
      bg: 'transparent',
      hoverBg: colors.neutral[100],
      text: colors.neutral[700],
      border: 'transparent',
    },
    danger: {
      bg: colors.error[500],
      hoverBg: colors.error[700],
      text: colors.neutral[0],
      border: 'transparent',
    },
  },
} as const

// Layout Constraints
export const layout = {
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    prose: '65ch', // Optimal reading width
  },
  container: {
    padding: spacing[4],
    paddingMobile: spacing[4],
  },
} as const

// Animation Presets
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  slideDown: {
    from: { opacity: 0, transform: 'translateY(-10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
} as const

// Utility Classes Generator
export const utils = {
  // Container with max-width and centered
  container: (maxWidth: keyof typeof layout.maxWidth = 'xl') => ({
    maxWidth: layout.maxWidth[maxWidth],
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: layout.container.padding,
    paddingRight: layout.container.padding,
  }),

  // Focus ring for accessibility
  focusRing: {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    '&:focus-visible': {
      outline: `2px solid ${colors.primary[500]}`,
      outlineOffset: '2px',
    },
  },

  // Truncate text
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  // Line clamp
  lineClamp: (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  }),
} as const

// Breakpoints (mobile-first)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Media Queries
export const media = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  mobile: `@media (max-width: ${breakpoints.md})`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
} as const

// Export all tokens
export const designTokens = {
  typography,
  spacing,
  colors,
  shadows,
  radius,
  transitions,
  zIndex,
  buttons,
  layout,
  animations,
  utils,
  breakpoints,
  media,
} as const

export type DesignTokens = typeof designTokens
