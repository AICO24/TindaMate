import React from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardStoreArtwork } from './DashboardStoreArtwork';
import {
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

interface DashboardHeroBannerProps {
  displayName: string;
  storeName?: string;
  onStorePress?: () => void;
}

/**
 * Smart first-name extractor:
 * Converts formal database names like "Gochaico, Manolo Jr. A." or "Juan Dela Cruz"
 * into friendly store-owner greetings like "Manolo" or "Juan".
 */
export function getFriendlyFirstName(rawName?: string | null): string {
  if (!rawName) return 'Partner';
  const trimmed = rawName.trim();
  // If formatted as "Lastname, Firstname ..." (common in PH legal/profile formats)
  if (trimmed.includes(',')) {
    const afterComma = trimmed.split(',')[1]?.trim();
    if (afterComma) {
      const firstWord = afterComma.split(' ')[0]?.trim();
      if (firstWord) return firstWord;
    }
  }
  // Otherwise take the first word
  const firstWord = trimmed.split(' ')[0]?.trim();
  return firstWord || trimmed;
}

/**
 * DashboardHeroBanner (Exact Showcase Match)
 *
 * Visually matches media_1793685516173_46f6ff18.png and Screen 1 of Showcase:
 * - Organic curved wave transition from deep green hero into white greeting card
 * - Friendly dynamic greeting ("Good afternoon,")
 * - Smart First Name display ("Manolo! 👋") with zero truncation or payroll formatting
 * - "Here's your store today" subtitle
 * - Authentic 3D-styled Filipino tindahan store artwork with striped awning, amber halo, and foliage
 * - Pure React Native code (zero cropped screenshots, 100% responsive)
 */
export function DashboardHeroBanner({
  displayName,
}: DashboardHeroBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;

  const firstName = getFriendlyFirstName(displayName);
  const artworkSize = isNarrowPhone ? 110 : 124;

  return (
    <View style={styles.cardContainer}>
      {/* Wave Layer 1: Subtle deep emerald accent curve peeking from top-left */}
      <View style={styles.waveAccentBack} pointerEvents="none" />

      {/* Wave Layer 2: Main organic curved white card surface */}
      <View style={[styles.card, isNarrowPhone && styles.cardNarrow]}>
        <View style={styles.contentRow}>
          {/* Left Column: Greeting Hierarchy */}
          <View style={styles.leftColumn}>
            {/* 1. Time-of-day greeting */}
            <Text style={styles.greetingTitle} maxFontSizeMultiplier={1.25}>
              {getGreeting()}
            </Text>

            {/* 2. Friendly First Name + Waving Hand Emoji */}
            <Text
              style={styles.displayNameText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.25}>
              {firstName}! 👋
            </Text>

            {/* 3. Subtitle */}
            <Text
              style={styles.greetingSubtext}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              Here&apos;s your store today
            </Text>
          </View>

          {/* Right Column: Authentic 3D Tindahan Artwork */}
          <View style={styles.artworkWrapper}>
            <DashboardStoreArtwork size={artworkSize} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    position: 'relative',
    marginTop: Spacing.one,
  },
  // Organic green wave scoop peeking out on top-left matching reference
  waveAccentBack: {
    position: 'absolute',
    top: -10,
    left: 8,
    width: '60%',
    height: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 60,
    backgroundColor: '#0D7A4D',
    opacity: 0.38,
    transform: [{ rotate: '-2deg' }],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'visible',
    ...Shadows.sm,
  },
  cardNarrow: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1.25,
    gap: 3,
    paddingRight: Spacing.two,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 14,
    fontWeight: Typography.weights.semiBold,
    color: '#475569',
    letterSpacing: -0.1,
  },
  displayNameText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.5,
    marginVertical: 1,
  },
  greetingSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
  },
  artworkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
