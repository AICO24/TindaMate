import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  KpiCartCheckIcon,
  KpiLowStockBoxIcon,
  KpiProfitCoinIcon,
} from './DashboardNavIcons';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

interface DashboardKpiRowProps {
  totalSalesCount: number;
  profitDisplay: string;
  lowStockCount: number;
  onTotalSalesPress?: () => void;
  onProfitPress?: () => void;
  onLowStockPress?: () => void;
  isNarrow?: boolean;
}

/**
 * DashboardKpiRow (3 Compact Supporting KPI Cards)
 *
 * Visually matches the 3-tile row in Design 2.0 reference showcase:
 * 1. Total Sales (Emerald cart/check icon)
 * 2. Profit (Warm golden coin icon)
 * 3. Low Stock (Amber alert box icon)
 *
 * Clean white surfaces, subtle borders, bold numbers, and responsive sizing.
 */
export function DashboardKpiRow({
  totalSalesCount,
  profitDisplay,
  lowStockCount,
  onTotalSalesPress,
  onProfitPress,
  onLowStockPress,
  isNarrow = false,
}: DashboardKpiRowProps) {
  return (
    <View style={[styles.row, isNarrow && styles.rowNarrow]}>
      {/* Tile 1: Total Sales Count */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Total Sales: ${totalSalesCount} transactions. Tap to view sales history.`}
        onPress={onTotalSalesPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}>
        <KpiCartCheckIcon size={22} />
        <Text
          style={styles.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.2}>
          {totalSalesCount}
        </Text>
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.15}>
          Total Sales
        </Text>
      </Pressable>

      {/* Tile 2: Gross Profit */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Profit: ${profitDisplay}. Tap to open reports.`}
        onPress={onProfitPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}>
        <KpiProfitCoinIcon size={22} />
        <Text
          style={styles.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          maxFontSizeMultiplier={1.2}>
          {profitDisplay}
        </Text>
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.15}>
          Profit
        </Text>
      </Pressable>

      {/* Tile 3: Low Stock Count */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Low Stock: ${lowStockCount} items. Tap to check inventory.`}
        onPress={onLowStockPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}>
        <KpiLowStockBoxIcon size={22} />
        <Text
          style={[styles.value, lowStockCount > 0 && styles.valueWarning]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.2}>
          {lowStockCount}
        </Text>
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.15}>
          Low Stock
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.twoHalf,
    width: '100%',
  },
  rowNarrow: {
    gap: 6,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 88,
    ...Shadows.xs,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  value: {
    fontSize: 18,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  valueWarning: {
    color: '#D97706',
  },
  label: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: '#64748B',
    letterSpacing: 0.1,
  },
});
