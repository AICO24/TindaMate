import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CartVectorIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { formatRecentSaleTime } from '@/lib/sales';
import { Sale } from '@/types/sale';

interface RecentActivitySectionProps {
  sales?: Sale[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onSalePress?: (sale: Sale) => void;
  hasActivity?: boolean;
  activityCount?: number;
}

/**
 * RecentActivitySection (Design 2.0 Showcase Alignment)
 *
 * Visually matches Screen 1 of TindaMate POS App Showcase.png:
 * - Flat section header ("Recent Activity" on left, "View All →" on right)
 * - Compact single-line pill/row for each recent transaction:
 *   Left: Soft green circle with cart icon
 *   Middle: Single-line summary ("New Sale • ₱350" or "{product_name} • {formattedTotal}")
 *   Right: Relative timestamp ("2m ago")
 */
export function RecentActivitySection({
  sales,
  onViewAll,
  onSalePress,
  hasActivity = false,
  activityCount = 0,
}: RecentActivitySectionProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 375;

  const hasSales = Boolean(sales && sales.length > 0);
  const showViewAll = (hasSales || hasActivity || activityCount > 0) && !!onViewAll;

  return (
    <View style={styles.container}>
      {/* Flat Section Header matching reference */}
      <View style={styles.headerRow}>
        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
          maxFontSizeMultiplier={1.25}>
          Recent Activity
        </Text>

        {showViewAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all recent activity"
            accessibilityHint="Navigates to full sales history screen"
            onPress={onViewAll}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.viewAllPressed,
            ]}>
            <Text style={styles.viewAllText} maxFontSizeMultiplier={1.2}>
              View All →
            </Text>
          </Pressable>
        ) : null}
      </View>

      {hasSales && sales ? (
        /* Compact Single-Line Rows matching reference */
        <View style={styles.rowsContainer}>
          {sales.slice(0, 2).map((sale) => {
            const formattedTotal = formatPesoCurrency(sale.total_amount);
            const formattedTime = formatRecentSaleTime(sale.created_at);
            const isCredit = sale.payment_method === 'credit';
            const titleLabel = sale.product_name || 'New Sale';

            const accessibilityLabel = `Sale: ${titleLabel}, total ${formattedTotal}, ${formattedTime}`;

            return (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint="Opens complete details for this sale"
                onPress={() => onSalePress?.(sale)}
                style={({ pressed }) => [
                  styles.salePillRow,
                  pressed && styles.saleRowPressed,
                ]}>
                {/* Left: Compact Green / Amber Icon Circle */}
                <View
                  style={[
                    styles.saleIconCircle,
                    isCredit && styles.saleIconCircleCredit,
                  ]}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants">
                  <CartVectorIcon
                    size={15}
                    color={isCredit ? '#D97706' : '#0D7A4D'}
                  />
                </View>

                {/* Middle: Single-line "New Sale • ₱350" format */}
                <View style={styles.saleInlineRow}>
                  <Text
                    style={styles.saleInlinePrimary}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={1.2}>
                    {titleLabel}
                  </Text>
                  <Text style={styles.saleInlineBullet} importantForAccessibility="no">
                    •
                  </Text>
                  <Text
                    style={styles.saleInlineAmount}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}>
                    {formattedTotal}
                  </Text>
                  {isCredit && (
                    <View style={styles.utangBadge}>
                      <Text style={styles.utangBadgeText}>Utang</Text>
                    </View>
                  )}
                </View>

                {/* Right: Relative Timestamp */}
                <Text
                  style={styles.saleTimeText}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.15}>
                  {formattedTime}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        /* Compact Single-Line Empty State Pill */
        <View style={[styles.emptyPillRow, isCompactPhone && styles.emptyPillRowCompact]}>
          <View
            style={styles.saleIconCircle}
            accessible={false}
            importantForAccessibility="no-hide-descendants">
            <CartVectorIcon size={15} color="#0D7A4D" />
          </View>
          <Text style={styles.emptyInlineText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            No sales recorded yet — tap POS to start
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  viewAllPressed: {
    opacity: 0.65,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: Typography.weights.semiBold,
    color: '#475569',
  },
  rowsContainer: {
    gap: 6,
  },
  salePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: Spacing.twoHalf,
    gap: Spacing.two,
    minHeight: 44,
    ...Shadows.xs,
  },
  saleRowPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.99 }],
  },
  saleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleIconCircleCredit: {
    backgroundColor: '#FEF3C7',
  },
  saleInlineRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  saleInlinePrimary: {
    fontSize: 13.5,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
    flexShrink: 1,
  },
  saleInlineBullet: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#64748B',
  },
  saleInlineAmount: {
    fontSize: 13.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  utangBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  utangBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    color: '#D97706',
  },
  saleTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: Typography.weights.medium,
  },
  emptyPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: Spacing.twoHalf,
    gap: Spacing.two,
    minHeight: 44,
    ...Shadows.xs,
  },
  emptyPillRowCompact: {
    paddingHorizontal: Spacing.two,
  },
  emptyInlineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: '#64748B',
  },
});
