import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  usePathname,
} from 'expo-router';

import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardBadgeVectorIcon } from '@/components/dashboard/DashboardNavIcons';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { CartItemCard } from '@/components/sales/CartItemCard';
import { CheckoutModal } from '@/components/sales/CheckoutModal';
import { SaleSuccessModal } from '@/components/sales/SaleSuccessModal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { fetchStoreProducts, formatPesoCurrency } from '@/lib/products';
import {
  addProductToCart,
  calculateCartSummary,
  filterSellableProducts,
  generateIdempotencyKey,
  recordCartSale,
  removeCartItem,
  syncCartWithLatestProducts,
  updateCartItemQuantity,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';
import { CartItem, CompletedCartSaleResult } from '@/types/sale';

/**
 * TindaMate Sales Screen (`/sales`)
 *
 * Implements Batch 7B-1: Cart State + Product Selection
 * - In-memory local cart state (`cartItems`) inside React component
 * - Product selection: tap product to add with qty 1 or merge into existing line
 * - Quantity steppers (− / +) capped at currently known available stock
 * - Explicit item removal and "Clear Cart" action
 * - Derived cart counts (total units + unique products) and estimated total (₱)
 * - Clean empty-cart and empty-inventory states
 * - Route-aware persistent bottom navigation
 */
export default function SalesScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;
  const params = useLocalSearchParams<{ productId?: string }>();
  const initialProductId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Local Cart State (Batch 7B-1)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const didApplyInitialProductRef = useRef(false);

  // Local Checkout Modal State (Batch 7B-2)
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  // Atomic Checkout Submission State (Batch 7B-3)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const activeIdempotencyKeyRef = useRef<string | null>(null);

  // Completed Transaction State (Batch 7B-3)
  const [completedSaleResult, setCompletedSaleResult] =
    useState<CompletedCartSaleResult | null>(null);
  const [completedPaymentInfo, setCompletedPaymentInfo] = useState<{
    amountTendered: number;
    change: number;
    priceDifferenceNotice: string | null;
  } | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Derived metrics
  const sellableProducts = filterSellableProducts(allProducts);
  const outOfStockCount = Math.max(
    0,
    allProducts.length - sellableProducts.length
  );
  const cartSummary = calculateCartSummary(cartItems);

  /**
   * Loads store inventory from Supabase and synchronizes the active cart items
   * with current stock quantities and prices.
   */
  const loadAvailableProducts = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        }
        setLoadError(null);

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError) {
          setLoadError(
            'Unable to verify your store session. Check your connection and retry.'
          );
          return;
        }

        if (!sessionData?.session) {
          router.replace('/');
          return;
        }

        const products = await fetchStoreProducts();
        setAllProducts(products);

        // Keep local cart synchronized with latest stock counts
        setCartItems((prev) => syncCartWithLatestProducts(prev, products));

        // If launched with an initial productId param (e.g. from Product details), add to cart
        if (
          initialProductId &&
          !didApplyInitialProductRef.current &&
          products.length > 0
        ) {
          didApplyInitialProductRef.current = true;
          const matching = products.find(
            (item) => item.id === initialProductId && item.stock_quantity > 0
          );
          if (matching) {
            setCartItems((prev) => addProductToCart(prev, matching));
          }
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load store products for sale. Please try again.';
        setLoadError(msg);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [initialProductId]
  );

  useFocusEffect(
    useCallback(() => {
      loadAvailableProducts(false);
    }, [loadAvailableProducts])
  );

  /**
   * Adds a product to the cart:
   * - If not in cart: adds with qty 1
   * - If in cart: increments qty by 1 up to available stock
   */
  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing && existing.quantity >= existing.availableStock) {
        // Already at maximum stock
        return prev;
      }
      return addProductToCart(prev, product);
    });
  };

  /**
   * Increments quantity of an existing cart item by 1 (capped at availableStock)
   */
  const handleIncrement = (productId: string) => {
    setCartItems((prev) => updateCartItemQuantity(prev, productId, +1));
  };

  /**
   * Decrements quantity of an existing cart item by 1 (removes if reaches 0)
   */
  const handleDecrement = (productId: string) => {
    setCartItems((prev) => updateCartItemQuantity(prev, productId, -1));
  };

  /**
   * Explicitly removes a product from the cart
   */
  const handleRemove = (productId: string) => {
    setCartItems((prev) => removeCartItem(prev, productId));
  };

  /**
   * Empties the entire cart
   */
  const handleClearCart = () => {
    setCartItems([]);
  };

  /**
   * Closes the checkout modal and resets idempotency key if not currently submitting.
   */
  const handleCloseCheckout = () => {
    if (isSubmitting) {
      return;
    }
    activeIdempotencyKeyRef.current = null;
    setCheckoutError(null);
    setIsCheckoutVisible(false);
  };

  /**
   * Executes atomic multi-item checkout via `public.record_cart_sale` RPC.
   *
   * Enforces:
   * 1. Double-tap prevention (isSubmitting guard)
   * 2. Idempotency UUID generation and preservation across network retries
   * 3. Server-authoritative totals and stock deductions
   * 4. Cart clearing ONLY on confirmed database success
   * 5. Inventory catalog reload to reflect actual deducted stock
   */
  const handleConfirmSale = async (
    amountTendered: number,
    _estimatedChange: number
  ) => {
    if (isSubmitting) {
      return;
    }

    // 1. Generate or reuse the idempotency key for this checkout attempt
    if (!activeIdempotencyKeyRef.current) {
      activeIdempotencyKeyRef.current = generateIdempotencyKey();
    }
    const idempotencyKey = activeIdempotencyKeyRef.current;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      // 2. Execute atomic database RPC transaction
      const result = await recordCartSale(cartItems, idempotencyKey);

      // 3. Server-authoritative calculations
      const serverTotal = result.sale.total_amount;
      const clientEstimatedTotal = cartSummary.totalAmount;
      const serverTotalCentavos = Math.round(serverTotal * 100);
      const tenderedCentavos = Math.round(amountTendered * 100);
      const actualChangeCentavos = Math.max(
        0,
        tenderedCentavos - serverTotalCentavos
      );
      const actualChange = Number((actualChangeCentavos / 100).toFixed(2));

      let priceNotice: string | null = null;
      if (serverTotal !== clientEstimatedTotal) {
        priceNotice = `Server price applied: Final total is ${formatPesoCurrency(
          serverTotal
        )} (estimated was ${formatPesoCurrency(clientEstimatedTotal)}).`;
      }

      // 4. Reset submission state & idempotency key
      activeIdempotencyKeyRef.current = null;
      setIsSubmitting(false);

      // 5. Clear cart ONLY after confirmed success
      setCartItems([]);

      // 6. Close checkout modal
      setIsCheckoutVisible(false);

      // 7. Store completed sale information and display success modal
      setCompletedSaleResult(result);
      setCompletedPaymentInfo({
        amountTendered,
        change: actualChange,
        priceDifferenceNotice: priceNotice,
      });
      setIsSuccessModalVisible(true);

      // 8. Refresh store inventory from Supabase so stock reflects completed sale
      loadAvailableProducts(false);
    } catch (err) {
      setIsSubmitting(false);
      // Cart remains intact!
      // activeIdempotencyKeyRef.current is intentionally preserved so retry uses the same key
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Could not complete the sale. Please try again.';
      setCheckoutError(errorMsg);
    }
  };

  /**
   * Dismisses the sale success modal to record another sale.
   */
  const handleDismissSuccess = () => {
    setIsSuccessModalVisible(false);
    setCompletedSaleResult(null);
    setCompletedPaymentInfo(null);
  };

  /**
   * Navigates to the transaction details screen.
   */
  const handleViewSaleDetails = (saleId: string) => {
    setIsSuccessModalVisible(false);
    setCompletedSaleResult(null);
    setCompletedPaymentInfo(null);
    router.push(`/sales/${saleId}`);
  };

  const handleBackNavigation = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const handleFutureModuleNotice = (moduleName: string, batchNote: string) => {
    const message = `${moduleName} will be connected to your Supabase store database in ${batchNote}!`;
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(moduleName, message, [{ text: 'Got it!' }]);
    }
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'sales') {
      return;
    }
    if (tab === 'home') {
      router.replace('/home');
      return;
    }
    if (tab === 'products') {
      router.replace('/products');
      return;
    }

    const tabNames: Record<NavTab, string> = {
      home: 'Home',
      products: 'Products Catalog',
      sales: 'Daily Sales & Cashier',
      utang: 'Lista ng Utang',
      more: 'Settings & Profile',
    };
    handleFutureModuleNotice(tabNames[tab], 'an upcoming batch');
  };

  const headerTitle = 'Record Sale';
  const headerSubtitle = isInitialLoading
    ? 'Loading store inventory...'
    : cartSummary.totalItems > 0
    ? `${cartSummary.totalItems} ${
        cartSummary.totalItems === 1 ? 'item' : 'items'
      } in cart · Est. ${formatPesoCurrency(cartSummary.totalAmount)}`
    : `${sellableProducts.length} ${
        sellableProducts.length === 1 ? 'product' : 'products'
      } available to sell`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Screen Header */}
        <ProductScreenHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          showBack={true}
          onBack={handleBackNavigation}
          rightActionLabel="History"
          rightActionAccessibilityLabel="View store sales history log"
          onRightActionPress={() => router.push('/sales/history')}
        />

        {/* Scrollable Body */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadAvailableProducts(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {/* Top-Level Error Banner */}
            {loadError ? (
              <DashboardErrorBanner
                message={loadError}
                onRetry={() => loadAvailableProducts(true)}
                onDismiss={() => setLoadError(null)}
              />
            ) : null}

            {/* 1. Initial Loading State */}
            {isInitialLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Products...</Text>
                <Text style={styles.stateSubtitle}>
                  Checking your store inventory for available products.
                </Text>
              </View>
            ) : loadError && allProducts.length === 0 ? (
              /* 2. Full Error State when initial fetch failed */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>
                <Text style={styles.stateTitle}>Could Not Load Inventory</Text>
                <Text style={styles.stateSubtitle}>{loadError}</Text>
                <View style={styles.stateActionWrap}>
                  <TindaMateButton
                    title="Retry Loading"
                    variant="primary"
                    onPress={() => loadAvailableProducts(true)}
                    accessibilityLabel="Retry loading products for sale"
                  />
                </View>
              </View>
            ) : sellableProducts.length === 0 ? (
              /* 3. Empty State: No Sellable Products Available */
              <View style={styles.emptyCard}>
                <View
                  style={styles.emptyIconCircle}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants">
                  <DashboardBadgeVectorIcon
                    type="record_sale"
                    color={Colors.primary}
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}>
                  {allProducts.length === 0
                    ? 'No products available for sale'
                    : 'No products in stock to sell'}
                </Text>

                <Text
                  style={styles.emptySubtitle}
                  maxFontSizeMultiplier={1.3}>
                  {allProducts.length === 0
                    ? 'Your store has no products yet. Add your first product with available stock so you can start recording sales.'
                    : `All ${allProducts.length} of your store products are currently Out of Stock (0 available). Restock a product in your inventory to record a sale.`}
                </Text>

                <View style={styles.emptyActionsWrap}>
                  {allProducts.length === 0 ? (
                    <TindaMateButton
                      title="Add First Product"
                      variant="primary"
                      showArrow
                      onPress={() => router.push('/products/add')}
                      accessibilityLabel="Add your first product"
                    />
                  ) : (
                    <>
                      <TindaMateButton
                        title="Go to Products to Restock"
                        variant="primary"
                        showArrow
                        onPress={() => router.push('/products')}
                        accessibilityLabel="Go to products list to restock inventory"
                      />
                      <TindaMateButton
                        title="Add New Product"
                        variant="secondary"
                        onPress={() => router.push('/products/add')}
                        accessibilityLabel="Add a new product"
                      />
                    </>
                  )}
                  <TindaMateButton
                    title="Return to Dashboard"
                    variant="ghost"
                    onPress={() => router.replace('/home')}
                    accessibilityLabel="Return to dashboard"
                  />
                </View>
              </View>
            ) : (
              /* 4. Active POS Cart & Product Catalog Layout */
              <>
                {/* A. Estimated Cart Summary Card (shown when cart has items) */}
                {cartItems.length > 0 ? (
                  <View style={styles.cartSummaryCard}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.summaryBadgePill}>
                        <View style={styles.summaryBadgeDot} />
                        <Text style={styles.summaryBadgeText}>Estimated Cart Total</Text>
                      </View>
                      <Text style={styles.summaryCountText}>
                        {cartSummary.totalItems}{' '}
                        {cartSummary.totalItems === 1 ? 'item' : 'items'} (
                        {cartSummary.distinctCount}{' '}
                        {cartSummary.distinctCount === 1 ? 'product' : 'products'})
                      </Text>
                    </View>

                    <Text
                      style={styles.summaryTotalAmount}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      numberOfLines={1}>
                      {formatPesoCurrency(cartSummary.totalAmount)}
                    </Text>

                    <View style={styles.summaryFooterRow}>
                      <Text style={styles.summaryHintText}>
                        Pre-checkout estimate · Tap Proceed to Checkout to enter payment
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* B. Cart Items List OR Empty Cart Card */}
                {cartItems.length > 0 ? (
                  <View style={styles.cartSection}>
                    <SectionHeader
                      title={`Cart Items (${cartSummary.distinctCount})`}
                      actionLabel="Clear All"
                      onActionPress={handleClearCart}
                    />

                    <View style={styles.cartItemsList}>
                      {cartItems.map((item) => (
                        <CartItemCard
                          key={item.productId}
                          item={item}
                          onIncrement={handleIncrement}
                          onDecrement={handleDecrement}
                          onRemove={handleRemove}
                        />
                      ))}
                    </View>

                    {/* Prominent Checkout Action Button */}
                    <View style={styles.checkoutActionWrap}>
                      <TindaMateButton
                        title={`Proceed to Checkout · ${formatPesoCurrency(cartSummary.totalAmount)}`}
                        variant="primary"
                        showArrow
                        onPress={() => setIsCheckoutVisible(true)}
                        accessibilityLabel={`Proceed to checkout with ${cartSummary.totalItems} items for ${formatPesoCurrency(cartSummary.totalAmount)}`}
                      />
                    </View>
                  </View>
                ) : (
                  /* Empty Cart Container */
                  <View style={styles.emptyCartCard}>
                    <View
                      style={styles.emptyCartIconCircle}
                      accessible={false}
                      importantForAccessibility="no-hide-descendants">
                      <DashboardBadgeVectorIcon
                        type="record_sale"
                        color={Colors.primary}
                      />
                    </View>
                    <Text
                      style={styles.emptyCartTitle}
                      accessibilityRole="header">
                      No items in cart yet
                    </Text>
                    <Text style={styles.emptyCartSubtitle}>
                      Tap any in-stock product below to add it to your sale.
                    </Text>
                    <View style={styles.emptyCartActionWrap}>
                      <TindaMateButton
                        title="Proceed to Checkout"
                        variant="primary"
                        disabled={true}
                        onPress={() => {}}
                        accessibilityLabel="Proceed to checkout disabled because cart is empty"
                      />
                    </View>
                  </View>
                )}

                {/* C. Available Products Catalog */}
                <View style={styles.productsSection}>
                  <SectionHeader
                    title={`Available Products (${sellableProducts.length})`}
                  />

                  {outOfStockCount > 0 ? (
                    <View style={styles.hiddenStockNote}>
                      <Text style={styles.hiddenStockNoteText}>
                        Note: {outOfStockCount} out-of-stock{' '}
                        {outOfStockCount === 1 ? 'product is' : 'products are'}{' '}
                        hidden and cannot be added to the cart.
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.productsGrid}>
                    {sellableProducts.map((product) => {
                      const inCartItem = cartItems.find(
                        (c) => c.productId === product.id
                      );
                      const inCartQty = inCartItem?.quantity ?? 0;
                      const isMaxStock = inCartQty >= product.stock_quantity;

                      return (
                        <View
                          key={product.id}
                          style={styles.productCardWrapper}>
                          <ProductCard
                            product={product}
                            onPress={handleAddToCart}
                          />

                          {/* In-Cart Status Pill Indicator */}
                          {inCartQty > 0 ? (
                            <View
                              style={[
                                styles.inCartBadge,
                                isMaxStock && styles.inCartBadgeMax,
                              ]}>
                              <Text
                                style={[
                                  styles.inCartBadgeText,
                                  isMaxStock && styles.inCartBadgeTextMax,
                                ]}>
                                {isMaxStock
                                  ? `✓ Max (${inCartQty} ${product.unit}) in cart`
                                  : `✓ ${inCartQty} ${product.unit} in cart (tap to +1)`}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Persistent Bottom Navigation Bar */}
        <DashboardBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </KeyboardAvoidingView>

      {/* POS Checkout & Payment Modal (Batch 7B-3) */}
      <CheckoutModal
        visible={isCheckoutVisible}
        cartItems={cartItems}
        cartSummary={cartSummary}
        isSubmitting={isSubmitting}
        submissionError={checkoutError}
        onClearError={() => setCheckoutError(null)}
        onClose={handleCloseCheckout}
        onConfirmSale={handleConfirmSale}
      />

      {/* POS Sale Success & Receipt Summary Modal (Batch 7B-3) */}
      <SaleSuccessModal
        visible={isSuccessModalVisible}
        sale={completedSaleResult?.sale ?? null}
        items={completedSaleResult?.items ?? []}
        amountTendered={completedPaymentInfo?.amountTendered ?? null}
        change={completedPaymentInfo?.change ?? 0}
        isRetry={completedSaleResult?.isRetry}
        priceDifferenceNotice={completedPaymentInfo?.priceDifferenceNotice}
        onDismiss={handleDismissSuccess}
        onViewDetails={handleViewSaleDetails}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
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
    gap: Spacing.four,
  },
  // State Cards (Loading & Error)
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    ...Shadows.xs,
  },
  stateTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  stateSubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
  },
  stateActionWrap: {
    width: '100%',
    marginTop: Spacing.two,
  },
  errorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
  },
  // Empty Catalog Card
  emptyCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    ...Shadows.xs,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    ...Shadows.xs,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
    maxWidth: 300,
  },
  emptyActionsWrap: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  // Cart Summary Card
  cartSummaryCard: {
    backgroundColor: Colors.pastel.green.bg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    padding: Spacing.threeHalf,
    gap: Spacing.one,
    ...Shadows.xs,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  summaryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  summaryBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  summaryBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryCountText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  summaryTotalAmount: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    marginVertical: 2,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  summaryHintText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  // Empty Cart Card
  emptyCartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    ...Shadows.xs,
  },
  emptyCartIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyCartTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCartActionWrap: {
    width: '100%',
    maxWidth: 280,
    marginTop: Spacing.sm,
  },
  // Cart Section
  cartSection: {
    gap: Spacing.twoHalf,
  },
  cartItemsList: {
    gap: Spacing.twoHalf,
  },
  checkoutActionWrap: {
    marginTop: Spacing.xs,
  },
  // Products Catalog Section
  productsSection: {
    gap: Spacing.twoHalf,
  },
  hiddenStockNote: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.one,
  },
  hiddenStockNoteText: {
    fontSize: Typography.sizes.caption,
    color: Colors.warningText,
    fontWeight: Typography.weights.semiBold,
  },
  productsGrid: {
    gap: Spacing.twoHalf,
  },
  productCardWrapper: {
    gap: 4,
  },
  inCartBadge: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.twoHalf,
    alignSelf: 'flex-start',
    marginLeft: Spacing.one,
  },
  inCartBadgeMax: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
  },
  inCartBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  inCartBadgeTextMax: {
    color: Colors.warningText,
  },
});
