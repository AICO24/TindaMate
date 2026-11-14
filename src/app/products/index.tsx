import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
  DashboardBadgeVectorIcon,
  NavProductsIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { TindaMateLoadingView } from '@/components/animated-icon';
import { TindaMateSearchBar } from '@/components/ui/TindaMateSearchBar';
import { FilterChipItem, FilterChipRow } from '@/components/ui/FilterChipRow';
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
type ProductSortOption = 'name' | 'stock' | 'price';

const SORT_LABELS: Record<ProductSortOption, string> = {
  name: 'Name A–Z',
  stock: 'Lowest Stock',
  price: 'Price: Low–High',
};

/**
 * TindaMate Products List Screen (`/products`) — Design 2.0
 *
 * Displays all products belonging to the authenticated vendor's store:
 * - Deep green header with cube icon, "Products" title, dynamic inventory subtitle, and "+ Add Product" pill button
 * - Persistent Search bar ("Search products...") + category filter toggle button inside header zone
 * - Shared FilterChipRow status chips: All (X), Low Stock (X), Out of Stock (X), In Stock (X)
 * - Discoverable category filter chips + compact Result Count & Sort bar
 * - Virtualized FlatList rendering 3-zone ProductCard items
 * - Honest loading, empty ("No products yet"), filtered-empty, and error/retry states
 */
