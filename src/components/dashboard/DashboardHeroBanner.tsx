import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { StorePillIcon } from './DashboardNavIcons';
import { DashboardMarketIllustration } from '@/components/dashboard/DashboardMarketIllustration';
import {
  BorderRadius,
  Colors,
  IconSizes,
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
 * DashboardHeroBanner (Design 2.0 Showcase Alignment)
 *
 * Visually matches Screen 1 of TindaMate POS App Showcase.png:
 * - Elevated white card container with rounded corners and subtle shadow
 * - Dynamic greeting ("Good morning," / "Good afternoon," / "Good evening,")
 * - Dynamic user name ("Manolo! 👋") in dark slate typography
 * - Friendly store overview supporting text ("Here's your store today")
 * - Compact store context pill [ 🏪 TindaMate Store › ]
 * - Authentic 3D sari-sari storefront illustration
 */
export function DashboardHeroBanner({
  displayName,
  storeName = 'TindaMate Store',
  onStorePress,
}: DashboardHeroBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const isSmallPhone = windowWidth < 380;
  const isLargePhone = windowWidth >= 414;

  const illustrationWidth = isNarrowPhone ? 116 : isSmallPhone ? 128 : isLargePhone ? 152 : 140;
  const illustrationHeight = isNarrowPhone ? 104 : isSmallPhone ? 116 : isLargePhone ? 138 : 126;

  const nameFontSize =
    displayName.length > 22
      ? isSmallPhone ? 17 : 19
      : displayName.length > 14
      ? isSmallPhone ? 19 : 21
      : isSmallPhone ? 21 : 23;

  const nameLineHeight = nameFontSize + 4;

  return (
    <View style={[styles.card, isNarrowPhone && styles.cardNarrow]}>
      <View style={styles.contentRow}>
        {/* Left Side: Text Hierarchy & Store Badge (55-65% width) */}
        <View style={styles.leftColumn}>
          {/* 1. Greeting */}
          <Text style={styles.greetingTitle} maxFontSizeMultiplier={1.3}>
            {getGreeting()}
          </Text>

          {/* 2. User Name */}
          <Text
            style={[
              styles.displayNameText,
              { fontSize: nameFontSize, lineHeight: nameLineHeight },
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {displayName}! 👋
          </Text>

          {/* 3. Supporting text */}
          <Text
            style={styles.greetingSubtext}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            Here&apos;s your store today
          </Text>

          {/* 4. Store Context Pill: [ StoreIcon TindaMate Store › ] */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Active store: ${storeName}`}
            accessibilityHint="Opens store account and profile settings"
            onPress={onStorePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.storePill,
              pressed && styles.storePillPressed,
            ]}>
            <View
              style={styles.storeIconCircle}
              accessible={false}
              importantForAccessibility="no-hide-descendants">
              <StorePillIcon size={IconSizes.xs} color={Colors.textInverse} />
            </View>
            <Text
              style={[
                styles.storePillText,
                { maxWidth: isNarrowPhone ? 100 : 130 },
              ]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}>
              {storeName}
            </Text>
            <Text style={styles.storePillChevron} importantForAccessibility="no">
              ›
            </Text>
          </Pressable>
        </View>

        {/* Right Side: Dedicated Marketplace Illustration */}
        <View style={styles.illustrationWrapper}>
          <DashboardMarketIllustration
            width={illustrationWidth}
            height={illustrationHeight}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.threeHalf,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  cardNarrow: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.twoHalf,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1.25,
    gap: 2,
    paddingRight: Spacing.two,
    zIndex: 2,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: '#64748B',
  },
  displayNameText: {
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 1,
  },
  greetingSubtext: {
    fontSize: Typography.sizes.caption,
    color: '#94A3B8',
    fontWeight: Typography.weights.medium,
    lineHeight: 16,
    marginBottom: Spacing.two,
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingLeft: Spacing.two,
    paddingRight: Spacing.twoHalf,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  storePillPressed: {
    backgroundColor: '#F1F5F9',
    transform: [{ scale: 0.98 }],
  },
  storeIconCircle: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
  },
  storePillChevron: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: '#64748B',
    marginTop: -1,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Spacing.xxs,
  },
});
