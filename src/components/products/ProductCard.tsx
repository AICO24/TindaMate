import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';

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
 * ProductCard — TindaMate Design 2.0 (3-Zone Retail Layout)
 *
 * Compact, scannable horizontal product row card for TindaMate store inventory:
 * - Left: 56x56 rounded product image container (cover fit) or semantic store icon
 * - Middle: Product name (15px bold) and category + unit metadata
 * - Right: Prominent tabular Peso selling price (#064E3B) stacked above a semantic
 *   StockStatusBadge pill with visible unit ("24 pcs", "Low • 3 pcs", "Out of Stock") + chevron
 */
export function ProductCard({ product, onPress }: ProductCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;
  const [imageError, setImageError] = useState(false);

  const status = getProductStockStatus(
    product.stock_quantity,
    product.low_stock_threshold
  );

  const formattedSellingPrice = formatPesoCurrency(product.selling_price);
  const stockLabel = `${product.stock_quantity} ${product.unit}`;
  const hasValidImage = Boolean(product.image_url?.trim()) && !imageError;

  const isOut = status === 'Out of Stock';
  const isLow = status === 'Low Stock';

  const badgeText = isOut
    ? 'Out of Stock'
    : isLow
    ? `Low • ${stockLabel}`
    : stockLabel;

  const categoryText = product.category?.trim() || 'General';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${
        product.category ? `${product.category}, ` : ''
      }selling price ${formattedSellingPrice} per ${product.unit}, stock ${stockLabel}, ${status}`}
      accessibilityHint="Opens product details"
      onPress={() => onPress(product)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}>
      {/* Left Zone: Product Image or Semantic Icon Box */}
      {hasValidImage ? (
        <View style={styles.imageBox}>
          <Image
            source={{ uri: product.image_url!.trim() }}
            style={styles.productThumbnail}
            contentFit="cover"
            transition={180}
            onError={() => setImageError(true)}
            accessibilityLabel={`${product.name} photo`}
          />
        </View>
      ) : (
        <View
          style={[
            styles.iconBox,
            isOut
              ? styles.iconBoxOut
              : isLow
              ? styles.iconBoxLow
              : styles.iconBoxHealthy,
          ]}
          importantForAccessibility="no-hide-descendants"
          accessible={false}>
          <DashboardBadgeVectorIcon
            type="products"
            color={
              isOut
                ? Colors.error
                : isLow
                ? Colors.accent
                : Colors.primary
            }
          />
        </View>
      )}

      {/* Middle Zone: Product Name & Category / Unit Metadata */}
      <View style={styles.infoColumn}>
        <Text
          style={styles.productName}
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.25}>
          {product.name}
        </Text>

        <View style={styles.metaRow}>
          <Text
            style={styles.categorySubtext}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.2}>
            {categoryText}
          </Text>
          <Text style={styles.metaDot} importantForAccessibility="no">
            •
          </Text>
          <Text
            style={styles.unitSubtext}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            per {product.unit}
          </Text>
        </View>
      </View>

      {/* Right Zone: Tabular Selling Price + Stock Status Pill */}
      <View style={styles.rightMetricsColumn}>
        <Text
          style={styles.priceValue}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}>
          {formattedSellingPrice}
        </Text>

        <StockStatusBadge
          status={status}
          label={badgeText}
          size="sm"
        />
      </View>

      {/* Far Right: Navigation Chevron */}
      <View style={styles.chevronWrapper} importantForAccessibility="no">
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    gap: 12,
    ...Shadows.xs,
  },
  cardCompact: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.twoHalf,
    gap: 10,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.992 }],
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productThumbnail: {
    width: '100%',
    height: '100%',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxHealthy: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  iconBoxLow: {
    backgroundColor: Colors.pastel.orange.bg,
    borderColor: Colors.pastel.orange.border,
  },
  iconBoxOut: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
    minWidth: 0,
  },
  productName: {
    fontSize: 15,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  categorySubtext: {
    flexShrink: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  unitSubtext: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  rightMetricsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    marginLeft: 2,
  },
  priceValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  chevronWrapper: {
    paddingLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
});
