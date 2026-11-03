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
import { HeaderWaveBackground } from '@/components/dashboard/HeaderWaveBackground';
import { TodaySalesCard } from '@/components/dashboard/TodaySalesCard';
import { DashboardKpiRow } from '@/components/dashboard/DashboardKpiRow';
import { SalesOverviewCard } from '@/components/dashboard/SalesOverviewCard';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection';
import { QuickActionItem } from '@/components/dashboard/QuickActionTile';
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
            {/* Signature Multi-Layered Zigzag Wave Ribbon Background */}
            <HeaderWaveBackground height={165} />

            <View style={styles.heroInnerContainer}>
              {/* Header: Authentic TindaMate Storefront Logo + Notification Bell */}
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

            {/* 2A. Open Greeting + Overlapping 3D Storefront Illustration (NO Card Box) */}
            <DashboardHeroBanner
              displayName={displayName}
              storeName="TindaMate Store"
              onStorePress={() => setIsProfileModalVisible(true)}
            />

            {/* 3. Main KPI Card: Today's Sales (Primary Visual Anchor with Orange & Emerald Waves) */}
            <TodaySalesCard
              amount={todaySalesSummary.totalAmount}
              transactionCount={todaySalesSummary.transactionCount}
              comparisonLabel={salesComparisonLabel}
              isGuestMode={isGuestMode}
              onPress={() => {
                if (isGuestMode) {
                  handleModuleClick("Today's Sales", 'Batch 4');
                  return;
                }
                router.push('/sales/history');
              }}
            />

            {/* 4. Supporting KPIs Row (3 Compact Tiles: Total Sales, Profit, Low Stock) */}
            <DashboardKpiRow
              totalSalesCount={
                allStoreSales.length > 0
                  ? allStoreSales.length
                  : todaySalesSummary.transactionCount
              }
              profitDisplay={profitValueDisplay}
              lowStockCount={lowStockCount}
              isNarrow={isNarrowPhone}
              onTotalSalesPress={() => {
                if (isGuestMode) {
                  handleModuleClick('Sales History', 'Batch 5');
                  return;
                }
                router.push('/sales/history');
              }}
              onProfitPress={() => {
                if (isGuestMode) {
                  handleModuleClick('Reports & Analytics', 'Batch 9');
                  return;
                }
                router.push('/reports' as any);
              }}
              onLowStockPress={() => {
                if (isGuestMode) {
                  handleModuleClick('Inventory', 'Batch 3');
                  return;
                }
                router.push('/products');
              }}
            />

            {/* 5. Sales Overview Section (Real Data Bar Chart with Tooltip Pointer) */}
            <SalesOverviewCard
              weeklyBars={weeklyBars}
              maxWeeklyAmount={maxWeeklyAmount}
              topYAxisValue={topYAxisValue}
              midYAxisValue={midYAxisValue}
              onPeriodPress={() => {
                if (isGuestMode) {
                  handleModuleClick('Reports', 'Batch 9');
                  return;
                }
                router.push('/reports' as any);
              }}
            />

            {/* 6. Operational Low-Stock Alert Banner (Conditional) */}
            <LowStockAlert
              lowStockCount={lowStockCount}
              outOfStockCount={outOfStockCount}
              onPress={() => router.push('/products')}
            />

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

            {/* 8. Quick Actions Strip */}
            <QuickActionsSection
              actions={quickActions}
              isNarrow={isNarrowPhone}
            />

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
  // 1. Curved Deep Forest Green Header Zone with Layered Signature Zigzag Wave Canopy
  fullBleedHeroZone: {
    backgroundColor: '#064E3B',
    paddingTop: Spacing.half,
    paddingBottom: 22,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroInnerContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    zIndex: 5,
  },
  // 2. Continuous Open Canvas Body Container with Natural Visual Rhythm & Whitespace
  bodyContentContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.six,
    gap: 18,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  // 9. Store Finances Row (Utang & Expense dual cards)
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

