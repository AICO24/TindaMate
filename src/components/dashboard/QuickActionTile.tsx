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
  PastelThemeKey,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface QuickActionItem {
  id: string;
  labelLine1: string;
  labelLine2: string;
  icon?: string;
  theme: PastelThemeKey;
  /** Whether this tile represents the primary high-frequency store action */
  isPrimary?: boolean;
  onPress: () => void;
}

interface QuickActionTileProps {
  item: QuickActionItem;
}

const ACTION_VECTOR_IDS = new Set([
  'add_product',
  'record_sale',
  'add_expense',
  'record_utang',
]);

/**
 * QuickActionTile
 *
 * Visually strong action tile using the TindaMate Design System:
 * - Supports primary visual priority (`isPrimary`) for the #1 daily action (Record Sale)
 * - Centralized Colors.pastel tokens (green, orange, blue, purple)
 * - Responsive circular icon container with crisp white vector icon
 * - Bold two-line centered title and bottom arrow (→) indicator
 */
export function QuickActionTile({ item }: QuickActionTileProps) {
  const currentTheme = Colors.pastel[item.theme];
  const hasVectorIcon = ACTION_VECTOR_IDS.has(item.id);
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const isCompactPhone = windowWidth < 380;

  const iconCircleSize = isNarrowPhone
    ? item.isPrimary ? 38 : 36
    : isCompactPhone
    ? item.isPrimary ? 42 : 40
    : item.isPrimary ? 46 : 42;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        item.isPrimary
          ? `${item.labelLine1} ${item.labelLine2}, primary action`
          : `${item.labelLine1} ${item.labelLine2}`
      }
      accessibilityHint={`Opens quick action to ${item.labelLine1.toLowerCase()} ${item.labelLine2.toLowerCase()}`}
      onPress={item.onPress}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      style={({ pressed }) => [
        styles.tile,
        isCompactPhone && styles.tileCompact,
        isNarrowPhone && styles.tileNarrow,
        {
          backgroundColor: currentTheme.bg,
          borderColor: item.isPrimary ? currentTheme.accent : currentTheme.border,
        },
        item.isPrimary && styles.tilePrimary,
        pressed && styles.tilePressed,
      ]}>
      {/* Top Circular Icon Badge */}
      <View
        style={[
          styles.iconCircle,
          {
            width: iconCircleSize,
            height: iconCircleSize,
            borderRadius: iconCircleSize / 2,
            backgroundColor: currentTheme.iconBg,
          },
          item.isPrimary && styles.iconCirclePrimary,
        ]}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        {hasVectorIcon ? (
          <DashboardBadgeVectorIcon
            type={
              item.id as
                | 'add_product'
                | 'record_sale'
                | 'add_expense'
                | 'record_utang'
            }
            color={Colors.textInverse}
          />
        ) : (
          <Text style={styles.iconText}>{item.icon}</Text>
        )}
      </View>

      {/* Two-Line Centered Label */}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.labelText,
            isNarrowPhone && styles.labelTextNarrow,
            item.isPrimary && styles.labelTextPrimary,
            item.isPrimary && isNarrowPhone && styles.labelTextPrimaryNarrow,
            { color: currentTheme.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.25}>
          {item.labelLine1}
        </Text>
        <Text
          style={[
            styles.labelText,
            isNarrowPhone && styles.labelTextNarrow,
            item.isPrimary && styles.labelTextPrimary,
            item.isPrimary && isNarrowPhone && styles.labelTextPrimaryNarrow,
            { color: currentTheme.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.25}>
          {item.labelLine2}
        </Text>
      </View>

      {/* Bottom Arrow Indicator */}
      <View
        style={[
          styles.arrowContainer,
          item.isPrimary && { backgroundColor: currentTheme.border },
        ]}
        importantForAccessibility="no">
        <Text
          style={[
            styles.arrow,
            isNarrowPhone && styles.arrowNarrow,
            { color: currentTheme.accent },
          ]}>
          →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    minHeight: 124,
    gap: 6,
    ...Shadows.xs,
  },
  tileCompact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.xxs,
    minHeight: 118,
    gap: 5,
  },
  tileNarrow: {
    paddingVertical: 7,
    paddingHorizontal: 1,
    minHeight: 114,
    gap: 4,
  },
  tilePrimary: {
    borderWidth: 1.8,
    ...Shadows.sm,
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  iconCirclePrimary: {
    borderWidth: 2,
    borderColor: Colors.surface,
    ...Shadows.sm,
  },
  iconText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textInverse,
  },
  labelContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    lineHeight: 15,
  },
  labelTextNarrow: {
    fontSize: Typography.sizes.caption,
    lineHeight: 13,
  },
  labelTextPrimary: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    lineHeight: 16,
  },
  labelTextPrimaryNarrow: {
    fontSize: Typography.sizes.xs,
    lineHeight: 14,
  },
  arrowContainer: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
  },
  arrowNarrow: {
    fontSize: Typography.sizes.xs,
  },
});


