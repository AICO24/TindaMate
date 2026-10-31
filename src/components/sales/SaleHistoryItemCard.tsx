import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardBadgeVectorIcon } from '@/components/dashboard/DashboardNavIcons';
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
 * SaleHistoryItemCard — TindaMate Design 2.0
 *
 * Scannable transaction-history row card matching the Design 2.0 reference:
 * - Left: Circular green receipt icon badge (or warm orange for Utang sales)
 * - Middle: Date • Time caption, large bold Peso amount (`₱115.00`), and item count / product summary
 * - Right: Clean "View ›" pill button
 */
export function SaleHistoryItemCard({
  sale,
  onPress,
}: SaleHistoryItemCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const isMultiItem = (sale.item_count ?? 1) > 1;
  const isUtang = sale.payment_method === 'credit';
  const formattedTotal = formatPesoCurrency(sale.total_amount);
  const formattedDate = formatSaleDate(sale.created_at);
  const formattedTime = formatSaleTime(sale.created_at);

  const itemCount = sale.item_count ?? sale.quantity ?? 1;
  const itemCountLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  const paymentDesc = isUtang
    ? `Utang credit sale${sale.customer_name ? ` to ${sale.customer_name}` : ''}`
    : 'Cash sale';

  const accessibilityLabel = `${paymentDesc} on ${formattedDate} at ${formattedTime}, total ${formattedTotal}, ${itemCountLabel}`;

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
      <View style={styles.contentRow}>
        {/* Left: Circular Green Receipt Icon Badge */}
        <View
          style={[
            styles.receiptIconCircle,
            isUtang && styles.receiptIconCircleUtang,
          ]}>
          <DashboardBadgeVectorIcon
            type="sales_history"
            color={Colors.textInverse}
          />
        </View>

        {/* Middle: Date • Time, Amount, Item Count & Utang Context */}
        <View style={styles.infoCol}>
          <Text
            style={styles.dateTimeText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            {formattedDate} • {formattedTime}
          </Text>

          <Text
            style={styles.totalAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.3}>
            {formattedTotal}
          </Text>

          <View style={styles.metaRow}>
            <Text
              style={styles.itemCountText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {itemCountLabel}
            </Text>
            {isUtang ? (
              <View style={styles.utangBadge}>
                <Text style={styles.utangBadgeText} numberOfLines={1}>
                  {sale.customer_name
                    ? `Utang · ${sale.customer_name}`
                    : 'Utang'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Right: "View ›" Pill Button */}
        <View style={styles.viewPill} importantForAccessibility="no">
          <Text style={styles.viewPillText}>View ›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 14,
    paddingHorizontal: Spacing.threeHalf,
    ...Shadows.sm,
  },
  cardCompact: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.992 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  receiptIconCircleUtang: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  dateTimeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemCountText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  utangBadge: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    maxWidth: 140,
  },
  utangBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  viewPill: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  viewPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
});
