import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { SaleHistoryItemCard } from '@/components/sales/SaleHistoryItemCard';
import { TodaySalesSummaryCard } from '@/components/sales/TodaySalesSummaryCard';
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
  computeTodaySalesSummary,
  fetchStoreSales,
  groupSalesByDate,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { Sale } from '@/types/sale';

/**
 * TindaMate Sales History Screen (`/sales/history`)
 *
 * Displays:
 * 1. Top Screen Header with "+ Record Sale" quick action
 * 2. Current day sales metric summary (Today's Sales total & transaction count)
 * 3. Chronological sales log grouped by human-readable date (Today, Yesterday, Date)
 * 4. Tap on any sale item to inspect complete historical Sale Details
 * 5. Honest loading, error, and empty states
 * 6. Route-aware persistent bottom navigation
 */
export default function SalesHistoryScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [sales, setSales] = useState<Sale[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSalesHistory = useCallback(
    async (showRefreshIndicator = false) => {
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
    },
    []
  );

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

    const tabNames: Record<NavTab, string> = {
      home: 'Home',
      products: 'Products Catalog',
      sales: 'Daily Sales & Cashier',
      utang: 'Lista ng Utang',
      more: 'Settings & Profile',
    };
    handleFutureModuleNotice(tabNames[tab], 'an upcoming batch');
  };

  const handleSelectSale = (sale: Sale) => {
    router.push({
      pathname: '/sales/[id]',
      params: { id: sale.id },
    });
  };

  const todaySummary = computeTodaySalesSummary(sales);
  const dateGroups = groupSalesByDate(sales);

  const headerSubtitle = isInitialLoading
    ? 'Loading store sales log...'
    : sales.length === 0
    ? 'No sales recorded yet'
    : `${sales.length} ${
        sales.length === 1 ? 'transaction' : 'transactions'
      } on record`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Top Screen Header */}
        <ProductScreenHeader
          title="Sales History"
          subtitle={headerSubtitle}
          showBack={true}
          onBack={handleBack}
          rightActionLabel="+ Record Sale"
          rightActionAccessibilityLabel="Record a new product sale"
          onRightActionPress={() => router.push('/sales' as any)}
        />

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
              /* 4. Populated State */
              <>
                {/* Feature 3: Simple Today's Sales Summary */}
                <TodaySalesSummaryCard summary={todaySummary} />

                {/* Date Grouped Sales Log */}
                <View style={styles.groupedContainer}>
                  {dateGroups.map((group) => (
                    <View key={group.dateTitle} style={styles.groupSection}>
                      {/* Section Date Header */}
                      <View style={styles.dateHeaderRow}>
                        <View style={styles.dateHeaderBadge}>
                          <Text style={styles.dateHeaderText}>
                            {group.dateTitle}
                          </Text>
                        </View>
                        <Text style={styles.groupItemCount}>
                          {group.data.length}{' '}
                          {group.data.length === 1 ? 'sale' : 'sales'}
                        </Text>
                      </View>

                      {/* Sale Items in Group */}
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
    maxWidth: 290,
  },
  emptyButtonWrap: {
    width: '100%',
    maxWidth: 260,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  groupedContainer: {
    gap: Spacing.four,
  },
  groupSection: {
    gap: Spacing.two,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  dateHeaderBadge: {
    backgroundColor: Colors.backgroundWarm,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateHeaderText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    letterSpacing: 0.2,
  },
  groupItemCount: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  itemsList: {
    gap: Spacing.two,
  },
});

