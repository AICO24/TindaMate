import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WarningTriangleIcon } from './DashboardNavIcons';
import { Shadows, Spacing, Typography } from '@/constants/theme';

interface LowStockAlertProps {
  lowStockCount: number;
  outOfStockCount?: number;
  onPress?: () => void;
}

/**
 * LowStockAlert (Operational Stock Warning Banner)
 *
 * Noticeable warning card communicating low/out of stock inventory:
 * - Rendered only when inventory needs attention (count > 0)
 * - TindaMate orange/amber visual language (#EA580C / #FFF7ED)
 * - Warning triangle icon
 * - Tap target navigates directly to /products inventory
 */
export function LowStockAlert({
  lowStockCount,
  outOfStockCount = 0,
  onPress,
}: LowStockAlertProps) {
  const totalAlertCount = lowStockCount + outOfStockCount;
  if (totalAlertCount <= 0) return null;

  const titleText =
    lowStockCount > 0
      ? `${lowStockCount} ${lowStockCount === 1 ? 'Product Running Low' : 'Products Running Low'}`
      : `${outOfStockCount} ${outOfStockCount === 1 ? 'Product Out of Stock' : 'Products Out of Stock'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${totalAlertCount} products running low or out of stock. Tap to check inventory.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}>
      {/* Subtle warm accent wave highlight */}
      <View style={styles.waveHighlight} pointerEvents="none" />

      <WarningTriangleIcon size={26} bgColor="#EA580C" fgColor="#FFFFFF" />

      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {titleText}
        </Text>
        <Text style={styles.actionLink} numberOfLines={1} maxFontSizeMultiplier={1.15}>
          Check inventory →
        </Text>
      </View>

      {outOfStockCount > 0 && lowStockCount > 0 && (
        <View style={styles.outOfStockPill}>
          <Text style={styles.outOfStockText}>+{outOfStockCount} out</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 11,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.xs,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  waveHighlight: {
    position: 'absolute',
    right: -20,
    top: -15,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDBA74',
    opacity: 0.22,
  },
  textColumn: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 13.5,
    fontWeight: Typography.weights.bold,
    color: '#9A3412',
    letterSpacing: -0.2,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: Typography.weights.semiBold,
    color: '#EA580C',
  },
  outOfStockPill: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#FECACA',
  },
  outOfStockText: {
    fontSize: 10.5,
    fontWeight: Typography.weights.bold,
    color: '#DC2626',
  },
});
