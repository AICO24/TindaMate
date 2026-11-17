import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { User } from '@supabase/supabase-js';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  isAppSplashActive,
  subscribeToSplashCompletion,
  TindaMateLoadingView,
} from '@/components/animated-icon';
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
import { AlertCircleIcon } from '@/components/ui/AuthIcons';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
import {
  fetchDashboardExpenseSummary,
  getReportingPeriodRange,
} from '@/lib/expenses';
import { computeSalesBuckets } from '@/lib/chartBuckets';
import { getPHTParts } from '@/lib/pht';
import { fetchStoreCOGSSummary } from '@/lib/profit';
import { parseAndApplyOAuthTokens } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { StoreProductSummary } from '@/types/product';
import { Sale, TodaySalesSummary } from '@/types/sale';
import { DashboardUtangSummary } from '@/types/customer';
import { DashboardExpenseSummary } from '@/types/expense';
import { COGSSummary } from '@/types/profit';

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
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const headerTopPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24) + Spacing.one;
  const headerCanopyHeight = headerTopPadding + 134;
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
  const [todayCogsSummary, setTodayCogsSummary] = useState<COGSSummary | null>(
    null
  );
  const [cogsError, setCogsError] = useState<string | null>(null);
  const activeRequestIdRef = useRef(0);
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
  const [isSplashActive, setIsSplashActive] = useState(() => isAppSplashActive());

  useEffect(() => {
    const unsubscribe = subscribeToSplashCompletion((active) => {
      setIsSplashActive(active);
    });
    return () => {
      unsubscribe();
    };
  }, []);

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
      setTodayCogsSummary({
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        saleItemCount: 0,
        trackedCostItemCount: 0,
        untrackedCostItemCount: 0,
        untrackedQuantity: 0,
        hasIncompleteCosts: false,
        startDate: null,
        endDate: null,
      });
      setCogsError(null);
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
      setErrorMessage(null);
      return;
    }

    const requestId = ++activeRequestIdRef.current;

    try {
      setErrorMessage(null);
      const todayRange = getReportingPeriodRange('today');
      const weekRange = getReportingPeriodRange('week');

      const [productRes, salesRes, utangRes, expenseRes, allSalesRes, cogsRes] =
        await Promise.allSettled([
          fetchStoreProductSummary(),
          fetchDashboardSalesData(),
          fetchDashboardUtangSummary(),
          fetchDashboardExpenseSummary(),
          fetchStoreSales(
            weekRange.startTimestampISO,
            weekRange.endTimestampISO
          ),
          fetchStoreCOGSSummary({
            startDate: todayRange.startTimestampISO,
            endDate: todayRange.endTimestampISO,
          }),
        ]);

      if (requestId !== activeRequestIdRef.current) {
        return;
      }

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
        setTodayCogsSummary(cogsRes.value);
        setCogsError(null);
      } else {
        console.warn('[Dashboard COGS Error]:', cogsRes.reason);
        setTodayCogsSummary(null);
        setCogsError(
          cogsRes.reason instanceof Error
            ? cogsRes.reason.message
            : 'Could not load COGS and profit summary.'
        );
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

      if (salesRes.status === 'rejected') {
        const msg =
          salesRes.reason instanceof Error
            ? salesRes.reason.message
            : 'Could not load sales data. Tap Retry to try again.';
        setErrorMessage(msg);
      } else if (productRes.status === 'rejected') {
        const msg =
          productRes.reason instanceof Error
            ? productRes.reason.message
            : 'Could not load inventory summary. Tap Retry to try again.';
        setErrorMessage(msg);
      } else if (
        allSalesRes.status === 'rejected' &&
        utangRes.status === 'rejected' &&
        expenseRes.status === 'rejected'
      ) {
        setErrorMessage('Unable to sync all store dashboard data. Tap Retry.');
      }
    } catch (err: unknown) {
      if (requestId !== activeRequestIdRef.current) {
        return;
      }
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
    if (isRefreshing) return;
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
  const handleModuleClick = useCallback(
    (moduleName: string, batchNote: string) => {
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
    },
    [isGuestMode]
  );

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

  const displayName = isGuestMode
    ? 'Guest Vendor'
    : user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Store Partner';

  const storeName = isGuestMode
    ? 'Store Open'
    : (typeof user?.user_metadata?.store_name === 'string' &&
        user.user_metadata.store_name.trim()) ||
      (typeof user?.user_metadata?.business_name === 'string' &&
        user.user_metadata.business_name.trim()) ||
      'Store Open';

  // Real store product counts from Supabase (centralized stock-status rule)
  const lowStockCount: number = isGuestMode ? 0 : productSummary.lowStockCount;
  const outOfStockCount: number = isGuestMode ? 0 : productSummary.outOfStockCount;
  const alertProductCount = lowStockCount + outOfStockCount;
  const isLowStockWarning = alertProductCount > 0;

  // Compute Monday-to-Sunday (Mon..Sun) sales bars strictly in Philippine Standard Time
  const {
    weeklyBars,
    maxWeeklyAmount,
    topYAxisValue,
    midYAxisValue,
    salesComparisonLabel,
  } = useMemo(() => {
    const weekRange = getReportingPeriodRange('week');
    const weeklyBuckets = computeSalesBuckets(
      allStoreSales,
      'week',
      {
        start: weekRange.startTimestampISO,
        end: weekRange.endTimestampISO,
      },
      new Date()
    );

    const phtParts = getPHTParts(new Date());
    // dowSun: 0 = Sun, 1 = Mon, ..., 6 = Sat -> Mon=0 .. Sat=5, Sun=6
    const todayBucketIdx = phtParts.dowSun === 0 ? 6 : phtParts.dowSun - 1;

    const bars: { label: string; amount: number; isToday: boolean }[] =
      weeklyBuckets.map((bucket, idx) => ({
        label: bucket.label,
        amount: bucket.amount,
        isToday: idx === todayBucketIdx,
      }));

    const maxAmount = Math.max(
      ...bars.map((b) => b.amount),
      todaySalesSummary.totalAmount,
      1
    );

    // Compute real comparison badge text from weeklyBars (only compare within current week Tue..Sun)
    const todayBarAmount =
      bars[todayBucketIdx]?.amount ?? todaySalesSummary.totalAmount;
    const yesterdayBarAmount =
      todayBucketIdx > 0 ? (bars[todayBucketIdx - 1]?.amount ?? 0) : 0;
    let comparisonLabel = `${todaySalesSummary.transactionCount} ${
      todaySalesSummary.transactionCount === 1 ? 'sale' : 'sales'
    }`;
    if (todayBucketIdx > 0 && yesterdayBarAmount > 0 && todayBarAmount >= 0) {
      const pctDiff =
        ((todayBarAmount - yesterdayBarAmount) / yesterdayBarAmount) * 100;
      const arrow = pctDiff >= 0 ? '↑' : '↓';
      const sign = pctDiff >= 0 ? '+' : '-';
      comparisonLabel = `${arrow} ${sign}${Math.abs(pctDiff).toFixed(1)}%`;
    } else if (todaySalesSummary.transactionCount > 0) {
      comparisonLabel = `${todaySalesSummary.transactionCount} ${
        todaySalesSummary.transactionCount === 1 ? 'sale' : 'sales'
      } today`;
    }

    const topY =
      maxAmount >= 1000
        ? `${Math.ceil(maxAmount / 1000)}k`
        : `${Math.ceil(maxAmount)}`;
    const midY =
      maxAmount >= 1000
        ? `${(Math.ceil(maxAmount / 1000) / 2).toFixed(
            maxAmount >= 2000 ? 0 : 1
          )}k`
        : `${Math.round(maxAmount / 2)}`;

    return {
      weeklyBars: bars,
      maxWeeklyAmount: maxAmount,
      topYAxisValue: topY,
      midYAxisValue: midY,
      salesComparisonLabel: comparisonLabel,
    };
  }, [
    allStoreSales,
    todaySalesSummary.totalAmount,
    todaySalesSummary.transactionCount,
  ]);

  // Truthful Profit & COGS calculations (never equate Gross Sales Revenue to Profit)
  const hasIncompleteCosts = Boolean(
    !isGuestMode && todayCogsSummary?.hasIncompleteCosts
  );
  const profitTileLabel = hasIncompleteCosts ? 'Est. Profit*' : 'Gross Profit';
  const profitValueDisplay = isGuestMode
    ? '₱0.00'
    : todayCogsSummary === null
    ? '—'
    : hasIncompleteCosts
    ? `~${formatPesoCurrency(todayCogsSummary.grossProfit)}`
    : formatPesoCurrency(todayCogsSummary.grossProfit);

  const todayNetProfit: number | null = isGuestMode
    ? 0
    : todayCogsSummary !== null && !expenseError
    ? Number(
        (
          (Math.round(todayCogsSummary.grossProfit * 100) -
            Math.round(expenseSummary.totalExpenses * 100)) /
          100
        ).toFixed(2)
      )
    : null;

  // Four Direct Quick Action Tiles
  const quickActions: QuickActionItem[] = useMemo(
    () => [
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
        id: 'add_expense',
        labelLine1: 'Add',
        labelLine2: 'Expense',
        theme: 'green',
        onPress: () => {
          if (isGuestMode) {
            handleModuleClick('Add Expense', 'Batch 9A');
            return;
          }
          router.push('/expenses/add' as any);
        },
      },
      {
        id: 'view_reports',
        labelLine1: 'View',
        labelLine2: 'Reports',
        theme: 'blue',
        onPress: () => {
          if (isGuestMode) {
            handleModuleClick('Reports & Analytics', 'Batch 9');
            return;
          }
          router.push('/reports' as any);
        },
      },
    ],
    [isGuestMode, handleModuleClick]
  );

  const activeNavTab: NavTab = isProfileModalVisible ? 'more' : routeTab;

  if (isLoading) {
    if (isSplashActive) {
      // Root AnimatedSplashOverlay is running the launch animation;
      // keep screen quiet so no duplicate logo is rendered underneath.
      return (
        <View style={styles.loadingContainer}>
          <StatusBar style="light" />
        </View>
      );
    }
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <TindaMateLoadingView message="Loading TindaMate Dashboard..." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
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
          {/* 1. Deep Forest Green Curved Header Zone with Safe-Area Clearance */}
          <View
            style={[styles.fullBleedHeroZone, { paddingTop: headerTopPadding }]}>
            {/* Signature Multi-Layered Zigzag Wave Ribbon Background */}
            <HeaderWaveBackground height={headerCanopyHeight} />

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
                  router.push({
                    pathname: '/products',
                    params: {
                      filter:
                        lowStockCount > 0
                          ? 'Low Stock'
                          : outOfStockCount > 0
                          ? 'Out of Stock'
                          : 'All',
                    },
                  } as any);
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

            {/* 2A. Open Greeting + Overlapping Marketplace Illustration */}
            <Animated.View entering={FadeInDown.duration(320).delay(40)}>
              <DashboardHeroBanner
                displayName={displayName}
                storeName={storeName}
                onStorePress={() => setIsProfileModalVisible(true)}
              />
            </Animated.View>

            {/* 3. Main KPI Card: Today's Sales (Primary Visual Anchor with Orange & Emerald Waves) */}
            <Animated.View entering={FadeInDown.duration(340).delay(80)}>
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
            </Animated.View>

            {/* 4. Supporting KPIs Row (3 Compact Tiles: Week's Sales, Gross Profit, Stock Alerts) */}
            <Animated.View entering={FadeInDown.duration(340).delay(110)}>
              <DashboardKpiRow
                totalSalesCount={
                  allStoreSales.length > 0
                    ? allStoreSales.length
                    : todaySalesSummary.transactionCount
                }
                salesLabel={
                  allStoreSales.length > 0 ? "Week's Sales" : "Today's Sales"
                }
                profitDisplay={profitValueDisplay}
                profitLabel={profitTileLabel}
                stockAlertCount={alertProductCount}
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
                  router.push({
                    pathname: '/products',
                    params: {
                      filter:
                        lowStockCount > 0
                          ? 'Low Stock'
                          : outOfStockCount > 0
                          ? 'Out of Stock'
                          : 'All',
                    },
                  } as any);
                }}
              />
            </Animated.View>

            {/* 5. Sales Overview Section (Real Data Bar Chart with Tooltip Pointer) */}
            <Animated.View entering={FadeInDown.duration(340).delay(140)}>
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
            </Animated.View>

            {/* 6. Operational Low-Stock Alert Banner (Conditional) */}
            {isLowStockWarning ? (
              <Animated.View entering={FadeInDown.duration(320).delay(160)}>
                <LowStockAlert
                  lowStockCount={lowStockCount}
                  outOfStockCount={outOfStockCount}
                  onPress={() =>
                    router.push({
                      pathname: '/products',
                      params: {
                        filter:
                          lowStockCount > 0 ? 'Low Stock' : 'Out of Stock',
                      },
                    } as any)
                  }
                />
              </Animated.View>
            ) : null}

            {/* 7. Recent Activity Section (Positioned in First Viewport matching Reference) */}
            <Animated.View entering={FadeInDown.duration(340).delay(180)}>
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
            </Animated.View>

            {/* 8. Quick Actions Strip */}
            <Animated.View entering={FadeInDown.duration(340).delay(200)}>
              <QuickActionsSection
                actions={quickActions}
                isNarrow={isNarrowPhone}
              />
            </Animated.View>

            {/* 9. Store Finances: Today's Profit/COGS Breakdown + Utang & Expenses */}
            <Animated.View
              entering={FadeInDown.duration(340).delay(220)}
              style={styles.storeFinancesSection}>
              <SectionHeader
                title="Store Finances"
                actionLabel="Reports"
                onActionPress={() => {
                  if (isGuestMode) {
                    handleModuleClick('Reports & Analytics', 'Batch 9');
                    return;
                  }
                  router.push('/reports' as any);
                }}
              />

              {/* Today's Net Profit, COGS & Expenses Breakdown Card */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Today's Profit and COGS summary. Tap to open full financial reports."
                accessibilityHint="Opens Reports & Analytics for detailed COGS and profit breakdown"
                onPress={() => {
                  if (isGuestMode) {
                    handleModuleClick('Reports & Analytics', 'Batch 9');
                    return;
                  }
                  router.push('/reports' as any);
                }}
                style={({ pressed }) => [
                  styles.profitSummaryCard,
                  pressed && styles.cardPressed,
                ]}>
                <View style={styles.profitTopRow}>
                  <View style={styles.profitTitleCol}>
                    <Text style={styles.profitCardLabel}>
                      {hasIncompleteCosts
                        ? "Today's Est. Net Profit*"
                        : "Today's Net Profit"}
                    </Text>
                    <Text style={styles.profitCardSub}>
                      Gross Profit minus Today&apos;s Expenses
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.profitNetAmount,
                      todayNetProfit !== null &&
                        todayNetProfit < 0 &&
                        styles.profitNetNegative,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}>
                    {todayNetProfit === null
                      ? '—'
                      : hasIncompleteCosts
                      ? `~${formatPesoCurrency(todayNetProfit)}`
                      : formatPesoCurrency(todayNetProfit)}
                  </Text>
                </View>

                <View style={styles.profitMetricsGrid}>
                  <View style={styles.profitMetricCell}>
                    <Text style={styles.profitMetricLabel}>Tracked COGS</Text>
                    <Text style={styles.profitMetricValue}>
                      {todayCogsSummary === null
                        ? '—'
                        : formatPesoCurrency(todayCogsSummary.cogs)}
                    </Text>
                  </View>
                  <View style={styles.profitMetricDivider} />
                  <View style={styles.profitMetricCell}>
                    <Text style={styles.profitMetricLabel}>
                      {hasIncompleteCosts ? 'Est. Gross' : 'Gross Profit'}
                    </Text>
                    <Text style={styles.profitMetricValue}>
                      {todayCogsSummary === null
                        ? '—'
                        : formatPesoCurrency(todayCogsSummary.grossProfit)}
                    </Text>
                  </View>
                  <View style={styles.profitMetricDivider} />
                  <View style={styles.profitMetricCell}>
                    <Text style={styles.profitMetricLabel}>Expenses</Text>
                    <Text style={styles.profitMetricValue}>
                      {expenseError
                        ? '—'
                        : formatPesoCurrency(expenseSummary.totalExpenses)}
                    </Text>
                  </View>
                </View>

                {!isGuestMode && isCardLoading && todayCogsSummary === null ? (
                  <View style={styles.profitLoadingBanner}>
                    <Text style={styles.profitLoadingText}>
                      Refreshing profit &amp; COGS summary...
                    </Text>
                  </View>
                ) : !isGuestMode && cogsError ? (
                  <View style={styles.incompleteCostBanner}>
                    <AlertCircleIcon size={14} color={Colors.warningText} />
                    <Text style={styles.incompleteCostText} numberOfLines={2}>
                      Profit &amp; COGS data unavailable — pull down or tap Retry
                      above.
                    </Text>
                  </View>
                ) : hasIncompleteCosts && todayCogsSummary ? (
                  <View style={styles.incompleteCostBanner}>
                    <AlertCircleIcon size={14} color={Colors.warningText} />
                    <Text style={styles.incompleteCostText} numberOfLines={2}>
                      {todayCogsSummary.untrackedCostItemCount}{' '}
                      {todayCogsSummary.untrackedCostItemCount === 1
                        ? 'sold item is'
                        : 'sold items are'}{' '}
                      missing a cost price today — profit is estimated.
                    </Text>
                  </View>
                ) : null}
              </Pressable>

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
            </Animated.View>
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
          <Pressable
            style={[
              styles.modalCard,
              { paddingBottom: Math.max(Spacing.four, insets.bottom + Spacing.three) },
            ]}
            onPress={(e) => e.stopPropagation()}>
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
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={({ pressed }) => pressed && { opacity: 0.6 }}>
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
                  {storeName !== 'Store Open'
                    ? `${displayName} • ${storeName}`
                    : displayName}
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
    backgroundColor: '#084B30',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  // 1. Curved Deep Forest-to-Emerald Header Zone with S-Wave Canopy
  fullBleedHeroZone: {
    backgroundColor: Colors.backgroundWarm,
    paddingTop: Spacing.half,
    paddingBottom: 56,
    minHeight: 148,
    position: 'relative',
    overflow: 'hidden',
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
    marginTop: -38,
    paddingTop: 2,
    paddingBottom: Spacing.six,
    gap: 11,
    zIndex: 6,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  // 9. Store Finances Section & Profit Summary Card
  storeFinancesSection: {
    gap: Spacing.two,
  },
  profitSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.threeHalf,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  profitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  profitTitleCol: {
    flex: 1,
    gap: 1,
  },
  profitCardLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  profitCardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  profitNetAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  profitNetNegative: {
    color: Colors.error,
  },
  profitMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  profitMetricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  profitMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  profitMetricLabel: {
    fontSize: 10.5,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  profitMetricValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  incompleteCostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
  },
  incompleteCostText: {
    flex: 1,
    fontSize: 11,
    fontWeight: Typography.weights.semiBold,
    color: Colors.warningText,
    lineHeight: 15,
  },
  profitLoadingBanner: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    alignItems: 'center',
  },
  profitLoadingText: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
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

