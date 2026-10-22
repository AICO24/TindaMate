import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { TodaySalesSummary } from '@/types/sale';

interface TodaySalesSummaryCardProps {
  summary: TodaySalesSummary;
}

/**
 * TodaySalesSummaryCard
 *
 * Lightweight current-day sales metric card displayed at the top of Sales History.
 * Shows:
 * - Label: "Today's Sales"
 * - Prominent total amount formatted in Philippine Pesos (e.g. ₱1,250.00)
 * - Number of completed transactions today (e.g. 8 Transactions)
 */
export function TodaySalesSummaryCard({ summary }: TodaySalesSummaryCardProps) {
  const transactionLabel =
    summary.transactionCount === 1
      ? '1 Transaction today'
      : `${summary.transactionCount} Transactions today`;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Today's sales total: ${formatPesoCurrency(
        summary.totalAmount
      )}, ${transactionLabel}`}>
      <View style={styles.topRow}>
        <View style={styles.badgePill}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Today's Sales</Text>
        </View>
        <Text style={styles.countText}>{transactionLabel}</Text>
      </View>

      <Text
        style={styles.totalAmount}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        numberOfLines={1}>
        {formatPesoCurrency(summary.totalAmount)}
      </Text>

      <Text style={styles.subtext}>
        {summary.transactionCount === 0
          ? 'No sales recorded yet today'
          : 'Total revenue from recorded sales today'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.pastel.green.bg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    padding: Spacing.threeHalf,
    gap: Spacing.one,
    ...Shadows.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  countText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    marginVertical: 2,
  },
  subtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
});

