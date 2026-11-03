import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  CartVectorIcon,
  RecentActivityClockIcon,
  UserPaymentVectorIcon,
} from './DashboardNavIcons';
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
 * RecentActivitySection (Target Reference 1:1 Alignment + Black Corner Hover Line)
 *
 * Visually matches the Recent Activity section in the Dashboard reference:
 * - Section Header: Circular clock-arrow history icon + "Recent Activity" on left, "View All →" on right
 * - Activity Rows: Floating white pill cards (#FFFFFF, 15px border radius):
 *   - Regular sale: Soft green circle (#DCFCE7) + emerald cart icon
 *   - Credit / Customer transaction: Soft warm peach circle (#FFEDD5) + orange user icon
 *   - Middle: Bold inline summary ("New Sale • ₱850")
 *   - Right: Relative timestamp ("2m ago")
 *   - Hover: Crisp black border line outline around the pill corners
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
  const [hoveredSaleId, setHoveredSaleId] = useState<string | null>(null);

  const hasSales = Boolean(sales && sales.length > 0);
  const showViewAll = (hasSales || hasActivity || activityCount > 0) && !!onViewAll;

  return (
    <View style={styles.container}>
      {/* Section Header with Clock-Arrow Icon + Title + View All */}
      <View style={styles.headerRow}>
        <View style={styles.titleCluster}>
          <RecentActivityClockIcon size={20} color="#0A5234" />
          <Text
            style={styles.headerTitle}
            accessibilityRole="header"
            maxFontSizeMultiplier={1.25}>
            Recent Activity
          </Text>
        </View>

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
        /* Compact Floating Pill Rows matching reference */
        <View style={styles.rowsContainer}>
          {sales.slice(0, 2).map((sale) => {
            const formattedTotal = formatPesoCurrency(sale.total_amount);
            const formattedTime = formatRecentSaleTime(sale.created_at);
            const isCredit = sale.payment_method === 'credit';
            const titleLabel = sale.product_name || 'New Sale';
            const isHovered = hoveredSaleId === sale.id;

            const accessibilityLabel = `Sale: ${titleLabel}, total ${formattedTotal}, ${formattedTime}`;

            return (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint="Opens complete details for this sale"
                onPress={() => onSalePress?.(sale)}
                onHoverIn={() => setHoveredSaleId(sale.id)}
                onHoverOut={() =>
                  setHoveredSaleId((prev) => (prev === sale.id ? null : prev))
                }
                style={({ pressed }) => [
                  styles.salePillRow,
                  isHovered && styles.salePillRowHovered,
                  pressed && styles.saleRowPressed,
                ]}>
                {/* Left: Green Cart Circle (Cash) or Warm Peach User Circle (Credit/Utang) */}
                <View
                  style={[
                    styles.saleIconCircle,
                    isCredit && styles.saleIconCircleCredit,
                  ]}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants">
                  {isCredit ? (
                    <UserPaymentVectorIcon size={16} color="#D97706" />
                  ) : (
                    <CartVectorIcon size={16} color="#15803D" />
                  )}
                </View>

                {/* Middle: Single-line "New Sale • ₱850" format */}
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
            <CartVectorIcon size={16} color="#15803D" />
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
    gap: 7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0A3D28',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  viewAllPressed: {
    opacity: 0.65,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#0A5234',
  },
  rowsContainer: {
    gap: 6,
  },
  salePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#EDF4EE',
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    minHeight: 44,
    ...Shadows.xs,
  },
  salePillRowHovered: {
    borderColor: '#000000',
  },
  saleRowPressed: {
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  saleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleIconCircleCredit: {
    backgroundColor: '#FFEDD5',
  },
  saleInlineRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  saleInlinePrimary: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
    flexShrink: 1,
  },
  saleInlineBullet: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#334155',
  },
  saleInlineAmount: {
    fontSize: 14,
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
    fontSize: 12.5,
    color: '#475569',
    fontWeight: Typography.weights.medium,
  },
  emptyPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDF4EE',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    gap: Spacing.twoHalf,
    minHeight: 50,
    ...Shadows.xs,
  },
  emptyPillRowCompact: {
    paddingHorizontal: Spacing.two,
  },
  emptyInlineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: '#475569',
  },
});
