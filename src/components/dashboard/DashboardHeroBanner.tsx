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
 * DashboardHeroBanner
 *
 * Visually polished mobile Hero section using the TindaMate Design System:
 * - Dynamic greeting ("Good morning," / "Good afternoon," / "Good evening,")
 * - Dynamic user name with responsive scaling for long names
 * - Friendly store overview supporting text
 * - Interactive store pill with vector storefront badge: [ 🏪 TindaMate Store › ]
 * - Dedicated pure React Native marketplace illustration
 */
export function DashboardHeroBanner({
  displayName,
  storeName = 'TindaMate Store',
  onStorePress,
}: DashboardHeroBannerProps) {
  // Determine time-of-day greeting
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

  // Responsive illustration size occupying right 35-45% of banner
  const illustrationWidth = isNarrowPhone ? 124 : isSmallPhone ? 138 : isLargePhone ? 166 : 152;
  const illustrationHeight = isNarrowPhone ? 114 : isSmallPhone ? 126 : isLargePhone ? 150 : 138;

  // Responsive typography for long names
  const nameFontSize =
    displayName.length > 22
      ? isSmallPhone ? 18 : 20
      : displayName.length > 14
      ? isSmallPhone ? 20 : 22
      : isSmallPhone ? 22 : Typography.sizes.displaySm;

  const nameLineHeight = nameFontSize >= 24 ? Typography.lineHeights.heading : nameFontSize + 4;

  return (
    <View style={[styles.container, isNarrowPhone && styles.containerNarrow]}>
      <View style={styles.contentRow}>
        {/* Left Side: Text Hierarchy & Store Badge (55-65% width) */}
        <View style={styles.leftColumn}>
          {/* 1. Greeting - semibold */}
          <Text style={styles.greetingTitle} maxFontSizeMultiplier={1.3}>
            {getGreeting()}
          </Text>

          {/* 2. User Name - large / bold / responsive */}
          <Text
            style={[
              styles.displayNameText,
              { fontSize: nameFontSize, lineHeight: nameLineHeight },
            ]}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}>
            {displayName}!
          </Text>

          {/* 3. Supporting sentence */}
          <Text
            style={styles.greetingSubtext}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}>
            Here&apos;s what&apos;s happening with your store today.
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
                { maxWidth: isNarrowPhone ? 105 : 140 },
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

        {/* Right Side: Dedicated Marketplace Illustration (35-45% width) */}
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
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    minHeight: 132,
    justifyContent: 'center',
    ...Shadows.sm,
  },
  containerNarrow: {
    minHeight: 122,
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
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  displayNameText: {
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 1,
  },
  greetingSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.tight,
    marginBottom: Spacing.two,
  },
  // Store pill button
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoft,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    gap: 6,
  },
  storePillPressed: {
    backgroundColor: Colors.primaryLight,
    transform: [{ scale: 0.98 }],
  },
  storeIconCircle: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePillText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  storePillChevron: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primary,
    marginTop: -1,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Spacing.xxs,
  },
});

