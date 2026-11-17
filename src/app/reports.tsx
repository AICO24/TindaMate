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
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, usePathname } from 'expo-router';

import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { TindaMateLoadingView } from '@/components/animated-icon';
import {
  CalendarFilterIcon,
  NavProductsIcon,
  TrendChartVectorIcon,
  WarningTriangleIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { AlertCircleIcon } from '@/components/ui/AuthIcons';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { fetchDashboardUtangSummary } from '@/lib/customers';
import { computeSalesBuckets } from '@/lib/chartBuckets';
import {
  fetchStoreExpenseSummaryForRange,
  getReportingPeriodRange,
} from '@/lib/expenses';
import {
  computeStoreProductSummary,
  fetchStoreProducts,
  formatPesoCurrency,
} from '@/lib/products';
import { fetchStoreCOGSSummary } from '@/lib/profit';
import {
  fetchStoreSales,
  fetchStoreTopProductsForRange,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { DashboardUtangSummary } from '@/types/customer';
import { DashboardExpenseSummary } from '@/types/expense';
import { Product } from '@/types/product';
import { COGSSummary, ReportPeriod } from '@/types/profit';
import { Sale, TopProductMetric } from '@/types/sale';

type ReportTab = 'Sales' | 'Profit' | 'Inventory' | 'Utang';

const REPORT_TABS: ReportTab[] = ['Sales', 'Profit', 'Inventory', 'Utang'];

const REPORT_PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

/**
 * TindaMate Reports & Analytics Screen (`/reports`) — Design 2.0
 *
 * Mobile-first business analytics screen powered 100% by real store data:
 * - Category Tabs: Sales, Profit, Inventory, Utang
 * - Main KPI & Bar Chart Card
 * - Top Products Ranking with horizontal progress bars & percentage share
 * - Financial & Inventory Breakdown Cards
 */
export default function ReportsScreen() {
  const pathname = usePathname();
  const activeNavTab = resolveActiveNavTab(pathname);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedTab, setSelectedTab] = useState<ReportTab>('Sales');
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cogsSummary, setCogsSummary] = useState<COGSSummary | null>(null);
  const [utangSummary, setUtangSummary] =
    useState<DashboardUtangSummary | null>(null);
  const [expenseSummary, setExpenseSummary] =
    useState<DashboardExpenseSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductMetric[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeRequestIdRef = React.useRef(0);

  const loadAnalytics = useCallback(
    async (period: ReportPeriod = selectedPeriod, showRefresh = false) => {
      const requestId = ++activeRequestIdRef.current;
      try {
        if (showRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          router.replace('/');
          return;
        }

        const periodRange = getReportingPeriodRange(period);

        const [
          salesData,
          productsData,
          cogsData,
          utangData,
          expenseData,
          topProductsData,
        ] = await Promise.all([
          fetchStoreSales(
            periodRange.startTimestampISO,
            periodRange.endTimestampISO
          ),
          fetchStoreProducts(),
          fetchStoreCOGSSummary({
            startDate: periodRange.startTimestampISO,
            endDate: periodRange.endTimestampISO,
          }),
          fetchDashboardUtangSummary().catch(() => null),
          fetchStoreExpenseSummaryForRange(
            periodRange.startDateDateOnly,
            periodRange.endDateDateOnly
          ),
          fetchStoreTopProductsForRange(
            periodRange.startTimestampISO,
            periodRange.endTimestampISO,
            5
          ),
        ]);

        // Guard against stale response if user switched periods rapidly
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        // Enrich top products with real product image URLs
        const productImageMap = new Map<string, string | null>();
        productsData.forEach((p) => {
          productImageMap.set(p.id, p.image_url);
          productImageMap.set(p.name.toLowerCase(), p.image_url);
        });

        const enrichedTopProducts = topProductsData.map((item) => ({
          ...item,
          imageUrl:
            item.imageUrl ||
            productImageMap.get(item.id) ||
            productImageMap.get(item.name.toLowerCase()) ||
            null,
        }));

        setSales(salesData);
        setProducts(productsData);
        setCogsSummary(cogsData);
        setUtangSummary(utangData);
        setExpenseSummary(expenseData);
        setTopProducts(enrichedTopProducts);
      } catch (err: unknown) {
        if (requestId !== activeRequestIdRef.current) {
          return;
        }
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load store analytics. Please try again.';
        setErrorMessage(msg);
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [selectedPeriod]
  );

  const handlePeriodChange = (period: ReportPeriod) => {
    if (period === selectedPeriod) return;
    setSelectedBarIdx(null);
    setSelectedPeriod(period);
    loadAnalytics(period, false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAnalytics(selectedPeriod, false);
    }, [loadAnalytics, selectedPeriod])
  );

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') {
      router.replace('/home');
      return;
    }
    if (tab === 'sales') {
      router.replace('/sales' as any);
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

  // Compute real totals
  const totalSalesAmount = useMemo(() => {
    const sum = sales.reduce(
      (acc, s) => acc + (Number(s.total_amount) || 0),
      0
    );
    return Number(sum.toFixed(2));
  }, [sales]);

  const productSummary = useMemo(
    () => computeStoreProductSummary(products),
    [products]
  );

  const grossProfit = cogsSummary?.grossProfit ?? null;
  const totalCOGS = cogsSummary?.cogs ?? null;
  const totalExpenses = expenseSummary?.totalExpenses ?? null;
  const hasIncompleteCosts = Boolean(cogsSummary?.hasIncompleteCosts);

  const netStoreProfit = useMemo<number | null>(() => {
    if (grossProfit === null || totalExpenses === null) {
      return null;
    }
    const grossCentavos = Math.round(grossProfit * 100);
    const expenseCentavos = Math.round(totalExpenses * 100);
    return Number(((grossCentavos - expenseCentavos) / 100).toFixed(2));
  }, [grossProfit, totalExpenses]);
  const totalUtang = utangSummary?.totalOutstandingUtang ?? null;

  const inventoryValuation = useMemo(() => {
    let retailCentavos = 0;
    let costCentavos = 0;
    let trackedCostProducts = 0;

    for (const p of products) {
      const qty = Math.max(0, p.stock_quantity);
      retailCentavos += Math.round(p.selling_price * 100) * qty;
      if (p.cost_price !== null && p.cost_price !== undefined) {
        costCentavos += Math.round(p.cost_price * 100) * qty;
        trackedCostProducts += 1;
      }
    }

    return {
      retailValue: Number((retailCentavos / 100).toFixed(2)),
      costValue: Number((costCentavos / 100).toFixed(2)),
      trackedCostProducts,
    };
  }, [products]);

  const periodRange = useMemo(
    () => getReportingPeriodRange(selectedPeriod),
    [selectedPeriod]
  );

  // Compute period-aligned, PHT-aware chronological sales buckets
  const chartBars = useMemo(() => {
    return computeSalesBuckets(
      sales,
      selectedPeriod,
      {
        start: periodRange.startTimestampISO,
        end: periodRange.endTimestampISO,
      },
      new Date()
    );
  }, [
    sales,
    selectedPeriod,
    periodRange.startTimestampISO,
    periodRange.endTimestampISO,
  ]);

  // Dynamic Hero Metric based on active tab
  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All-Time';
    }
  }, [selectedPeriod]);

  const heroMetric = useMemo(() => {
    if (selectedTab === 'Profit') {
      const formattedGross =
        grossProfit !== null
          ? hasIncompleteCosts
            ? `~${formatPesoCurrency(grossProfit)}`
            : formatPesoCurrency(grossProfit)
          : '—';
      const formattedNet =
        netStoreProfit !== null
          ? hasIncompleteCosts
            ? `~${formatPesoCurrency(netStoreProfit)}`
            : formatPesoCurrency(netStoreProfit)
          : null;

      return {
        amount: formattedGross,
        label: hasIncompleteCosts
          ? `${periodLabel} Est. Gross Profit*`
          : `${periodLabel} Gross Profit`,
        badge:
          formattedNet !== null
            ? `${hasIncompleteCosts ? 'Est. net' : 'Net'} after expenses: ${formattedNet}`
            : 'Net profit unavailable',
      };
    }
    if (selectedTab === 'Inventory') {
      return {
        amount: formatPesoCurrency(inventoryValuation.retailValue),
        label: 'Inventory Retail Value',
        badge: `${productSummary.totalProducts} products · ${
          productSummary.lowStockCount + productSummary.outOfStockCount
        } alerts`,
      };
    }
    if (selectedTab === 'Utang') {
      return {
        amount: totalUtang !== null ? formatPesoCurrency(totalUtang) : '—',
        label: 'Total Outstanding Utang',
        badge: `${
          utangSummary?.customersWithBalanceCount ?? 0
        } customers with balance`,
      };
    }
    return {
      amount: formatPesoCurrency(totalSalesAmount),
      label: `${periodLabel} Sales`,
      badge: `${sales.length} ${
        sales.length === 1 ? 'transaction' : 'transactions'
      } recorded`,
    };
  }, [
    selectedTab,
    periodLabel,
    grossProfit,
    netStoreProfit,
    hasIncompleteCosts,
    inventoryValuation.retailValue,
    productSummary,
    totalUtang,
    utangSummary,
    totalSalesAmount,
    sales.length,
  ]);

  const isChartEmpty = chartBars.every((b) => b.amount === 0);
  const maxBucketAmount = Math.max(...chartBars.map((b) => b.amount), 0);
  const getBarHeight = (amount: number) =>
    amount > 0 && maxBucketAmount > 0
      ? Math.max(6, Math.round((amount / maxBucketAmount) * 84))
      : 2; // zero baseline indicator, 2px

  const barCount = chartBars.length;
  const barWidth = isCompactPhone
    ? barCount >= 7
      ? 18
      : 22
    : barCount >= 7
    ? 24
    : 28;
  const activeBarIdx =
    selectedBarIdx !== null && selectedBarIdx < chartBars.length
      ? selectedBarIdx
      : chartBars.length > 0
      ? chartBars.length - 1
      : null;

  const isInitialLoadError =
    Boolean(errorMessage) &&
    !cogsSummary &&
    sales.length === 0 &&
    products.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Deep Green Header */}
        <ProductScreenHeader
          title="Reports"
          subtitle={`${periodLabel} store performance & profit`}
          showBack={true}
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
          rightElement={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View sales history log"
              accessibilityHint="Opens full sales history screen"
              onPress={() => router.push('/sales/history')}
              style={({ pressed }) => [
                styles.calendarIconBtn,
                pressed && styles.iconBtnPressed,
              ]}>
              <CalendarFilterIcon color={Colors.textInverse} size={18} />
            </Pressable>
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadAnalytics(selectedPeriod, true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {/* Reporting Period Selector (Today, This Week, This Month, All Time) */}
            <View style={styles.periodSelectorWrap}>
              {REPORT_PERIODS.map((p) => {
                const isSelected = selectedPeriod === p.key;
                return (
                  <Pressable
                    key={p.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filter reports by ${p.label}`}
                    onPress={() => handlePeriodChange(p.key)}
                    style={[
                      styles.periodSegmentBtn,
                      isSelected && styles.periodSegmentBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.periodSegmentText,
                        isSelected && styles.periodSegmentTextActive,
                      ]}
                      numberOfLines={1}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Category Tabs: Sales, Profit, Inventory, Utang */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabStrip}>
              {REPORT_TABS.map((tab) => {
                const isSelected = selectedTab === tab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setSelectedTab(tab)}
                    style={[styles.tabChip, isSelected && styles.tabChipActive]}>
                    <Text
                      style={[
                        styles.tabChipText,
                        isSelected && styles.tabChipTextActive,
                      ]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {errorMessage && !isInitialLoadError ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadAnalytics(selectedPeriod, true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {isLoading ? (
              <View style={styles.loadingCard}>
                <TindaMateLoadingView
                  compact
                  message="Calculating Store Reports..."
                />
              </View>
            ) : isInitialLoadError ? (
              <View style={styles.errorStateCard}>
                <View style={styles.errorIconCircle}>
                  <WarningTriangleIcon
                    size={24}
                    bgColor={Colors.errorLight}
                    fgColor={Colors.error}
                  />
                </View>
                <Text style={styles.errorStateTitle}>
                  Could Not Load Store Reports
                </Text>
                <Text style={styles.errorStateSubtitle}>{errorMessage}</Text>
                <View style={styles.errorRetryWrap}>
                  <TindaMateButton
                    title="Retry Loading"
                    variant="primary"
                    onPress={() => loadAnalytics(selectedPeriod, true)}
                    accessibilityLabel="Retry loading store reports"
                  />
                </View>
              </View>
            ) : (
              <>
                {/* Main KPI & Full-Width Interactive Bar Chart Card */}
                <View style={styles.kpiChartCard}>
                  <View style={styles.kpiHeaderRow}>
                    <View style={styles.kpiLeftCol}>
                      <Text style={styles.kpiLabel}>{heroMetric.label}</Text>
                      <Text
                        style={styles.kpiBigAmount}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        numberOfLines={1}>
                        {heroMetric.amount}
                      </Text>
                    </View>

                    <View style={styles.kpiTrendPill}>
                      <Text style={styles.kpiTrendPillText} numberOfLines={1}>
                        {heroMetric.badge}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chartDivider} />

                  {/* Period-Aware Chronological Interactive Sales Trend Chart */}
                  <View style={styles.chartSection}>
                    <View style={styles.chartHeaderRow}>
                      <View style={styles.chartTitleCluster}>
                        <TrendChartVectorIcon
                          size={15}
                          color={Colors.primaryDark}
                        />
                        <Text style={styles.chartSubtitle} numberOfLines={1}>
                          Sales Trend ({periodLabel})
                        </Text>
                      </View>
                      {activeBarIdx !== null && chartBars[activeBarIdx] ? (
                        <Text
                          style={styles.chartSelectedReadout}
                          numberOfLines={1}>
                          {chartBars[activeBarIdx].label}:{' '}
                          {formatPesoCurrency(chartBars[activeBarIdx].amount)}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.barChartWrap}>
                      {chartBars.map((bucket, idx) => {
                        const barHeight = getBarHeight(bucket.amount);
                        const isSelected = activeBarIdx === idx;
                        return (
                          <Pressable
                            key={`${bucket.label}-${idx}`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`${bucket.label} sales: ${formatPesoCurrency(bucket.amount)}`}
                            accessibilityHint="Tap to inspect sales total for this period"
                            onPress={() => setSelectedBarIdx(idx)}
                            style={styles.barItemCol}>
                            <View style={styles.barStage}>
                              <View
                                style={[
                                  styles.verticalBar,
                                  {
                                    width: barWidth,
                                    height: barHeight,
                                    backgroundColor: isSelected
                                      ? Colors.primaryDark
                                      : bucket.amount > 0
                                      ? Colors.primary
                                      : Colors.border,
                                  },
                                ]}
                              />
                            </View>
                            <Text
                              style={[
                                styles.barLabel,
                                isSelected && styles.barLabelSelected,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.75}>
                              {bucket.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {isChartEmpty ? (
                      <Text style={styles.emptyChartCaption} numberOfLines={1}>
                        No sales recorded in this period
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Incomplete Product Cost Safety Warning Banner */}
                {hasIncompleteCosts && cogsSummary ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Incomplete product cost warning. Tap to review products."
                    accessibilityHint="Opens products list to update missing cost prices"
                    onPress={() => router.push('/products')}
                    style={({ pressed }) => [
                      styles.incompleteCostBanner,
                      pressed && styles.pressedCard,
                    ]}>
                    <AlertCircleIcon size={18} color={Colors.warningText} />
                    <View style={styles.incompleteCostCol}>
                      <Text style={styles.incompleteCostTitle}>
                        Estimated Profit (Incomplete Cost Data)
                      </Text>
                      <Text style={styles.incompleteCostBody}>
                        {cogsSummary.untrackedCostItemCount} sold{' '}
                        {cogsSummary.untrackedCostItemCount === 1
                          ? 'item'
                          : 'items'}{' '}
                        ({cogsSummary.untrackedQuantity}{' '}
                        {cogsSummary.untrackedQuantity === 1 ? 'unit' : 'units'}
                        ) had no recorded cost price. COGS reflects{' '}
                        {cogsSummary.trackedCostItemCount}/
                        {cogsSummary.saleItemCount} tracked items. Tap to update
                        products ›
                      </Text>
                    </View>
                  </Pressable>
                ) : null}

                {/* Profit & Loss Breakdown Card (Prominent on Profit tab, or below chart) */}
                {selectedTab === 'Profit' || selectedTab === 'Sales' ? (
                  <View style={styles.pnlCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        {periodLabel} Profit &amp; Cost Summary
                      </Text>
                      {hasIncompleteCosts ? (
                        <View style={styles.estPill}>
                          <Text style={styles.estPillText}>ESTIMATED</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.pnlRows}>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>Sales Revenue</Text>
                        <Text style={styles.pnlValue}>
                          {formatPesoCurrency(totalSalesAmount)}
                        </Text>
                      </View>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>
                          Tracked Cost of Goods (COGS)
                        </Text>
                        <Text style={styles.pnlValueMuted}>
                          {totalCOGS !== null
                            ? `- ${formatPesoCurrency(totalCOGS)}`
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.pnlDivider} />
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabelBold}>
                          {hasIncompleteCosts
                            ? 'Est. Gross Profit*'
                            : 'Gross Profit'}
                        </Text>
                        <Text style={styles.pnlValueBold}>
                          {grossProfit !== null
                            ? `${hasIncompleteCosts ? '~' : ''}${formatPesoCurrency(grossProfit)}`
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>
                          Operating Expenses ({expenseSummary?.expenseCount ?? 0}
                          )
                        </Text>
                        <Text style={styles.pnlValueMuted}>
                          {totalExpenses !== null
                            ? `- ${formatPesoCurrency(totalExpenses)}`
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.pnlDivider} />
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlNetLabel}>
                          {hasIncompleteCosts
                            ? 'Est. Net Profit*'
                            : 'Net Store Profit'}
                        </Text>
                        <Text
                          style={[
                            styles.pnlNetValue,
                            netStoreProfit !== null &&
                              netStoreProfit < 0 &&
                              styles.pnlNetNegative,
                          ]}>
                          {netStoreProfit !== null
                            ? `${hasIncompleteCosts ? '~' : ''}${formatPesoCurrency(netStoreProfit)}`
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Tab-Aware Inventory Summary Card */}
                {selectedTab === 'Inventory' ? (
                  <View style={styles.pnlCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        Store Inventory Health
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/products')}>
                        <Text style={styles.seeAllLink}>Manage →</Text>
                      </Pressable>
                    </View>
                    <View style={styles.pnlRows}>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>Total Products</Text>
                        <Text style={styles.pnlValue}>
                          {productSummary.totalProducts}
                        </Text>
                      </View>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>In Stock</Text>
                        <Text style={styles.pnlValuePositive}>
                          {productSummary.inStockCount}
                        </Text>
                      </View>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>Low Stock</Text>
                        <Text style={styles.pnlValueWarning}>
                          {productSummary.lowStockCount}
                        </Text>
                      </View>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>Out of Stock</Text>
                        <Text style={styles.pnlValueDanger}>
                          {productSummary.outOfStockCount}
                        </Text>
                      </View>
                      <View style={styles.pnlDivider} />
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabelBold}>
                          Tracked Cost Value ({inventoryValuation.trackedCostProducts}/
                          {productSummary.totalProducts})
                        </Text>
                        <Text style={styles.pnlValueBold}>
                          {formatPesoCurrency(inventoryValuation.costValue)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Tab-Aware Utang Summary Card */}
                {selectedTab === 'Utang' ? (
                  <View style={styles.pnlCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        Customer Credit &amp; Collections
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/customers' as any)}>
                        <Text style={styles.seeAllLink}>Open Ledger →</Text>
                      </Pressable>
                    </View>
                    <View style={styles.pnlRows}>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>
                          Total Outstanding Utang
                        </Text>
                        <Text
                          style={[
                            styles.pnlValueBold,
                            totalUtang !== null &&
                              totalUtang > 0 && { color: Colors.accentDark },
                          ]}>
                          {totalUtang !== null
                            ? formatPesoCurrency(totalUtang)
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabel}>
                          Customers with Balance
                        </Text>
                        <Text style={styles.pnlValue}>
                          {utangSummary
                            ? utangSummary.customersWithBalanceCount
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.pnlDivider} />
                      <View style={styles.pnlRow}>
                        <Text style={styles.pnlLabelBold}>
                          Collected Today
                        </Text>
                        <Text style={styles.pnlValuePositive}>
                          {utangSummary
                            ? formatPesoCurrency(
                                utangSummary.todayPaymentsTotal
                              )
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Top Products Card */}
                <View style={styles.topProductsCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                      Top Products ({periodLabel})
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push('/products')}>
                      <Text style={styles.seeAllLink}>See All →</Text>
                    </Pressable>
                  </View>

                  {topProducts.length === 0 ? (
                    <Text style={styles.emptySubtext}>
                      No product sales recorded for this period yet.
                    </Text>
                  ) : (
                    <View style={styles.topProductsList}>
                      {topProducts.map((item, idx) => {
                        const hasValidProductId = /^[0-9a-f]{8}-/i.test(
                          item.id
                        );
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityLabel={`Rank ${idx + 1}: ${item.name}, ${item.unitsSold} sold, ${formatPesoCurrency(item.revenue)}, ${item.sharePercent}% of sales`}
                            onPress={() =>
                              router.push(
                                hasValidProductId
                                  ? (`/products/${item.id}` as any)
                                  : '/products'
                              )
                            }
                            style={({ pressed }) => [
                              styles.topProductRow,
                              pressed && styles.pressedCard,
                            ]}>
                            <View style={styles.rankBadge}>
                              <Text style={styles.rankBadgeText}>
                                {idx + 1}
                              </Text>
                            </View>

                            {/* Product Thumbnail / Icon */}
                            <View style={styles.topProductThumb}>
                              {item.imageUrl ? (
                                <Image
                                  source={{ uri: item.imageUrl }}
                                  style={styles.topProductImg}
                                  contentFit="contain"
                                />
                              ) : (
                                <NavProductsIcon color={Colors.primary} />
                              )}
                            </View>

                            {/* Name + Units/Share + Progress Bar */}
                            <View style={styles.topProductCenter}>
                              <View style={styles.topProductTitleRow}>
                                <Text
                                  style={styles.topProductName}
                                  numberOfLines={1}>
                                  {item.name}
                                </Text>
                                <Text style={styles.topProductShare}>
                                  {formatPesoCurrency(item.revenue)}
                                </Text>
                              </View>

                              <Text style={styles.topProductMeta}>
                                {item.unitsSold}{' '}
                                {item.unitsSold === 1 ? 'unit' : 'units'} sold ·{' '}
                                {item.sharePercent}% of sales
                              </Text>

                              <View style={styles.progressTrack}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${Math.max(
                                        12,
                                        item.sharePercent
                                      )}%`,
                                      backgroundColor: Colors.accent,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Financial & Inventory Breakdown Grid */}
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownTile}>
                    <Text style={styles.breakdownLabel}>{periodLabel} Sales</Text>
                    <Text
                      style={styles.breakdownValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}>
                      {formatPesoCurrency(totalSalesAmount)}
                    </Text>
                    <Text style={styles.breakdownCaption}>
                      {sales.length} {sales.length === 1 ? 'sale' : 'total sales'}
                    </Text>
                  </View>

                  <View style={styles.breakdownTile}>
                    <Text style={styles.breakdownLabel}>
                      {hasIncompleteCosts ? 'Tracked COGS*' : 'Recorded COGS'}
                    </Text>
                    <Text
                      style={styles.breakdownValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}>
                      {totalCOGS !== null ? formatPesoCurrency(totalCOGS) : '—'}
                    </Text>
                    <Text style={styles.breakdownCaption}>
                      {cogsSummary
                        ? `${cogsSummary.trackedCostItemCount}/${cogsSummary.saleItemCount} items tracked`
                        : 'COGS unavailable'}
                    </Text>
                  </View>

                  <View style={styles.breakdownTile}>
                    <Text style={styles.breakdownLabel}>
                      {periodLabel} Expenses
                    </Text>
                    <Text
                      style={styles.breakdownValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}>
                      {totalExpenses !== null
                        ? formatPesoCurrency(totalExpenses)
                        : '—'}
                    </Text>
                    <Text style={styles.breakdownCaption}>
                      {expenseSummary
                        ? `${expenseSummary.expenseCount} expense ${
                            expenseSummary.expenseCount === 1
                              ? 'entry'
                              : 'entries'
                          }`
                        : '—'}
                    </Text>
                  </View>

                  <View style={styles.breakdownTile}>
                    <Text style={styles.breakdownLabel}>Unpaid Utang</Text>
                    <Text
                      style={[
                        styles.breakdownValue,
                        totalUtang !== null &&
                          totalUtang > 0 && { color: Colors.accentDark },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}>
                      {totalUtang !== null ? formatPesoCurrency(totalUtang) : '—'}
                    </Text>
                    <Text style={styles.breakdownCaption}>
                      Current outstanding balance
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Persistent Bottom Navigation */}
        <DashboardBottomNav
          activeTab={activeNavTab}
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
  calendarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
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
  periodSelectorWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xl,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  periodSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  periodSegmentBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.xs,
  },
  periodSegmentText: {
    fontSize: 12,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  periodSegmentTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
  tabStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  tabChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  tabChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  tabChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  tabChipTextActive: {
    color: Colors.textInverse,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  errorStateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.twoHalf,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorStateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  errorStateSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
  },
  errorRetryWrap: {
    width: '100%',
    maxWidth: 260,
    marginTop: Spacing.one,
  },
  pressedCard: {
    opacity: 0.88,
  },
  // Main KPI & Full-Width Interactive Bar Chart Card
  kpiChartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.primaryCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  kpiLeftCol: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  kpiBigAmount: {
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  kpiLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  kpiTrendPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  kpiTrendPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  chartDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  chartSection: {
    gap: Spacing.two,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  chartTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartSubtitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  chartSelectedReadout: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    fontVariant: ['tabular-nums'],
  },
  barChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 106,
    paddingTop: Spacing.one,
  },
  barItemCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barStage: {
    height: 84,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  verticalBar: {
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10.5,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  barLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
  emptyChartCaption: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Incomplete Cost Warning Banner
  incompleteCostBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.twoHalf,
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
  },
  incompleteCostCol: {
    flex: 1,
    gap: 2,
  },
  incompleteCostTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.warningText,
  },
  incompleteCostBody: {
    fontSize: 11.5,
    color: Colors.warningText,
    lineHeight: 16,
  },
  // P&L / Inventory / Utang Summary Card
  pnlCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.primaryCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  estPill: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  estPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    color: Colors.warningText,
    letterSpacing: 0.4,
  },
  pnlRows: {
    gap: Spacing.two,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pnlLabel: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  pnlLabelBold: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
    flex: 1,
  },
  pnlValue: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  pnlValueMuted: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  pnlValueBold: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  pnlValuePositive: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.successText,
    fontVariant: ['tabular-nums'],
  },
  pnlValueWarning: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  pnlValueDanger: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
    fontVariant: ['tabular-nums'],
  },
  pnlDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 2,
  },
  pnlNetLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  pnlNetValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  pnlNetNegative: {
    color: Colors.error,
  },
  // Top Products Section
  topProductsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.primaryCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  seeAllLink: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  emptySubtext: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  topProductsList: {
    gap: 14,
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  topProductThumb: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topProductImg: {
    width: '84%',
    height: '84%',
  },
  topProductCenter: {
    flex: 1,
    gap: 4,
  },
  topProductTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topProductName: {
    flex: 1,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  topProductShare: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  topProductMeta: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  // Breakdown Grid
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  breakdownTile: {
    width: '48.4%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.threeHalf,
    gap: 4,
    ...Shadows.xs,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  breakdownCaption: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});
