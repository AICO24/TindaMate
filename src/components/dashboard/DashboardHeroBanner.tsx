import React, { useState } from 'react';
import {
  Pressable,
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
  displayName?: string;
  storeName?: string;
  onStorePress?: () => void;
}

/**
 * Smart first-name extractor kept exported for compatibility across screens.
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
 * DashboardHeroBanner (Option A — "Ka-Tindahan!" + Live Store Status Pill)
 *
 * Clean, purposeful Pinoy-fintech store greeting without AI-style waving hand emoji
 * or raw database user name:
 * - Line 1: Time-of-day greeting ("Good morning," / "Good afternoon," / "Good evening,")
 * - Line 2: Bold Deep Forest Green "Ka-Tindahan!" headline
 * - Line 3: Interactive Live Store Status pill ("● Store Open • Today's summary")
 * - Right: Front-facing 3D Sari-Sari Store House illustration
 */
export function DashboardHeroBanner({
  onStorePress,
}: DashboardHeroBannerProps) {
  const [isPillHovered, setIsPillHovered] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;

  return (
    <View style={styles.greetingZone}>
      <View style={styles.contentRow}>
        {/* Left Column: Branded Store Greeting Hierarchy */}
        <View style={styles.leftColumn}>
          {/* 1. Time-of-day greeting */}
          <Text style={styles.greetingTitle} maxFontSizeMultiplier={1.2}>
            {getGreeting()}
          </Text>

          {/* 2. Branded Store Headline (No emoji, no raw user name) */}
          <Text
            style={styles.headlineText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.2}>
            Ka-Tindahan!
          </Text>

          {/* 3. Live Store Status Pill Badge */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Store Open, viewing today's summary. Tap to open store account settings."
            onPress={onStorePress}
            onHoverIn={() => setIsPillHovered(true)}
            onHoverOut={() => setIsPillHovered(false)}
            style={({ pressed }) => [
              styles.statusPill,
              isPillHovered && styles.statusPillHovered,
              pressed && styles.statusPillPressed,
            ]}>
            <View style={styles.liveDotOuter}>
              <View style={styles.liveDotInner} />
            </View>
            <Text
              style={styles.greetingSubtext}
              numberOfLines={1}
              maxFontSizeMultiplier={1.15}>
              Store Open • Today&apos;s summary
            </Text>
          </Pressable>
        </View>

        {/* Right Column: Front-Facing Sari-Sari Store House Illustration */}
        <View style={styles.artworkWrapper}>
          <DashboardMarketIllustration
            width={isNarrowPhone ? 144 : 162}
            height={isNarrowPhone ? 124 : 138}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingZone: {
    width: '100%',
    paddingTop: 2,
    paddingBottom: 2,
    position: 'relative',
    overflow: 'visible',
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.two,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  greetingTitle: {
    fontSize: 14.5,
    fontWeight: Typography.weights.semiBold,
    color: '#1E3A2F',
    letterSpacing: -0.1,
  },
  headlineText: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: Typography.weights.extraBold,
    color: '#083D27',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderColor: '#C5E6D3',
  },
  statusPillHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#000000',
  },
  statusPillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  liveDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(22, 163, 74, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  greetingSubtext: {
    fontSize: 12,
    color: '#0F5132',
    fontWeight: Typography.weights.bold,
    lineHeight: 16,
  },
  artworkWrapper: {
    marginTop: -20,
    marginRight: -4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
});
