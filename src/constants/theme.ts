/**
 * TindaMate Centralized Theme & Design System Foundation
 *
 * Single source of truth for all visual tokens across Welcome, Auth, Dashboard,
 * and future business modules (Products, Inventory, Sales, Utang, Expenses, Reports):
 * - Colors (Brand palette, warm surfaces, typography, semantic states, pastel accents)
 * - Typography (Hierarchy presets, font sizes, weights, and line heights)
 * - Spacing (Consistent 4pt/8pt spatial scale)
 * - BorderRadius (Unified curvature language)
 * - Shadows (Subtle mobile-first elevation rules)
 * - IconSizes (Consistent sizing for navigation, buttons, cards, inputs, headers)
 */

import '@/global.css';

import { Platform, ViewStyle } from 'react-native';

/**
 * TindaMate Color Palette
 *
 * Tailored for local/sari-sari store vendors:
 * - Recognizable TindaMate deep forest & emerald green primary identity
 * - Warm market orange accent ("Mate") used strategically for highlights & secondary emphasis
 * - Soft pastel supporting tones for store metrics, categories, and quick actions
 * - Warm, bright, breathable backgrounds and high-contrast typography
 */
export const Colors = {
  // Primary Brand Colors (TindaMate Green / Teal)
  primary: '#0D7A4D',         // Primary interactive green (Buttons, active states, links)
  primaryDark: '#064E3B',     // Deep forest green (Brand wordmark, hero headings, active nav)
  primaryDeep: '#065F46',     // Supporting deep emerald green
  primaryBrand: '#105B48',    // Emblem & display headline green
  primaryPressed: '#0A5C3A',  // Pressed/active primary button state
  primaryLight: '#E8F5E9',    // Soft green tint (Badges, subtle highlights, pressed outline)
  primarySoft: '#EDF7F2',     // Breathable mint card surface (Empty states, banners)
  primaryBorder: '#D1FAE5',   // Soft green border for pills and highlights

  // Accent Colors (Warm Market Orange)
  accent: '#EA580C',          // "Mate" brand orange & key highlights
  accentMedium: '#F97316',    // Supporting vibrant orange accent
  accentWarm: '#F59E0B',      // Warm amber accent (Stars, awnings, secondary highlights)
  accentPressed: '#D97706',   // Pressed amber/orange state
  accentLight: '#FFF4E8',     // Soft orange surface tint
  accentBorder: '#FFE4CB',    // Soft orange border

  // Background & Surface Colors
  background: '#F8FAF7',      // Primary clean soft sage-tinted background (Design 2.0)
  backgroundWarm: '#FCFAF2',  // Warm cream/mint-tinted hero & header backdrop
  backgroundAlt: '#F1F5F2',   // Subtle secondary sage-slate surface
  surfaceSubtle: '#F3F6F4',   // Subtle container / image stage background
  surface: '#FFFFFF',         // Elevated card & input surface
  card: '#FFFFFF',            // Alias for card container surface

  // Border & Divider Colors
  border: '#E2E8F0',          // Default card & input border (Slate 200)
  borderFocused: '#0D7A4D',   // Focused input border (Primary green)
  borderSubtle: '#EDF2EE',    // Subtle section/row divider

  // Typography Colors
  textPrimary: '#0F172A',     // High-contrast primary body & dark titles (Slate 900)
  textBrand: '#064E3B',       // Brand-tinted section & hero headings
  textSecondary: '#475569',   // Supporting descriptions & labels (Slate 600)
  textMuted: '#64748B',       // Captions, helper text & inactive nav (Slate 500)
  textPlaceholder: '#94A3B8', // Input placeholder text (Slate 400)
  textInverse: '#FFFFFF',     // Text on primary/dark surfaces

  // Semantic Feedback & Status Colors
  success: '#16A34A',         // Positive status / strong password / connected
  successLight: '#DCFCE7',    // Soft success badge background
  successText: '#166534',     // Dark green text on success badge
  warning: '#F59E0B',         // Warning / medium strength / low stock alert
  warningLight: '#FEF3C7',    // Soft warning background
  warningText: '#92400E',     // Dark amber text on warning badge
  error: '#DC2626',           // Accessible error & destructive action red
  errorLight: '#FEF2F2',      // Soft error banner & input background
  errorBorder: '#FCA5A5',     // Error border
  disabled: '#CBD5E1',        // Disabled interactive surface
  disabledText: '#94A3B8',    // Disabled text label

  // Supporting Pastel Palettes (Store Overview Cards, Quick Actions, Future Modules)
  pastel: {
    green: {
      bg: '#EAF7F0',
      border: '#D1EFE0',
      iconBg: '#10B981',
      text: '#064E3B',
      accent: '#059669',
    },
    orange: {
      bg: '#FFF4E8',
      border: '#FFE4CB',
      iconBg: '#F97316',
      text: '#7C2D12',
      accent: '#EA580C',
    },
    blue: {
      bg: '#EAF4FE',
      border: '#D0E6FC',
      iconBg: '#3B82F6',
      text: '#1E3A8A',
      accent: '#2563EB',
    },
    purple: {
      bg: '#F5EDFE',
      border: '#E8D5FD',
      iconBg: '#8B5CF6',
      text: '#581C87',
      accent: '#7C3AED',
    },
    neutral: {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      iconBg: '#64748B',
      text: '#334155',
      accent: '#64748B',
    },
  },

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

export type PastelThemeKey = keyof typeof Colors.pastel;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Standard Spacing Scale (4pt / 8pt Grid)
 * Use these tokens consistently across screens instead of arbitrary pixel values.
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  twoHalf: 12,
  three: 16,
  threeHalf: 20,
  four: 24,
  five: 32,
  six: 64,

  // Semantic aliases for intuitive mobile styling
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
} as const;

