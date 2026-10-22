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
import { StockStatusBadge } from '@/components/products/StockStatusBadge';
import { CheckIcon } from '@/components/ui/AuthIcons';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  fetchStoreProducts,
  formatPesoCurrency,
  getProductStockStatus,
} from '@/lib/products';
import {
  calculateSaleTotal,
  filterSellableProducts,
  recordProductSale,
  validateSaleQuantity,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';
import { CompletedSaleResult } from '@/types/sale';

type SaleStep =
  | 'select_product'
  | 'enter_quantity'
  | 'review_sale'
  | 'sale_success';

const QUICK_QUANTITIES = [1, 2, 3, 5] as const;

/**
 * TindaMate Sales Screen (`/sales`)
 *
 * Implements the Batch 4 Sales Feature Foundation workflow:
 *   Select Product -> Enter Quantity -> Calculate Sale Total ->
 *   Validate Stock -> Review Sale -> Confirm Sale ->
 *   Save Sale & Deduct Stock -> Show Success Result
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

  // Sale workflow state
  const [step, setStep] = useState<SaleStep>('select_product');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [quantityFieldError, setQuantityFieldError] = useState<string | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResult, setCompletedResult] =
    useState<CompletedSaleResult | null>(null);

  // Synchronous ref lock to prevent rapid double-tap duplicate submissions
  const isSubmittingRef = useRef(false);
  const didApplyInitialProductRef = useRef(false);

  const sellableProducts = filterSellableProducts(allProducts);
  const outOfStockCount = Math.max(
    0,
    allProducts.length - sellableProducts.length
  );

  const selectedProduct: Product | null =
    allProducts.find((item) => item.id === selectedProductId) ?? null;

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

        // If launched with an initial productId param, pre-select it if sellable
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
            setSelectedProductId(matching.id);
            setQuantityInput('1');
            setQuantityFieldError(null);
            setStep('enter_quantity');
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

  // Live quantity validation & automatic Peso total calculation
  const liveQuantityValidation = selectedProduct
    ? validateSaleQuantity(
        quantityInput,
        selectedProduct.stock_quantity,
        selectedProduct.unit
      )
    : { isValid: false, quantity: null, error: 'Select a product first.' };

  const calculatedTotal =
    selectedProduct &&
    liveQuantityValidation.isValid &&
    liveQuantityValidation.quantity !== null
      ? calculateSaleTotal(
          selectedProduct.selling_price,
          liveQuantityValidation.quantity
        )
      : 0;

  /**
   * Step 1 -> Step 2: Select an available product to sell
   */
  const handleSelectProduct = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setSubmitError('Not enough stock available. This product is out of stock.');
      return;
    }

    setSelectedProductId(product.id);
    setQuantityInput('1');
    setQuantityFieldError(null);
    setSubmitError(null);
    setCompletedResult(null);
    setStep('enter_quantity');
  };

  /**
   * Updates raw quantity string without silently coercing invalid characters.
   * Immediately provides validation feedback if the user enters invalid input.
   */
  const handleQuantityChange = (text: string) => {
    setQuantityInput(text);
    setSubmitError(null);

    if (!selectedProduct) {
      return;
    }

    const validation = validateSaleQuantity(
      text,
      selectedProduct.stock_quantity,
      selectedProduct.unit
    );

    if (!validation.isValid) {
      setQuantityFieldError(validation.error ?? 'Enter a valid quantity.');
    } else {
      setQuantityFieldError(null);
    }
  };

  /**
   * Adjusts quantity via +/- stepper buttons within valid stock bounds
   */
  const handleStepQuantity = (delta: number) => {
    if (!selectedProduct || isSubmitting) return;

    const currentNumeric = Number(quantityInput.trim());
    const base =
      Number.isSafeInteger(currentNumeric) && currentNumeric > 0
        ? currentNumeric
        : 0;
    const next = Math.min(
      selectedProduct.stock_quantity,
      Math.max(1, base + delta)
    );

    const nextText = String(next);
    setQuantityInput(nextText);
    setQuantityFieldError(null);
    setSubmitError(null);
  };

  /**
   * Step 2 -> Step 3: Validate quantity and open Sale Review state
   */
  const handleProceedToReview = () => {
    if (!selectedProduct) {
      setStep('select_product');
      return;
    }

    const validation = validateSaleQuantity(
      quantityInput,
      selectedProduct.stock_quantity,
      selectedProduct.unit
    );

    if (!validation.isValid || validation.quantity === null) {
      setQuantityFieldError(
        validation.error ?? 'Please enter a valid quantity to sell.'
      );
      return;
    }

    setQuantityFieldError(null);
    setSubmitError(null);
    setStep('review_sale');
  };

  /**
   * Step 3 -> Step 4: Confirm Sale, re-verify product & live stock, save sale, and deduct stock
   */
  const handleConfirmSale = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    if (!selectedProduct) {
      setSubmitError('Please select a product to sell.');
      setStep('select_product');
      return;
    }

    const validation = validateSaleQuantity(
      quantityInput,
      selectedProduct.stock_quantity,
      selectedProduct.unit
    );

    if (!validation.isValid || validation.quantity === null) {
      setQuantityFieldError(
        validation.error ?? 'Please enter a valid quantity.'
      );
      setStep('enter_quantity');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await recordProductSale(
        selectedProduct.id,
        validation.quantity
      );

      // Update local products state with the freshly deducted product stock
      setAllProducts((prev) =>
        prev.map((item) =>
          item.id === result.updatedProduct.id ? result.updatedProduct : item
        )
      );

      setCompletedResult(result);
      setStep('sale_success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not complete the sale. Please try again.';
      setSubmitError(msg);

      // Refresh store products so if stock changed externally, the UI reflects the latest stock count
      try {
        const refreshedProducts = await fetchStoreProducts();
        setAllProducts(refreshedProducts);
      } catch {
        // Preserve existing product list if background refresh fails
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  /**
   * Resets workflow to record a new sale and refreshes product stock
   */
  const handleStartNewSale = () => {
    setSelectedProductId(null);
    setQuantityInput('1');
    setQuantityFieldError(null);
    setSubmitError(null);
    setCompletedResult(null);
    setStep('select_product');
    loadAvailableProducts(true);
  };

  const handleBackNavigation = () => {
    if (isSubmitting) return;

    if (step === 'review_sale') {
      setSubmitError(null);
      setStep('enter_quantity');
      return;
    }

    if (step === 'enter_quantity') {
      setSubmitError(null);
      setQuantityFieldError(null);
      setStep('select_product');
      return;
    }

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
    if (isSubmitting) return;

    if (tab === 'sales') {
      if (step === 'sale_success') {
        handleStartNewSale();
      }
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

  const headerTitle =
    step === 'sale_success'
      ? 'Sale Complete'
      : step === 'review_sale'
      ? 'Review Sale'
      : 'Record Sale';

  const headerSubtitle = isInitialLoading
    ? 'Loading store inventory...'
    : step === 'sale_success'
    ? 'Transaction saved & inventory updated'
    : step === 'review_sale'
    ? 'Verify details before confirming'
    : step === 'enter_quantity' && selectedProduct
    ? `${selectedProduct.name} · ${selectedProduct.stock_quantity} ${selectedProduct.unit} available`
    : `${sellableProducts.length} ${
        sellableProducts.length === 1 ? 'product' : 'products'
      } available to sell`;

  const selectedProductStatus = selectedProduct
    ? getProductStockStatus(
        selectedProduct.stock_quantity,
        selectedProduct.low_stock_threshold
      )
    : 'In Stock';

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
            {/* Step Progress Indicator (shown when products are available and before success) */}
            {!isInitialLoading &&
            !loadError &&
            sellableProducts.length > 0 &&
            step !== 'sale_success' ? (
              <View
                style={styles.stepIndicatorBar}
                accessibilityRole="progressbar"
                accessibilityLabel={`Sale step: ${
                  step === 'select_product'
                    ? '1 of 3, Select Product'
                    : step === 'enter_quantity'
                    ? '2 of 3, Enter Quantity'
                    : '3 of 3, Review and Confirm'
                }`}>
                {(
                  [
                    { key: 'select_product', label: '1. Product' },
                    { key: 'enter_quantity', label: '2. Quantity' },
                    { key: 'review_sale', label: '3. Review' },
                  ] as { key: SaleStep; label: string }[]
                ).map((item, index) => {
                  const currentStepIndex =
                    step === 'select_product'
                      ? 0
                      : step === 'enter_quantity'
                      ? 1
                      : 2;
                  const isCurrent = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;

                  return (
                    <View
                      key={item.key}
                      style={[
                        styles.stepPill,
                        isCurrent && styles.stepPillCurrent,
                        isCompleted && styles.stepPillCompleted,
                      ]}>
                      <Text
                        style={[
                          styles.stepPillText,
                          isCurrent && styles.stepPillTextCurrent,
                          isCompleted && styles.stepPillTextCompleted,
                        ]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.2}>
                        {isCompleted ? `✓ ${item.label}` : item.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Top-Level Error Banners */}
            {loadError ? (
              <DashboardErrorBanner
                message={loadError}
                onRetry={() => loadAvailableProducts(true)}
                onDismiss={() => setLoadError(null)}
              />
            ) : null}

            {submitError ? (
              <DashboardErrorBanner
                message={submitError}
                onRetry={step === 'review_sale' ? handleConfirmSale : undefined}
                onDismiss={() => setSubmitError(null)}
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
            ) : step === 'sale_success' && completedResult ? (
              /* 3. Sale Success State */
              <View style={styles.successCard}>
                <View style={styles.successIconCircle}>
                  <CheckIcon size={30} color={Colors.textInverse} />
                </View>

                <Text
                  style={styles.successTitle}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}>
                  Sale Recorded Successfully!
                </Text>
                <Text
                  style={styles.successSubtitle}
                  maxFontSizeMultiplier={1.3}>
                  The sale has been saved and your product inventory has been
                  updated.
                </Text>

                {/* Completed Sale Receipt Summary */}
                <View style={styles.receiptBox}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Product Sold</Text>
                    <Text style={styles.receiptValueBold} numberOfLines={2}>
                      {completedResult.sale.product_name}
                    </Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Unit Price</Text>
                    <Text style={styles.receiptValue}>
                      {formatPesoCurrency(completedResult.sale.unit_price)} /{' '}
                      {completedResult.sale.unit}
                    </Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Quantity Sold</Text>
                    <Text style={styles.receiptValueBold}>
                      {completedResult.sale.quantity}{' '}
                      {completedResult.sale.unit}
                    </Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>Total Amount</Text>
                    <Text
                      style={styles.receiptTotalValue}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      numberOfLines={1}>
                      {formatPesoCurrency(completedResult.sale.total_amount)}
                    </Text>
                  </View>
                </View>

                {/* Updated Stock Status Pill */}
                <View style={styles.updatedStockBanner}>
                  <View style={styles.updatedStockTextCol}>
                    <Text style={styles.updatedStockLabel}>
                      Remaining Stock in Store
                    </Text>
                    <Text style={styles.updatedStockValue}>
                      {completedResult.updatedProduct.stock_quantity}{' '}
                      {completedResult.updatedProduct.unit}
                    </Text>
                  </View>
                  <StockStatusBadge
                    status={completedResult.updatedProduct.status}
                    size="md"
                  />
                </View>

                {/* Next Actions */}
                <View style={styles.successActionsBlock}>
                  <TindaMateButton
                    title="Record Another Sale"
                    variant="primary"
                    showArrow
                    onPress={handleStartNewSale}
                    accessibilityLabel="Record another sale"
                  />
                  <TindaMateButton
                    title="View Products Inventory"
                    variant="secondary"
                    onPress={() => router.replace('/products')}
                    accessibilityLabel="Return to products inventory"
                  />
                  <TindaMateButton
                    title="Return to Dashboard"
                    variant="ghost"
                    onPress={() => router.replace('/home')}
                    accessibilityLabel="Return to store dashboard"
                  />
                </View>
              </View>
            ) : sellableProducts.length === 0 ? (
              /* 4. Empty State: No Sellable Products Available */
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
            ) : step === 'select_product' ? (
              /* 5. STEP 1: Select Product */
              <>
                <View style={styles.instructionCard}>
                  <Text
                    style={styles.instructionTitle}
                    accessibilityRole="header">
                    Select a Product to Sell
                  </Text>
                  <Text style={styles.instructionSubtitle}>
                    Tap an in-stock product below to enter the quantity sold.
                  </Text>
                  {outOfStockCount > 0 ? (
                    <View style={styles.hiddenStockNote}>
                      <Text style={styles.hiddenStockNoteText}>
                        Note: {outOfStockCount} out-of-stock{' '}
                        {outOfStockCount === 1 ? 'product is' : 'products are'}{' '}
                        hidden and cannot be sold until restocked.
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.listContainer}>
                  {sellableProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPress={handleSelectProduct}
                    />
                  ))}
                </View>
              </>
            ) : !selectedProduct ? (
              /* Fallback if selected product was removed or became unavailable */
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Product Not Found</Text>
                <Text style={styles.stateSubtitle}>
                  The selected product is no longer available. Please choose an
                  in-stock product from your store.
                </Text>
                <View style={styles.stateActionWrap}>
                  <TindaMateButton
                    title="Select a Product"
                    variant="primary"
                    onPress={handleStartNewSale}
                  />
                </View>
              </View>
            ) : step === 'enter_quantity' ? (
              /* 6. STEP 2: Enter Quantity & Automatic Total */
              <>
                {/* Selected Product Summary Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.selectedHeaderRow}>
                    <View style={styles.selectedTitleCol}>
                      <Text style={styles.sectionOverline}>
                        Selected Product
                      </Text>
                      <Text
                        style={styles.selectedProductName}
                        numberOfLines={2}
                        maxFontSizeMultiplier={1.3}>
                        {selectedProduct.name}
                      </Text>
                      {selectedProduct.category ? (
                        <Text style={styles.selectedCategoryText}>
                          {selectedProduct.category}
                        </Text>
                      ) : null}
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Change selected product"
                      onPress={() => {
                        setSubmitError(null);
                        setQuantityFieldError(null);
                        setStep('select_product');
                      }}
                      style={({ pressed }) => [
                        styles.changeProductPill,
                        pressed && styles.changeProductPillPressed,
                      ]}>
                      <Text style={styles.changeProductPillText}>Change</Text>
                    </Pressable>
                  </View>

                  <View style={styles.divider} />

                  <View
                    style={[
                      styles.productMetricsRow,
                      isCompactPhone && styles.productMetricsRowStacked,
                    ]}>
                    <View style={[styles.metricTile, styles.priceMetricTile]}>
                      <Text style={styles.metricTileLabel}>Selling Price</Text>
                      <Text
                        style={styles.metricTilePriceValue}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        numberOfLines={1}>
                        {formatPesoCurrency(selectedProduct.selling_price)}
                      </Text>
                      <Text style={styles.metricTileSubtext}>
                        per {selectedProduct.unit}
                      </Text>
                    </View>

                    <View style={styles.metricTile}>
                      <View style={styles.stockTileTopRow}>
                        <Text style={styles.metricTileLabel}>
                          Available Stock
                        </Text>
                        <StockStatusBadge
                          status={selectedProductStatus}
                          size="sm"
                        />
                      </View>
                      <Text
                        style={[
                          styles.metricTileStockValue,
                          selectedProductStatus === 'Low Stock' && {
                            color: Colors.warningText,
                          },
                          selectedProductStatus === 'Out of Stock' && {
                            color: Colors.error,
                          },
                        ]}>
                        {selectedProduct.stock_quantity} {selectedProduct.unit}
                      </Text>
                      <Text style={styles.metricTileSubtext}>
                        Maximum sellable quantity
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quantity Entry Card */}
                <View style={styles.sectionCard}>
                  <Text
                    style={styles.sectionHeading}
                    accessibilityRole="header">
                    Enter Quantity Sold
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Specify how many {selectedProduct.unit} the customer is
                    buying (1 to {selectedProduct.stock_quantity}{' '}
                    {selectedProduct.unit}).
                  </Text>

                  {/* Touch-Friendly Stepper + Numeric Input */}
                  <View style={styles.stepperRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Decrease quantity by 1"
                      disabled={
                        isSubmitting ||
                        (liveQuantityValidation.isValid &&
                          liveQuantityValidation.quantity !== null &&
                          liveQuantityValidation.quantity <= 1)
                      }
                      onPress={() => handleStepQuantity(-1)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed && styles.stepperButtonPressed,
                        liveQuantityValidation.isValid &&
                          liveQuantityValidation.quantity !== null &&
                          liveQuantityValidation.quantity <= 1 &&
                          styles.stepperButtonDisabled,
                      ]}>
                      <Text style={styles.stepperButtonText}>−</Text>
                    </Pressable>

                    <View style={styles.stepperInputWrap}>
                      <TindaMateInput
                        label={`Quantity (${selectedProduct.unit}) *`}
                        value={quantityInput}
                        onChangeText={handleQuantityChange}
                        placeholder="1"
                        keyboardType="number-pad"
                        returnKeyType="done"
                        onSubmitEditing={handleProceedToReview}
                        errorMessage={quantityFieldError ?? undefined}
                        accessibilityLabel={`Quantity sold in ${selectedProduct.unit}`}
                        style={styles.zeroBottomMargin}
                      />
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Increase quantity by 1"
                      disabled={
                        isSubmitting ||
                        (liveQuantityValidation.isValid &&
                          liveQuantityValidation.quantity !== null &&
                          liveQuantityValidation.quantity >=
                            selectedProduct.stock_quantity)
                      }
                      onPress={() => handleStepQuantity(1)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed && styles.stepperButtonPressed,
                        liveQuantityValidation.isValid &&
                          liveQuantityValidation.quantity !== null &&
                          liveQuantityValidation.quantity >=
                            selectedProduct.stock_quantity &&
                          styles.stepperButtonDisabled,
                      ]}>
                      <Text style={styles.stepperButtonText}>+</Text>
                    </Pressable>
                  </View>

                  {/* Quick Quantity Chips */}
                  <View style={styles.quickChipsBlock}>
                    <Text style={styles.quickChipsLabel}>Quick quantity:</Text>
                    <View style={styles.quickChipsRow}>
                      {QUICK_QUANTITIES.filter(
                        (q) => q <= selectedProduct.stock_quantity
                      ).map((qty) => {
                        const isSelected =
                          liveQuantityValidation.isValid &&
                          liveQuantityValidation.quantity === qty;
                        return (
                          <Pressable
                            key={qty}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Set quantity to ${qty} ${selectedProduct.unit}`}
                            onPress={() =>
                              handleQuantityChange(String(qty))
                            }
                            style={({ pressed }) => [
                              styles.qtyChip,
                              isSelected && styles.qtyChipSelected,
                              pressed && styles.qtyChipPressed,
                            ]}>
                            <Text
                              style={[
                                styles.qtyChipText,
                                isSelected && styles.qtyChipTextSelected,
                              ]}>
                              {qty} {selectedProduct.unit}
                            </Text>
                          </Pressable>
                        );
                      })}

                      {selectedProduct.stock_quantity > 1 ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{
                            selected:
                              liveQuantityValidation.isValid &&
                              liveQuantityValidation.quantity ===
                                selectedProduct.stock_quantity,
                          }}
                          accessibilityLabel={`Set quantity to maximum available stock, ${selectedProduct.stock_quantity} ${selectedProduct.unit}`}
                          onPress={() =>
                            handleQuantityChange(
                              String(selectedProduct.stock_quantity)
                            )
                          }
                          style={({ pressed }) => [
                            styles.qtyChip,
                            liveQuantityValidation.isValid &&
                              liveQuantityValidation.quantity ===
                                selectedProduct.stock_quantity &&
                              styles.qtyChipSelected,
                            pressed && styles.qtyChipPressed,
                          ]}>
                          <Text
                            style={[
                              styles.qtyChipText,
                              liveQuantityValidation.isValid &&
                                liveQuantityValidation.quantity ===
                                  selectedProduct.stock_quantity &&
                                styles.qtyChipTextSelected,
                            ]}>
                            All ({selectedProduct.stock_quantity})
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Automatic Total Calculation Card */}
                <View style={styles.totalCard}>
                  <View style={styles.totalCardHeader}>
                    <Text style={styles.totalCardLabel}>
                      Automatic Sale Total
                    </Text>
                    <Text style={styles.totalFormulaText}>
                      {formatPesoCurrency(selectedProduct.selling_price)} ×{' '}
                      {liveQuantityValidation.isValid &&
                      liveQuantityValidation.quantity !== null
                        ? `${liveQuantityValidation.quantity} ${selectedProduct.unit}`
                        : '0'}
                    </Text>
                  </View>

                  <Text
                    style={styles.totalBigAmount}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={1}>
                    {formatPesoCurrency(calculatedTotal)}
                  </Text>

                  {liveQuantityValidation.isValid &&
                  liveQuantityValidation.quantity !== null ? (
                    <Text style={styles.totalRemainingStockHint}>
                      Stock after this sale:{' '}
                      <Text style={styles.boldText}>
                        {selectedProduct.stock_quantity -
                          liveQuantityValidation.quantity}{' '}
                        {selectedProduct.unit}
                      </Text>{' '}
                      remaining
                    </Text>
                  ) : (
                    <Text style={styles.totalInvalidHint}>
                      Enter a valid quantity (1 to{' '}
                      {selectedProduct.stock_quantity} {selectedProduct.unit})
                      to compute the sale total.
                    </Text>
                  )}
                </View>

                {/* Step 2 Actions */}
                <View style={styles.actionsBlock}>
                  <TindaMateButton
                    title="Review Sale"
                    variant="primary"
                    showArrow
                    onPress={handleProceedToReview}
                    accessibilityLabel="Proceed to review sale details"
                  />
                  <TindaMateButton
                    title="Choose Different Product"
                    variant="secondary"
                    onPress={() => {
                      setSubmitError(null);
                      setQuantityFieldError(null);
                      setStep('select_product');
                    }}
                    accessibilityLabel="Go back and select a different product"
                  />
                </View>
              </>
            ) : (
              /* 7. STEP 3: Sale Review & Confirm */
              <>
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeaderBlock}>
                    <Text
                      style={styles.reviewHeading}
                      accessibilityRole="header">
                      Review Transaction
                    </Text>
                    <Text style={styles.reviewSubheading}>
                      Verify the product, unit price, quantity, and total amount
                      before confirming this sale.
                    </Text>
                  </View>

                  <View style={styles.reviewSummaryBox}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Product</Text>
                      <Text style={styles.reviewValueBold} numberOfLines={2}>
                        {selectedProduct.name}
                      </Text>
                    </View>

                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Unit Price</Text>
                      <Text style={styles.reviewValue}>
                        {formatPesoCurrency(selectedProduct.selling_price)}
                      </Text>
                    </View>

                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Quantity</Text>
                      <Text style={styles.reviewValueBold}>
                        {liveQuantityValidation.quantity ?? 0}{' '}
                        {selectedProduct.unit}
                      </Text>
                    </View>

                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewTotalRow}>
                      <Text style={styles.reviewTotalLabel}>Total</Text>
                      <Text
                        style={styles.reviewTotalValue}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        numberOfLines={1}>
                        {formatPesoCurrency(calculatedTotal)}
                      </Text>
                    </View>
                  </View>

                  {/* Stock Impact Notice */}
                  <View style={styles.stockImpactBanner}>
                    <Text style={styles.stockImpactTitle}>
                      Inventory Update Upon Confirmation:
                    </Text>
                    <Text style={styles.stockImpactText}>
                      Current stock of{' '}
                      <Text style={styles.boldText}>
                        {selectedProduct.stock_quantity} {selectedProduct.unit}
                      </Text>{' '}
                      will be reduced by{' '}
                      <Text style={styles.boldText}>
                        {liveQuantityValidation.quantity ?? 0}{' '}
                        {selectedProduct.unit}
                      </Text>{' '}
                      to{' '}
                      <Text style={styles.boldText}>
                        {Math.max(
                          0,
                          selectedProduct.stock_quantity -
                            (liveQuantityValidation.quantity ?? 0)
                        )}{' '}
                        {selectedProduct.unit}
                      </Text>
                      .
                    </Text>
                  </View>
                </View>

                {/* Confirm & Edit Actions */}
                <View style={styles.actionsBlock}>
                  <TindaMateButton
                    title={
                      isSubmitting
                        ? 'Recording Sale & Updating Stock...'
                        : 'Confirm Sale'
                    }
                    variant="primary"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onPress={handleConfirmSale}
                    accessibilityLabel="Confirm and save this sale"
                  />
                  <TindaMateButton
                    title="Edit Quantity"
                    variant="secondary"
                    disabled={isSubmitting}
                    onPress={() => {
                      setSubmitError(null);
                      setStep('enter_quantity');
                    }}
                    accessibilityLabel="Go back to edit quantity"
                  />
                  <TindaMateButton
                    title="Change Product"
                    variant="ghost"
                    disabled={isSubmitting}
                    onPress={() => {
                      setSubmitError(null);
                      setQuantityFieldError(null);
                      setStep('select_product');
                    }}
                    accessibilityLabel="Go back to select a different product"
                  />
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
    gap: Spacing.three,
  },
  // Step Progress Bar
  stepIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Colors.backgroundAlt,
    padding: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: Spacing.two,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillCurrent: {
    backgroundColor: Colors.primaryDark,
    ...Shadows.xs,
  },
  stepPillCompleted: {
    backgroundColor: Colors.primaryLight,
  },
  stepPillText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  stepPillTextCurrent: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.extraBold,
  },
  stepPillTextCompleted: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
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
  // Empty State Card
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
  // Step 1: Select Product
  instructionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadows.xs,
  },
  instructionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  instructionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  hiddenStockNote: {
    marginTop: Spacing.one,
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
  listContainer: {
    gap: Spacing.twoHalf,
  },
  // Step 2: Selected Product & Quantity Entry
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  selectedTitleCol: {
    flex: 1,
    gap: 2,
  },
  sectionOverline: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectedProductName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
  selectedCategoryText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  changeProductPill: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  changeProductPillPressed: {
    backgroundColor: Colors.primaryLight,
  },
  changeProductPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  productMetricsRow: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
  },
  productMetricsRowStacked: {
    flexDirection: 'column',
  },
  metricTile: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.twoHalf,
    gap: 4,
  },
  priceMetricTile: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  stockTileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  metricTileLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  metricTilePriceValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  metricTileStockValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  metricTileSubtext: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  sectionHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  stepperButton: {
    width: 52,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1.4,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPressed: {
    backgroundColor: Colors.primaryLight,
    transform: [{ scale: 0.96 }],
  },
  stepperButtonDisabled: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  stepperButtonText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  stepperInputWrap: {
    flex: 1,
  },
  zeroBottomMargin: {
    marginBottom: 0,
  },
  quickChipsBlock: {
    gap: Spacing.one,
  },
  quickChipsLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  qtyChip: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  qtyChipPressed: {
    opacity: 0.75,
  },
  qtyChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  qtyChipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
  // Automatic Total Card
  totalCard: {
    backgroundColor: Colors.pastel.green.bg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    padding: Spacing.threeHalf,
    gap: Spacing.one,
    ...Shadows.xs,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  totalCardLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalFormulaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  totalBigAmount: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    marginVertical: 2,
  },
  totalRemainingStockHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.successText,
    fontWeight: Typography.weights.medium,
  },
  totalInvalidHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.semiBold,
  },
  boldText: {
    fontWeight: Typography.weights.extraBold,
  },
  // Step 3: Review Sale Card
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.threeHalf,
    gap: Spacing.three,
    ...Shadows.xs,
  },
  reviewHeaderBlock: {
    gap: 4,
  },
  reviewHeading: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  reviewSubheading: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  reviewSummaryBox: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.twoHalf,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  reviewLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  reviewValueBold: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  reviewTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  reviewTotalLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  reviewTotalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  stockImpactBanner: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.twoHalf,
    gap: 4,
  },
  stockImpactTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  stockImpactText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  // Step 4: Success Card
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
    ...Shadows.sm,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  successTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
    marginTop: -Spacing.one,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  receiptLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  receiptValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  receiptValueBold: {
    flex: 1,
    textAlign: 'right',
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.one,
  },
  receiptTotalLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  receiptTotalValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  updatedStockBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    gap: Spacing.two,
  },
  updatedStockTextCol: {
    flex: 1,
    gap: 2,
  },
  updatedStockLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  updatedStockValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  successActionsBlock: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionsBlock: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
