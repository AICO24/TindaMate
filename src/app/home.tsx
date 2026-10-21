import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { User } from '@supabase/supabase-js';

import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardHeroBanner } from '@/components/dashboard/DashboardHeroBanner';
import { CalendarFilterIcon } from '@/components/dashboard/DashboardNavIcons';
import { QuickActionItem, QuickActionTile } from '@/components/dashboard/QuickActionTile';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { OverviewItem, StoreOverviewCard } from '@/components/dashboard/StoreOverviewCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';

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

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Verify session on mount
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (isMounted) router.replace('/');
          return;
        }
        if (isMounted) {
          setUser(data.session.user);
        }
      } catch (err) {
        console.warn('[Dashboard Session Error]:', err);
        if (isMounted) router.replace('/');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        router.replace('/');
      } else if (session && isMounted) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Close Profile/Store Account modal and restore route-derived active tab
   */
  const handleCloseProfileModal = () => {
    setIsProfileModalVisible(false);
  };

  /**
   * Handle user sign out
   */
  const handleLogout = async () => {
    if (isLoggingOut) return;

    const performSignOut = async () => {
      try {
        setIsLoggingOut(true);
        setIsProfileModalVisible(false);
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('[SignOut Error]:', error.message);
        }
        router.replace('/');
      } catch (err) {
        console.warn('[SignOut Exception]:', err);
        router.replace('/');
      } finally {
        setIsLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of TindaMate?');
      if (confirmLogout) {
        await performSignOut();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of TindaMate?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: performSignOut },
      ]);
    }
  };

  /**
   * Placeholder handler for coming soon modules
   */
  const handleModuleClick = (moduleName: string, batchNote: string) => {
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
        router.replace('/home');
      }
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
        <ActivityIndicator size="large" color={Colors.primaryDark} />
        <Text style={styles.loadingText}>Loading TindaMate Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Store Partner';

  // Truthful empty store counts (will come from Supabase in future data batch)
  const lowStockCount: number = 0;
  const isLowStockWarning = lowStockCount > 0;

  // Four Store Overview KPI Cards (Label -> Primary Value -> Supporting Subtitle)
  const overviewItems: OverviewItem[] = [
    {
      id: 'sales',
      title: "Today's Sales",
      value: '₱0.00',
      subtitle: 'No sales recorded yet',
      theme: 'green',
      onPress: () => handleModuleClick("Today's Sales", 'Batch 3'),
    },
    {
      id: 'products',
      title: 'Products',
      value: '0 items',
      subtitle: 'No products added yet',
      theme: 'blue',
      onPress: () => handleModuleClick('Product Inventory', 'Batch 3'),
    },
    {
      id: 'low_stock',
      title: 'Low Stock',
      value: `${lowStockCount} ${lowStockCount === 1 ? 'item' : 'items'}`,
      subtitle: isLowStockWarning ? 'Needs restocking soon' : 'No low-stock items',
      theme: isLowStockWarning ? 'amber' : 'neutral',
      onPress: () => handleModuleClick('Stock Alerts', 'Batch 3'),
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
      onPress: () => handleModuleClick('Record Sale', 'Batch 3'),
    },
    {
      id: 'add_product',
      labelLine1: 'Add',
      labelLine2: 'Product',
      theme: 'green',
      onPress: () => handleModuleClick('Add Product', 'Batch 3'),
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Main Scrollable Dashboard Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* 1. Full-Bleed Hero Zone with Warm Backdrop */}
          <View style={styles.fullBleedHeroZone}>
            <View style={styles.heroInnerContainer}>
              {/* Header: Prominent Logo + Profile Circle */}
              <DashboardHeader
                userEmail={user?.email}
                onProfilePress={() => setIsProfileModalVisible(true)}
              />

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
            {/* 3. Store Overview Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Store Overview"
                rightElement={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Date range filter: Today"
                    onPress={() => handleModuleClick('Date Filter', 'Batch 5')}
                    style={({ pressed }) => [
                      styles.filterPill,
                      pressed && styles.filterPillPressed,
                    ]}>
                    <CalendarFilterIcon size={IconSizes.xs} color={Colors.primaryDark} />
                    <Text style={styles.filterPillText}>Today</Text>
                    <Text style={styles.filterChevron}>⌵</Text>
                  </Pressable>
                }
              />

              {/* 2x2 Overview Cards Grid */}
              <View style={styles.gridRow}>
                <StoreOverviewCard item={overviewItems[0]} />
                <StoreOverviewCard item={overviewItems[1]} />
              </View>
              <View style={styles.gridRow}>
                <StoreOverviewCard item={overviewItems[2]} />
                <StoreOverviewCard item={overviewItems[3]} />
              </View>
            </View>

            {/* 4. Quick Actions Section */}
            <View style={styles.section}>
              <SectionHeader
                title="Quick Actions"
                subtitle="Manage your store, faster."
              />

              {/* 4-Column Action Tiles Row */}
              <View style={styles.quickActionsRow}>
                <QuickActionTile item={quickActions[0]} />
                <QuickActionTile item={quickActions[1]} />
                <QuickActionTile item={quickActions[2]} />
                <QuickActionTile item={quickActions[3]} />
              </View>
            </View>

            {/* 5. Recent Activity Section */}
            <RecentActivitySection
              onViewAll={() => handleModuleClick('Recent Activity', 'Batch 3')}
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
                onPress={handleCloseProfileModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* User Info */}
            <View style={styles.userProfileInfo}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfoText}>
                <Text style={styles.userFullName}>{displayName}</Text>
                <Text style={styles.userEmailText}>{user?.email}</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Supabase Connected</Text>
                </View>
              </View>
            </View>

            {/* Logout Action using TindaMateButton danger variant */}
            <TindaMateButton
              title={isLoggingOut ? 'Signing Out...' : 'Log Out of Account'}
              variant="danger"
              loading={isLoggingOut}
              disabled={isLoggingOut}
              onPress={handleLogout}
              accessibilityLabel="Log out of TindaMate"
              style={styles.modalLogoutButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: Colors.background,
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
    paddingBottom: Spacing.four,
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
    paddingTop: Spacing.threeHalf,
    gap: Spacing.threeHalf,
  },
  section: {
    gap: Spacing.twoHalf,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
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
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
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
    gap: 14,
    backgroundColor: Colors.backgroundAlt,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  modalLogoutButton: {
    marginTop: Spacing.one,
  },
});

