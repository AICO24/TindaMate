import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, usePathname } from 'expo-router';

import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardBadgeVectorIcon } from '@/components/dashboard/DashboardNavIcons';
import { ProductCard } from '@/components/products/ProductCard';
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
  computeStoreProductSummary,
  fetchStoreProducts,
  getProductStockStatus,
} from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { Product, ProductStockStatus } from '@/types/product';

type FilterTab = 'All' | ProductStockStatus;

/**
 * TindaMate Products List Screen (`/products`)
 *
 * Displays all products belonging to the authenticated vendor's store:
 * - Screen title, count subtitle, and "+ Add Product" action
 * - Quick status filter pills (All, In Stock, Low Stock, Out of Stock)
 * - Scannable ProductCard list items
 * - Honest loading, empty ("No products yet"), and error/retry states
 * - Route-aware persistent bottom navigation
 */
export default function ProductsListScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.replace('/');
        return;
      }

      const items = await fetchStoreProducts();
      setProducts(items);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not load your products. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts(false);
    }, [loadProducts])
  );

  const handleFutureModuleNotice = (moduleName: string, batchNote: string) => {
    const message = `${moduleName} will be connected to your Supabase store database in ${batchNote}!`;
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(moduleName, message, [{ text: 'Got it!' }]);
    }
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'products') {
      return;
    }
    if (tab === 'home') {
      router.replace('/home');
      return;
    }
    if (tab === 'sales') {
      router.replace('/sales' as any);
      return;
    }
    if (tab === 'utang') {
      router.replace('/customers' as any);
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

  const summary = computeStoreProductSummary(products);

  const filteredProducts =
    selectedFilter === 'All'
      ? products
      : products.filter(
          (item) =>
            getProductStockStatus(
              item.stock_quantity,
              item.low_stock_threshold
            ) === selectedFilter
        );

  const headerSubtitle = isInitialLoading
    ? 'Loading store inventory...'
    : `${summary.totalProducts} ${
        summary.totalProducts === 1 ? 'product' : 'products'
      } in your store`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Top Header */}
        <ProductScreenHeader
          title="Products"
          subtitle={headerSubtitle}
          showBack={true}
          onBack={() => router.replace('/home')}
          rightActionLabel="+ Add Product"
          rightActionAccessibilityLabel="Add a new product"
          onRightActionPress={() => router.push('/products/add')}
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadProducts(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {/* Error Banner if refresh or fetch fails */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadProducts(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 1. Initial Loading State */}
            {isInitialLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Products...</Text>
                <Text style={styles.stateSubtitle}>
                  Fetching your store inventory from Supabase.
                </Text>
              </View>
            ) : errorMessage && products.length === 0 ? (
              /* 2. Full Error State when initial fetch failed and list is empty */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>
                <Text style={styles.stateTitle}>Could Not Load Products</Text>
                <Text style={styles.stateSubtitle}>{errorMessage}</Text>
                <View style={styles.stateActionWrap}>
                  <TindaMateButton
                    title="Retry Loading"
                    variant="primary"
                    onPress={() => loadProducts(true)}
                    accessibilityLabel="Retry loading products"
                  />
                </View>
              </View>
            ) : products.length === 0 ? (
              /* 3. Honest Empty State (Section 10B) */
              <View style={styles.emptyCard}>
                <View
                  style={styles.emptyIconCircle}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants">
                  <DashboardBadgeVectorIcon
                    type="products"
                    color={Colors.primary}
                  />
                </View>
                <Text
                  style={styles.emptyTitle}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}>
                  No products yet
                </Text>
                <Text
                  style={styles.emptySubtitle}
                  maxFontSizeMultiplier={1.3}>
                  Add your first product to start managing your store.
                </Text>
                <View style={styles.emptyButtonWrap}>
                  <TindaMateButton
                    title="Add Product"
                    variant="primary"
                    showArrow
                    onPress={() => router.push('/products/add')}
                    accessibilityLabel="Add your first product"
                  />
                </View>
              </View>
            ) : (
              /* 4. Populated Product List + Status Filter Strip */
              <>
                <View style={styles.filterStrip}>
                  {(
                    [
                      { key: 'All', count: summary.totalProducts },
                      { key: 'In Stock', count: summary.inStockCount },
                      { key: 'Low Stock', count: summary.lowStockCount },
                      { key: 'Out of Stock', count: summary.outOfStockCount },
                    ] as { key: FilterTab; count: number }[]
                  ).map((tab) => {
                    const isSelected = selectedFilter === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Filter ${tab.key}, ${tab.count} items`}
                        onPress={() => setSelectedFilter(tab.key)}
                        style={({ pressed }) => [
                          styles.filterChip,
                          isSelected && styles.filterChipSelected,
                          pressed && styles.filterChipPressed,
                        ]}>
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && styles.filterChipTextSelected,
                          ]}
                          maxFontSizeMultiplier={1.2}>
                          {tab.key} ({tab.count})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {filteredProducts.length === 0 ? (
                  <View style={styles.filteredEmptyCard}>
                    <Text style={styles.filteredEmptyTitle}>
                      No {selectedFilter.toLowerCase()} products
                    </Text>
                    <Text style={styles.filteredEmptySubtitle}>
                      None of your store items currently match the &ldquo;
                      {selectedFilter}&rdquo; filter.
                    </Text>
                    <TindaMateButton
                      title="Show All Products"
                      variant="secondary"
                      onPress={() => setSelectedFilter('All')}
                      style={styles.showAllButton}
                    />
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onPress={(item) => router.push(`/products/${item.id}`)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Persistent Bottom Navigation Bar */}
        <DashboardBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>
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
    maxWidth: 280,
  },
  emptyButtonWrap: {
    width: '100%',
    maxWidth: 260,
    marginTop: Spacing.two,
  },
  filterStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  filterChip: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  filterChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.extraBold,
  },
  listContainer: {
    gap: Spacing.twoHalf,
  },
  filteredEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  filteredEmptyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  filteredEmptySubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  showAllButton: {
    marginTop: Spacing.one,
  },
});

