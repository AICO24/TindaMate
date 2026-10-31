import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  CalendarFilterIcon,
  DashboardBadgeVectorIcon,
  TrendChartVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { SaleHistoryItemCard } from '@/components/sales/SaleHistoryItemCard';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { fetchStoreSales, groupSalesByDate } from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { Sale } from '@/types/sale';

type HistoryPeriodFilter = 'This Week' | 'This Month' | 'Custom';

const PERIOD_FILTERS: HistoryPeriodFilter[] = [
  'This Week',
  'This Month',
  'Custom',
];

/**
 * TindaMate Sales History Screen (`/sales/history`) — Design 2.0
 *
 * Clean transaction-history pattern matching the Design 2.0 reference:
 * - Deep Green Header ("Sales History" + Trend Chart Icon + "+ New Sale")
 * - Period Filter Chips ("This Week", "This Month", "Today", "All")
 * - Total Sales Summary & Trend Card
 * - Chronological transaction cards with receipt badge, Date • Time, Peso amount, item count & "View ›" pill
 */
export default function SalesHistoryScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] =
    useState<HistoryPeriodFilter>('This Week');
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
    if (tab === 'utang') {
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

  // Filter sales by selected period
  const filteredSales = useMemo(() => {
    if (selectedPeriod === 'Custom') {
      return sales;
    }
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

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

  const periodTotalAmount = useMemo(() => {
    const sum = filteredSales.reduce(
      (acc, item) => acc + (Number(item.total_amount) || 0),
      0
    );
    return Number(sum.toFixed(2));
  }, [filteredSales]);

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
      <View style={styles.mainContainer}>
        {/* Deep Green Top Screen Header */}
        <View style={styles.heroHeaderZone}>
          <ProductScreenHeader
            title="Sales History"
            showBack={true}
            onBack={handleBack}
            leftIcon={
              <TrendChartVectorIcon color={Colors.textInverse} size={20} />
            }
            rightElement={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select date filter"
                onPress={() => setSelectedPeriod('Custom')}
                style={styles.calendarIconBtn}>
                <CalendarFilterIcon color={Colors.textInverse} size={18} />
              </Pressable>
            }
          />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Sales History...</Text>
                <Text style={styles.stateSubtitle}>
                  Fetching your store sales records from Supabase.
                </Text>
              </View>
            ) : errorMessage && sales.length === 0 ? (
              /* 2. Full Error State */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>!</Text>
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
              /* 4. Populated State: Total Sales Summary + Chronological List */
              <>
                {/* Period Total Sales KPI & Trend Visual Card */}
                <View style={styles.summaryHeroCard}>
                  <View style={styles.summaryLeftCol}>
                    <Text style={styles.summaryLabel}>Total Sales</Text>
                    <Text
                      style={styles.summaryBigAmount}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      numberOfLines={1}>
                      {formatPesoCurrency(periodTotalAmount)}
                    </Text>
                    <View style={styles.summaryBadgePill}>
                      <Text style={styles.summaryBadgeText}>
                        ↑ +15.2%
                      </Text>
                    </View>
                  </View>

                  {/* Sleek Ascending Trend Graphic */}
                  <View style={styles.lineChartBox}>
                    <View style={styles.chartFillArea}>
                      {miniTrendBars.map((ratio, index) => (
                        <View
                          key={index}
                          style={[
                            styles.chartColumnBar,
                            {
                              height: Math.max(14, Math.round(ratio * 52)),
                              opacity: 0.18 + (index / miniTrendBars.length) * 0.45,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.chartLineAccent} />
                  </View>
                </View>

                {filteredSales.length === 0 ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateTitle}>
                      No sales in &ldquo;{selectedPeriod}&rdquo;
                    </Text>
                    <Text style={styles.stateSubtitle}>
                      Switch to &ldquo;Custom&rdquo; to view all {sales.length}{' '}
                      recorded store transactions.
                    </Text>
                    <TindaMateButton
                      title="Show All Sales"
                      variant="secondary"
                      onPress={() => setSelectedPeriod('Custom')}
                    />
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
  periodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  periodChip: {
    paddingHorizontal: 18,
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
  // Period Total Sales Summary Hero Card
  summaryHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 18,
    paddingHorizontal: Spacing.four,
    gap: 14,
    ...Shadows.sm,
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
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  calendarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  lineChartBox: {
    width: 100,
    height: 60,
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
    width: 12,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  chartLineAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    height: 2.5,
    backgroundColor: '#10B981',
    borderRadius: 2,
    transform: [{ rotate: '-14deg' }],
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
    maxWidth: 290,
  },
  emptyButtonWrap: {
    width: '100%',
    maxWidth: 260,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  groupedContainer: {
    gap: Spacing.threeHalf,
  },
  groupSection: {
    gap: 10,
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
    gap: 10,
  },
});
