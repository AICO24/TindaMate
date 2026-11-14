import React, { useCallback, useMemo, useState } from 'react';
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
import { router, useFocusEffect, usePathname } from 'expo-router';

import { TindaMateLoadingView } from '@/components/animated-icon';
import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import {
  DashboardBadgeVectorIcon,
  TrendChartVectorIcon,
  WarningTriangleIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { SaleHistoryItemCard } from '@/components/sales/SaleHistoryItemCard';
import { FilterChipItem, FilterChipRow } from '@/components/ui/FilterChipRow';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateSearchBar } from '@/components/ui/TindaMateSearchBar';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import {
  fetchStoreSales,
  formatSaleDate,
  groupSalesByDate,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { Sale } from '@/types/sale';

type HistoryPeriodFilter = 'Today' | 'This Week' | 'This Month' | 'All Time';
type PaymentMethodFilter = 'all' | 'cash' | 'credit';

const PERIOD_FILTERS: HistoryPeriodFilter[] = [
  'Today',
  'This Week',
  'This Month',
  'All Time',
];

function isSaleUtang(sale: Sale): boolean {
  return sale.payment_method === 'credit';
}

function sumSaleAmounts(items: Sale[]): number {
  const sum = items.reduce(
    (acc, item) => acc + (Number(item.total_amount) || 0),
    0
  );
  return Number(sum.toFixed(2));
}

/**
 * TindaMate Sales History Screen (`/sales/history`) — Batch S-3
 *
 * Clean retail transaction management interface:
 * - Deep Green ProductScreenHeader with embedded TindaMateSearchBar
 * - Local-midnight period filters (Today, This Week, This Month, All Time)
 * - Payment method filters (All, Cash, Utang) with live counts
 * - Honest Recorded Sales summary with Cash vs Utang breakdown
 * - Scannable grouped transaction cards linking to `/sales/[id]`
 */
export default function SalesHistoryScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] =
    useState<HistoryPeriodFilter>('This Week');
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethodFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSalesHistory = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        setErrorMessage(
          'Unable to verify your store session. Check your connection and retry.'
        );
        return;
      }

      if (!sessionData?.session) {
        router.replace('/');
        return;
      }

      const items = await fetchStoreSales();
      setSales(items);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not load your sales history. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSalesHistory(false);
    }, [loadSalesHistory])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/sales' as any);
    }
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'sales') {
      router.replace('/sales' as any);
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
    if (tab === 'customers' || tab === 'utang') {
      router.replace('/customers' as any);
      return;
    }
    if (tab === 'more') {
      router.push('/more' as any);
      return;
    }
  };

  const handleSelectSale = (sale: Sale) => {
    router.push({
      pathname: '/sales/[id]',
      params: { id: sale.id },
    });
  };

  // 1. Filter by local-midnight calendar period
  const periodFilteredSales = useMemo(() => {
    if (selectedPeriod === 'All Time') {
      return sales;
    }
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (selectedPeriod === 'Today') {
      return sales.filter((s) => new Date(s.created_at) >= startOfToday);
    }
    if (selectedPeriod === 'This Week') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return sales.filter((s) => new Date(s.created_at) >= sevenDaysAgo);
    }
    if (selectedPeriod === 'This Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return sales.filter((s) => new Date(s.created_at) >= startOfMonth);
    }
    return sales;
  }, [sales, selectedPeriod]);

  // 2. Period Cash vs Utang counts & totals
  const periodMetrics = useMemo(() => {
    const cashSales = periodFilteredSales.filter((s) => !isSaleUtang(s));
    const utangSales = periodFilteredSales.filter((s) => isSaleUtang(s));
    return {
      totalCount: periodFilteredSales.length,
      totalAmount: sumSaleAmounts(periodFilteredSales),
      cashCount: cashSales.length,
      cashAmount: sumSaleAmounts(cashSales),
      utangCount: utangSales.length,
      utangAmount: sumSaleAmounts(utangSales),
    };
  }, [periodFilteredSales]);

  // 3. Payment filter chips with live period counts
  const paymentFilterItems: FilterChipItem<PaymentMethodFilter>[] = useMemo(
    () => [
      { id: 'all', label: 'All', count: periodMetrics.totalCount },
      { id: 'cash', label: 'Cash', count: periodMetrics.cashCount },
      { id: 'credit', label: 'Utang', count: periodMetrics.utangCount },
    ],
    [periodMetrics]
  );

  // 4. Filter by payment method & search query
  const filteredSales = useMemo(() => {
    const paymentMatches =
      selectedPayment === 'all'
        ? periodFilteredSales
        : selectedPayment === 'credit'
        ? periodFilteredSales.filter((s) => isSaleUtang(s))
        : periodFilteredSales.filter((s) => !isSaleUtang(s));

    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) {
      return paymentMatches;
    }

    return paymentMatches.filter((sale) => {
      const shortRef = `#${sale.id.slice(0, 8).toUpperCase()}`.toLowerCase();
      const rawId = sale.id.toLowerCase();
      const customerName = (sale.customer_name ?? '').toLowerCase();
      const productName = (sale.product_name ?? '').toLowerCase();
      const saleDate = formatSaleDate(sale.created_at).toLowerCase();
      return (
        shortRef.includes(trimmedQuery) ||
        rawId.includes(trimmedQuery) ||
        customerName.includes(trimmedQuery) ||
        productName.includes(trimmedQuery) ||
        saleDate.includes(trimmedQuery)
      );
    });
  }, [periodFilteredSales, selectedPayment, searchQuery]);

  const filteredTotalAmount = useMemo(
    () => sumSaleAmounts(filteredSales),
    [filteredSales]
  );

  const hasActiveFilters =
    selectedPeriod !== 'All Time' ||
    selectedPayment !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedPeriod('All Time');
    setSelectedPayment('all');
    setSearchQuery('');
  };

  // Compute 6-bar mini sparkline heights from filteredSales
  const miniTrendBars = useMemo(() => {
    if (filteredSales.length === 0) {
      return [0.25, 0.35, 0.3, 0.45, 0.4, 0.5];
    }
    const buckets = [0, 0, 0, 0, 0, 0];
    filteredSales.forEach((s, idx) => {
      buckets[idx % 6] += Number(s.total_amount) || 0;
    });
    const maxVal = Math.max(...buckets, 1);
    return buckets.map((v) => Math.max(0.22, Math.min(1, v / maxVal)));
  }, [filteredSales]);

  const dateGroups = useMemo(
    () => groupSalesByDate(filteredSales),
    [filteredSales]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Deep Green Top Screen Header + Embedded Search */}
        <ProductScreenHeader
          title="Sales History"
          subtitle={
            !isInitialLoading
              ? `${sales.length} recorded ${sales.length === 1 ? 'sale' : 'sales'}`
              : 'Loading transactions...'
          }
          showBack={true}
          onBack={handleBack}
          leftIcon={
            <TrendChartVectorIcon color={Colors.textInverse} size={20} />
          }>
          {!isInitialLoading && sales.length > 0 ? (
            <TindaMateSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search ref #, customer, or item..."
              accessibilityLabel="Search sales transactions"
            />
          ) : null}
        </ProductScreenHeader>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadSalesHistory(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {/* Error Banner */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadSalesHistory(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 1. Loading State */}
            {isInitialLoading ? (
              <View style={styles.stateCard}>
                <TindaMateLoadingView
                  compact
                  message="Fetching sales records..."
                />
              </View>
            ) : errorMessage && sales.length === 0 ? (
              /* 2. Full Error State */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <WarningTriangleIcon
                    size={22}
                    bgColor={Colors.error}
                    fgColor={Colors.textInverse}
                  />
                </View>
                <Text style={styles.stateTitle}>
                  Could Not Load Sales History
                </Text>
                <Text style={styles.stateSubtitle}>{errorMessage}</Text>
                <View style={styles.stateActionWrap}>
                  <TindaMateButton
                    title="Retry Loading"
                    variant="primary"
                    onPress={() => loadSalesHistory(true)}
                    accessibilityLabel="Retry loading sales records"
                  />
                </View>
              </View>
            ) : sales.length === 0 ? (
              /* 3. Empty State */
              <View style={styles.emptyCard}>
                <View
                  style={styles.emptyIconCircle}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants">
                  <DashboardBadgeVectorIcon
                    type="sales"
                    color={Colors.primary}
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}>
                  No sales yet
                </Text>
                <Text
                  style={styles.emptySubtitle}
                  maxFontSizeMultiplier={1.3}>
                  Your completed sales will appear here after recording
                  transactions.
                </Text>

                <View style={styles.emptyButtonWrap}>
                  <TindaMateButton
                    title="Record a Sale"
                    variant="primary"
                    showArrow
                    onPress={() => router.push('/sales' as any)}
                    accessibilityLabel="Record your first sale"
                  />
                  <TindaMateButton
                    title="Return to Dashboard"
                    variant="ghost"
                    onPress={() => router.replace('/home')}
                    accessibilityLabel="Return to store dashboard"
                  />
                </View>
              </View>
            ) : (
              /* 4. Populated State: Filters + Summary + Chronological List */
              <>
                {/* Period Filter Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.periodStrip}>
                  {PERIOD_FILTERS.map((period) => {
                    const isSelected = selectedPeriod === period;
                    return (
                      <Pressable
                        key={period}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Filter sales by ${period}`}
                        onPress={() => setSelectedPeriod(period)}
                        style={[
                          styles.periodChip,
                          isSelected && styles.periodChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.periodChipText,
                            isSelected && styles.periodChipTextActive,
                          ]}>
                          {period}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Payment Method Filter Chips */}
                <FilterChipRow
                  items={paymentFilterItems}
                  selectedId={selectedPayment}
                  onSelect={setSelectedPayment}
                  contentContainerStyle={styles.paymentChipStrip}
                  accessibilityLabelPrefix="Payment filter"
                />

                {/* Recorded Sales Summary Card */}
                <View
                  style={[
                    styles.summaryHeroCard,
                    isCompactPhone && styles.summaryHeroCardCompact,
                  ]}>
                  <View style={styles.summaryTopRow}>
                    <View style={styles.summaryLeftCol}>
                      <Text style={styles.summaryLabel}>
                        {selectedPayment === 'cash'
                          ? `${selectedPeriod} · Cash Sales`
                          : selectedPayment === 'credit'
                          ? `${selectedPeriod} · Utang Recorded`
                          : `${selectedPeriod} · Recorded Sales`}
                      </Text>
                      <Text
                        style={[
                          styles.summaryBigAmount,
                          isCompactPhone && styles.summaryBigAmountCompact,
                        ]}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        numberOfLines={1}>
                        {formatPesoCurrency(filteredTotalAmount)}
                      </Text>
                      <View style={styles.summaryBadgePill}>
                        <Text style={styles.summaryBadgeText}>
                          {filteredSales.length}{' '}
                          {filteredSales.length === 1
                            ? 'transaction'
                            : 'transactions'}
                        </Text>
                      </View>
                    </View>

                    {/* Mini Trend Graphic */}
                    <View style={styles.lineChartBox}>
                      <View style={styles.chartFillArea}>
                        {miniTrendBars.map((ratio, index) => (
                          <View
                            key={index}
                            style={[
                              styles.chartColumnBar,
                              {
                                height: Math.max(14, Math.round(ratio * 48)),
                                opacity:
                                  0.2 + (index / miniTrendBars.length) * 0.5,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <View style={styles.chartLineAccent} />
                    </View>
                  </View>

                  {/* Cash vs Utang Breakdown for the Selected Period */}
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownPillCash}>
                      <Text style={styles.breakdownLabelCash}>
                        Cash ({periodMetrics.cashCount})
                      </Text>
                      <Text style={styles.breakdownValueCash} numberOfLines={1}>
                        {formatPesoCurrency(periodMetrics.cashAmount)}
                      </Text>
                    </View>
                    <View style={styles.breakdownPillUtang}>
                      <Text style={styles.breakdownLabelUtang}>
                        Utang ({periodMetrics.utangCount})
                      </Text>
                      <Text
                        style={styles.breakdownValueUtang}
                        numberOfLines={1}>
                        {formatPesoCurrency(periodMetrics.utangAmount)}
                      </Text>
                    </View>
                  </View>
                </View>

                {filteredSales.length === 0 ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateTitle}>
                      No matching transactions
                    </Text>
                    <Text style={styles.stateSubtitle}>
                      {searchQuery.trim().length > 0
                        ? `No sales matched "${searchQuery.trim()}" in ${selectedPeriod}.`
                        : `No ${
                            selectedPayment === 'credit'
                              ? 'Utang'
                              : selectedPayment === 'cash'
                              ? 'Cash'
                              : ''
                          } sales recorded in ${selectedPeriod}.`}
                    </Text>
                    {hasActiveFilters ? (
                      <View style={styles.stateActionWrap}>
                        <TindaMateButton
                          title="Reset Filters"
                          variant="secondary"
                          onPress={handleResetFilters}
                          accessibilityLabel="Reset period, payment, and search filters"
                        />
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.groupedContainer}>
                    {dateGroups.map((group) => (
                      <View key={group.dateTitle} style={styles.groupSection}>
                        <View style={styles.dateHeaderRow}>
                          <Text style={styles.dateHeaderText}>
                            {group.dateTitle}
                          </Text>
                          <Text style={styles.groupItemCount}>
                            {group.data.length}{' '}
                            {group.data.length === 1 ? 'sale' : 'sales'}
                          </Text>
                        </View>

                        <View style={styles.itemsList}>
                          {group.data.map((sale) => (
                            <SaleHistoryItemCard
                              key={sale.id}
                              sale={sale}
                              onPress={handleSelectSale}
                            />
                          ))}
                        </View>
                      </View>
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
    backgroundColor: Colors.primaryDark,
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
    paddingTop: Spacing.twoHalf,
    gap: Spacing.twoHalf,
  },
  periodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  periodChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  periodChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  periodChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  periodChipTextActive: {
    color: Colors.textInverse,
  },
  paymentChipStrip: {
    paddingVertical: 2,
  },
  // Period Total Sales Summary Hero Card
  summaryHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.heroCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    ...Shadows.sm,
  },
  summaryHeroCardCompact: {
    padding: Spacing.twoHalf,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.twoHalf,
  },
  summaryLeftCol: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  summaryBigAmount: {
    fontSize: 28,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  summaryBigAmountCompact: {
    fontSize: 24,
  },
  summaryBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  lineChartBox: {
    width: 88,
    height: 54,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartFillArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    paddingBottom: 2,
  },
  chartColumnBar: {
    width: 10,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  chartLineAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    height: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    transform: [{ rotate: '-14deg' }],
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  breakdownPillCash: {
    flex: 1,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.one + 2,
    gap: 2,
  },
  breakdownLabelCash: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  breakdownValueCash: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  breakdownPillUtang: {
    flex: 1,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.one + 2,
    gap: 2,
  },
  breakdownLabelUtang: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.accentDark,
  },
  breakdownValueUtang: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.accentDark,
    fontVariant: ['tabular-nums'],
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
    maxWidth: 290,
  },
  emptyButtonWrap: {
    width: '100%',
    maxWidth: 260,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  groupedContainer: {
    gap: Spacing.three,
  },
  groupSection: {
    gap: Spacing.two,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dateHeaderText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupItemCount: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  itemsList: {
    gap: Spacing.two,
  },
});