export default function ProductsListScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);
  const params = useLocalSearchParams<{ filter?: string; status?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCategoryStrip, setShowCategoryStrip] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSortOption>('name');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply deep-linked filter or post-save feedback status param if provided
  useEffect(() => {
    const rawFilter = Array.isArray(params.filter)
      ? params.filter[0]
      : params.filter;
    if (
      rawFilter === 'Low Stock' ||
      rawFilter === 'Out of Stock' ||
      rawFilter === 'In Stock' ||
      rawFilter === 'All'
    ) {
      setSelectedFilter(rawFilter);
    }

    const rawStatus = Array.isArray(params.status)
      ? params.status[0]
      : params.status;
    if (rawStatus === 'created') {
      setFeedbackBanner('Product added to your store inventory.');
    } else if (rawStatus === 'updated') {
      setFeedbackBanner('Product changes saved.');
    }
  }, [params.filter, params.status]);

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
    if (tab === 'customers' || tab === 'utang') {
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

  const statusFilterItems: FilterChipItem<FilterTab>[] = useMemo(
    () => [
      { id: 'All', label: 'All', count: summary.totalProducts },
      { id: 'Low Stock', label: 'Low Stock', count: summary.lowStockCount },
      {
        id: 'Out of Stock',
        label: 'Out of Stock',
        count: summary.outOfStockCount,
      },
      { id: 'In Stock', label: 'In Stock', count: summary.inStockCount },
    ],
    [summary]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = products.filter((item) => {
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

    if (sortBy === 'stock') {
      return [...filtered].sort(
        (a, b) =>
          a.stock_quantity - b.stock_quantity || a.name.localeCompare(b.name)
      );
    }
    if (sortBy === 'price') {
      return [...filtered].sort(
        (a, b) =>
          a.selling_price - b.selling_price || a.name.localeCompare(b.name)
      );
    }
    return filtered;
  }, [products, selectedFilter, selectedCategory, searchQuery, sortBy]);

  const cycleSortOption = () => {
    setSortBy((prev) => {
      if (prev === 'name') return 'stock';
      if (prev === 'stock') return 'price';
      return 'name';
    });
  };

  const handleResetFilters = () => {
    setSelectedFilter('All');
    setSelectedCategory('All');
    setSearchQuery('');
  };

  const hasMultipleCategories = categories.length > 1;
  const isCategoryFiltered = selectedCategory !== 'All';
  const isCategoryRowVisible =
    hasMultipleCategories && (showCategoryStrip || isCategoryFiltered);
  const isAnyFilterActive =
    selectedFilter !== 'All' ||
    isCategoryFiltered ||
    searchQuery.trim().length > 0;

  const headerSubtitle = useMemo(() => {
    if (isInitialLoading) {
      return 'Loading store inventory...';
    }
    if (summary.totalProducts === 0) {
      return 'No items in store yet';
    }
    const itemWord = summary.totalProducts === 1 ? 'item' : 'items';
    const alertParts: string[] = [];
    if (summary.lowStockCount > 0) {
      alertParts.push(`${summary.lowStockCount} low stock`);
    }
    if (summary.outOfStockCount > 0) {
      alertParts.push(`${summary.outOfStockCount} out of stock`);
    }
    if (alertParts.length > 0) {
      return `${summary.totalProducts} ${itemWord} • ${alertParts.join(', ')}`;
    }
    return `${summary.totalProducts} ${itemWord} • All in stock`;
  }, [isInitialLoading, summary]);

  const renderListHeader = () => (
    <View style={styles.headerControlsBlock}>
      {/* Post-Save Confirmation Banner */}
      {feedbackBanner ? (
        <View
          style={styles.successBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          <View style={styles.successLeft}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successBannerText}>{feedbackBanner}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            onPress={() => setFeedbackBanner(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.successDismissText}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Error Banner if refresh or fetch fails */}
      {errorMessage ? (
        <DashboardErrorBanner
          message={errorMessage}
          onRetry={() => loadProducts(true)}
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}

      {/* Status Filter Strip + Category Filter Strip + Result Count & Sort Bar */}
      {!isInitialLoading && products.length > 0 ? (
        <>
          <FilterChipRow
            items={statusFilterItems}
            selectedId={selectedFilter}
            onSelect={setSelectedFilter}
            contentContainerStyle={styles.filterStripContent}
            accessibilityLabelPrefix="Filter status"
          />

          {/* Discoverable Category Filter Strip */}
          {isCategoryRowVisible ? (
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
                    accessibilityState={{ selected: isCatActive }}
                    accessibilityLabel={`Category filter: ${
                      cat === 'All' ? 'All Categories' : cat
                    }`}
                    onPress={() => setSelectedCategory(cat)}
                    style={({ pressed }) => [
                      styles.categorySubChip,
                      isCatActive && styles.categorySubChipActive,
                      pressed && styles.filterChipPressed,
                    ]}>
                    <Text
                      style={[
                        styles.categorySubChipText,
                        isCatActive && styles.categorySubChipTextActive,
                      ]}
                      maxFontSizeMultiplier={1.2}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Result Count & Sort Bar */}
          <View style={styles.resultsToolbar}>
            <Text
              style={styles.resultsCountText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {isAnyFilterActive
                ? `Showing ${filteredProducts.length} of ${summary.totalProducts} products`
                : `${summary.totalProducts} ${
                    summary.totalProducts === 1 ? 'Product' : 'Products'
                  }`}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sort products, currently sorted by ${SORT_LABELS[sortBy]}`}
              accessibilityHint="Cycles between sorting by name, lowest stock, and lowest price"
              onPress={cycleSortOption}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.sortPill,
                sortBy !== 'name' && styles.sortPillActive,
                pressed && styles.filterChipPressed,
              ]}>
              <Text
                style={[
                  styles.sortPillText,
                  sortBy !== 'name' && styles.sortPillTextActive,
                ]}
                maxFontSizeMultiplier={1.2}>
                Sort: {SORT_LABELS[sortBy]} ▾
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );

  const renderEmptyComponent = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.stateCard}>
          <TindaMateLoadingView
            compact
            message="Fetching your store inventory..."
          />
        </View>
      );
    }

    if (errorMessage && products.length === 0) {
      return (
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
      );
    }

    if (products.length === 0) {
      return (
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
          <Text style={styles.emptySubtitle} maxFontSizeMultiplier={1.3}>
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
      );
    }

    return (
      <View style={styles.filteredEmptyCard}>
        <Text style={styles.filteredEmptyTitle}>No matching products</Text>
        <Text style={styles.filteredEmptySubtitle}>
          None of your store items match the active search or filter.
        </Text>
        <TindaMateButton
          title="Show All Products"
          variant="secondary"
          onPress={handleResetFilters}
          style={styles.showAllButton}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Deep Green Top Header + Persistent Embedded Search Bar */}
        <ProductScreenHeader
          title="Products"
          subtitle={headerSubtitle}
          showBack={false}
          leftIcon={<NavProductsIcon color={Colors.textInverse} />}
          rightActionLabel="+ Add Product"
          rightActionAccessibilityLabel="Add a new product"
          onRightActionPress={() => {
            setFeedbackBanner(null);
            router.push('/products/add');
          }}>
          <TindaMateSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products by name or category..."
            accessibilityLabel="Search store products"
            inputProps={{ editable: !isInitialLoading }}
            rightAction={
              hasMultipleCategories ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isCategoryRowVisible }}
                  accessibilityLabel={
                    isCategoryFiltered
                      ? `Toggle category filters, active category: ${selectedCategory}`
                      : 'Toggle category filters'
                  }
                  onPress={() => setShowCategoryStrip((prev) => !prev)}
                  style={({ pressed }) => [
                    styles.filterIconButton,
                    (showCategoryStrip || isCategoryFiltered) &&
                      styles.filterIconButtonActive,
                    pressed && styles.filterChipPressed,
                  ]}>
                  <View style={styles.filterLinesWrap}>
                    <View style={[styles.filterLine, { width: 16 }]} />
                    <View style={[styles.filterLine, { width: 11 }]} />
                    <View style={[styles.filterLine, { width: 6 }]} />
                  </View>
                  {isCategoryFiltered ? (
                    <View style={styles.activeCategoryDot} />
                  ) : null}
                </Pressable>
              ) : undefined
            }
          />
        </ProductScreenHeader>

        {/* Virtualized Product List */}
        <FlatList
          data={isInitialLoading ? [] : filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={(prod) => {
                setFeedbackBanner(null);
                router.push(`/products/${prod.id}`);
              }}
            />
          )}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          style={styles.flatList}
          contentContainerStyle={styles.listContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadProducts(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }
        />

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
  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.xs,
  },
  filterIconButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  activeCategoryDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.surface,
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
  flatList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContentContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  headerControlsBlock: {
    gap: Spacing.twoHalf,
    marginBottom: Spacing.twoHalf,
  },
  itemSeparator: {
    height: 10,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  successLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  successIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
  },
  successBannerText: {
    flex: 1,
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  successDismissText: {
    fontSize: Typography.sizes.body,
    color: Colors.successText,
    fontWeight: Typography.weights.bold,
  },
  filterStripContent: {
    paddingHorizontal: 0,
    paddingVertical: 2,
    gap: 8,
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  categoryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categorySubChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  resultsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: Spacing.two,
  },
  resultsCountText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortPillActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  sortPillTextActive: {
    color: Colors.primaryDark,
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
    marginTop: Spacing.one,
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
    marginTop: Spacing.one,
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
