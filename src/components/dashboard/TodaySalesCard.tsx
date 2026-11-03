import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TrendChartVectorIcon } from './DashboardNavIcons';
import { Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';

interface TodaySalesCardProps {
  amount: number;
  transactionCount: number;
  comparisonLabel: string;
  onPress?: () => void;
  isGuestMode?: boolean;
}

/**
 * TodaySalesCard (Primary Hero KPI Card)
 *
 * Visually communicates Today's Sales as the primary anchor of the Dashboard:
 * - Rich emerald green card (#065F46) with signature warm orange and mint wave ribbons
 * - Large readable currency amount with auto-scaling
 * - Unboxed trend vector icon
 * - Translucent percentage comparison badge pill
 */
export function TodaySalesCard({
  amount,
  transactionCount,
  comparisonLabel,
  onPress,
  isGuestMode = false,
}: TodaySalesCardProps) {
  const displayAmount = isGuestMode ? '₱0.00' : formatPesoCurrency(amount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Today's Sales: ${displayAmount}, ${transactionCount} transactions today. Tap to view sales history.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}>
      {/* Signature Orange, Emerald, and Mint Wave Accents on Bottom-Right */}
      <View style={styles.orangeWave} pointerEvents="none" />
      <View style={styles.emeraldWave} pointerEvents="none" />
      <View style={styles.mintWave} pointerEvents="none" />

      <View style={styles.contentLeft}>
        <View style={styles.iconWrapper}>
          <TrendChartVectorIcon size={30} color={Colors.textInverse} />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.label} maxFontSizeMultiplier={1.2}>
            Today&apos;s Sales
          </Text>
          <Text
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            maxFontSizeMultiplier={1.2}>
            {displayAmount}
          </Text>
        </View>
      </View>

      {/* Comparison badge pill (e.g., "↑ 12.5%" or "↑ 5 sales") */}
      <View style={styles.badgePill}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {comparisonLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#065F46',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: Spacing.threeHalf,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#047857',
    gap: Spacing.two,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  // Signature Warm Orange Wave Ribbon on Bottom-Right
  orangeWave: {
    position: 'absolute',
    right: -14,
    bottom: -18,
    width: 140,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F59E0B',
    opacity: 0.92,
    transform: [{ rotate: '-10deg' }],
    zIndex: 1,
  },
  emeraldWave: {
    position: 'absolute',
    right: 22,
    bottom: -22,
    width: 130,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    opacity: 0.65,
    transform: [{ rotate: '-4deg' }],
    zIndex: 1,
  },
  mintWave: {
    position: 'absolute',
    right: -4,
    bottom: 0,
    width: 90,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A7F3D0',
    opacity: 0.45,
    transform: [{ rotate: '-8deg' }],
    zIndex: 1,
  },
  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    zIndex: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 1,
  },
  label: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: Typography.weights.semiBold,
    letterSpacing: 0.2,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 2,
    alignSelf: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.1,
  },
});
