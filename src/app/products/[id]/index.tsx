import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { TindaMateLoadingView } from '@/components/animated-icon';
import {
  CartVectorIcon,
  DashboardBadgeVectorIcon,
  NavProductsIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { StockStatusBadge } from '@/components/products/StockStatusBadge';
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
import {
  addProductWithQuantityToCart,
  getCartSnapshot,
  getPersistedCart,
  getProductCartQuantity,
  savePersistedCart,
  subscribeToCartChanges,
} from '@/lib/cartStore';
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
 * - Title, Large Tabular Peso Selling Price (`₱85.00`), and Semantic Stock Pill (`In Stock • 12 pcs`)
 * - 2x2 Inventory & Pricing Metrics Grid (Cost Price, Unit Profit/Margin, Low-Stock Alert, Category & Timestamp)
 * - Quick POS Add-to-Cart Stepper (`− 1 +` + `[ Add to Cart ]` button passing selected quantity)
 * - Clean Action Tiles: `Edit Product & Stock` and `Sales History`
 */
export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [inCartQty, setInCartQty] = useState<number>(() =>
    getProductCartQuantity(getCartSnapshot(), productId)
  );
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getPersistedCart().then((cart) => {
      setInCartQty(getProductCartQuantity(cart, productId));
    });

    const unsubscribe = subscribeToCartChanges((cart) => {
      setInCartQty(getProductCartQuantity(cart, productId));
    });

    return () => {
      unsubscribe();
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
      }
    };
  }, [productId]);

  // Keep selectedQty clamped to remaining available stock not yet in cart
  const remainingAddable = product
    ? Math.max(0, product.stock_quantity - inCartQty)
    : 0;
  const isMaxInCart =
    product !== null &&
    product.stock_quantity > 0 &&
    inCartQty >= product.stock_quantity;

  useEffect(() => {
    if (!product) return;
    if (remainingAddable <= 0) {
      setSelectedQty(1);
    } else if (selectedQty > remainingAddable) {
      setSelectedQty(remainingAddable);
    }
  }, [product, remainingAddable, selectedQty]);

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
        if (item) {
          setSelectedQty((prev) =>
            item.stock_quantity > 0
              ? Math.min(Math.max(1, prev), item.stock_quantity)
              : 1
          );
        }
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

  const handleAddToCart = async () => {
    try {
      if (!product || product.stock_quantity <= 0) return;

      const currentCart = await getPersistedCart();
      const currentInCart = getProductCartQuantity(currentCart, product.id);
      const maxCanAdd = Math.max(0, product.stock_quantity - currentInCart);
      if (maxCanAdd <= 0) {
        return;
      }

      const safeQty = Math.min(Math.max(1, selectedQty), maxCanAdd);
      const updatedCart = addProductWithQuantityToCart(
        currentCart,
        product,
        safeQty
      );
      await savePersistedCart(updatedCart);

      setSelectedQty(1);
      setJustAdded(true);
      if (addedTimerRef.current) {
        clearTimeout(addedTimerRef.current);
      }
      addedTimerRef.current = setTimeout(() => {
        setJustAdded(false);
      }, 1800);
    } catch (err) {
      console.error('[ProductDetails] Error adding to cart:', err);
    }
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

  const hasCostPrice =
    product !== null &&
    product.cost_price !== null &&
    Number.isFinite(product.cost_price);
  const unitProfit =
    hasCostPrice && product
      ? Number((product.selling_price - product.cost_price!).toFixed(2))
      : null;
  const marginPct =
    unitProfit !== null && product && product.selling_price > 0
      ? ((unitProfit / product.selling_price) * 100).toFixed(1)
      : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Deep Green Top Header */}
        <ProductScreenHeader
          title="Product Details"
          subtitle={
            product
              ? product.category?.trim() || 'Store Inventory Item'
              : 'Loading item...'
          }
          onBack={handleBack}
          showCartButton
          rightActionLabel={product ? 'Edit' : undefined}
          rightActionAccessibilityLabel="Edit product details"
          onRightActionPress={product ? handleEdit : undefined}
        />

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
                <TindaMateLoadingView
                  compact
                  message="Loading Product Details..."
                />
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
              <View style={styles.showcaseCard}>
                {/* Centered Product Image Stage with Subtle Organic Accents */}
                <View style={styles.imageStage}>
                  <View style={styles.stageWaveTop} pointerEvents="none" />
                  <View style={styles.stageWaveWarm} pointerEvents="none" />
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

                  <StockStatusBadge
                    status={status}
                    label={`${status} • ${product.stock_quantity} ${product.unit}`}
                    size="md"
                  />
                </View>

                <View style={styles.divider} />

                {/* 2x2 Inventory & Financial Metrics Grid */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsHeading}>
                    Pricing & Inventory Summary
                  </Text>

                  <View
                    style={[
                      styles.metricsGrid,
                      isCompactPhone && styles.metricsGridStacked,
                    ]}>
                    <View style={styles.metricMiniCard}>
                      <Text style={styles.metricLabel}>Cost Price</Text>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {hasCostPrice
                          ? formatPesoCurrency(product.cost_price)
                          : 'Not set'}
                      </Text>
                      <Text style={styles.metricCaption} numberOfLines={1}>
                        {hasCostPrice
                          ? `Purchase cost per ${product.unit}`
                          : 'Tap Edit to add cost'}
                      </Text>
                    </View>

                    <View style={styles.metricMiniCard}>
                      <Text style={styles.metricLabel}>Est. Unit Profit</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          unitProfit !== null && unitProfit > 0
                            ? styles.metricValuePositive
                            : unitProfit !== null && unitProfit < 0
                            ? styles.metricValueNegative
                            : null,
                        ]}
                        numberOfLines={1}>
                        {unitProfit !== null
                          ? `${unitProfit > 0 ? '+' : ''}${formatPesoCurrency(
                              unitProfit
                            )}`
                          : '—'}
                      </Text>
                      <Text style={styles.metricCaption} numberOfLines={1}>
                        {marginPct !== null
                          ? `${marginPct}% gross margin`
                          : 'Requires cost price'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.metricsGrid,
                      isCompactPhone && styles.metricsGridStacked,
                    ]}>
                    <View style={styles.metricMiniCard}>
                      <Text style={styles.metricLabel}>Low-Stock Alert</Text>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {product.low_stock_threshold} {product.unit}
                      </Text>
                      <Text style={styles.metricCaption} numberOfLines={1}>
                        {isOut
                          ? 'Needs immediate restock'
                          : isLow
                          ? 'Below alert threshold'
                          : 'Stock is healthy'}
                      </Text>
                    </View>

                    <View style={styles.metricMiniCard}>
                      <Text style={styles.metricLabel}>Category</Text>
                      <Text style={styles.metricValue} numberOfLines={1}>
                        {product.category?.trim() || 'General'}
                      </Text>
                      <Text style={styles.metricCaption} numberOfLines={1}>
                        Updated {formatTimestamp(product.updated_at)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* POS Quick Add Section: Context Header + Stepper + Add to Cart CTA */}
                <View style={styles.posQuickAddSection}>
                  <View style={styles.posQuickAddHeader}>
                    <Text style={styles.detailsHeading}>Quick Add to Cart</Text>
                    {inCartQty > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${inCartQty} ${product.unit} in cart. Tap to view cart`}
                        onPress={() => router.push('/sales')}
                        style={({ pressed }) => [
                          styles.inCartStatusPill,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text style={styles.inCartStatusPillText}>
                          {inCartQty} in cart • View Cart →
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.posQuickAddRow}>
                    <View style={styles.qtyStepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Decrease quantity"
                        disabled={selectedQty <= 1 || isOut || isMaxInCart}
                        onPress={() =>
                          setSelectedQty((q) => Math.max(1, q - 1))
                        }
                        style={({ pressed }) => [
                          styles.qtyBtn,
                          (selectedQty <= 1 || isOut || isMaxInCart) &&
                            styles.qtyBtnDisabled,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyDisplay}>
                        {isMaxInCart ? 0 : selectedQty}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Increase quantity"
                        disabled={
                          isOut || isMaxInCart || selectedQty >= remainingAddable
                        }
                        onPress={() =>
                          setSelectedQty((q) =>
                            Math.min(remainingAddable, q + 1)
                          )
                        }
                        style={({ pressed }) => [
                          styles.qtyBtn,
                          (isOut ||
                            isMaxInCart ||
                            selectedQty >= remainingAddable) &&
                            styles.qtyBtnDisabled,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        isOut
                          ? 'Out of stock'
                          : isMaxInCart
                          ? `Maximum available stock of ${product.stock_quantity} ${product.unit} already in cart`
                          : `Add ${selectedQty} ${product.unit} of ${product.name} to cart`
                      }
                      disabled={isOut || (isMaxInCart && !justAdded)}
                      onPress={handleAddToCart}
                      style={({ pressed }) => [
                        styles.addToCartButton,
                        justAdded && styles.addToCartButtonSuccess,
                        (isOut || (isMaxInCart && !justAdded)) &&
                          styles.addToCartButtonDisabled,
                        pressed &&
                          !isOut &&
                          !isMaxInCart &&
                          styles.buttonPressed,
                      ]}>
                      <CartVectorIcon color={Colors.textInverse} size={18} />
                      <Text
                        style={styles.addToCartButtonText}
                        numberOfLines={1}>
                        {isOut
                          ? 'Out of Stock'
                          : justAdded
                          ? 'Added to Cart ✓'
                          : isMaxInCart
                          ? 'Max Stock in Cart'
                          : 'Add to Cart'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Bottom Action Tiles: Edit Product & Stock + Sales History */}
                <View style={styles.bottomTilesRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit product details and stock"
                    onPress={handleEdit}
                    style={({ pressed }) => [
                      styles.actionTile,
                      pressed && styles.buttonPressed,
                    ]}>
                    <View style={styles.actionTileIconWrap}>
                      <NavProductsIcon color={Colors.primaryDark} />
                    </View>
                    <Text style={styles.actionTileLabel}>
                      Edit Details & Stock
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View store sales history"
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
                    <Text style={styles.actionTileLabel}>Sales History</Text>
                  </Pressable>
                </View>
              </View>
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
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
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
    borderRadius: BorderRadius.primaryCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.threeHalf,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  imageStage: {
    width: '100%',
    height: 190,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    position: 'relative',
  },
  stageWaveTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#10B981',
    opacity: 0.14,
  },
  stageWaveWarm: {
    position: 'absolute',
    bottom: -60,
    left: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#F59E0B',
    opacity: 0.16,
  },
  heroImage: {
    width: '84%',
    height: '86%',
  },
  fallbackHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
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
    fontSize: 28,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  unitTagText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  detailsSection: {
    gap: 10,
  },
  detailsHeading: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
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
    borderRadius: BorderRadius.md,
    padding: Spacing.twoHalf,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 3,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  metricValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  metricValuePositive: {
    color: Colors.primaryDark,
  },
  metricValueNegative: {
    color: Colors.error,
  },
  metricCaption: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  // POS Quick Add Section
  posQuickAddSection: {
    gap: 10,
  },
  posQuickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inCartStatusPill: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
  },
  inCartStatusPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  posQuickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontVariant: ['tabular-nums'],
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
    backgroundColor: Colors.disabled,
    ...Shadows.none,
  },
  addToCartButtonSuccess: {
    backgroundColor: Colors.secondary,
  },
  addToCartButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
  },
  // Bottom Action Tiles
  bottomTilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionTileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  actionTileLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
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