/**
 * Border Radius Scale
 * Unified corner radius language across inputs, buttons, cards, and modals.
 */
export const BorderRadius = {
  xs: 6,      // Checkboxes, small tags
  sm: 10,     // Inner icon boxes, compact badges
  md: 14,     // Form inputs, banners, standard cards
  lg: 18,     // Dashboard overview cards, quick action tiles
  xl: 24,     // Modals, large empty-state containers
  xxl: 32,    // Hero zone bottom curvature
  full: 999,  // Pill buttons, circular avatars, filter chips
} as const;

/**
 * Typography Hierarchy & Presets
 * Consistent sizes, weights, and line heights across all TindaMate screens.
 */
export const Typography = {
  sizes: {
    caption: 11,        // Input labels, bottom nav labels, status badges
    xs: 12,             // Helper hints, inline errors, filter pills
    sm: 13,             // Secondary card labels, compact links
    bodySm: 14,         // Supporting text, form prompts, card titles
    body: 15,           // Standard body text, input text
    base: 16,           // Primary button text, prominent labels
    md: 17,             // Medium-prominent card headings
    sectionHeading: 19, // Dashboard section headers ("Store Overview", "Quick Actions")
    lg: 20,             // Modal titles, sub-headers
    xl: 24,             // Auth screen titles ("Welcome Back!", "Create Your Account")
    displaySm: 26,      // Hero user greeting name
    xxl: 28,            // Prominent KPI and cart total display
    display: 32,        // Welcome hero headline ("Shop Local, Support Small")
    hero: 38,           // Extra-large display title
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeights: {
    tight: 18,
    normal: 20,
    relaxed: 22,
    heading: 30,
    display: 38,
  },
} as const;

/**
 * Icon Sizing Scale
 * Standardized dimensions for icons across navigation, inputs, buttons, and cards.
 */
export const IconSizes = {
  xs: 14,     // Inline status/error icons, chevrons
  sm: 18,     // Input field left icons, small action icons
  md: 20,     // Password visibility toggle, Google icon, avatar icon
  nav: 22,    // Bottom navigation bar icons & header back chevron
  lg: 24,     // Dashboard overview & quick action vector icons
  xl: 28,     // Empty state / feature highlight icons
} as const;

/**
 * Elevation & Shadow Presets
 * Subtle, cohesive shadows for mobile cards, buttons, and bars.
 */
export const Shadows: Record<'none' | 'xs' | 'sm' | 'md' | 'primaryButton' | 'accentButton' | 'bottomNav' | 'floatingCenter', ViewStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sm: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButton: {
    shadowColor: '#0D7A4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  accentButton: {
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomNav: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 12,
  },
  floatingCenter: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
};

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
export const AuthMaxContentWidth = 440;
export const DashboardMaxContentWidth = 520;

