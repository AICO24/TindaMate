import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardBadgeVectorIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  PastelThemeKey,
  Shadows,
  Typography,
} from '@/constants/theme';

export interface QuickActionItem {
  id: string;
  labelLine1: string;
  labelLine2: string;
  icon: string;
  theme: PastelThemeKey;
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
 * Visually strong, large action tile using the TindaMate Design System:
 * - Centralized Colors.pastel tokens (green, orange, blue, purple)
 * - Large 46px circular icon container with crisp white vector icon
 * - Bold two-line centered title and bottom arrow (→) indicator
 */
export function QuickActionTile({ item }: QuickActionTileProps) {
  const currentTheme = Colors.pastel[item.theme];
  const hasVectorIcon = ACTION_VECTOR_IDS.has(item.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.labelLine1} ${item.labelLine2}`}
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && styles.tilePressed,
      ]}>
      {/* Top Large Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor: currentTheme.iconBg }]}>
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
        <Text style={[styles.labelText, { color: currentTheme.text }]} numberOfLines={1}>
          {item.labelLine1}
        </Text>
        <Text style={[styles.labelText, { color: currentTheme.text }]} numberOfLines={1}>
          {item.labelLine2}
        </Text>
      </View>

      {/* Bottom Arrow Indicator */}
      <Text style={[styles.arrow, { color: currentTheme.accent }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderWidth: 1,
    minHeight: 125,
    gap: 6,
    ...Shadows.xs,
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  iconText: {
    fontSize: 21,
    color: Colors.textInverse,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    textAlign: 'center',
    lineHeight: 16,
  },
  arrow: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
  },
});

