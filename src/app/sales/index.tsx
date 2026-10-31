import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
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
import {
  CartVectorIcon,
  DashboardBadgeVectorIcon,
  NavPosIcon,
  NavProductsIcon,
  SearchVectorIcon,
  TrashVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { CartItemCard } from '@/components/sales/CartItemCard';
import { CheckoutModal } from '@/components/sales/CheckoutModal';
import { SaleSuccessModal } from '@/components/sales/SaleSuccessModal';
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
import {
  CartItem,
  CompletedCartSaleResult,
  SalePaymentMethod,
} from '@/types/sale';

/**
 * TindaMate POS / Sales Screen (`/sales`) — Design 2.0
 *
 * Modern mobile retail POS experience:
 * - Deep Green header ("New Sale") with integrated search bar & quick history/clear actions
 * - Category filter chips ("All" + store categories)
 * - 2-column visual POS product grid with product image, name, price, stock indicator & green "+" add button
 * - Integrated Cart panel with compact item rows, quantity steppers, bold total, and dominant Orange Checkout CTA
 * - Preserves 100% of existing cart state, idempotency key, and atomic `record_cart_sale` RPC logic
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

  // POS Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>(
    {}
  );

  // Local Cart State (Batch 7B-1)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const didApplyInitialProductRef = useRef(false);

  // Local Checkout Modal State (Batch 7B-2)
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);

  // Atomic Checkout Submission State (Batch 7B-3)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const activeIdempotencyKeyRef = useRef<string | null>(null);

  // Completed Transaction State (Batch 7B-3 & Batch 8C)
  const [completedSaleResult, setCompletedSaleResult] =
    useState<CompletedCartSaleResult | null>(null);
  const [completedPaymentInfo, setCompletedPaymentInfo] = useState<{
    paymentMethod: SalePaymentMethod;
    amountTendered: number | null;
    change: number;
    customerId?: string | null;
    customerName?: string | null;
    priceDifferenceNotice: string | null;
  } | null>(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Derived metrics
  const sellableProducts = useMemo(
    () => filterSellableProducts(allProducts),
    [allProducts]
  );
  const outOfStockCount = Math.max(
    0,
    allProducts.length - sellableProducts.length
  );
  const cartSummary = useMemo(
    () => calculateCartSummary(cartItems),
    [cartItems]
  );

  // Extract distinct categories from sellable products (plus standard sari-sari fallbacks if uncategorized)
  const categoryOptions = useMemo(() => {
    const distinct = new Set<string>();
    sellableProducts.forEach((p) => {
      const cat = p.category?.trim();
      if (cat) {
        distinct.add(cat);
      }
    });
    const list = Array.from(distinct);
    if (list.length === 0) {
      return ['All', 'Drinks', 'Snacks', 'Canned', 'Others'];
    }
    return ['All', ...list];
  }, [sellableProducts]);

  // Filtered sellable products based on search query & selected category chip
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sellableProducts.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.category ?? '').toLowerCase().includes(q);

      if (!matchesSearch) {
        return false;
      }

      if (selectedCategory === 'All') {
        return true;
      }

      const prodCat = (product.category ?? '').trim().toLowerCase();
      const targetCat = selectedCategory.toLowerCase();
      if (prodCat === targetCat) {
        return true;
      }
      // Smart keyword matching if store products don't have explicit category set
      if (!prodCat) {
        const nameLower = product.name.toLowerCase();
        if (
          targetCat === 'drinks' &&
          (nameLower.includes('cola') ||
            nameLower.includes('juice') ||
            nameLower.includes('milo') ||
            nameLower.includes('coffee') ||
            nameLower.includes('water') ||
            nameLower.includes('milk'))
        ) {
          return true;
        }
        if (
          targetCat === 'snacks' &&
          (nameLower.includes('piattos') ||
            nameLower.includes('chip') ||
            nameLower.includes('biscuit') ||
            nameLower.includes('cracker') ||
            nameLower.includes('bread'))
        ) {
          return true;
        }
        if (
          targetCat === 'canned' &&
          (nameLower.includes('can') ||
            nameLower.includes('sardine') ||
            nameLower.includes('tuna') ||
            nameLower.includes('corned') ||
            nameLower.includes('lucky me') ||
            nameLower.includes('noodle') ||
            nameLower.includes('pancit'))
        ) {
          return true;
        }
        if (targetCat === 'others') {
          return true;
        }
      }
      return false;
    });
  }, [sellableProducts, searchQuery, selectedCategory]);

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
   */
  const handleConfirmSale = async (
    paymentMethod: SalePaymentMethod,
    amountTendered: number | null,
    _estimatedChange: number,
    customerId?: string | null,
    customerName?: string | null
  ) => {
    if (isSubmitting) {
      return;
    }

    if (!activeIdempotencyKeyRef.current) {
      activeIdempotencyKeyRef.current = generateIdempotencyKey();
    }
    const idempotencyKey = activeIdempotencyKeyRef.current;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const result = await recordCartSale(
        cartItems,
        idempotencyKey,
        paymentMethod,
        customerId
      );

      const serverTotal = result.sale.total_amount;
      const clientEstimatedTotal = cartSummary.totalAmount;

      let actualChange = 0;
      if (paymentMethod === 'cash' && amountTendered !== null) {
        const serverTotalCentavos = Math.round(serverTotal * 100);
        const tenderedCentavos = Math.round(amountTendered * 100);
        const actualChangeCentavos = Math.max(
          0,
          tenderedCentavos - serverTotalCentavos
        );
        actualChange = Number((actualChangeCentavos / 100).toFixed(2));
      }

      let priceNotice: string | null = null;
      if (serverTotal !== clientEstimatedTotal) {
        priceNotice = `Server price applied: Final total is ${formatPesoCurrency(
          serverTotal
        )} (estimated was ${formatPesoCurrency(clientEstimatedTotal)}).`;
      }

      activeIdempotencyKeyRef.current = null;
      setIsSubmitting(false);
      setCartItems([]);
      setIsCheckoutVisible(false);

      setCompletedSaleResult(result);
      setCompletedPaymentInfo({
        paymentMethod,
        amountTendered,
        change: actualChange,
        customerId,
        customerName: customerName ?? result.sale.customer_name,
        priceDifferenceNotice: priceNotice,
      });
      setIsSuccessModalVisible(true);

      loadAvailableProducts(false);
    } catch (err) {
      setIsSubmitting(false);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Could not complete the sale. Please try again.';
      setCheckoutError(errorMsg);
    }
  };

  const handleDismissSuccess = () => {
    setIsSuccessModalVisible(false);
    setCompletedSaleResult(null);
    setCompletedPaymentInfo(null);
  };

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
    if (tab === 'utang') {
      router.replace('/customers' as any);
      return;
    }
    if (tab === 'more') {
      router.push('/more' as any);
      return;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Deep Green POS Header + Search Bar */}
        <View style={styles.posHeroHeader}>
          <ProductScreenHeader
            title="New Sale"
            showBack={true}
            onBack={handleBackNavigation}
            rightElement={
              <View style={styles.headerRightActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View sales history"
                  onPress={() => router.push('/sales/history')}
                  style={({ pressed }) => [
                    styles.headerHistoryPill,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.headerHistoryText}>History</Text>
                </Pressable>
                {cartItems.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear cart"
                    onPress={handleClearCart}
                    style={({ pressed }) => [
                      styles.headerIconBtn,
                      pressed && styles.buttonPressed,
                    ]}>
                    <TrashVectorIcon color={Colors.textInverse} size={18} />
                  </Pressable>
                ) : null}
              </View>
            }
          />

          {/* Search Products Input Bar inside Green Header Zone */}
          {!isInitialLoading && sellableProducts.length > 0 ? (
            <View style={styles.searchOuterWrap}>
              <View style={styles.searchBar}>
                <SearchVectorIcon color={Colors.textMuted} size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search products..."
                  placeholderTextColor={Colors.textMuted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCorrect={false}
                  accessibilityLabel="Search products to add to sale"
                />
                {searchQuery.trim().length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </Pressable>
                ) : (
                  <View style={styles.scanIconBadge}>
                    <NavPosIcon color={Colors.primaryDark} />
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </View>

        {/* Scrollable POS Workspace */}
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
                <Text style={styles.stateTitle}>Loading POS Catalog...</Text>
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
              /* 4. Active POS Layout: Category Chips + 2-Column Product Grid + Integrated Cart */
              <>
                {/* Category Filter Chips Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChipsScroll}>
                  {categoryOptions.map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <Pressable
                        key={category}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Filter by ${category}`}
                        onPress={() => setSelectedCategory(category)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextActive,
                          ]}>
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {outOfStockCount > 0 ? (
                  <View style={styles.hiddenStockNote}>
                    <Text style={styles.hiddenStockNoteText}>
                      {outOfStockCount} out-of-stock{' '}
                      {outOfStockCount === 1 ? 'item is' : 'items are'} hidden
                      from POS selection.
                    </Text>
                  </View>
                ) : null}

                {/* 2-Column POS Product Selection Grid */}
                {filteredProducts.length === 0 ? (
                  <View style={styles.noMatchCard}>
                    <Text style={styles.noMatchTitle}>
                      No matching products found
                    </Text>
                    <Text style={styles.noMatchSubtitle}>
                      Try clearing your search or switching category filter.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      style={styles.resetFilterPill}>
                      <Text style={styles.resetFilterText}>Reset Filters</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.posGridContainer}>
                    {filteredProducts.map((product) => {
                      const inCartItem = cartItems.find(
                        (c) => c.productId === product.id
                      );
                      const inCartQty = inCartItem?.quantity ?? 0;
                      const isMaxStock = inCartQty >= product.stock_quantity;
                      const hasValidImage =
                        Boolean(product.image_url?.trim()) &&
                        !failedImageIds[product.id];

                      return (
                        <Pressable
                          key={product.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Add ${product.name}, ${formatPesoCurrency(product.selling_price)}, ${product.stock_quantity} ${product.unit} available`}
                          onPress={() => handleAddToCart(product)}
                          style={({ pressed }) => [
                            styles.posProductTile,
                            isCompactPhone && styles.posProductTileCompact,
                            inCartQty > 0 && styles.posProductTileInCart,
                            pressed && styles.posProductTilePressed,
                          ]}>
                          {/* Top Image / Icon Box */}
                          <View style={styles.posImageStage}>
                            {hasValidImage ? (
                              <Image
                                source={{ uri: product.image_url!.trim() }}
                                style={styles.posProductImage}
                                contentFit="contain"
                                transition={150}
                                onError={() =>
                                  setFailedImageIds((prev) => ({
                                    ...prev,
                                    [product.id]: true,
                                  }))
                                }
                              />
                            ) : (
                              <View style={styles.posFallbackIconWrap}>
                                <NavProductsIcon color={Colors.primary} />
                              </View>
                            )}

                            {/* In-Cart Quantity Badge overlay */}
                            {inCartQty > 0 ? (
                              <View
                                style={[
                                  styles.tileQtyBadge,
                                  isMaxStock && styles.tileQtyBadgeMax,
                                ]}>
                                <Text style={styles.tileQtyBadgeText}>
                                  {inCartQty} in cart
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Bottom Info + Circular Green "+" Add Button */}
                          <View style={styles.posTileFooter}>
                            <View style={styles.posTileTextCol}>
                              <Text
                                style={styles.posProductName}
                                numberOfLines={1}
                                maxFontSizeMultiplier={1.2}>
                                {product.name}
                              </Text>
                              <Text
                                style={styles.posProductPrice}
                                numberOfLines={1}>
                                {formatPesoCurrency(product.selling_price)}
                              </Text>
                              <Text
                                style={styles.posProductStock}
                                numberOfLines={1}>
                                {product.stock_quantity} {product.unit} left
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.posAddCircleBtn,
                                isMaxStock && styles.posAddCircleBtnDisabled,
                              ]}>
                              <Text style={styles.posAddCirclePlus}>
                                {isMaxStock ? '✓' : '+'}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {/* Integrated POS Cart Panel */}
                <View style={styles.integratedCartCard}>
                  <View style={styles.cartHeaderRow}>
                    <View style={styles.cartHeaderLeft}>
                      <Text style={styles.cartHeaderTitle}>
                        Cart ({cartSummary.totalItems})
                      </Text>
                      {cartSummary.distinctCount > 0 ? (
                        <View style={styles.cartDistinctBadge}>
                          <Text style={styles.cartDistinctBadgeText}>
                            {cartSummary.distinctCount}{' '}
                            {cartSummary.distinctCount === 1 ? 'item' : 'items'}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {cartItems.length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear all items from cart"
                        onPress={handleClearCart}
                        style={({ pressed }) => [
                          styles.clearCartActionBtn,
                          pressed && styles.buttonPressed,
                        ]}>
                        <TrashVectorIcon color={Colors.error} size={14} />
                        <Text style={styles.clearCartActionText}>Clear</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {cartItems.length > 0 ? (
                    <>
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

                      <View style={styles.cartDivider} />

                      {/* Total Row */}
                      <View style={styles.cartTotalRow}>
                        <Text style={styles.cartTotalLabel}>Total:</Text>
                        <Text
                          style={styles.cartTotalValue}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                          numberOfLines={1}>
                          {formatPesoCurrency(cartSummary.totalAmount)}
                        </Text>
                      </View>

                      {/* Dominant Orange Checkout CTA */}
                      <TindaMateButton
                        title="Checkout"
                        variant="accent"
                        showArrow
                        leftIcon={
                          <CartVectorIcon color={Colors.textInverse} size={19} />
                        }
                        onPress={() => setIsCheckoutVisible(true)}
                        accessibilityLabel={`Checkout with ${cartSummary.totalItems} items for ${formatPesoCurrency(cartSummary.totalAmount)}`}
                      />
                    </>
                  ) : (
                    /* Empty Cart State inside Integrated Panel */
                    <View style={styles.emptyCartInner}>
                      <View style={styles.emptyCartIconCircle}>
                        <CartVectorIcon color={Colors.primary} size={22} />
                      </View>
                      <Text style={styles.emptyCartTitle}>
                        Your cart is empty
                      </Text>
                      <Text style={styles.emptyCartSubtitle}>
                        Tap any product card above to add items to this sale.
                      </Text>
                      <View style={styles.emptyCartActionWrap}>
                        <TindaMateButton
                          title="Checkout"
                          variant="accent"
                          disabled={true}
                          showArrow
                          onPress={() => {}}
                          accessibilityLabel="Checkout disabled because cart is empty"
                        />
                      </View>
                    </View>
                  )}
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
    backgroundColor: Colors.primaryDark,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  posHeroHeader: {
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: Spacing.twoHalf,
    ...Shadows.sm,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerHistoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerHistoryText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchOuterWrap: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.threeHalf,
    paddingRight: 8,
    minHeight: 46,
    gap: 10,
    ...Shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  clearSearchBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  scanIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Category Filter Chips
  categoryChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
  },
  hiddenStockNote: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  hiddenStockNoteText: {
    fontSize: Typography.sizes.caption,
    color: Colors.warningText,
    fontWeight: Typography.weights.semiBold,
  },
  // 2-Column POS Product Grid
  posGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  posProductTile: {
    width: '48.2%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDF2EE',
    padding: 12,
    gap: 8,
    ...Shadows.sm,
  },
  posProductTileCompact: {
    width: '100%',
  },
  posProductTileInCart: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#FCFDFC',
  },
  posProductTilePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  posImageStage: {
    width: '100%',
    height: 104,
    borderRadius: 16,
    backgroundColor: '#F8FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  posProductImage: {
    width: '88%',
    height: '88%',
  },
  posFallbackIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileQtyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tileQtyBadgeMax: {
    backgroundColor: Colors.accent,
  },
  tileQtyBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
  },
  posTileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 2,
  },
  posTileTextCol: {
    flex: 1,
    gap: 1,
  },
  posProductName: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  posProductPrice: {
    fontSize: 15,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  posProductStock: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  posAddCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D7A4D',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  posAddCircleBtnDisabled: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  posAddCirclePlus: {
    fontSize: 20,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
    lineHeight: 22,
  },
  // No Match Filter State
  noMatchCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 6,
    ...Shadows.xs,
  },
  noMatchTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  noMatchSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resetFilterPill: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  resetFilterText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  // Integrated Cart Container
  integratedCartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.threeHalf,
    gap: Spacing.twoHalf,
    ...Shadows.md,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartHeaderTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  cartDistinctBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  cartDistinctBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  clearCartActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
  },
  clearCartActionText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  cartItemsList: {
    gap: 8,
  },
  cartDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 2,
  },
  cartTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cartTotalLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  cartTotalValue: {
    fontSize: 22,
    fontWeight: Typography.weights.extraBold,
    color: '#064E3B',
    letterSpacing: -0.4,
  },
  emptyCartInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: 6,
  },
  emptyCartIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyCartTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  emptyCartSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyCartActionWrap: {
    width: '100%',
    marginTop: Spacing.two,
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
  buttonPressed: {
    opacity: 0.85,
  },
});
