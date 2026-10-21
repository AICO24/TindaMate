import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardBadgeVectorIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Typography,
} from '@/constants/theme';

export interface OverviewItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  iconSymbol: string;
  theme: 'green' | 'blue' | 'amber' | 'purple';
  onPress?: () => void;
}

interface StoreOverviewCardProps {
  item: OverviewItem;
}

const OVERVIEW_THEME_MAP = {
  green: Colors.pastel.green,
  blue: Colors.pastel.blue,
  amber: Colors.pastel.orange,
  purple: Colors.pastel.purple,
} as const;

const VECTOR_IDS = new Set(['sales', 'products', 'low_stock', 'utang']);

/**
 * StoreOverviewCard
 *
 * Visually substantial summary card using the TindaMate Design System:
 * - Soft pastel background & border from centralized Colors.pastel tokens
 * - 42px circular badge with crisp white vector icon
 * - Brand-colored title & readable secondary subtitle
 */
export function StoreOverviewCard({ item }: StoreOverviewCardProps) {
  const currentTheme = OVERVIEW_THEME_MAP[item.theme];
  const hasVectorIcon = VECTOR_IDS.has(item.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}: ${item.subtitle}`}
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && styles.cardPressed,
      ]}>
      {/* Left: Prominent Round Themed Icon */}
      <View style={[styles.iconCircle, { backgroundColor: currentTheme.iconBg }]}>
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

      {/* Middle: Title & Subtitle */}
      <View style={styles.textColumn}>
        <Text style={[styles.title, { color: currentTheme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>

      {/* Right: Chevron */}
      <Text style={[styles.chevron, { color: currentTheme.accent }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 78,
    gap: 10,
    ...Shadows.xs,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 19,
    fontWeight: Typography.weights.extraBold,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  chevron: {
    fontSize: 22,
    fontWeight: Typography.weights.extraBold,
    paddingLeft: 2,
  },
});

