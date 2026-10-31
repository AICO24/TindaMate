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
 * CartItemCard (TindaMate Design 2.0)
 *
 * Compact, high-density retail POS cart line item row:
 * - Left: Product thumbnail or icon badge
 * - Middle: Product name, unit price, and max-stock warning pill
 * - Right: Compact (− qty +) stepper, bold line subtotal (₱), and quick remove button
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
      <View style={styles.mainRow}>
        {/* Left Thumbnail / Icon */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={150}
            accessibilityLabel={`${item.productName} photo`}
          />
        ) : (
          <View
            style={styles.iconBox}
            importantForAccessibility="no-hide-descendants"
            accessible={false}>
            <DashboardBadgeVectorIcon type="products" color={Colors.primary} />
          </View>
        )}

        {/* Product Name & Unit Price */}
        <View style={styles.infoCol}>
          <Text
            style={styles.productName}
            numberOfLines={1}
            maxFontSizeMultiplier={1.25}>
            {item.productName}
          </Text>
          <Text style={styles.unitPriceText} maxFontSizeMultiplier={1.2}>
            {formattedUnitPrice}{' '}
            <Text style={styles.unitSuffix}>/ {item.unit}</Text>
          </Text>
        </View>

        {/* Compact Stepper (−  qty  +) */}
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
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.stepperButtonPressed,
            ]}>
            <Text style={styles.stepperButtonText}>−</Text>
          </Pressable>

          <Text
            style={styles.quantityText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            {item.quantity}
          </Text>

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
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.stepperButton,
              styles.stepperButtonPlus,
              isAtMaxStock && styles.stepperButtonDisabled,
              pressed && !isAtMaxStock && styles.stepperButtonPressed,
            ]}>
            <Text
              style={[
                styles.stepperButtonText,
                styles.stepperButtonPlusText,
                isAtMaxStock && styles.stepperButtonTextDisabled,
              ]}>
              +
            </Text>
          </Pressable>
        </View>

        {/* Line Subtotal + Remove */}
        <View style={styles.rightCol}>
          <Text
            style={styles.subtotalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.2}>
            {formattedSubtotal}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.productName} from cart`}
            accessibilityHint="Deletes this item line from the cart"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onRemove(item.productId)}
            style={({ pressed }) => [
              styles.removeLink,
              pressed && styles.removeLinkPressed,
            ]}>
            <Text style={styles.removeLinkText}>Remove</Text>
          </Pressable>
        </View>
      </View>

      {isAtMaxStock ? (
        <View style={styles.maxStockBanner}>
          <Text style={styles.maxStockText}>
            Max stock reached ({item.availableStock} {item.unit} available)
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAFCFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDF2EE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  cardCompact: {
    paddingHorizontal: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.surface,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    backgroundColor: Colors.pastel.green.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 1,
  },
  productName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  unitPriceText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  unitSuffix: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.regular,
    color: Colors.textMuted,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPlus: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  stepperButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.8,
  },
  stepperButtonDisabled: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.border,
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  stepperButtonPlusText: {
    color: Colors.primaryDark,
  },
  stepperButtonTextDisabled: {
    color: Colors.textMuted,
  },
  quantityText: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 64,
    gap: 2,
  },
  subtotalValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  removeLink: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  removeLinkPressed: {
    opacity: 0.65,
  },
  removeLinkText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  maxStockBanner: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    marginTop: 2,
  },
  maxStockText: {
    fontSize: 10,
    color: Colors.warningText,
    fontWeight: Typography.weights.semiBold,
  },
});

