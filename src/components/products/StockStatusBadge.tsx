import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';
import { ProductStockStatus } from '@/types/product';

interface StockStatusBadgeProps {
  status: ProductStockStatus;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const STATUS_STYLE_MAP: Record<
  ProductStockStatus,
  {
    bg: string;
    border: string;
    dot: string;
    text: string;
  }
> = {
  'In Stock': {
    bg: Colors.successLight,
    border: Colors.primaryBorder,
    dot: Colors.success,
    text: Colors.successText,
  },
  'Low Stock': {
    bg: Colors.warningLight,
    border: Colors.accentBorder,
    dot: Colors.warning,
    text: Colors.warningText,
  },
  'Out of Stock': {
    bg: Colors.errorLight,
    border: Colors.errorBorder,
    dot: Colors.error,
    text: Colors.error,
  },
};

/**
 * StockStatusBadge
 *
 * Semantic pill badge displaying whether a product is In Stock, Low Stock, or Out of Stock.
 * Uses centralized TindaMate semantic status colors.
 */
export function StockStatusBadge({
  status,
  size = 'sm',
  style,
}: StockStatusBadgeProps) {
  const palette = STATUS_STYLE_MAP[status];
  const isMedium = size === 'md';

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Stock status: ${status}`}
      style={[
        styles.badge,
        isMedium && styles.badgeMd,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}>
      <View
        style={[
          styles.dot,
          isMedium && styles.dotMd,
          { backgroundColor: palette.dot },
        ]}
        importantForAccessibility="no"
      />
      <Text
        style={[
          styles.label,
          isMedium && styles.labelMd,
          { color: palette.text },
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.25}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 5,
  },
  badgeMd: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotMd: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
  },
});

