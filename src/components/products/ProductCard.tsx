import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardBadgeVectorIcon } from '@/components/dashboard/DashboardNavIcons';
import { StockStatusBadge } from '@/components/products/StockStatusBadge';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency, getProductStockStatus } from '@/lib/products';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

/**
 * ProductCard
 *
 * Scannable, mobile-first product list card for TindaMate store vendors.
 * Clearly communicates:
 * - Product name (supports multi-line wrapping for long names)
 * - Category pill (if entered)
 * - Selling price formatted in Philippine Pesos (₱)
 * - Current stock quantity + unit
 * - Stock status badge (In Stock / Low Stock / Out of Stock)
 */
export function ProductCard({ product, onPress }: ProductCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  // Always derive stock status via centralized helper
  const status = getProductStockStatus(
    product.stock_quantity,
    product.low_stock_threshold
  );

  const formattedSellingPrice = formatPesoCurrency(product.selling_price);
  const stockLabel = `${product.stock_quantity} ${product.unit}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${
        product.category ? `${product.category}, ` : ''
      }selling price ${formattedSellingPrice}, stock ${stockLabel}, ${status}`}
      accessibilityHint="Opens product details"
      onPress={() => onPress(product)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}>
      {/* Top Row: Icon + Name/Category + Status Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            status === 'Out of Stock'
              ? { backgroundColor: Colors.errorLight, borderColor: Colors.errorBorder }
              : status === 'Low Stock'
              ? { backgroundColor: Colors.pastel.orange.bg, borderColor: Colors.pastel.orange.border }
              : { backgroundColor: Colors.pastel.green.bg, borderColor: Colors.pastel.green.border },
          ]}
          importantForAccessibility="no-hide-descendants"
          accessible={false}>
          <DashboardBadgeVectorIcon
            type="products"
            color={
              status === 'Out of Stock'
                ? Colors.error
                : status === 'Low Stock'
                ? Colors.pastel.orange.iconBg
                : Colors.primary
            }
          />
        </View>

        <View style={styles.titleColumn}>
          <Text
            style={styles.productName}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}>
            {product.name}
          </Text>

          <View style={styles.metaRow}>
            {product.category ? (
              <View style={styles.categoryPill}>
                <Text
                  style={styles.categoryText}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}>
                  {product.category}
                </Text>
              </View>
            ) : (
              <Text style={styles.uncategorizedText} maxFontSizeMultiplier={1.2}>
                General Item
              </Text>
            )}
          </View>
        </View>

        <StockStatusBadge status={status} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Row: Selling Price & Current Stock */}
      <View style={[styles.bottomRow, isCompactPhone && styles.bottomRowCompact]}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel} maxFontSizeMultiplier={1.2}>
            Selling Price
          </Text>
          <View style={styles.priceValueRow}>
            <Text
              style={styles.priceValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.3}>
              {formattedSellingPrice}
            </Text>
            <Text style={styles.unitSuffix} maxFontSizeMultiplier={1.2}>
              / {product.unit}
            </Text>
          </View>
        </View>

        <View style={[styles.metricBlock, styles.stockBlock]}>
          <Text style={styles.metricLabel} maxFontSizeMultiplier={1.2}>
            Current Stock
          </Text>
          <Text
            style={[
              styles.stockValue,
              status === 'Out of Stock' && { color: Colors.error },
              status === 'Low Stock' && { color: Colors.warningText },
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {stockLabel}
          </Text>
        </View>

        <View style={styles.chevronWrapper} importantForAccessibility="no">
          <Text style={styles.chevron}>›</Text>
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
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  cardCompact: {
    padding: Spacing.twoHalf,
    gap: Spacing.two,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.twoHalf,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  categoryPill: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    maxWidth: '100%',
  },
  categoryText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  uncategorizedText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  bottomRowCompact: {
    gap: Spacing.one,
  },
  metricBlock: {
    flex: 1,
    gap: 2,
  },
  stockBlock: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semiBold,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    flexWrap: 'wrap',
  },
  priceValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  unitSuffix: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  stockValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  chevronWrapper: {
    paddingLeft: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
});

