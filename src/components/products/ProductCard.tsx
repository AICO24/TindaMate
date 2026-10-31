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
 * ProductCard — TindaMate Design 2.0
 *
 * Compact, scannable horizontal product row card for TindaMate store inventory:
 * - Left: 56x56 rounded product image container or semantic store icon
 * - Middle: Product name, bold Peso selling price, and semantic stock quantity pill
 *   (Green for healthy stock, warm orange/amber pill for low stock, red pill for out of stock)
 * - Right: Category tag (if set) & navigation chevron
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
      {/* Left: Product Image or Semantic Icon Box */}
      {hasValidImage ? (
        <View style={styles.imageBox}>
          <Image
            source={{ uri: product.image_url!.trim() }}
            style={styles.productThumbnail}
            contentFit="contain"
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

      {/* Middle: Name, Price, Stock Status Pill */}
      <View style={styles.infoColumn}>
        <Text
          style={styles.productName}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text
            style={styles.priceValue}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {formattedSellingPrice}
          </Text>
          {product.unit ? (
            <Text style={styles.unitSuffix} numberOfLines={1}>
              / {product.unit}
            </Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.stockPill,
              isOut
                ? styles.stockPillOut
                : isLow
                ? styles.stockPillLow
                : styles.stockPillHealthy,
            ]}>
            <Text
              style={[
                styles.stockPillText,
                isOut
                  ? styles.stockPillTextOut
                  : isLow
                  ? styles.stockPillTextLow
                  : styles.stockPillTextHealthy,
              ]}
              numberOfLines={1}>
              {isOut
                ? 'Out of Stock (0)'
                : `Stock: ${product.stock_quantity}`}
            </Text>
          </View>

          {product.category ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText} numberOfLines={1}>
                {product.category}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right: Chevron */}
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
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    gap: 14,
    ...Shadows.sm,
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
    width: 58,
    height: 58,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productThumbnail: {
    width: '86%',
    height: '86%',
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.lg,
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
    gap: 3,
  },
  productName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  unitSuffix: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  stockPillHealthy: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  stockPillLow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stockPillOut: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  stockPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  stockPillTextHealthy: {
    color: Colors.primary,
  },
  stockPillTextLow: {
    color: Colors.accent,
  },
  stockPillTextOut: {
    color: Colors.error,
  },
  categoryTag: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  chevronWrapper: {
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
});
