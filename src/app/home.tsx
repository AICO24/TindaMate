import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { User } from '@supabase/supabase-js';

import { TindaMateLoadingView } from '@/components/animated-icon';
import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardHeroBanner } from '@/components/dashboard/DashboardHeroBanner';
import {
  KpiCartCheckIcon,
  KpiLowStockBoxIcon,
  KpiProfitCoinIcon,
  TrendChartVectorIcon,
  WarningTriangleIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { QuickActionItem, QuickActionTile } from '@/components/dashboard/QuickActionTile';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { UtangOverviewCard } from '@/components/dashboard/UtangOverviewCard';
import { ExpenseOverviewCard } from '@/components/dashboard/ExpenseOverviewCard';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { fetchStoreProductSummary, formatPesoCurrency } from '@/lib/products';
import { fetchDashboardSalesData, fetchStoreSales } from '@/lib/sales';
import { fetchDashboardUtangSummary } from '@/lib/customers';
import { fetchDashboardExpenseSummary } from '@/lib/expenses';
import { fetchStoreCOGSSummary } from '@/lib/profit';
import { parseAndApplyOAuthTokens } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { StoreProductSummary } from '@/types/product';
import { Sale, TodaySalesSummary } from '@/types/sale';
import { DashboardUtangSummary } from '@/types/customer';
import { DashboardExpenseSummary } from '@/types/expense';

/**
 * TindaMate Main Dashboard Screen
 *
 * Visually Unified, Mobile-First Dashboard using the TindaMate Design System:
 * 1. Full-bleed Hero Zone (Colors.backgroundWarm with rounded bottom corners):
 *    - Prominent TindaMate brand emblem & circular vector profile avatar
 *    - Strong greeting typography ("Good morning,", large bold name, store pill)
 *    - Vibrant pure React Native market stall illustration
 * 2. Store Overview (2x2 grid of horizontal KPI cards with clear Label -> Value -> Helper hierarchy)
 * 3. Quick Actions (4-column row with Record Sale prioritized first)
 * 4. Recent Activity (Polished empty state card with transaction guidance)
 * 5. Route-aware Persistent Bottom Navigation bar (Home, Products, Sales, Utang, More)
 */
export default function AuthenticatedDashboardScreen() {
  const pathname = usePathname();
  const routeTab = resolveActiveNavTab(pathname);
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const params = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = params.guest === '1';

  const [user, setUser] = useState<User | null>(null);
  const [productSummary, setProductSummary] = useState<StoreProductSummary>({
    totalProducts: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [todaySalesSummary, setTodaySalesSummary] = useState<TodaySalesSummary>({
    totalAmount: 0,
    transactionCount: 0,
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [allStoreSales, setAllStoreSales] = useState<Sale[]>([]);
  const [todayGrossProfit, setTodayGrossProfit] = useState<number | null>(null);
  const [utangSummary, setUtangSummary] = useState<DashboardUtangSummary>({
    totalOutstandingUtang: 0,
    customersWithBalanceCount: 0,
    todayPaymentsTotal: 0,
  });
  const [utangError, setUtangError] = useState<string | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<DashboardExpenseSummary>({
    totalExpenses: 0,
    expenseCount: 0,
  });
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  /**
   * Fetches real store metrics from Supabase:
   * 1. Product & stock counts (Total, In Stock, Low Stock)
   * 2. Today's sales revenue & transaction count
   * 3. Recent completed sales activity
   */
  const loadDashboardData = useCallback(async () => {
    if (isGuestMode) {
      setProductSummary({
        totalProducts: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      });
      setTodaySalesSummary({
        totalAmount: 0,
        transactionCount: 0,
      });
      setRecentSales([]);
      setAllStoreSales([]);
      setTodayGrossProfit(0);
      setUtangSummary({
        totalOutstandingUtang: 0,
        customersWithBalanceCount: 0,
        todayPaymentsTotal: 0,
      });
      setUtangError(null);
      setExpenseSummary({
        totalExpenses: 0,
        expenseCount: 0,
      });
      setExpenseError(null);
      return;
    }

    try {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

      const [productRes, salesRes, utangRes, expenseRes, allSalesRes, cogsRes] =
        await Promise.allSettled([
          fetchStoreProductSummary(),
          fetchDashboardSalesData(),
          fetchDashboardUtangSummary(),
          fetchDashboardExpenseSummary(),
          fetchStoreSales(),
          fetchStoreCOGSSummary({ startDate: startOfToday }),
        ]);

      if (productRes.status === 'fulfilled') {
        setProductSummary(productRes.value);
      } else {
        console.warn('[Dashboard Product Error]:', productRes.reason);
      }

      if (salesRes.status === 'fulfilled') {
        setTodaySalesSummary(salesRes.value.todaySummary);
        setRecentSales(salesRes.value.recentSales);
      } else {
        console.warn('[Dashboard Sales Error]:', salesRes.reason);
      }

      if (allSalesRes.status === 'fulfilled') {
        setAllStoreSales(allSalesRes.value);
      }

      if (cogsRes.status === 'fulfilled') {
        setTodayGrossProfit(cogsRes.value.grossProfit);
      } else {
        setTodayGrossProfit(null);
      }

      if (utangRes.status === 'fulfilled') {
        setUtangSummary(utangRes.value);
        setUtangError(null);
      } else {
        console.warn('[Dashboard Utang Error]:', utangRes.reason);
        setUtangError(
          utangRes.reason instanceof Error
            ? utangRes.reason.message
            : 'Could not load Utang summary.'
        );
      }

      if (expenseRes.status === 'fulfilled') {
        setExpenseSummary(expenseRes.value);
        setExpenseError(null);
      } else {
        console.warn('[Dashboard Expense Error]:', expenseRes.reason);
        setExpenseError(
          expenseRes.reason instanceof Error
            ? expenseRes.reason.message
            : 'Could not load Expense summary.'
        );
      }

      if (
        productRes.status === 'rejected' &&
        salesRes.status === 'rejected' &&
        utangRes.status === 'rejected' &&
        expenseRes.status === 'rejected'
      ) {
        const msg =
          productRes.reason instanceof Error
            ? productRes.reason.message
            : 'Unable to load store dashboard data.';
        setErrorMessage(msg);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to load store dashboard data.';
      setErrorMessage(msg);
    }
  }, [isGuestMode]);

  useEffect(() => {
    let isMounted = true;

    // Verify session on mount (supports guest preview without session bounce)
    const checkSession = async () => {
      try {
        // If arrived via deep link with tokens, apply them first
        const initialUrl = await Linking.getInitialURL();
        if (
          initialUrl &&
          (initialUrl.includes('access_token=') || initialUrl.includes('code='))
        ) {
          console.log('[Home] Processing deep link auth tokens...');
          await parseAndApplyOAuthTokens(initialUrl);
        }

        let { data } = await supabase.auth.getSession();

        // Grace period for AsyncStorage to finish hydrating if needed
        if (!data?.session) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const retry = await supabase.auth.getSession();
          data = retry.data;
        }

        if (data?.session) {
          if (isMounted) {
            setUser(data.session.user);
          }
          await loadDashboardData();
        } else {
          // If no active session, allow entry only if explicitly in guest mode
          if (isGuestMode) {
            if (isMounted) {
              setUser(null);
            }
          } else {
            if (isMounted) router.replace('/');
            return;
          }
        }
      } catch (err) {
        console.warn('[Dashboard Session Error]:', err);
        if (!isGuestMode && isMounted) {
          router.replace('/');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // ONLY redirect to '/' if the user explicitly SIGNED OUT!
      if (event === 'SIGNED_OUT' && isMounted) {
        if (!isGuestMode) {
          router.replace('/');
        } else {
          setUser(null);
        }
      } else if (session && isMounted) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isGuestMode]);

  // Refresh store metrics (products, sales summary, recent activity) whenever user returns to Home
  useFocusEffect(
    useCallback(() => {
      if (!isGuestMode && !isLoading) {
        loadDashboardData();
      }
    }, [isGuestMode, isLoading, loadDashboardData])
  );

  /**
   * Close Profile/Store Account modal and restore route-derived active tab
   */
  const handleCloseProfileModal = () => {
    setIsProfileModalVisible(false);
  };

  /**
   * Pull-to-refresh handler
   * Re-validates active session, clears errors, and refreshes real store product & sales metrics
   */
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setIsCardLoading(true);
      setErrorMessage(null);

      if (isGuestMode) {
        // In guest preview mode, brief visual pulse without Supabase auth redirect
        await new Promise((resolve) => setTimeout(resolve, 600));
        return;
      }

      // Verify active session with Supabase
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setErrorMessage('Unable to connect to Supabase. Check your connection and retry.');
        return;
      }

      if (!data.session) {
        router.replace('/');
        return;
      }

      setUser(data.session.user);
      await loadDashboardData();
    } catch (err) {
      console.warn('[Dashboard Refresh Exception]:', err);
      setErrorMessage('Network connection lost. Tap Retry to reconnect.');
    } finally {
      setIsRefreshing(false);
      setIsCardLoading(false);
    }
  };

  /**
   * Opens custom branded logout confirmation modal
   */
  const handleOpenLogoutModal = () => {
    setIsProfileModalVisible(false);
    setIsLogoutModalVisible(true);
  };

  /**
   * Closes logout confirmation modal safely
   */
  const handleCloseLogoutModal = () => {
    if (isLoggingOut) return;
    setIsLogoutModalVisible(false);
  };

  /**
   * Performs user sign out when confirmed in modal
   */
  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[SignOut Error]:', error.message);
      }
      setIsLogoutModalVisible(false);
      router.replace('/');
    } catch (err) {
      console.warn('[SignOut Exception]:', err);
      setIsLogoutModalVisible(false);
      router.replace('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Module click handler: in guest preview mode, guides user to log in; otherwise shows batch roadmap notice
   */
  const handleModuleClick = (moduleName: string, batchNote: string) => {
    if (isGuestMode) {
      const message = `${moduleName} is part of the full TindaMate store manager. Would you like to log in or create an account to start managing your store?`;
      if (Platform.OS === 'web') {
        const wantsAuth = window.confirm(message);
        if (wantsAuth) {
          router.push('/login');
        }
      } else {
        Alert.alert('Guest Preview', message, [
          { text: 'Explore More', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/login') },
        ]);
      }
      return;
    }

    const message = `${moduleName} will be connected to your Supabase store database in ${batchNote}!`;
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(moduleName, message, [{ text: 'Got it!' }]);
    }
  };

  /**
   * Handle bottom tab switching
   */
  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') {
      if (pathname !== '/home') {
        router.replace(isGuestMode ? { pathname: '/home', params: { guest: '1' } } : '/home');
      }
      return;
    }

    if (tab === 'products') {
      if (isGuestMode) {
        handleModuleClick('Products Catalog', 'Batch 3');
        return;
      }
      router.push('/products');
      return;
    }

    if (tab === 'sales') {
      if (isGuestMode) {
        handleModuleClick('Record Sale', 'Batch 4');
        return;
      }
      router.push('/sales' as any);
      return;
    }

    if (tab === 'customers' || tab === 'utang') {
      if (isGuestMode) {
        handleModuleClick('Customers & Utang', 'Batch 8');
        return;
      }
      router.push('/customers' as any);
      return;
    }

    if (tab === 'more') {
      if (isGuestMode) {
        setIsProfileModalVisible(true);
        return;
      }
      router.push('/more' as any);
      return;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
      <StatusBar style="light" />
        <TindaMateLoadingView message="Loading TindaMate Dashboard..." />
      </SafeAreaView>
    );
  }

  const displayName = isGuestMode
    ? 'Guest Vendor'
    : user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Store Partner';

  // Real store product counts from Supabase (centralized stock-status rule)
  const lowStockCount: number = isGuestMode ? 0 : productSummary.lowStockCount;
  const outOfStockCount: number = isGuestMode ? 0 : productSummary.outOfStockCount;
  const alertProductCount = lowStockCount + outOfStockCount;
  const isLowStockWarning = alertProductCount > 0;

  // Compute last 7 days (Mon..Sun or rolling 7 days) sales bars from real store sales
  const salesSource = allStoreSales.length > 0 ? allStoreSales : recentSales;
  const nowDate = new Date();
  const weeklyBars: { label: string; amount: number; isToday: boolean }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate() - i
    );
    const y = d.getFullYear();
    const m = d.getMonth();
    const dayNum = d.getDate();
    let dayCentavos = 0;

    for (const s of salesSource) {
      const sd = new Date(s.created_at);
      if (
        !Number.isNaN(sd.getTime()) &&
        sd.getFullYear() === y &&
        sd.getMonth() === m &&
        sd.getDate() === dayNum
      ) {
        dayCentavos += Math.round(s.total_amount * 100);
      }
    }

    weeklyBars.push({
      label: dayNames[d.getDay()],
      amount: Number((dayCentavos / 100).toFixed(2)),
      isToday: i === 0,
    });
  }

  const maxWeeklyAmount = Math.max(
    ...weeklyBars.map((b) => b.amount),
    todaySalesSummary.totalAmount,
    1
  );

  // Compute real comparison badge text from weeklyBars (today vs yesterday)
  const todayBarAmount = weeklyBars[weeklyBars.length - 1]?.amount ?? todaySalesSummary.totalAmount;
  const yesterdayBarAmount = weeklyBars[weeklyBars.length - 2]?.amount ?? 0;
  let salesComparisonLabel = `${todaySalesSummary.transactionCount} ${
    todaySalesSummary.transactionCount === 1 ? 'sale' : 'sales'
  }`;
  if (yesterdayBarAmount > 0 && todayBarAmount >= 0) {
    const pctDiff = ((todayBarAmount - yesterdayBarAmount) / yesterdayBarAmount) * 100;
    const arrow = pctDiff >= 0 ? '↑' : '↓';
    salesComparisonLabel = `${arrow} ${Math.abs(pctDiff).toFixed(1)}%`;
  } else if (todayBarAmount > 0) {
    salesComparisonLabel = `↑ ${todaySalesSummary.transactionCount} ${
      todaySalesSummary.transactionCount === 1 ? 'sale' : 'sales'
    }`;
  }

  // Dynamic Y-Axis labels for Sales Overview chart
  const topYAxisValue = maxWeeklyAmount >= 1000
    ? `${Math.ceil(maxWeeklyAmount / 1000)}k`
    : `${Math.ceil(maxWeeklyAmount)}`;
  const midYAxisValue = maxWeeklyAmount >= 1000
    ? `${(Math.ceil(maxWeeklyAmount / 1000) / 2).toFixed(maxWeeklyAmount >= 2000 ? 0 : 1)}k`
    : `${Math.round(maxWeeklyAmount / 2)}`;

  const profitValueDisplay = isGuestMode
    ? '₱0.00'
    : formatPesoCurrency(todayGrossProfit ?? todaySalesSummary.totalAmount);

  // Four Quick Action Tiles
  const quickActions: QuickActionItem[] = [
    {
      id: 'record_sale',
      labelLine1: 'New',
      labelLine2: 'Sale',
      theme: 'orange',
      isPrimary: true,
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Record Sale', 'Batch 4');
          return;
        }
        router.push('/sales' as any);
      },
    },
    {
      id: 'add_product',
      labelLine1: 'Add',
      labelLine2: 'Product',
      theme: 'green',
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Add Product', 'Batch 3');
          return;
        }
        router.push('/products/add');
      },
    },
    {
      id: 'record_utang',
      labelLine1: 'Utang',
      labelLine2: '',
      theme: 'green',
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Customers & Utang', 'Batch 8');
          return;
        }
        router.push('/customers' as any);
      },
    },
    {
      id: 'add_expense',
      labelLine1: 'Expense',
      labelLine2: '',
      theme: 'neutral',
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Add Expense', 'Batch 9A');
          return;
        }
        router.push('/expenses' as any);
      },
    },
  ];

  const activeNavTab: NavTab = isProfileModalVisible ? 'more' : routeTab;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Main Scrollable Dashboard Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          {/* 1. Deep Forest Green Curved Header Zone (Design 2.0 Reference Reconstruction) */}
          <View style={styles.fullBleedHeroZone}>
            <View
              style={styles.heroDecorCircle}
              importantForAccessibility="no"
              pointerEvents="none"
            />
            <View
              style={styles.heroDecorWarm}
              importantForAccessibility="no"
              pointerEvents="none"
            />

            <View style={styles.heroInnerContainer}>
              {/* Header: Brand Bag Emblem + Notification Bell */}
              <DashboardHeader
                userEmail={isGuestMode ? undefined : user?.email}
                notificationCount={alertProductCount}
                onNotificationPress={() => {
                  if (isGuestMode) {
                    handleModuleClick('Stock Alerts', 'Batch 3');
                    return;
                  }
                  router.push('/products');
                }}
                onProfilePress={() => setIsProfileModalVisible(true)}
              />

              {/* Guest Preview Notification Pill */}
              {isGuestMode ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Guest preview mode active. Tap to log in or register."
                  accessibilityHint="Navigates to login screen"
                  onPress={() => router.push('/login')}
                  style={({ pressed }) => [
                    styles.guestBanner,
                    pressed && styles.guestBannerPressed,
                  ]}>
                  <View style={styles.guestBadgeDot} />
                  <Text style={styles.guestBannerText} maxFontSizeMultiplier={1.25}>
                    Guest Preview Mode —{' '}
                    <Text style={styles.guestBannerActionText}>Log in to save data ›</Text>
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Layered S-Wave Curve Transition into Open Canvas */}
            <View style={styles.heroWaveEmerald} pointerEvents="none" />
            <View style={styles.heroWaveMint} pointerEvents="none" />
            <View style={styles.heroWaveCanvas} pointerEvents="none" />
          </View>

          {/* 2. Continuous Open Canvas Body Content */}
          <View style={styles.bodyContentContainer}>
            {/* Error Banner Slot */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={handleRefresh}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 2A. Open Greeting + Overlapping Storefront Illustration (NO Card Box) */}
            <DashboardHeroBanner
              displayName={displayName}
              storeName="TindaMate Store"
              onStorePress={() => setIsProfileModalVisible(true)}
            />

            {/* 3. Main KPI Card: Today's Sales (Primary Visual Anchor) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Today's Sales: ${
                isGuestMode ? '₱0.00' : formatPesoCurrency(todaySalesSummary.totalAmount)
              }, ${todaySalesSummary.transactionCount} transactions today. Tap to view sales history.`}
              onPress={() => {
                if (isGuestMode) {
                  handleModuleClick("Today's Sales", 'Batch 4');
                  return;
                }
                router.push('/sales/history');
              }}
              style={({ pressed }) => [
                styles.mainSalesKpiCard,
                pressed && styles.cardPressed,
              ]}>
              {/* Decorative internal emerald wave highlight on bottom-right */}
              <View style={styles.mainSalesWaveHighlight} pointerEvents="none" />
              <View style={styles.mainSalesWaveSecondary} pointerEvents="none" />

              <View style={styles.mainSalesLeft}>
                <View style={styles.mainSalesIconUnboxed}>
                  <TrendChartVectorIcon size={30} color={Colors.textInverse} />
                </View>
                <View style={styles.mainSalesTextCol}>
                  <Text style={styles.mainSalesLabel}>Today&apos;s Sales</Text>
                  <Text
                    style={styles.mainSalesAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}>
                    {isGuestMode
                      ? '₱0.00'
                      : formatPesoCurrency(todaySalesSummary.totalAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.mainSalesBadgePill}>
                <Text style={styles.mainSalesBadgeText}>
                  {salesComparisonLabel}
                </Text>
              </View>
            </Pressable>

            {/* 4. Supporting KPIs Row (3 Compact Tiles: Total Sales, Profit, Low Stock) */}
            <View
              style={[
                styles.secondaryKpiRow,
                isNarrowPhone && styles.secondaryKpiRowNarrow,
              ]}>
              {/* Tile 1: Total Sales Count */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Total Sales: ${allStoreSales.length > 0 ? allStoreSales.length : todaySalesSummary.transactionCount} transactions`}
                onPress={() => {
                  if (isGuestMode) {
                    handleModuleClick('Sales History', 'Batch 5');
                    return;
                  }
                  router.push('/sales/history');
                }}
                style={({ pressed }) => [
                  styles.secondaryKpiCard,
                  pressed && styles.cardPressed,
                ]}>
                <KpiCartCheckIcon size={22} />
                <Text
                  style={styles.secondaryKpiValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {isGuestMode
                    ? '0'
                    : allStoreSales.length > 0
                    ? allStoreSales.length
                    : todaySalesSummary.transactionCount}
                </Text>
                <Text style={styles.secondaryKpiLabel} numberOfLines={1}>
                  Total Sales
                </Text>
              </Pressable>

              {/* Tile 2: Gross Profit */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Gross Profit: ${profitValueDisplay}. Tap to open Reports.`}
                onPress={() => {
                  if (isGuestMode) {
                    handleModuleClick('Reports & Analytics', 'Batch 9');
                    return;
                  }
                  router.push('/reports' as any);
                }}
                style={({ pressed }) => [
                  styles.secondaryKpiCard,
                  pressed && styles.cardPressed,
                ]}>
                <KpiProfitCoinIcon size={22} />
                <Text
                  style={styles.secondaryKpiValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}>
                  {profitValueDisplay}
                </Text>
                <Text style={styles.secondaryKpiLabel} numberOfLines={1}>
                  Profit
                </Text>
              </Pressable>

              {/* Tile 3: Low Stock */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Low Stock: ${isGuestMode ? '5 Items' : `${lowStockCount} ${lowStockCount === 1 ? 'Item' : 'Items'}`} items`}
                onPress={() => {
                  if (isGuestMode) {
                    handleModuleClick('Inventory', 'Batch 3');
                    return;
                  }
                  router.push('/products');
                }}
                style={({ pressed }) => [
                  styles.secondaryKpiCard,
                  pressed && styles.cardPressed,
                ]}>
                <KpiLowStockBoxIcon size={22} />
                <Text
                  style={styles.secondaryKpiValue}
                  numberOfLines={1}>
                  {lowStockCount}
                </Text>
                <Text style={styles.secondaryKpiLabel} numberOfLines={1}>
                  Low Stock
                </Text>
              </Pressable>
            </View>

            {/* 5. Sales Overview Section (Flat Open Canvas Section — NO Outer Card Box) */}
            <View style={styles.salesOverviewSection}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.chartTitle} accessibilityRole="header">
                  Sales Overview
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open full Reports and Analytics"
                  onPress={() => {
                    if (isGuestMode) {
                      handleModuleClick('Reports', 'Batch 9');
                      return;
                    }
                    router.push('/reports' as any);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={({ pressed }) => [
                    styles.plainFilterTrigger,
                    pressed && styles.plainFilterPressed,
                  ]}>
                  <Text style={styles.plainFilterText}>This Week</Text>
                  <Text style={styles.plainFilterChevron} importantForAccessibility="no">
                    ⌄
                  </Text>
                </Pressable>
              </View>

              {/* Flat Bar Chart Plot Area */}
              <View style={styles.chartPlotRow}>
                {/* Faint Y-Axis Scale Numbers */}
                <View style={styles.yAxisColumn} pointerEvents="none">
                  <Text style={styles.yAxisLabel}>{topYAxisValue}</Text>
                  <Text style={styles.yAxisLabel}>{midYAxisValue}</Text>
                  <Text style={styles.yAxisLabel}>0</Text>
                </View>

                <View style={styles.chartBarsContainer}>
                  {/* Subtle Horizontal Grid Lines */}
                  <View style={styles.gridLinesOverlay} pointerEvents="none">
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                  </View>

                  <View style={styles.barsRow}>
                    {weeklyBars.map((bar, idx) => {
                      const heightPct =
                        bar.amount > 0
                          ? Math.max(18, Math.round((bar.amount / maxWeeklyAmount) * 100))
                          : 12;
                      return (
                        <View key={`${bar.label}-${idx}`} style={styles.barColumn}>
                          {bar.isToday ? (
                            <View style={styles.barCalloutWrapper}>
                              <View style={styles.barCalloutPill}>
                                <Text style={styles.barCalloutText} numberOfLines={1}>
                                  {bar.amount >= 1000
                                    ? `₱${(bar.amount / 1000).toFixed(1)}k`
                                    : `₱${Math.round(bar.amount)}`}
                                </Text>
                              </View>
                              <View style={styles.barCalloutPointer} />
                            </View>
                          ) : (
                            <View style={styles.barCalloutSpacer} />
                          )}

                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { height: `${heightPct}%` },
                                bar.isToday && styles.barFillToday,
                                bar.amount === 0 && styles.barFillZero,
                              ]}>
                              {/* Inner soft mint gradient effect at bottom of bar */}
                              {bar.amount > 0 && (
                                <View style={styles.barGradientBottom} />
                              )}
                            </View>
                          </View>

                          <Text
                            style={[
                              styles.barDayLabel,
                              bar.isToday && styles.barDayLabelToday,
                            ]}>
                            {bar.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* 6. Operational Low-Stock Alert Banner (Conditional) */}
            {isLowStockWarning ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${alertProductCount} products running low or out of stock. Tap to check inventory.`}
                onPress={() => router.push('/products')}
                style={({ pressed }) => [
                  styles.alertBannerCard,
                  pressed && styles.cardPressed,
                ]}>
                {/* Decorative warm wave accent on right matching reference */}
                <View style={styles.alertWaveHighlight} pointerEvents="none" />

                <WarningTriangleIcon size={28} bgColor="#EA580C" fgColor="#FFFFFF" />
                <View style={styles.alertTextCol}>
                  <Text style={styles.alertTitleText}>
                    {lowStockCount > 0
                      ? `${lowStockCount} ${
                          lowStockCount === 1
                            ? 'Product Running Low'
                            : 'Products Running Low'
                        }`
                      : `${outOfStockCount} ${
                          outOfStockCount === 1
                            ? 'Product Out of Stock'
                            : 'Products Out of Stock'
                        }`}
                  </Text>
                  <Text style={styles.alertActionLink}>
                    Check inventory →
                  </Text>
                </View>
                {outOfStockCount > 0 && lowStockCount > 0 ? (
                  <View style={styles.outOfStockMiniPill}>
                    <Text style={styles.outOfStockMiniText}>
                      +{outOfStockCount} out
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}

            {/* 7. Recent Activity Section (Positioned in First Viewport matching Reference) */}
            <RecentActivitySection
              sales={recentSales}
              isLoading={isCardLoading}
              hasActivity={recentSales.length > 0}
              activityCount={recentSales.length}
              onViewAll={() => {
                if (isGuestMode) {
                  handleModuleClick('Recent Activity', 'Batch 5');
                  return;
                }
                router.push('/sales/history');
              }}
              onSalePress={(sale) => {
                if (isGuestMode) {
                  handleModuleClick('Sale Details', 'Batch 5');
                  return;
                }
                router.push({
                  pathname: '/sales/[id]',
                  params: { id: sale.id },
                });
              }}
            />

            {/* 8. Quick Actions (Scrolled Below-the-Fold Operational Strip) */}
            <View
              style={[
                styles.quickActionsRow,
                isNarrowPhone && styles.quickActionsRowNarrow,
              ]}>
              <QuickActionTile item={quickActions[0]} />
              <QuickActionTile item={quickActions[1]} />
              <QuickActionTile item={quickActions[2]} />
              <QuickActionTile item={quickActions[3]} />
            </View>

            {/* 9. Store Finances: Utang & Expenses (Scrolled Below-the-Fold Dual Summary) */}
            <View style={styles.storeFinancesRow}>
              <UtangOverviewCard
                summary={utangSummary}
                isLoading={isCardLoading}
                error={utangError}
                onRetry={loadDashboardData}
                onViewCustomers={() => {
                  if (isGuestMode) {
                    handleModuleClick('Customers & Utang', 'Batch 8');
                    return;
                  }
                  router.push('/customers' as any);
                }}
                compact
              />
              <ExpenseOverviewCard
                summary={expenseSummary}
                isLoading={isCardLoading}
                error={expenseError}
                onRetry={loadDashboardData}
                onViewExpenses={() => {
                  if (isGuestMode) {
                    handleModuleClick('Expense Management', 'Batch 9A');
                    return;
                  }
                  router.push('/expenses' as any);
                }}
                compact
              />
            </View>
          </View>
        </ScrollView>

        {/* 10. Persistent Bottom Navigation Bar */}
        <DashboardBottomNav
          activeTab={activeNavTab}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Profile & Account Settings Modal */}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseProfileModal}>
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseProfileModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Store Account
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close Store Account modal"
                accessibilityHint="Dismisses store account modal"
                onPress={handleCloseProfileModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* User Info */}
            <View style={styles.userProfileInfo}>
              <View
                style={[
                  styles.modalAvatar,
                  isGuestMode && { backgroundColor: Colors.accent },
                ]}
                accessible={false}
                importantForAccessibility="no-hide-descendants">
                <Text style={styles.modalAvatarText}>
                  {isGuestMode ? 'G' : user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfoText}>
                <Text style={styles.userFullName} maxFontSizeMultiplier={1.3}>
                  {displayName}
                </Text>
                <Text style={styles.userEmailText} maxFontSizeMultiplier={1.3}>
                  {isGuestMode ? 'Browsing as Guest' : user?.email}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isGuestMode && { backgroundColor: Colors.accentLight },
                  ]}>
                  <View
                    style={[
                      styles.statusDot,
                      isGuestMode && { backgroundColor: Colors.accent },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isGuestMode && { color: Colors.accent },
                    ]}
                    maxFontSizeMultiplier={1.3}>
                    {isGuestMode ? 'Guest Preview Mode' : 'Supabase Connected'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions: Log In & Exit Guest in Guest Mode, or Business Management + Sign Out in Auth Mode */}
            {isGuestMode ? (
              <View style={styles.guestModalActions}>
                <TindaMateButton
                  title="Log In to Store"
                  variant="primary"
                  onPress={() => {
                    handleCloseProfileModal();
                    router.push('/login');
                  }}
                  accessibilityLabel="Log in to your store account"
                  style={styles.modalLogoutButton}
                />
                <TindaMateButton
                  title="Exit Guest Mode"
                  variant="ghost"
                  onPress={() => {
                    handleCloseProfileModal();
                    router.replace('/');
                  }}
                  accessibilityLabel="Exit guest mode and return to welcome screen"
                />
              </View>
            ) : (
              <View style={styles.guestModalActions}>
                <TindaMateButton
                  title="Open More & Store Menu"
                  variant="primary"
                  showArrow
                  onPress={() => {
                    handleCloseProfileModal();
                    router.push('/more' as any);
                  }}
                  accessibilityLabel="Open More and Store Menu"
                />
                <TindaMateButton
                  title="Manage Store Expenses"
                  variant="secondary"
                  showArrow
                  onPress={() => {
                    handleCloseProfileModal();
                    router.push('/expenses' as any);
                  }}
                  accessibilityLabel="Open Expense Management"
                />
                <TindaMateButton
                  title="Log Out of Account"
                  variant="danger"
                  onPress={handleOpenLogoutModal}
                  accessibilityLabel="Log out of TindaMate"
                  style={styles.modalLogoutButton}
                />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Branded Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={isLogoutModalVisible}
        onConfirm={handleConfirmLogout}
        onCancel={handleCloseLogoutModal}
        isLoading={isLoggingOut}
        accountName={displayName || user?.email || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.twoHalf,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  // 1. Curved Deep Forest Green Header Zone with S-Wave Transition into Open Canvas
  fullBleedHeroZone: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 2,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecorCircle: {
    position: 'absolute',
    right: -30,
    top: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    opacity: 0.34,
  },
  heroDecorWarm: {
    position: 'absolute',
    left: -30,
    bottom: -20,
    width: 130,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#10B981',
    opacity: 0.18,
  },
  heroInnerContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    zIndex: 3,
  },
  // Layered S-Wave Curves at bottom of green header transitioning to #F8FAFC canvas
  heroWaveEmerald: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -14,
    height: 36,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 240,
    backgroundColor: '#0D7A4D',
    opacity: 0.55,
    transform: [{ rotate: '-2deg' }],
    zIndex: 1,
  },
  heroWaveMint: {
    position: 'absolute',
    left: -20,
    right: 60,
    bottom: -16,
    height: 32,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 180,
    backgroundColor: '#A7F3D0',
    opacity: 0.45,
    transform: [{ rotate: '-1.5deg' }],
    zIndex: 1,
  },
  heroWaveCanvas: {
    position: 'absolute',
    left: -24,
    right: -24,
    bottom: -18,
    height: 32,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 220,
    backgroundColor: '#F8FAFC',
    zIndex: 2,
  },
  // 2. Continuous Open Canvas Body Container
  bodyContentContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: 2,
    paddingBottom: Spacing.four,
    gap: 11,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  // 3. Today's Sales Primary Hero KPI Card (Rich Emerald with Wave Highlight)
  mainSalesKpiCard: {
    backgroundColor: '#065F46',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: Spacing.threeHalf,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#047857',
    gap: Spacing.two,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  mainSalesWaveHighlight: {
    position: 'absolute',
    right: -24,
    bottom: -26,
    width: 160,
    height: 64,
    borderRadius: 48,
    backgroundColor: '#10B981',
    opacity: 0.28,
    transform: [{ rotate: '-8deg' }],
  },
  mainSalesWaveSecondary: {
    position: 'absolute',
    right: 30,
    bottom: -28,
    width: 120,
    height: 46,
    borderRadius: 32,
    backgroundColor: '#34D399',
    opacity: 0.18,
    transform: [{ rotate: '6deg' }],
  },
  mainSalesLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    zIndex: 2,
  },
  mainSalesIconUnboxed: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSalesTextCol: {
    flex: 1,
    gap: 1,
  },
  mainSalesLabel: {
    fontSize: 12.5,
    fontWeight: Typography.weights.semiBold,
    color: '#D1FAE5',
  },
  mainSalesAmount: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  mainSalesBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.42)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    zIndex: 2,
  },
  mainSalesBadgeText: {
    color: '#ECFDF5',
    fontSize: 11.5,
    fontWeight: Typography.weights.extraBold,
    fontVariant: ['tabular-nums'],
  },
  // 4. Supporting 3-Column KPIs Row (Compact Soft White Tiles)
  secondaryKpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryKpiRowNarrow: {
    gap: 6,
  },
  secondaryKpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 2,
    minHeight: 70,
    ...Shadows.xs,
  },
  secondaryKpiValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  secondaryKpiLabel: {
    fontSize: 11.5,
    fontWeight: Typography.weights.medium,
    color: '#64748B',
  },
  // 5. Sales Overview Section (Flat Open Canvas Section — NO Outer Box Card)
  salesOverviewSection: {
    paddingTop: 2,
    paddingHorizontal: 2,
    gap: 6,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  chartTitle: {
    fontSize: 15.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  plainFilterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  plainFilterPressed: {
    opacity: 0.65,
  },
  plainFilterText: {
    fontSize: 12.5,
    fontWeight: Typography.weights.semiBold,
    color: '#334155',
  },
  plainFilterChevron: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#475569',
    marginTop: -2,
  },
  chartPlotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 104,
    gap: 6,
  },
  yAxisColumn: {
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'flex-end',
    width: 22,
  },
  yAxisLabel: {
    fontSize: 9.5,
    fontWeight: Typography.weights.medium,
    color: '#CBD5E1',
    fontVariant: ['tabular-nums'],
  },
  chartBarsContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLinesOverlay: {
    position: 'absolute',
    top: 22,
    bottom: 20,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barCalloutWrapper: {
    alignItems: 'center',
    marginBottom: -2,
    zIndex: 5,
  },
  barCalloutPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  barCalloutText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    fontVariant: ['tabular-nums'],
  },
  barCalloutPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#064E3B',
  },
  barCalloutSpacer: {
    height: 20,
  },
  barTrack: {
    flex: 1,
    width: 22,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 20,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#059669',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFillToday: {
    backgroundColor: '#047857',
    width: 22,
  },
  barFillZero: {
    backgroundColor: '#E2E8F0',
  },
  barGradientBottom: {
    width: '100%',
    height: '42%',
    backgroundColor: '#6EE7B7',
    opacity: 0.45,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: '#64748B',
  },
  barDayLabelToday: {
    color: '#0F172A',
    fontWeight: Typography.weights.bold,
  },
  // 6. Operational Low-Stock Alert Banner (Warm Amber/Peach with Wave Highlight)
  alertBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    gap: Spacing.twoHalf,
    position: 'relative',
    overflow: 'hidden',
  },
  alertWaveHighlight: {
    position: 'absolute',
    right: -20,
    bottom: -18,
    width: 130,
    height: 54,
    borderRadius: 30,
    backgroundColor: '#FDE68A',
    opacity: 0.48,
    transform: [{ rotate: '-10deg' }],
  },
  alertTextCol: {
    flex: 1,
    gap: 1,
    zIndex: 2,
  },
  alertTitleText: {
    fontSize: 13.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
  },
  alertActionLink: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: '#C2410C',
  },
  outOfStockMiniPill: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    zIndex: 2,
  },
  outOfStockMiniText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  quickActionsRowNarrow: {
    gap: Spacing.one,
  },
  storeFinancesRow: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
  },
  // Profile Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingBottom: Spacing.twoHalf,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  modalCloseText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  userProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.backgroundAlt,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
  },
  userInfoText: {
    flex: 1,
    gap: 2,
  },
  userFullName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  userEmailText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: Spacing.one,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  modalLogoutButton: {
    marginTop: Spacing.one,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    gap: Spacing.two,
    alignSelf: 'center',
    marginBottom: Spacing.two,
    ...Shadows.xs,
  },
  guestBannerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  guestBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  guestBannerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  guestBannerActionText: {
    fontWeight: Typography.weights.bold,
    textDecorationLine: 'underline',
  },
  guestModalActions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});

