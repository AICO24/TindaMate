import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { formatSaleTime } from '@/lib/sales';
import { Sale } from '@/types/sale';

interface SaleHistoryItemCardProps {
  sale: Sale;
  onPress: (sale: Sale) => void;
}

/**
 * SaleHistoryItemCard
 *
 * Scannable, mobile-first list item card representing a completed historical sale.
 * Clearly communicates:
 * - Product name (supports multi-line wrapping for long sari-sari store names)
 * - Quantity & Unit Price snapshot (e.g. 2 × ₱75.00)
 * - Total transaction amount in Philippine Pesos (e.g. ₱150.00)
 * - Time of transaction (e.g. 2:35 PM)
 * - Tappable with Chevron indicator to view full Sale Details
 */
export function SaleHistoryItemCard({
  sale,
  onPress,
}: SaleHistoryItemCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const isMultiItem = (sale.item_count ?? 1) > 1;
  const formattedTotal = formatPesoCurrency(sale.total_amount);
  const formattedUnitPrice = formatPesoCurrency(sale.unit_price);
  const formattedTime = formatSaleTime(sale.created_at);

  const accessibilityLabel = isMultiItem
    ? `Sale: ${sale.product_name}, ${sale.item_count} products, ${sale.quantity} total units, total ${formattedTotal}, at ${formattedTime}`
    : `Sale: ${sale.product_name}, ${sale.quantity} ${sale.unit} at ${formattedUnitPrice} each, total ${formattedTotal}, at ${formattedTime}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens complete details for this sale"
      onPress={() => onPress(sale)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.contentRow}>
        {/* Left Information Block */}
        <View style={styles.infoCol}>
          <View style={styles.nameHeaderRow}>
            <Text
              style={styles.productName}
              numberOfLines={2}
              maxFontSizeMultiplier={1.3}>
              {sale.product_name}
            </Text>
            {isMultiItem && (
              <View style={styles.multiBadge}>
                <Text style={styles.multiBadgeText}>
                  {sale.item_count} items
                </Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.calculationText} maxFontSizeMultiplier={1.2}>
              {isMultiItem
                ? `${sale.item_count} products · ${sale.quantity} units`
                : `${sale.quantity} ${sale.unit} × ${formattedUnitPrice}`}
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.timeText} maxFontSizeMultiplier={1.2}>
              {formattedTime}
            </Text>
          </View>
        </View>

        {/* Right Amount & Chevron Block */}
        <View style={styles.amountCol}>
          <Text
            style={styles.totalAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.3}>
            {formattedTotal}
          </Text>
          <Text style={styles.chevron} importantForAccessibility="no">
            ›
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    ...Shadows.xs,
  },
  cardCompact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.twoHalf,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.99 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.twoHalf,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  productName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
  multiBadge: {
    backgroundColor: Colors.pastel.blue.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.blue.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  multiBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.blue.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  calculationText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  dotSeparator: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  timeText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  amountCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: Spacing.one,
  },
  totalAmount: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  chevron: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
});

