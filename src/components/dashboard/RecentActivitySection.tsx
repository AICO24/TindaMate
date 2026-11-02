import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CartVectorIcon } from './DashboardNavIcons';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
 * Displays recent sales as compact rows inside a unified card container with subtle separators:
 * - Direct visual alignment with Screen 1 of TindaMate POS App Showcase.png
 * - Small cart/bag icon, concise product name, total price, timestamp
 * - Payment badge pill for credit/utang transactions
 * - Direct tap-through to Sale Details and "View All →" action
 */
export function RecentActivitySection({
  sales,
  isLoading = false,
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
      {/* Header: Title + View All Link */}
      <SectionHeader
        title="Recent Activity"
        actionLabel={showViewAll ? 'View All' : undefined}
        onActionPress={showViewAll ? onViewAll : undefined}
      />

      {hasSales && sales ? (
        /* Unified Card with Compact Separated Rows */
        <View style={styles.activityListCard}>
          {sales.slice(0, 5).map((sale, index) => {
            const isMultiItem = (sale.item_count ?? 1) > 1;
            const formattedTotal = formatPesoCurrency(sale.total_amount);
            const formattedUnitPrice = formatPesoCurrency(sale.unit_price);
            const formattedTime = formatRecentSaleTime(sale.created_at);
            const isLast = index === Math.min(sales.length, 5) - 1;

            const accessibilityLabel = isMultiItem
              ? `Sale: ${sale.product_name}, ${sale.item_count} products, total ${formattedTotal}, ${formattedTime}`
              : `Sale: ${sale.product_name}, ${sale.quantity} ${sale.unit} at ${formattedUnitPrice} each, total ${formattedTotal}, ${formattedTime}`;

            return (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint="Opens complete details for this sale"
                onPress={() => onSalePress?.(sale)}
                style={({ pressed }) => [
                  styles.saleRowItem,
                  !isLast && styles.saleRowBorder,
                  pressed && styles.saleRowPressed,
                ]}>
                {/* Left: Compact Green / Amber Icon Circle */}
                <View
                  style={[
                    styles.saleIconCircle,
                    sale.payment_method === 'credit' && styles.saleIconCircleCredit,
                  ]}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants">
                  <CartVectorIcon
                    size={15}
                    color={
                      sale.payment_method === 'credit'
                        ? '#D97706'
                        : '#0D7A4D'
                    }
                  />
                </View>

                {/* Middle: Sale Title & Details */}
                <View style={styles.saleInfoCol}>
                  <View style={styles.nameHeaderRow}>
                    <Text
                      style={styles.saleProductName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      maxFontSizeMultiplier={1.2}>
                      {sale.product_name}
                    </Text>
                    {isMultiItem && (
                      <View style={styles.multiBadge}>
                        <Text style={styles.multiBadgeText}>
                          {sale.item_count} items
                        </Text>
                      </View>
                    )}
                    {sale.payment_method === 'credit' && (
                      <View style={styles.utangBadge}>
                        <Text style={styles.utangBadgeText}>Utang</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.saleMetaText} maxFontSizeMultiplier={1.15}>
                    {isMultiItem
                      ? `${sale.quantity} units total`
                      : `${sale.quantity} ${sale.unit}`}
                    {' · '}
                    {formattedTime}
                  </Text>
                </View>

                {/* Right: Amount & Chevron */}
                <View style={styles.saleAmountCol}>
                  <Text
                    style={styles.saleTotalAmount}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.25}>
                    {formattedTotal}
                  </Text>
                  <Text style={styles.saleChevron} importantForAccessibility="no">
                    ›
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        /* Empty State Card */
        <View style={[styles.emptyCard, isCompactPhone && styles.emptyCardCompact]}>
          <View
            style={styles.illustrationContainer}
            accessible={false}
            importantForAccessibility="no-hide-descendants">
            <View style={styles.checklistPad}>
              {[0, 1, 2].map((idx) => (
                <View key={idx} style={styles.checkRow}>
                  <View style={styles.checkDot} />
                  <View style={styles.checkLine} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.textGroup}>
            <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
              No recent activity yet.
            </Text>
            <Text style={styles.emptyDescription} maxFontSizeMultiplier={1.3}>
              Your <Text style={styles.boldWord}>sales</Text> will appear here once you record your first transaction.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  activityListCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.xs,
  },
  saleRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: Spacing.three,
    gap: Spacing.twoHalf,
  },
  saleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  saleRowPressed: {
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FEF3C7',
  },
  saleInfoCol: {
    flex: 1,
    gap: 2,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  saleProductName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
    flexShrink: 1,
  },
  multiBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  multiBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
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
  saleMetaText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  saleAmountCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  saleTotalAmount: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  saleChevron: {
    fontSize: Typography.sizes.base,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: Spacing.two,
    ...Shadows.xs,
  },
  emptyCardCompact: {
    padding: Spacing.three,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.one,
  },
  checklistPad: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    gap: 5,
    justifyContent: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  checkLine: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  textGroup: {
    alignItems: 'center',
    gap: 3,
  },
  emptyTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
  },
  emptyDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  boldWord: {
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
  },
});
