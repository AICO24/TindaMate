import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  KpiCartCheckIcon,
  KpiLowStockBoxIcon,
  KpiProfitCoinIcon,
} from './DashboardNavIcons';
import { Shadows, Spacing, Typography } from '@/constants/theme';

interface DashboardKpiRowProps {
  totalSalesCount: number;
  profitDisplay: string;
  lowStockCount: number;
  onTotalSalesPress?: () => void;
  onProfitPress?: () => void;
  onLowStockPress?: () => void;
  isNarrow?: boolean;
}

interface InteractiveKpiTileProps {
  accessibilityLabel: string;
  value: string | number;
  label: string;
  minimumFontScale?: number;
  onPress?: () => void;
  children: React.ReactNode;
}

/**
 * Individual KPI Tile with Crisp Black Corner/Border Line on Hover
 */
function InteractiveKpiTile({
  accessibilityLabel,
  value,
  label,
  minimumFontScale = 0.8,
  onPress,
  children,
}: InteractiveKpiTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed }) => [
          styles.card,
          isHovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}>
        <View style={styles.iconContainer}>
          {children}
        </View>
        <Text
          style={styles.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={minimumFontScale}
          maxFontSizeMultiplier={1.2}>
          {value}
        </Text>
        <Text
          style={styles.label}
          numberOfLines={1}
          maxFontSizeMultiplier={1.15}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * DashboardKpiRow (Target Reference 3 Compact KPI Summary Cards + Black Corner Hover Line)
 *
 * Visually matches the 3-tile KPI row in the Dashboard reference:
 * 1. Total Sales (Solid Emerald Shopping Cart icon)
 * 2. Profit (Stacked Golden Coins icon)
 * 3. Low Stock (3D Isometric Orange Box icon)
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
      <InteractiveKpiTile
        accessibilityLabel={`Total Sales: ${totalSalesCount} transactions. Tap to view sales history.`}
        value={totalSalesCount}
        label="Total Sales"
        onPress={onTotalSalesPress}>
        <KpiCartCheckIcon size={25} />
      </InteractiveKpiTile>

      {/* Tile 2: Gross Profit */}
      <InteractiveKpiTile
        accessibilityLabel={`Profit: ${profitDisplay}. Tap to open reports.`}
        value={profitDisplay}
        label="Profit"
        minimumFontScale={0.7}
        onPress={onProfitPress}>
        <KpiProfitCoinIcon size={25} />
      </InteractiveKpiTile>

      {/* Tile 3: Low Stock Count */}
      <InteractiveKpiTile
        accessibilityLabel={`Low Stock: ${lowStockCount} items. Tap to check inventory.`}
        value={lowStockCount}
        label="Low Stock"
        onPress={onLowStockPress}>
        <KpiLowStockBoxIcon size={25} />
      </InteractiveKpiTile>
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
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1.5,
    borderColor: '#EDF4EE',
    minHeight: 82,
    ...Shadows.sm,
  },
  cardHovered: {
    borderColor: '#000000',
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: Typography.weights.medium,
    color: '#334155',
    letterSpacing: 0.1,
  },
});
