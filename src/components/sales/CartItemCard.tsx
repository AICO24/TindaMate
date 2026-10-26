import React from 'react';
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
import { formatPesoCurrency } from '@/lib/products';
import { CartItem } from '@/types/sale';

interface CartItemCardProps {
  item: CartItem;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

/**
 * CartItemCard
 *
 * Mobile-first list item card representing an active product line item in the POS cart:
 * - Product Name, category/unit, and unit price
 * - Interactive − / + quantity stepper controls
 * - Line item subtotal (quantity × unit price)
 * - Explicit "Remove" action button
 * - Stock limit indicator when cart quantity reaches available store stock
 */
export function CartItemCard({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const isAtMaxStock = item.quantity >= item.availableStock;
  const formattedUnitPrice = formatPesoCurrency(item.sellingPrice);
  const formattedSubtotal = formatPesoCurrency(item.subtotal);

  return (
    <View style={[styles.card, isCompactPhone && styles.cardCompact]}>
      {/* Top Row: Thumbnail/Icon + Name/Meta + Remove Action */}
      <View style={styles.topRow}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={150}
            accessibilityLabel={`${item.productName} photo`}
          />
        ) : (
          <View style={styles.iconBox} importantForAccessibility="no-hide-descendants" accessible={false}>
            <DashboardBadgeVectorIcon type="products" color={Colors.primary} />
          </View>
        )}

        <View style={styles.infoCol}>
          <Text
            style={styles.productName}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}>
            {item.productName}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.unitPriceText} maxFontSizeMultiplier={1.2}>
              {formattedUnitPrice} <Text style={styles.unitSuffix}>/ {item.unit}</Text>
            </Text>
            {item.category ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {item.category}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Remove Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.productName} from cart`}
          accessibilityHint="Deletes this item line from the cart"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onRemove(item.productId)}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>
      </View>

      {/* Stock warning pill if quantity reaches or exceeds available store stock */}
      {isAtMaxStock ? (
        <View style={styles.maxStockBanner}>
          <Text style={styles.maxStockText}>
            Max stock reached ({item.availableStock} {item.unit} available)
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Bottom Row: Stepper Controls + Line Subtotal */}
      <View style={styles.bottomRow}>
        {/* Quantity Stepper */}
        <View style={styles.stepperContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity for ${item.productName}`}
            accessibilityHint={
              item.quantity === 1
                ? 'Decreasing will remove item from cart'
                : 'Decreases quantity by 1'
            }
            onPress={() => onDecrement(item.productId)}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.stepperButtonPressed,
            ]}>
            <Text style={styles.stepperButtonText}>−</Text>
          </Pressable>

          <View style={styles.quantityDisplayBox}>
            <Text
              style={styles.quantityText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.25}>
              {item.quantity}
            </Text>
            <Text style={styles.quantityUnitText} numberOfLines={1}>
              {item.unit}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity for ${item.productName}`}
            accessibilityHint={
              isAtMaxStock
                ? 'Cannot increase, stock limit reached'
                : 'Increases quantity by 1'
            }
            disabled={isAtMaxStock}
            onPress={() => onIncrement(item.productId)}
            style={({ pressed }) => [
              styles.stepperButton,
              isAtMaxStock && styles.stepperButtonDisabled,
              pressed && !isAtMaxStock && styles.stepperButtonPressed,
            ]}>
            <Text
              style={[
                styles.stepperButtonText,
                isAtMaxStock && styles.stepperButtonTextDisabled,
              ]}>
              +
            </Text>
          </Pressable>
        </View>

        {/* Subtotal Display */}
        <View style={styles.subtotalCol}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text
            style={styles.subtotalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.3}>
            {formattedSubtotal}
          </Text>
        </View>
      </View>
    </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.twoHalf,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    backgroundColor: Colors.pastel.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  productName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  unitPriceText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.primaryDark,
  },
  unitSuffix: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.regular,
    color: Colors.textMuted,
  },
  dotSeparator: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  categoryText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  removeButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  removeButtonPressed: {
    opacity: 0.7,
  },
  removeButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  maxStockBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  maxStockText: {
    fontSize: Typography.sizes.caption,
    color: Colors.warningText,
    fontWeight: Typography.weights.semiBold,
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
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPressed: {
    backgroundColor: Colors.primaryLight,
    transform: [{ scale: 0.95 }],
  },
  stepperButtonDisabled: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.border,
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    lineHeight: 22,
  },
  stepperButtonTextDisabled: {
    color: Colors.textMuted,
  },
  quantityDisplayBox: {
    minWidth: 44,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  quantityUnitText: {
    fontSize: 10,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    marginTop: -2,
  },
  subtotalCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  subtotalLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  subtotalValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
});

