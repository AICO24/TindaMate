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
import { CalendarFilterIcon } from '@/components/dashboard/DashboardNavIcons';
import { QuickActionItem, QuickActionTile } from '@/components/dashboard/QuickActionTile';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { OverviewItem, StoreOverviewCard } from '@/components/dashboard/StoreOverviewCard';
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
import { fetchStoreProductSummary } from '@/lib/products';
import { parseAndApplyOAuthTokens } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';
import { StoreProductSummary } from '@/types/product';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  /**
   * Fetches real store product counts (Products & Low Stock) from Supabase
   * using the centralized `getProductStockStatus` rule.
   */
  const loadProductSummary = useCallback(async () => {
    if (isGuestMode) {
      setProductSummary({
        totalProducts: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      });
      return;
    }

    try {
      const summary = await fetchStoreProductSummary();
      setProductSummary(summary);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to load store product counts.';
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
          try {
            const summary = await fetchStoreProductSummary();
            if (isMounted) {
              setProductSummary(summary);
            }
          } catch (summaryErr: unknown) {
            if (isMounted) {
              setErrorMessage(
                summaryErr instanceof Error
                  ? summaryErr.message
                  : 'Unable to load store product counts.'
              );
            }
          }
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

  // Refresh store product counts whenever the user returns to Home from Products or Add Product
  useFocusEffect(
    useCallback(() => {
      if (!isGuestMode && !isLoading) {
        loadProductSummary();
      }
    }, [isGuestMode, isLoading, loadProductSummary])
  );

  /**
   * Close Profile/Store Account modal and restore route-derived active tab
   */
  const handleCloseProfileModal = () => {
    setIsProfileModalVisible(false);
  };

  /**
   * Pull-to-refresh handler
   * Re-validates active session, clears errors, and refreshes real store product metrics
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
      await loadProductSummary();
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
      router.push('/sales');
      return;
    }

    if (tab === 'more') {
      setIsProfileModalVisible(true);
      return;
    }

    const tabNames: Record<NavTab, string> = {
      home: 'Home',
      products: 'Products Catalog',
      sales: 'Daily Sales & Cashier',
      utang: 'Lista ng Utang',
      more: 'Settings & Profile',
    };
    handleModuleClick(tabNames[tab], 'an upcoming batch');
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
  const totalProductsCount: number = isGuestMode ? 0 : productSummary.totalProducts;
  const lowStockCount: number = isGuestMode ? 0 : productSummary.lowStockCount;
  const isLowStockWarning = lowStockCount > 0;

  // Four Store Overview KPI Cards (Label -> Primary Value -> Supporting Subtitle)
  const overviewItems: OverviewItem[] = [
    {
      id: 'sales',
      title: "Today's Sales",
      value: '₱0.00',
      subtitle: 'No sales recorded yet',
      theme: 'green',
      onPress: () => handleModuleClick("Today's Sales", 'Batch 4'),
    },
    {
      id: 'products',
      title: 'Products',
      value: `${totalProductsCount} ${totalProductsCount === 1 ? 'item' : 'items'}`,
      subtitle:
        totalProductsCount === 0
          ? 'No products added yet'
          : `${productSummary.inStockCount} in stock`,
      theme: 'blue',
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Product Inventory', 'Batch 3');
          return;
        }
        router.push('/products');
      },
    },
    {
      id: 'low_stock',
      title: 'Low Stock',
      value: `${lowStockCount} ${lowStockCount === 1 ? 'item' : 'items'}`,
      subtitle: isLowStockWarning ? 'Needs restocking soon' : 'No low-stock items',
      theme: isLowStockWarning ? 'amber' : 'neutral',
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Stock Alerts', 'Batch 3');
          return;
        }
        router.push('/products');
      },
    },
    {
      id: 'utang',
      title: 'Outstanding Utang',
      value: '₱0.00',
      subtitle: 'No outstanding balance',
      theme: 'purple',
      onPress: () => handleModuleClick('Utang Tracker', 'Batch 4'),
    },
  ];

  // Four Quick Action Tiles (Record Sale prioritized first with primary emphasis)
  const quickActions: QuickActionItem[] = [
    {
      id: 'record_sale',
      labelLine1: 'Record',
      labelLine2: 'Sale',
      theme: 'orange',
      isPrimary: true,
      onPress: () => {
        if (isGuestMode) {
          handleModuleClick('Record Sale', 'Batch 4');
          return;
        }
        router.push('/sales');
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
      labelLine1: 'Record',
      labelLine2: 'Utang',
      theme: 'purple',
      onPress: () => handleModuleClick('Record Utang', 'Batch 4'),
    },
    {
      id: 'add_expense',
      labelLine1: 'Add',
      labelLine2: 'Expense',
      theme: 'blue',
      onPress: () => handleModuleClick('Add Expense', 'Batch 4'),
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
          {/* 1. Full-Bleed Hero Zone with Warm Backdrop */}
          <View style={styles.fullBleedHeroZone}>
            <View style={styles.heroInnerContainer}>
              {/* Header: Prominent Logo + Profile Circle */}
              <DashboardHeader
                userEmail={isGuestMode ? undefined : user?.email}
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

              {/* Greeting + Marketplace Illustration */}
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

            {/* 3. Store Overview Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Store Overview"
                rightElement={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Date range filter: Today"
                    accessibilityHint="Changes date filter range for store overview metrics"
                    onPress={() => handleModuleClick('Date Filter', 'Batch 5')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={({ pressed }) => [
                      styles.filterPill,
                      pressed && styles.filterPillPressed,
                    ]}>
                    <CalendarFilterIcon size={IconSizes.xs} color={Colors.primaryDark} />
                    <Text style={styles.filterPillText} maxFontSizeMultiplier={1.25}>
                      Today
                    </Text>
                    <Text style={styles.filterChevron} importantForAccessibility="no">
                      ⌵
                    </Text>
                  </Pressable>
                }
              />

              {/* 2x2 Overview Cards Grid */}
              <View style={[styles.gridRow, isNarrowPhone && styles.gridRowNarrow]}>
                <StoreOverviewCard
                  item={overviewItems[0]}
                  isLoading={isCardLoading}
                />
                <StoreOverviewCard
                  item={overviewItems[1]}
                  isLoading={isCardLoading}
                />
              </View>
              <View style={[styles.gridRow, isNarrowPhone && styles.gridRowNarrow]}>
                <StoreOverviewCard
                  item={overviewItems[2]}
                  isLoading={isCardLoading}
                />
                <StoreOverviewCard
                  item={overviewItems[3]}
                  isLoading={isCardLoading}
                />
              </View>
            </View>

            {/* 4. Quick Actions Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Quick Actions"
                subtitle="Manage your store, faster."
              />

              {/* 4-Column Action Tiles Row */}
              <View style={[styles.quickActionsRow, isNarrowPhone && styles.quickActionsRowNarrow]}>
                <QuickActionTile item={quickActions[0]} />
                <QuickActionTile item={quickActions[1]} />
                <QuickActionTile item={quickActions[2]} />
                <QuickActionTile item={quickActions[3]} />
              </View>
            </View>

            {/* 5. Recent Activity Section */}
            <RecentActivitySection
              onViewAll={() => handleModuleClick('Recent Activity', 'Batch 3')}
              hasActivity={false}
            />
          </View>
        </ScrollView>

        {/* 6. Persistent Bottom Navigation Bar */}
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

            {/* Actions: Log In & Exit Guest in Guest Mode, or Sign Out in Auth Mode */}
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
              <TindaMateButton
                title="Log Out of Account"
                variant="danger"
                onPress={handleOpenLogoutModal}
                accessibilityLabel="Log out of TindaMate"
                style={styles.modalLogoutButton}
              />
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
    backgroundColor: Colors.backgroundWarm,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FDF7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.twoHalf,
  },
  loadingText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
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
  // Full-bleed integrated top hero zone
  fullBleedHeroZone: {
    backgroundColor: Colors.backgroundWarm,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
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
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.twoHalf,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Shadows.xs,
  },
  filterPillPressed: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
  filterPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  filterChevron: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textMuted,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
  },
  gridRowNarrow: {
    gap: Spacing.two,
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
    marginBottom: Spacing.one,
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

