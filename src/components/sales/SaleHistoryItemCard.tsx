import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  DashboardBadgeVectorIcon,
  NavUtangIcon,
} from '@/components/dashboard/DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { formatSaleDate, formatSaleTime } from '@/lib/sales';
import { Sale } from '@/types/sale';

interface SaleHistoryItemCardProps {
  sale: Sale;
  onPress: (sale: Sale) => void;
}

/**
 * SaleHistoryItemCard (Batch S-3)
 *
 * Scannable retail transaction card:
 * - Top: Human-readable reference (#XXXXXXXX), Date • Time, and Cash vs Utang status pill
 * - Middle: Product summary (from sale header), item count, and customer attribution for Utang
 * - Bottom: Prominent tabular-nums transaction total and "View ›" affordance
 */
export function SaleHistoryItemCard({
  sale,
  onPress,
}: SaleHistoryItemCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const isUtang = sale.payment_method === 'credit';
  const refCode = `#${sale.id.slice(0, 8).toUpperCase()}`;
  const formattedTotal = formatPesoCurrency(sale.total_amount);
  const formattedDate = formatSaleDate(sale.created_at);
  const formattedTime = formatSaleTime(sale.created_at);

  const itemCount = sale.item_count ?? sale.quantity ?? 1;
  const itemCountLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  const productSummary = sale.product_name?.trim() || null;

  const paymentDesc = isUtang
    ? `Utang credit sale${sale.customer_name ? ` to ${sale.customer_name}` : ''}`
    : 'Cash sale';

  const accessibilityLabel = `${refCode}, ${paymentDesc} on ${formattedDate} at ${formattedTime}, total ${formattedTotal}, ${itemCountLabel}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens complete receipt details for this sale"
      onPress={() => onPress(sale)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}>
      {/* Top Section: Icon + Ref / Date•Time + Payment Status Pill */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View
            style={[
              styles.receiptIconCircle,
              isUtang
                ? styles.receiptIconCircleUtang
                : styles.receiptIconCircleCash,
            ]}>
            {isUtang ? (
              <NavUtangIcon color={Colors.textInverse} size={18} />
            ) : (
              <DashboardBadgeVectorIcon
                type="sales_history"
                color={Colors.textInverse}
              />
            )}
          </View>

          <View style={styles.refCol}>
            <Text style={styles.refText} numberOfLines={1}>
              {refCode}
            </Text>
            <Text
              style={styles.dateTimeText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.paymentPill,
            isUtang ? styles.paymentPillUtang : styles.paymentPillCash,
          ]}>
          <Text
            style={[
              styles.paymentPillText,
              isUtang ? styles.paymentPillTextUtang : styles.paymentPillTextCash,
            ]}>
            {isUtang ? 'UTANG' : 'CASH'}
          </Text>
        </View>
      </View>

      {/* Middle Section: Product Summary, Item Count & Customer */}
      <View style={styles.middleRow}>
        {productSummary ? (
          <Text
            style={styles.productSummaryText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            {productSummary}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text
            style={styles.itemCountText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            {itemCountLabel}
          </Text>
          {isUtang && sale.customer_name ? (
            <>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.customerNameText} numberOfLines={1}>
                {sale.customer_name}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Bottom Section: Total Amount + View Details Pill */}
      <View style={styles.bottomRow}>
        <Text
          style={[
            styles.totalAmount,
            isUtang && styles.totalAmountUtang,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.3}>
          {formattedTotal}
        </Text>

        <View style={styles.viewPill} importantForAccessibility="no">
          <Text style={styles.viewPillText}>View Details ›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  cardCompact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.twoHalf,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.992 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  topLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  receiptIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  receiptIconCircleCash: {
    backgroundColor: Colors.primary,
  },
  receiptIconCircleUtang: {
    backgroundColor: Colors.accent,
  },
  refCol: {
    flex: 1,
    gap: 1,
  },
  refText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  dateTimeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  paymentPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  paymentPillCash: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  paymentPillUtang: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentBorder,
  },
  paymentPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.4,
  },
  paymentPillTextCash: {
    color: Colors.primaryDark,
  },
  paymentPillTextUtang: {
    color: Colors.accentDark,
  },
  middleRow: {
    gap: 2,
    paddingLeft: 44,
  },
  productSummaryText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  itemCountText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  customerNameText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.accentDark,
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.one + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  totalAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  totalAmountUtang: {
    color: Colors.accentDark,
  },
  viewPill: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  viewPillText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
});
