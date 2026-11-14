import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import {
  DashboardBadgeVectorIcon,
  TrashVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
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
 * CartItemCard (TindaMate Design 2.0 — Batch S-1)
 *
 * Ergonomic two-tier retail POS cart line item card:
 * - Top row: Product thumbnail/icon, full 2-line product name, unit price, and explicit Remove button (`TrashVectorIcon`)
 * - Bottom row: Stock / max-stock indicator, accessible 34x34 quantity stepper (`− qty +`), and aligned `tabular-nums` line subtotal
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
      {/* Top Section: Thumbnail + Product Name + Unit Price + Remove Button */}
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
          <View
            style={styles.iconBox}
            importantForAccessibility="no-hide-descendants"
            accessible={false}>
            <DashboardBadgeVectorIcon type="products" color={Colors.primary} />
          </View>
        )}

        <View style={styles.infoCol}>
          <Text
            style={styles.productName}
            numberOfLines={2}
            maxFontSizeMultiplier={1.25}>
            {item.productName}
          </Text>
          <Text style={styles.unitPriceText} maxFontSizeMultiplier={1.2}>
            {formattedUnitPrice}{' '}
            <Text style={styles.unitSuffix}>/ {item.unit}</Text>
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.productName} from cart`}
          accessibilityHint="Removes this item completely from the current sale"
          onPress={() => onRemove(item.productId)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}>
          <TrashVectorIcon color={Colors.error} size={16} />
        </Pressable>
      </View>

      {/* Bottom Section: Stock Indicator + Stepper + Line Subtotal */}
      <View style={styles.bottomRow}>
        <View style={styles.stockStatusCol}>
          {isAtMaxStock ? (
            <View style={styles.maxStockPill}>
              <Text style={styles.maxStockText} numberOfLines={1}>
                Max stock ({item.availableStock} {item.unit})
              </Text>
            </View>
          ) : (
            <Text style={styles.availableStockText} numberOfLines={1}>
              {item.availableStock} {item.unit} in stock
            </Text>
          )}
        </View>

        <View style={styles.controlsRightGroup}>
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

          <Text
            style={styles.subtotalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.2}>
            {formattedSubtotal}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.twoHalf,
    gap: Spacing.two,
  },
  cardCompact: {
    padding: Spacing.two,
    gap: Spacing.one + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.twoHalf,
  },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  productName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  unitPriceText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  unitSuffix: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.regular,
    color: Colors.textMuted,
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  stockStatusCol: {
    flex: 1,
    justifyContent: 'center',
  },
  availableStockText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  maxStockPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  maxStockText: {
    fontSize: 11,
    color: Colors.warningText,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  controlsRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundAlt,
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
    transform: [{ scale: 0.93 }],
    opacity: 0.85,
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
    minWidth: 22,
    textAlign: 'center',
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  subtotalValue: {
    minWidth: 68,
    textAlign: 'right',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
});
