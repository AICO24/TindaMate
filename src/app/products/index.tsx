import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  DashboardBadgeVectorIcon,
  NavProductsIcon,
  SearchVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
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
 * TindaMate Products List Screen (`/products`) — Design 2.0
 *
 * Displays all products belonging to the authenticated vendor's store:
 * - Deep green header with cube icon, "Products" title, and "+ Add Product" pill button
 * - Search bar ("Search products...") + filter button inside header zone
 * - Status filter chips: All (X), Low Stock (X), Out of Stock (X), In Stock (X)
 * - Compact scannable ProductCard list items
 * - Honest loading, empty ("No products yet"), and error/retry states
 */
export default function ProductsListScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCategoryStrip, setShowCategoryStrip] = useState(false);
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
    if (tab === 'more') {
      router.push('/more' as any);
      return;
    }
  };

  const summary = useMemo(
    () => computeStoreProductSummary(products),
    [products]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = p.category?.trim();
      if (cat) {
        set.add(cat);
      }
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      const status = getProductStockStatus(
        item.stock_quantity,
        item.low_stock_threshold
      );
      if (selectedFilter !== 'All' && status !== selectedFilter) {
        return false;
      }
      if (
        selectedCategory !== 'All' &&
        (item.category ?? '').trim().toLowerCase() !==
          selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = (item.category ?? '').toLowerCase().includes(q);
        return matchesName || matchesCat;
      }
      return true;
    });
  }, [products, selectedFilter, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Deep Green Top Header + Search Bar */}
        <View style={styles.heroHeaderZone}>
          <ProductScreenHeader
            title="Products"
            showBack={false}
            leftIcon={<NavProductsIcon color={Colors.textInverse} />}
            rightActionLabel="+ Add Product"
            rightActionAccessibilityLabel="Add a new product"
            onRightActionPress={() => router.push('/products/add')}
          />

          {/* Search Products Input + Filter Toggle Button */}
          {!isInitialLoading && products.length > 0 ? (
            <View style={styles.searchRowWrap}>
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
                  accessibilityLabel="Search store products"
                />
                {searchQuery.trim().length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle category filters"
                onPress={() => setShowCategoryStrip((prev) => !prev)}
                style={({ pressed }) => [
                  styles.filterIconButton,
                  showCategoryStrip && styles.filterIconButtonActive,
                  pressed && styles.filterChipPressed,
                ]}>
                <View style={styles.filterLinesWrap}>
                  <View style={[styles.filterLine, { width: 16 }]} />
                  <View style={[styles.filterLine, { width: 11 }]} />
                  <View style={[styles.filterLine, { width: 6 }]} />
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
              /* 3. Honest Empty State */
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterStrip}>
                  {(
                    [
                      { key: 'All', count: summary.totalProducts },
                      { key: 'Low Stock', count: summary.lowStockCount },
                      { key: 'Out of Stock', count: summary.outOfStockCount },
                      { key: 'In Stock', count: summary.inStockCount },
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
                </ScrollView>

                {/* Optional Collapsible Category Filter Strip */}
                {showCategoryStrip && categories.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryStrip}>
                    {categories.map((cat) => {
                      const isCatActive = selectedCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          accessibilityRole="button"
                          onPress={() => setSelectedCategory(cat)}
                          style={[
                            styles.categorySubChip,
                            isCatActive && styles.categorySubChipActive,
                          ]}>
                          <Text
                            style={[
                              styles.categorySubChipText,
                              isCatActive && styles.categorySubChipTextActive,
                            ]}>
                            {cat === 'All' ? 'All Categories' : cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}

                {filteredProducts.length === 0 ? (
                  <View style={styles.filteredEmptyCard}>
                    <Text style={styles.filteredEmptyTitle}>
                      No matching products
                    </Text>
                    <Text style={styles.filteredEmptySubtitle}>
                      None of your store items match the active search or filter.
                    </Text>
                    <TindaMateButton
                      title="Show All Products"
                      variant="secondary"
                      onPress={() => {
                        setSelectedFilter('All');
                        setSelectedCategory('All');
                        setSearchQuery('');
                      }}
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
      </KeyboardAvoidingView>
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
  heroHeaderZone: {
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: Spacing.twoHalf,
    ...Shadows.sm,
  },
  searchRowWrap: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.threeHalf,
    paddingRight: 10,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  filterIconButton: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  filterIconButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  filterLinesWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  filterLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.primaryDark,
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
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  filterChipSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  filterChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.extraBold,
  },
  categoryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categorySubChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  categorySubChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categorySubChipText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  categorySubChipTextActive: {
    color: Colors.textInverse,
  },
  listContainer: {
    gap: 10,
  },
  filteredEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
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
