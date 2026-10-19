/**
 * TindaMate Centralized Theme Foundation
 *
 * Provides a single source of truth for design tokens:
 * - Colors (Brand palette, surfaces, typography, interactive states)
 * - Spacing (Standard 4pt/8pt grid)
 * - BorderRadius (Curvature presets)
 * - Typography (Font sizes, weights, and line heights)
 * - Layout (Insets, max widths)
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * TindaMate Color Palette
 *
 * Tailored for Filipino sari-sari store owners:
 * - Friendly, dependable primary blue (#2563EB)
 * - Clean, readable backgrounds and card surfaces
 * - High-contrast text for outdoor / high-glare readability
 */
export const Colors = {
  // Brand & Interactive Colors
  primary: '#2563EB',         // Main action blue
  primaryPressed: '#1D4ED8',  // Active/pressed blue
  primaryLight: '#DBEAFE',    // Soft accent blue (badges, highlights)

  // Surface & Layout Colors
  background: '#F8FAFC',      // Screen background (Slate 50)
  card: '#FFFFFF',            // Card container surface (White)
  border: '#E2E8F0',          // Card border (Slate 200)
  borderSubtle: '#F1F5F9',    // Divider line (Slate 100)

  // Typography Colors
  textPrimary: '#0F172A',     // Headings & high-contrast titles (Slate 900)
  textSecondary: '#475569',   // Body description text (Slate 600)
  textMuted: '#94A3B8',       // Captions & hint text (Slate 400)
  textInverse: '#FFFFFF',     // Button label & text on dark backgrounds

  // State Colors
  disabled: '#CBD5E1',        // Disabled button surface (Slate 300)
  disabledText: '#94A3B8',    // Disabled button label (Slate 400)

  // Template Theme Colors (preserved for backward compatibility with template components)
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Standard Spacing Grid
 * Based on 4pt / 8pt increments for consistent padding, margins, and gaps.
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,

  // Semantic aliases for intuitive mobile styling
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
} as const;

/**
 * Border Radii
 * Standard curve values for rounded elements.
 */
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/**
 * Typography Scale & Presets
 * Consistent font sizes, weights, and line heights across screens.
 */
export const Typography = {
  sizes: {
    xs: 12,     // Small hints & captions
    sm: 13,     // Badges & pill tags
    bodySm: 14, // Feature list items
    body: 15,   // Descriptions & paragraphs
    base: 16,   // Button text & taglines
    lg: 20,     // Card headers
    xl: 24,     // Section titles
    hero: 38,   // Main screen title (TindaMate)
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    normal: 20,
    relaxed: 22,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
