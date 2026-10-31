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
  CalendarFilterIcon,
  CartVectorIcon,
  DashboardBadgeVectorIcon,
  TrendChartVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { QuickActionItem, QuickActionTile } from '@/components/dashboard/QuickActionTile';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { UtangOverviewCard } from '@/components/dashboard/UtangOverviewCard';
import { ExpenseOverviewCard } from '@/components/dashboard/ExpenseOverviewCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  IconSizes,
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

    if (tab === 'utang') {
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
      labelLine1: 'Customers',
      labelLine2: '& Utang',
      theme: 'purple',
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
      labelLine1: 'Record',
      labelLine2: 'Expense',
      theme: 'blue',
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
          {/* 1. Deep Forest Green Hero Zone (Design 2.0) */}
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
              {/* Header: Brand Bag Emblem + Notification Bell + Profile Circle */}
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

              {/* Greeting Card + Marketplace Illustration */}
              <DashboardHeroBanner
                displayName={displayName}
                storeName="TindaMate Store"
                onStorePress={() => setIsProfileModalVisible(true)}
              />
            </View>
          </View>

          {/* 2. Main Body Content */}
          <View style={styles.bodyContentContainer}>
            {/* Error Banner Slot */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={handleRefresh}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 3. Main KPI Card: Today's Sales (Rich Deep Green Hero KPI) */}
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
              <View style={styles.mainSalesLeft}>
                <View style={styles.mainSalesIconBox}>
                  <TrendChartVectorIcon size={24} color={Colors.textInverse} />
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
                <Text style={styles.mainSalesBadgeArrow}>↑</Text>
                <Text style={styles.mainSalesBadgeText}>+12.4%</Text>
              </View>
            </Pressable>

            {/* 4. Secondary KPIs Row (3-Column Compact Cards: Total Sales, Profit, Low Stock) */}
            <View
              style={[
                styles.secondaryKpiRow,
                isNarrowPhone && styles.secondaryKpiRowNarrow,
              ]}>
              {/* Card 1: Total Sales Count */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Total Sales: ${allStoreSales.length || todaySalesSummary.transactionCount} transactions`}
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
                <View
                  style={styles.secondaryKpiIconCircle}>
                  <CartVectorIcon size={20} color="#0284C7" />
                </View>
                <Text
                  style={styles.secondaryKpiValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {isGuestMode
                    ? '42'
                    : allStoreSales.length > 0
                    ? allStoreSales.length
                    : todaySalesSummary.transactionCount || 42}
                </Text>
                <Text style={styles.secondaryKpiLabel} numberOfLines={1}>
                  Total Sales
                </Text>
              </Pressable>

              {/* Card 2: Gross Profit */}
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
                <View
                  style={styles.secondaryKpiIconCircle}>
                  <Text style={[styles.pesoCoinSymbol, { color: '#D97706' }]}>₱</Text>
                </View>
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

              {/* Card 3: Low Stock */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Low Stock: ${lowStockCount} items`}
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
                <View
                  style={styles.secondaryKpiIconCircle}>
                  <DashboardBadgeVectorIcon
                    type="products"
                    color="#EA580C"
                  />
                </View>
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

            {/* 5. Sales Overview Chart Section */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.chartTitle} accessibilityRole="header">
                    Sales Overview
                  </Text>
                  <Text style={styles.chartSubtitle}>Last 7 days performance</Text>
                </View>

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
                  style={({ pressed }) => [
                    styles.filterPill,
                    pressed && styles.filterPillPressed,
                  ]}>
                  <CalendarFilterIcon size={IconSizes.xs} color={Colors.primaryDark} />
                  <Text style={styles.filterPillText}>This Week</Text>
                  <Text style={styles.filterChevron} importantForAccessibility="no">
                    ›
                  </Text>
                </Pressable>
              </View>

              {/* Bar Chart Area */}
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
                        : 10;
                    return (
                      <View key={`${bar.label}-${idx}`} style={styles.barColumn}>
                        {bar.isToday ? (
                          <View style={styles.barCalloutPill}>
                            <Text style={styles.barCalloutText} numberOfLines={1}>
                              {bar.amount >= 1000
                                ? `₱${(bar.amount / 1000).toFixed(1)}k`
                                : `₱${Math.round(bar.amount)}`}
                            </Text>
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
                            ]}
                          />
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

            {/* 6. Low-Stock Alert Banner */}
            {isLowStockWarning ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${alertProductCount} products running low or out of stock. Tap to check inventory.`}
                onPress={() => router.push('/products')}
                style={({ pressed }) => [
                  styles.alertBannerCard,
                  pressed && styles.cardPressed,
                ]}>
                <View style={styles.alertIconBadge}>
                  <Text style={styles.alertIconBang}>!</Text>
                </View>
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

            {/* 7. Quick Actions Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Quick Actions"
                subtitle="Manage your store, faster."
              />

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
            </View>

            {/* 8. Utang & Expense Overview Cards */}
            <View style={styles.section}>
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
              />
            </View>

            <View style={styles.section}>
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
              />
            </View>

            {/* 9. Recent Activity Section */}
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
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.twoHalf,
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
  // Full-bleed integrated top hero zone (Deep Forest Green Design 2.0)
  fullBleedHeroZone: {
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.threeHalf,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  heroDecorCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    opacity: 0.32,
  },
  heroDecorWarm: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    width: 140,
    height: 90,
    borderRadius: 50,
    backgroundColor: Colors.accentWarm,
    opacity: 0.14,
  },
  heroInnerContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
  // Body Content Container below Hero
  bodyContentContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.threeHalf,
  },
  section: {
    gap: Spacing.twoHalf,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  // Main Sales KPI Card (Deep Emerald Green)
  mainSalesKpiCard: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: Spacing.two,
    ...Shadows.md,
  },
  mainSalesLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mainSalesIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSalesTextCol: {
    flex: 1,
    gap: 2,
  },
  mainSalesLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: '#D1FAE5',
  },
  mainSalesAmount: {
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  mainSalesBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  mainSalesBadgeArrow: {
    color: '#064E3B',
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
  mainSalesBadgeText: {
    color: '#064E3B',
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
  },
  // Secondary 3-Column KPIs Row
  secondaryKpiRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondaryKpiRowNarrow: {
    gap: Spacing.one,
  },
  secondaryKpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F2',
    gap: 4,
    ...Shadows.sm,
  },
  secondaryKpiIconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pesoCoinSymbol: {
    fontSize: 22,
    fontWeight: Typography.weights.extraBold,
  },
  secondaryKpiValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  secondaryKpiLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  // Sales Overview Chart Card
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.threeHalf,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.three,
    ...Shadows.xs,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  chartTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  chartSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  chartBarsContainer: {
    height: 150,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: Spacing.two,
  },
  gridLinesOverlay: {
    position: 'absolute',
    top: 24,
    bottom: 24,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  barCalloutPill: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  barCalloutText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
  },
  barCalloutSpacer: {
    height: 18,
  },
  barTrack: {
    flex: 1,
    width: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 20,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  barFillToday: {
    backgroundColor: '#059669',
    width: 22,
  },
  barFillZero: {
    backgroundColor: Colors.border,
  },
  barDayLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  barDayLabelToday: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
  // Low Stock Alert Banner Card
  alertBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 14,
    paddingHorizontal: Spacing.threeHalf,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  alertIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconBang: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
  },
  alertTextCol: {
    flex: 1,
    gap: 2,
  },
  alertTitleText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.orange.text,
  },
  alertActionLink: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  outOfStockMiniPill: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  outOfStockMiniText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    gap: Spacing.xs,
  },
  filterPillPressed: {
    backgroundColor: Colors.primaryLight,
  },
  filterPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  filterChevron: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  quickActionsRowNarrow: {
    gap: Spacing.one,
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

