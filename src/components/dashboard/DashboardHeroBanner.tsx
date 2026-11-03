import React from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardMarketIllustration } from './DashboardMarketIllustration';
import {
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
  if (trimmed.includes(',')) {
    const afterComma = trimmed.split(',')[1]?.trim();
    if (afterComma) {
      const firstWord = afterComma.split(' ')[0]?.trim();
      if (firstWord) return firstWord;
    }
  }
  const firstWord = trimmed.split(' ')[0]?.trim();
  return firstWord || trimmed;
}

/**
 * DashboardHeroBanner (Exact Showcase Reference Alignment)
 *
 * Visually matches Screen 1 of TindaMate POS App Showcase.png:
 * - Open canvas greeting zone sitting cleanly below the green header wave
 * - Friendly dynamic greeting ("Good afternoon,")
 * - Smart First Name display ("Manolo! 👋") in bold dark slate
 * - "Here's your store today" subtitle
 * - 3D sari-sari storefront artwork on the right overlapping the wave boundary
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
  const artworkSize = isNarrowPhone ? 98 : 110;

  return (
    <View style={styles.greetingZone}>
      <View style={styles.contentRow}>
        {/* Left Column: Open Greeting Hierarchy directly on Canvas */}
        <View style={styles.leftColumn}>
          {/* 1. Time-of-day greeting */}
          <Text style={styles.greetingTitle} maxFontSizeMultiplier={1.2}>
            {getGreeting()}
          </Text>

          {/* 2. Friendly First Name + Waving Hand Emoji */}
          <Text
            style={styles.displayNameText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.2}>
            {firstName}! 👋
          </Text>

          {/* 3. Subtitle */}
          <Text
            style={styles.greetingSubtext}
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}>
            Here&apos;s your store today
          </Text>
        </View>

        {/* Right Column: Pure React Native Marketplace Illustration (Strategy 1) */}
        <View style={styles.artworkWrapper}>
          <DashboardMarketIllustration
            width={isNarrowPhone ? 134 : 152}
            height={isNarrowPhone ? 120 : 136}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingZone: {
    width: '100%',
    paddingTop: Spacing.half,
    paddingBottom: Spacing.xs,
    position: 'relative',
    overflow: 'visible',
    zIndex: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    gap: 1,
    paddingRight: Spacing.two,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 14,
    fontWeight: Typography.weights.semiBold,
    color: '#334155',
    letterSpacing: -0.1,
  },
  displayNameText: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  greetingSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: Typography.weights.medium,
    lineHeight: 17,
    marginTop: 1,
  },
  artworkWrapper: {
    marginTop: -20,
    marginRight: -2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
