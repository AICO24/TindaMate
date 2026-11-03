/**
 * TindaMate Centralized Theme & Design System Foundation (Design 2.0)
 *
 * Single source of truth for all visual tokens across Welcome, Auth, Dashboard,
 * and business modules (Products, Inventory, Sales, Customers/Utang, Expenses, Reports):
 * - Colors (Design 2.0 Forest Green, Slate Canvas, Crisp White Surfaces, Warm Orange CTAs)
 * - Typography (Hierarchy presets, font sizes, weights, and line heights with tabular numerals)
 * - Spacing (Standardized 4pt/8pt spatial scale with 16pt screen padding)
 * - BorderRadius (Unified curvature hierarchy: 24px hero, 20px primary card, 16px card, 14px button/input, 9999px pill)
 * - Shadows (Subtle mobile-first elevation rules)
 * - IconSizes (Consistent sizing for navigation, buttons, cards, inputs, headers)
 */

import '@/global.css';

import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * TindaMate Color Palette (Design 2.0 Foundation)
 *
 * Retail-focused, friendly, and trustworthy:
 * - Recognizable TindaMate deep forest & emerald green primary identity
 * - Vibrant sari-sari store orange accent ("Mate") for transactional CTAs (POS checkout, floating action)
 * - Clean cool slate canvas (#F4F6F8) with crisp elevated white cards (#FFFFFF)
 * - High-contrast typography (#0F172A) and semantic status colors
 */
export const Colors = {
  // Primary Brand Colors (TindaMate Design 2.0 Forest & Emerald Green)
  primary: '#0D7A4D',         // Rich TindaMate Emerald (Buttons, active states, price text)
  primaryDark: '#064E3B',     // Deep Forest Green (Hero headers, brand titles, active nav)
  primaryMedium: '#047857',   // Supporting deep emerald (Hero card surfaces & wave accents)
  primaryDeep: '#065F46',     // Supporting deep emerald green
  primaryBrand: '#105B48',    // Emblem & display headline green
  primaryPressed: '#0A5C3A',  // Pressed/active primary button state
  primaryLight: '#DCFCE7',    // Soft green badge & icon container tint
  primarySoft: '#ECFDF5',     // Breathable mint card surface (Active pills, banners)
  primaryBorder: '#D1FAE5',   // Soft green border for pills and highlights

  // Secondary Color (Positive Growth / In-Stock Green)
  secondary: '#16A34A',

  // Accent Colors (Warm Market Orange / Transactional CTAs)
  accent: '#F97316',          // Primary Orange CTA (Checkout, Floating POS button, "Mate" wordmark)
  accentDark: '#EA580C',      // Pressed orange / High-contrast warning text
  accentMedium: '#F97316',    // Supporting vibrant orange accent
  accentWarm: '#F59E0B',      // Warm amber accent (Stars, awnings, secondary highlights)
  accentPressed: '#D97706',   // Pressed amber/orange state
  accentLight: '#FFEDD5',     // Soft orange surface & icon badge tint
  accentBorder: '#FFE4CB',    // Soft orange border

  // Background & Surface Colors (Design 2.0 Soft Mint-Sage Canvas & Crisp White Surfaces)
  background: '#F4F6F8',      // Primary clean slate background
  backgroundWarm: '#E4F2EA',  // Soft Mint-Sage Canvas matching Dashboard reference (High-contrast 3D card depth)
  backgroundAlt: '#F1F5F9',   // Subtle secondary slate surface
  surfaceSubtle: '#F8FAFC',   // Subtle container / image stage background
  surface: '#FFFFFF',         // Elevated crisp white card & input surface
  surfaceMuted: '#F8FAFC',    // Secondary container / input background
  card: '#FFFFFF',            // Alias for card container surface

  // Border & Divider Colors
  border: '#E2E8F0',          // Default card & input border (Slate 200)
  borderStrong: '#CBD5E1',    // Focused/active outline border (Slate 300)
  borderFocused: '#0D7A4D',   // Focused input border (Primary green)
  borderSubtle: '#F1F5F9',    // Subtle section/row divider
  divider: '#F1F5F9',         // Standard card row divider

  // Typography Colors
  textPrimary: '#0F172A',     // High-contrast primary body & dark titles (Slate 900)
  textBrand: '#064E3B',       // Brand-tinted section & hero headings
  textSecondary: '#475569',   // Supporting descriptions & labels (Slate 600)
  textMuted: '#94A3B8',       // Captions, helper text & inactive nav (Slate 400)
  textPlaceholder: '#94A3B8', // Input placeholder text (Slate 400)
  textInverse: '#FFFFFF',     // Text on primary/dark surfaces
  textOnPrimary: '#FFFFFF',   // White text on dark green / orange surfaces

  // Semantic Feedback & Status Colors
  success: '#16A34A',         // Positive status / strong password / connected
  successLight: '#DCFCE7',    // Soft success badge background
  successText: '#166534',     // Dark green text on success badge
  warning: '#D97706',         // Warning / low stock alert (Amber 600)
  warningLight: '#FEF3C7',    // Soft warning background
  warningText: '#92400E',     // Dark amber text on warning badge
  error: '#DC2626',           // Accessible error & destructive action red
  errorLight: '#FEF2F2',      // Soft error banner & input background
  errorBorder: '#FCA5A5',     // Error border
  danger: '#DC2626',          // Alias for error/danger states
  dangerLight: '#FEE2E2',     // Soft red surface tint
  info: '#2563EB',            // Informational state blue
  infoLight: '#DBEAFE',       // Soft info surface tint
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
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Standardized layout geometry
  screenPadding: 16,
  sectionGap: 16,
} as const;

/**
 * Border Radius Scale (Design 2.0 Hierarchy)
 * Unified corner radius language across inputs, buttons, cards, and modals.
 */
export const BorderRadius = {
  xs: 6,         // Small tags, micro indicators
  sm: 10,        // Inner icon boxes, compact badges
  md: 14,        // Form inputs, buttons, compact banners
  button: 14,    // Standard interactive button radius
  input: 14,     // Standard text input radius
  card: 16,      // Standard list cards (ProductCard, CustomerCard, SaleHistoryItemCard)
  lg: 16,        // Standard card alias
  primaryCard: 20, // Hero KPI card, major summaries, modals
  heroCard: 20,  // Alias for primary hero card
  xl: 24,        // Top hero header bottom curvature, bottom sheets
  heroHeader: 24, // Hero header curve alias
  xxl: 32,       // Floating action cradle & oversized elements
  pill: 9999,    // Search bars, filter chips, status badges
  full: 9999,    // Pill buttons, circular avatars
} as const;

/**
 * Typography Hierarchy & Presets
 * Consistent sizes, weights, line heights, and semantic presets.
 */
export const Typography = {
  sizes: {
    caption: 12,        // Helper hints, inline metadata, status badges
    xs: 12,             // Smallest accessible body/meta size
    sm: 13,             // Secondary card labels, compact links
    bodySm: 14,         // Supporting text, form prompts, card titles
    body: 14,           // Standard body text, input text
    base: 16,           // Primary button text, prominent labels
    md: 17,             // Medium-prominent card headings
    sectionHeading: 17, // Dashboard section headers ("Store Overview", "Quick Actions")
    lg: 20,             // Modal titles, sub-headers
    xl: 22,             // Screen titles
    displaySm: 24,      // Secondary KPI amounts
    xxl: 28,            // Large modal totals & prominent KPI values
    display: 34,        // Hero KPI value ("Today's Sales")
    hero: 38,           // Welcome display title
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
    heading: 28,
    display: 40,
  },

  // Semantic Typography Presets (Design 2.0 Foundation)
  presets: {
    heroValue: {
      fontSize: 34,
      fontWeight: '800' as const,
      letterSpacing: -0.8,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
      color: Colors.textInverse,
    } as TextStyle,
    kpiValue: {
      fontSize: 24,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
      color: Colors.textPrimary,
    } as TextStyle,
    screenTitle: {
      fontSize: 22,
      fontWeight: '800' as const,
      letterSpacing: -0.4,
      color: Colors.textInverse,
    } as TextStyle,
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800' as const,
      letterSpacing: -0.3,
      color: Colors.textPrimary,
    } as TextStyle,
    cardTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: Colors.textPrimary,
    } as TextStyle,
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: Colors.textPrimary,
      lineHeight: 20,
    } as TextStyle,
    bodyMedium: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: Colors.textPrimary,
      lineHeight: 20,
    } as TextStyle,
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: Colors.textMuted,
      lineHeight: 16,
    } as TextStyle,
    badge: {
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    } as TextStyle,
  },

  // Direct helper aliases
  heroValue: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  } as TextStyle,
  kpiValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  } as TextStyle,
  screenTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
  } as TextStyle,
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  } as TextStyle,
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  } as TextStyle,
  bodyMedium: {
    fontSize: 14,
    fontWeight: '600' as const,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
  } as TextStyle,
  badge: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  } as TextStyle,
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
export const Shadows: Record<
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'card'
  | 'primaryButton'
  | 'accentButton'
  | 'bottomNav'
  | 'floatingCenter',
  ViewStyle
> = {
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
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
