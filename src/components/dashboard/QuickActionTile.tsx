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
  const isCompactPhone = windowWidth < 375;

  const iconCircleSize = isCompactPhone
    ? item.isPrimary ? 42 : 40
    : item.isPrimary ? 48 : 44;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        item.isPrimary
          ? `${item.labelLine1} ${item.labelLine2}, primary action`
          : `${item.labelLine1} ${item.labelLine2}`
      }
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.tile,
        isCompactPhone && styles.tileCompact,
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
        ]}>
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
            item.isPrimary && styles.labelTextPrimary,
            { color: currentTheme.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {item.labelLine1}
        </Text>
        <Text
          style={[
            styles.labelText,
            item.isPrimary && styles.labelTextPrimary,
            { color: currentTheme.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
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
        <Text style={[styles.arrow, { color: currentTheme.accent }]}>→</Text>
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
    paddingVertical: 10,
    paddingHorizontal: Spacing.xxs,
    minHeight: 116,
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
  labelTextPrimary: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    lineHeight: 16,
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
});


