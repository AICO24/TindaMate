import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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
 * RecentActivitySection
 *
 * Displays the recent completed sales activity feed on the Dashboard:
 * - When sales exist: Displays newest 3-5 completed sale transactions
 *   (Product name, quantity & unit price, total amount, formatted time/date)
 *   with direct tap-through to Sale Details and "View All" to Sales History.
 * - When empty: Displays the polished vector checklist pad empty state card
 *   with warm sparkle rays and friendly store guidance.
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
      {/* Reusable Design-System Section Header (shows View All when activity exists) */}
      <SectionHeader
        title="Recent Activity"
        actionLabel={showViewAll ? 'View All' : undefined}
        onActionPress={showViewAll ? onViewAll : undefined}
      />

      {hasSales && sales ? (
        /* Real Recent Sales List (limited to 5 records, newest first) */
        <View style={styles.salesList}>
          {sales.slice(0, 5).map((sale) => {
            const formattedTotal = formatPesoCurrency(sale.total_amount);
            const formattedUnitPrice = formatPesoCurrency(sale.unit_price);
            const formattedTime = formatRecentSaleTime(sale.created_at);

            return (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={`Sale: ${sale.product_name}, ${sale.quantity} ${sale.unit} at ${formattedUnitPrice} each, total ${formattedTotal}, ${formattedTime}`}
                accessibilityHint="Opens complete details for this sale"
                onPress={() => onSalePress?.(sale)}
                style={({ pressed }) => [
                  styles.saleCard,
                  isCompactPhone && styles.saleCardCompact,
                  pressed && styles.saleCardPressed,
                ]}>
                <View style={styles.saleRow}>
                  {/* Left Column: Product name, Quantity & Unit Price, Time */}
                  <View style={styles.saleInfoCol}>
                    <Text
                      style={styles.saleProductName}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      maxFontSizeMultiplier={1.3}>
                      {sale.product_name}
                    </Text>

                    <View style={styles.saleMetaRow}>
                      <Text style={styles.saleQuantityText} maxFontSizeMultiplier={1.2}>
                        {sale.quantity} {sale.unit} × {formattedUnitPrice}
                      </Text>
                      <Text style={styles.saleMetaDot}>•</Text>
                      <Text style={styles.saleTimeText} maxFontSizeMultiplier={1.2}>
                        {formattedTime}
                      </Text>
                    </View>
                  </View>

                  {/* Right Column: Total Amount & Chevron */}
                  <View style={styles.saleAmountCol}>
                    <Text
                      style={styles.saleTotalAmount}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.3}>
                      {formattedTotal}
                    </Text>
                    <Text style={styles.saleChevron} importantForAccessibility="no">
                      ›
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        /* Empty State Card */
        <View style={[styles.emptyCard, isCompactPhone && styles.emptyCardCompact]}>
          {/* Vector Checklist Card with Warm Sparkle Rays */}
          <View
            style={styles.illustrationContainer}
            accessible={false}
            importantForAccessibility="no-hide-descendants">
            {/* Left Warm Sparkle Rays */}
            <View style={styles.raysLeft}>
              <View style={[styles.ray, styles.rayTopLeft]} />
              <View style={[styles.ray, styles.rayMidLeft]} />
              <View style={[styles.ray, styles.rayBotLeft]} />
            </View>

            {/* Tilted Mint Checklist Sheet */}
            <View style={styles.checklistPad}>
              {[0, 1, 2].map((idx) => (
                <View key={idx} style={styles.checkRow}>
                  <View style={styles.checkDot} />
                  <View style={styles.checkLine} />
                </View>
              ))}
            </View>

            {/* Right Warm Sparkle Rays */}
            <View style={styles.raysRight}>
              <View style={[styles.ray, styles.rayTopRight]} />
              <View style={[styles.ray, styles.rayMidRight]} />
              <View style={[styles.ray, styles.rayBotRight]} />
            </View>
          </View>

          {/* Text Details */}
          <View style={styles.textGroup}>
            <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
              No recent activity yet.
            </Text>
            <Text style={styles.emptyDescription} maxFontSizeMultiplier={1.3}>
              Your <Text style={styles.boldWord}>transactions</Text> and updates will
              appear here once you start using the app.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.twoHalf,
  },
  salesList: {
    gap: Spacing.two,
  },
  saleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  saleCardCompact: {
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.twoHalf,
  },
  saleCardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    opacity: 0.95,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.twoHalf,
  },
  saleInfoCol: {
    flex: 1,
    gap: 3,
  },
  saleProductName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  saleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  saleQuantityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  saleMetaDot: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  saleTimeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  saleAmountCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleTotalAmount: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  saleChevron: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  emptyCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    ...Shadows.xs,
  },
  emptyCardCompact: {
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.twoHalf,
    gap: Spacing.twoHalf,
  },
  illustrationContainer: {
    width: 72,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistPad: {
    width: 42,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#99D5C3',
    paddingVertical: 9,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    transform: [{ rotate: '-5deg' }],
    ...Shadows.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  checkDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: Colors.surface,
  },
  checkLine: {
    flex: 1,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: Colors.surface,
  },
  raysLeft: {
    height: 36,
    justifyContent: 'space-between',
    marginRight: 5,
  },
  raysRight: {
    height: 36,
    justifyContent: 'space-between',
    marginLeft: 5,
  },
  ray: {
    width: 6,
    height: 2.2,
    borderRadius: 1.2,
    backgroundColor: Colors.accentWarm,
  },
  rayTopLeft: {
    transform: [{ rotate: '28deg' }],
  },
  rayMidLeft: {
    width: 7,
  },
  rayBotLeft: {
    transform: [{ rotate: '-28deg' }],
  },
  rayTopRight: {
    transform: [{ rotate: '-28deg' }],
  },
  rayMidRight: {
    width: 7,
  },
  rayBotRight: {
    transform: [{ rotate: '28deg' }],
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  emptyTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  emptyDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.tight,
  },
  boldWord: {
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
});
