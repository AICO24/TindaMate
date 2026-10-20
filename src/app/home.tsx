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
import { router } from 'expo-router';
import { User } from '@supabase/supabase-js';

import { DashboardBottomNav, NavTab } from '@/components/dashboard/DashboardBottomNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardHeroBanner } from '@/components/dashboard/DashboardHeroBanner';
import { QuickActionItem, QuickActionTile } from '@/components/dashboard/QuickActionTile';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { OverviewItem, StoreOverviewCard } from '@/components/dashboard/StoreOverviewCard';
import { BorderRadius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

/**
 * TindaMate Main Dashboard Screen
 *
 * Primary starting point for authenticated store owners:
 * 1. Top Brand Header with user profile button
 * 2. Warm greeting & store context banner with mini marketplace illustration
 * 3. Store Overview (4 pastel summary cards with honest empty states)
 * 4. Quick Actions (4 action tiles for sales, products, expenses, and utang)
 * 5. Recent Activity (clean empty state for new stores)
 * 6. Persistent Bottom Navigation bar (Home, Products, Sales, Utang, More)
 */
export default function AuthenticatedDashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
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
    setActiveTab(tab);
    if (tab === 'home') return;
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
        <ActivityIndicator size="large" color="#105B48" />
        <Text style={styles.loadingText}>Loading TindaMate Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Vendor Partner';

  // Four Store Overview Cards
  const overviewItems: OverviewItem[] = [
    {
      id: 'sales',
      title: "Today's Sales",
      value: '₱0.00',
      subtitle: 'No sales recorded yet',
      icon: '💵',
      theme: 'green',
      onPress: () => handleModuleClick("Today's Sales", 'Batch 3'),
    },
    {
      id: 'products',
      title: 'Products',
      value: '0 items',
      subtitle: 'Tap to add first item',
      icon: '📦',
      theme: 'blue',
      onPress: () => handleModuleClick('Product Inventory', 'Batch 3'),
    },
    {
      id: 'low_stock',
      title: 'Low Stock',
      value: 'All Good',
      subtitle: 'No low-stock items',
      icon: '⚠️',
      theme: 'amber',
      onPress: () => handleModuleClick('Stock Alerts', 'Batch 3'),
    },
    {
      id: 'utang',
      title: 'Outstanding Utang',
      value: '₱0.00',
      subtitle: 'Lista ng utang is clear',
      icon: '📝',
      theme: 'purple',
      onPress: () => handleModuleClick('Utang Tracker', 'Batch 4'),
    },
  ];

  // Four Quick Action Tiles
  const quickActions: QuickActionItem[] = [
    {
      id: 'add_product',
      label: 'Add Product',
      sublabel: 'New store item',
      icon: '📦',
      theme: 'emerald',
      onPress: () => handleModuleClick('Add Product', 'Batch 3'),
    },
    {
      id: 'record_sale',
      label: 'Record Sale',
      sublabel: 'Cashier entry',
      icon: '🧾',
      theme: 'blue',
      onPress: () => handleModuleClick('Record Sale', 'Batch 3'),
    },
    {
      id: 'add_expense',
      label: 'Add Expense',
      sublabel: 'Store expense',
      icon: '💸',
      theme: 'amber',
      onPress: () => handleModuleClick('Add Expense', 'Batch 4'),
    },
    {
      id: 'record_utang',
      label: 'Record Utang',
      sublabel: 'Customer credit',
      icon: '✍️',
      theme: 'purple',
      onPress: () => handleModuleClick('Record Utang', 'Batch 4'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Main Scrollable Dashboard Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* 1. Top Header */}
          <DashboardHeader
            userEmail={user?.email}
            onProfilePress={() => setIsProfileModalVisible(true)}
          />

          {/* 2. Hero Greeting & Store Banner */}
          <DashboardHeroBanner
            displayName={displayName}
            storeName="TindaMate Store"
          />

          {/* 3. Store Overview Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Store Overview</Text>
              {/* Date Filter Pill */}
              <View style={styles.filterPill}>
                <Text style={styles.filterPillText}>Today ▾</Text>
              </View>
            </View>

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
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            {/* 2x2 Quick Action Tiles Grid */}
            <View style={styles.gridRow}>
              <QuickActionTile item={quickActions[0]} />
              <QuickActionTile item={quickActions[1]} />
            </View>
            <View style={styles.gridRow}>
              <QuickActionTile item={quickActions[2]} />
              <QuickActionTile item={quickActions[3]} />
            </View>
          </View>

          {/* 5. Recent Activity Section */}
          <RecentActivitySection
            onViewAll={() => handleModuleClick('Recent Activity', 'Batch 3')}
          />
        </ScrollView>

        {/* 6. Persistent Bottom Navigation Bar */}
        <DashboardBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Profile & Account Settings Modal */}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsProfileModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsProfileModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Store Account</Text>
              <Pressable
                onPress={() => setIsProfileModalVisible(false)}
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

            {/* Logout Action */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out of TindaMate"
              onPress={handleLogout}
              disabled={isLoggingOut}
              style={({ pressed }) => [
                styles.modalLogoutButton,
                pressed && styles.modalLogoutButtonPressed,
                isLoggingOut && styles.modalLogoutButtonDisabled,
              ]}>
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.modalLogoutText}>Log Out of Account</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.four,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  filterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Profile Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F1F5F9',
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  userProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#105B48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  userInfoText: {
    flex: 1,
    gap: 2,
  },
  userFullName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
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
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  modalLogoutButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  modalLogoutButtonPressed: {
    backgroundColor: '#FECACA',
  },
  modalLogoutButtonDisabled: {
    opacity: 0.6,
  },
  modalLogoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
