import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import {
  CartVectorIcon,
  DashboardBadgeVectorIcon,
  NavProductsIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  fetchStoreProductById,
  formatPesoCurrency,
  getProductStockStatus,
} from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * TindaMate Product Details Screen (`/products/[id]`) — Design 2.0
 *
 * Showcase product detail view matching the Design 2.0 visual reference:
 * - Deep Green Header with Back & Edit actions
 * - Centered Product Hero Showcase (Image or Icon Stage)
 * - Title, Large Peso Selling Price (`₱85.00`), and Semantic Stock Pill (`In Stock • 12 pcs`)
 * - Product Details & Pricing/Margin breakdown card
 * - Quick POS Add-to-Cart Stepper (`− 1 +` + `[ Add to Cart ]` button)
 * - 3 Quick Action Tiles: `Edit`, `Adjust Stock`, `View History`
 */
export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProduct = useCallback(
    async (showRefresh = false) => {
      if (!productId) {
        setErrorMessage('Invalid product ID.');
        setIsLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setIsRefreshing(true);
        }
        setErrorMessage(null);

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          router.replace('/');
          return;
        }

        const item = await fetchStoreProductById(productId);
        setProduct(item);
        setImageError(false);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load product details. Please try again.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [productId]
  );

  useFocusEffect(
    useCallback(() => {
      loadProduct(false);
    }, [loadProduct])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products');
    }
  };

  const handleEdit = () => {
    if (!product) return;
    router.push(`/products/${product.id}/edit`);
  };

  const handleAddToPosCart = () => {
    if (!product || product.stock_quantity <= 0) return;
    router.push({
      pathname: '/sales',
      params: { productId: product.id },
    } as any);
  };

  const status = product
    ? getProductStockStatus(
        product.stock_quantity,
        product.low_stock_threshold
      )
    : 'In Stock';

  const isOut = status === 'Out of Stock';
  const isLow = status === 'Low Stock';
  const hasValidImage = Boolean(product?.image_url?.trim()) && !imageError;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Deep Green Top Header */}
        <View style={styles.heroHeaderZone}>
          <ProductScreenHeader
            title="Product Details"
            onBack={handleBack}
            rightActionLabel={product ? 'Edit' : undefined}
            rightActionAccessibilityLabel="Edit this product"
            onRightActionPress={product ? handleEdit : undefined}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadProduct(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadProduct(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Product Details...</Text>
              </View>
            ) : !product ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Product Not Found</Text>
                <Text style={styles.stateSubtitle}>
                  {errorMessage ??
                    'This product could not be found or does not belong to your store.'}
                </Text>
                <View style={styles.stateActions}>
                  {errorMessage ? (
                    <TindaMateButton
                      title="Retry"
                      variant="primary"
                      onPress={() => loadProduct(true)}
                    />
                  ) : null}
                  <TindaMateButton
                    title="Back to Products"
                    variant="secondary"
                    onPress={() => router.replace('/products')}
                  />
                </View>
              </View>
            ) : (
              <>
                {/* Main Product Showcase Card */}
                <View style={styles.showcaseCard}>
                  {/* Centered Product Image Stage */}
                  <View style={styles.imageStage}>
                    {hasValidImage ? (
                      <Image
                        source={{ uri: product.image_url!.trim() }}
                        style={styles.heroImage}
                        contentFit="contain"
                        transition={200}
                        onError={() => setImageError(true)}
                        accessibilityLabel={`${product.name} photo`}
                      />
                    ) : (
                      <View style={styles.fallbackHeroIcon}>
                        <NavProductsIcon color={Colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Product Name */}
                  <Text
                    style={styles.productTitle}
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1.3}>
                    {product.name}
                  </Text>

                  {/* Price & Stock Status Pill Row */}
                  <View style={styles.priceStockRow}>
                    <View style={styles.priceWrap}>
                      <Text
                        style={styles.sellingPriceBig}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        numberOfLines={1}>
                        {formatPesoCurrency(product.selling_price)}
                      </Text>
                      <Text style={styles.unitTagText}>/ {product.unit}</Text>
                    </View>

                    <View
                      style={[
                        styles.stockStatusPill,
                        isOut
                          ? styles.stockStatusPillOut
                          : isLow
                          ? styles.stockStatusPillLow
                          : styles.stockStatusPillHealthy,
                      ]}>
                      <Text
                        style={[
                          styles.stockStatusPillText,
                          isOut
                            ? styles.stockStatusTextOut
                            : isLow
                            ? styles.stockStatusTextLow
                            : styles.stockStatusTextHealthy,
                        ]}>
                        {status} • {product.stock_quantity} {product.unit}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Product Details Box */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsHeading}>Product Details</Text>
                    <View style={styles.detailsDescriptionBox}>
                      <Text style={styles.detailsDescriptionText}>
                        {product.category
                          ? `${product.category} item sold per ${product.unit}. `
                          : `Store inventory item sold per ${product.unit}. `}
                        {isOut
                          ? 'Currently out of stock — tap Adjust Stock below to replenish inventory.'
                          : isLow
                          ? `Low stock alert active (threshold: ${product.low_stock_threshold} ${product.unit}).`
                          : `Ready for POS checkout (${product.stock_quantity} ${product.unit} available in store).`}
                      </Text>
                    </View>

                    {/* Cost Price & Profit Margin Row */}
                    <View
                      style={[
                        styles.metricsGrid,
                        isCompactPhone && styles.metricsGridStacked,
                      ]}>
                      <View style={styles.metricMiniCard}>
                        <Text style={styles.metricLabel}>Cost Price (COGS)</Text>
                        <Text style={styles.metricValue}>
                          {product.cost_price !== null
                            ? formatPesoCurrency(product.cost_price)
                            : 'Not set'}
                        </Text>
                        <Text style={styles.metricCaption}>
                          {product.cost_price !== null
                            ? `Margin: ${formatPesoCurrency(
                                product.selling_price - product.cost_price
                              )} / ${product.unit}`
                            : 'Optional unit cost'}
                        </Text>
                      </View>

                      <View style={styles.metricMiniCard}>
                        <Text style={styles.metricLabel}>Alert Threshold</Text>
                        <Text style={styles.metricValue}>
                          {product.low_stock_threshold} {product.unit}
                        </Text>
                        <Text style={styles.metricCaption}>
                          Updated {formatTimestamp(product.updated_at)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* POS Quick Add Row: Stepper + Add to Cart CTA */}
                  <View style={styles.posQuickAddRow}>
                    <View style={styles.qtyStepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                        disabled={selectedQty <= 1 || isOut}
                        onPress={() =>
                          setSelectedQty((q) => Math.max(1, q - 1))
                        }
                        style={({ pressed }) => [
                          styles.qtyBtn,
                          (selectedQty <= 1 || isOut) && styles.qtyBtnDisabled,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyDisplay}>{selectedQty}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                        disabled={
                          isOut || selectedQty >= product.stock_quantity
                        }
                        onPress={() =>
                          setSelectedQty((q) =>
                            Math.min(product.stock_quantity, q + 1)
                          )
                        }
                        style={({ pressed }) => [
                          styles.qtyBtn,
                          (isOut || selectedQty >= product.stock_quantity) &&
                            styles.qtyBtnDisabled,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${product.name} to POS cart`}
                      disabled={isOut}
                      onPress={handleAddToPosCart}
                      style={({ pressed }) => [
                        styles.addToCartButton,
                        isOut && styles.addToCartButtonDisabled,
                        pressed && !isOut && styles.buttonPressed,
                      ]}>
                      <CartVectorIcon color={Colors.textInverse} size={18} />
                      <Text style={styles.addToCartButtonText}>
                        {isOut ? 'Out of Stock' : 'Add to Cart'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* 3 Quick Action Tiles: Edit, Adjust Stock, View History */}
                  <View style={styles.bottomTilesRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Edit product details"
                      onPress={handleEdit}
                      style={({ pressed }) => [
                        styles.actionTile,
                        pressed && styles.buttonPressed,
                      ]}>
                      <View style={styles.actionTileIconWrap}>
                        <Text style={styles.actionTileGlyph}>✎</Text>
                      </View>
                      <Text style={styles.actionTileLabel}>Edit</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Adjust product stock"
                      onPress={handleEdit}
                      style={({ pressed }) => [
                        styles.actionTile,
                        pressed && styles.buttonPressed,
                      ]}>
                      <View style={styles.actionTileIconWrap}>
                        <NavProductsIcon color={Colors.primaryDark} />
                      </View>
                      <Text style={styles.actionTileLabel}>Adjust Stock</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="View sales history"
                      onPress={() => router.push('/sales/history')}
                      style={({ pressed }) => [
                        styles.actionTile,
                        pressed && styles.buttonPressed,
                      ]}>
                      <View style={styles.actionTileIconWrap}>
                        <DashboardBadgeVectorIcon
                          type="sales_history"
                          color={Colors.primaryDark}
                        />
                      </View>
                      <Text style={styles.actionTileLabel}>View History</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroHeaderZone: {
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: Spacing.one,
    ...Shadows.sm,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  showcaseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.md,
  },
  imageStage: {
    width: '100%',
    height: 190,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  heroImage: {
    width: '82%',
    height: '86%',
  },
  fallbackHeroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  sellingPriceBig: {
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: -0.5,
  },
  unitTagText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  stockStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  stockStatusPillHealthy: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stockStatusPillLow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stockStatusPillOut: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  stockStatusPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
  },
  stockStatusTextHealthy: {
    color: Colors.primaryDark,
  },
  stockStatusTextLow: {
    color: Colors.warningText,
  },
  stockStatusTextOut: {
    color: Colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  detailsSection: {
    gap: 10,
  },
  detailsHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  detailsDescriptionBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  detailsDescriptionText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.normal,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricsGridStacked: {
    flexDirection: 'column',
  },
  metricMiniCard: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.twoHalf,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  metricCaption: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  // POS Quick Add Row
  posQuickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    lineHeight: 22,
  },
  qtyDisplay: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    gap: 8,
    paddingHorizontal: Spacing.three,
    ...Shadows.primaryButton,
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  addToCartButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
  },
  // Bottom 3 Action Tiles
  bottomTilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionTileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  actionTileGlyph: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  actionTileLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    ...Shadows.xs,
  },
  stateTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
  },
  stateActions: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
