// VexoSocial Design System - Purple Accent Palette
export const colors = {
  // Base colors
  background: {
    primary: '#0D0D0D',    // Dark background
    secondary: '#1A1A1A',  // Slightly lighter dark
    tertiary: '#2A2A2A',   // Card backgrounds
  },
  
  // Purple accent palette
  purple: {
    primary: '#A259FF',    // Main accent - buttons, highlights
    secondary: '#6C2BD9',  // Badges, borders
    tertiary: '#D6B4FF',   // Subtle accents, text
    dark: '#4A1A8A',      // Darker purple for contrast
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',     // Main text
    secondary: '#B3B3B3',  // Secondary text
    tertiary: '#808080',   // Muted text
    accent: '#A259FF',     // Accent text
  },
  
  // Status colors
  status: {
    live: '#FF4444',       // Live indicator
    success: '#00D4AA',    // Success states
    warning: '#FFB800',    // Warning states
    error: '#FF6B6B',      // Error states
  },
  
  // Overlay colors
  overlay: {
    dark: 'rgba(0, 0, 0, 0.7)',
    medium: 'rgba(0, 0, 0, 0.5)',
    light: 'rgba(0, 0, 0, 0.3)',
    purple: 'rgba(162, 89, 255, 0.1)',
  }
};

export const typography = {
  // Font sizes
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  // Font weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',  // Fully rounded
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  purple: '0 4px 14px 0 rgba(162, 89, 255, 0.3)',
};

// Component styles
export const components = {
  button: {
    primary: {
      backgroundColor: colors.purple.primary,
      color: colors.text.primary,
      borderRadius: borderRadius.lg,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.weights.semibold,
      boxShadow: shadows.purple,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.purple.primary,
      border: `2px solid ${colors.purple.primary}`,
      borderRadius: borderRadius.lg,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.weights.semibold,
    },
    ghost: {
      backgroundColor: colors.overlay.light,
      color: colors.text.primary,
      borderRadius: borderRadius.lg,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.weights.medium,
    }
  },
  
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    boxShadow: shadows.md,
    border: `1px solid ${colors.background.tertiary}`,
  },
  
  input: {
    backgroundColor: colors.background.secondary,
    border: `1px solid ${colors.purple.secondary}`,
    borderRadius: borderRadius.lg,
    padding: `${spacing.md} ${spacing.lg}`,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  }
};

// Mobile-first responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

// Animation durations
export const animations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
};
