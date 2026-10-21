import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardBadgeVectorIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface OverviewItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  iconSymbol?: string;
  theme: 'green' | 'blue' | 'amber' | 'purple' | 'neutral';
  onPress?: () => void;
}

interface StoreOverviewCardProps {
  item: OverviewItem;
  isLoading?: boolean;
}

const OVERVIEW_THEME_MAP = {
  green: Colors.pastel.green,
  blue: Colors.pastel.blue,
  amber: Colors.pastel.orange,
  purple: Colors.pastel.purple,
  neutral: Colors.pastel.neutral,
} as const;

const VECTOR_IDS = new Set(['sales', 'products', 'low_stock', 'utang']);

/**
 * StoreOverviewCard
 *
 * Visually substantial KPI summary card using the TindaMate Design System:
 * - Clear 3-tier hierarchy: KPI Label -> Primary KPI Value -> Supporting helper text
 * - Soft pastel or calm neutral background & border from centralized Colors.pastel tokens
 * - Responsive circular badge with crisp white vector icon
 * - Supports inline skeleton loading state (isLoading) with zero layout shift
 */
export function StoreOverviewCard({ item, isLoading = false }: StoreOverviewCardProps) {
  const currentTheme = OVERVIEW_THEME_MAP[item.theme];
  const hasVectorIcon = VECTOR_IDS.has(item.id);
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const isCompactPhone = windowWidth < 380;

  const iconCircleSize = isNarrowPhone ? 34 : isCompactPhone ? 36 : 40;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isLoading
          ? `${item.title}, loading data`
          : `${item.title}: ${item.value}. ${item.subtitle}`
      }
      accessibilityHint={`Views detailed ${item.title} summary`}
      onPress={isLoading ? undefined : item.onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        isNarrowPhone && styles.cardNarrow,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && !isLoading && styles.cardPressed,
      ]}>
      {/* Left: Prominent Round Themed Icon */}
      <View
        style={[
          styles.iconCircle,
          {
            width: iconCircleSize,
            height: iconCircleSize,
            borderRadius: iconCircleSize / 2,
            backgroundColor: currentTheme.iconBg,
          },
        ]}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        {hasVectorIcon ? (
          <DashboardBadgeVectorIcon
            type={item.id as 'sales' | 'products' | 'low_stock' | 'utang'}
            color={Colors.textInverse}
          />
        ) : (
          <Text style={[styles.iconSymbol, { color: Colors.textInverse }]}>
            {item.iconSymbol}
          </Text>
        )}
      </View>

      {/* Middle: KPI Label -> Primary Value -> Helper Text */}
      <View style={styles.textColumn}>
        <Text
          style={[styles.title, { color: currentTheme.text }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.25}>
          {item.title}
        </Text>
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <View
              style={[
                styles.skeletonPillValue,
                { backgroundColor: currentTheme.border },
              ]}
            />
            <View
              style={[
                styles.skeletonPillSubtitle,
                { backgroundColor: currentTheme.border },
              ]}
            />
          </View>
        ) : (
          <>
            <Text
              style={[
                styles.value,
                isCompactPhone && styles.valueCompact,
                isNarrowPhone && styles.valueNarrow,
                { color: currentTheme.text },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              maxFontSizeMultiplier={1.25}>
              {item.value}
            </Text>
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              maxFontSizeMultiplier={1.25}>
              {item.subtitle}
            </Text>
          </>
        )}
      </View>

      {/* Right: Chevron */}
      <Text
        style={[styles.chevron, { color: currentTheme.accent }]}
        importantForAccessibility="no">
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.twoHalf,
    borderWidth: 1,
    minHeight: 84,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  cardCompact: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 80,
    gap: 6,
  },
  cardNarrow: {
    paddingHorizontal: 6,
    paddingVertical: 7,
    minHeight: 76,
    gap: 5,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: Typography.sizes.sectionHeading,
    fontWeight: Typography.weights.extraBold,
  },
  textColumn: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.1,
  },
  value: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.3,
    lineHeight: Typography.lineHeights.normal,
  },
  valueCompact: {
    fontSize: Typography.sizes.bodySm,
  },
  valueNarrow: {
    fontSize: Typography.sizes.sm,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  chevron: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    paddingLeft: Spacing.xxs,
  },
  skeletonContainer: {
    gap: 4,
    marginTop: 3,
    marginBottom: 2,
  },
  skeletonPillValue: {
    width: '65%',
    height: 14,
    borderRadius: BorderRadius.xs,
    opacity: 0.65,
  },
  skeletonPillSubtitle: {
    width: '85%',
    height: 10,
    borderRadius: BorderRadius.xs,
    opacity: 0.45,
  },
});


