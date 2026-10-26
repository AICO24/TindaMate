import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, usePathname } from 'expo-router';

import { CustomerCard } from '@/components/customers/CustomerCard';
import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { fetchStoreCustomers } from '@/lib/customers';
import { supabase } from '@/lib/supabase';
import { CustomerFilterTab, CustomerWithCredit } from '@/types/customer';

const FILTER_TABS: CustomerFilterTab[] = ['All', 'Active', 'With Utang', 'Inactive'];

/**
 * TindaMate Customers List & Search Screen (`/customers`)
 *
 * Implements Batch 8B: Customer Management UI & Service Layer:
 * - Scannable list of store customers with avatar, phone, and utang balance
 * - Instant responsive search by customer name or phone number
 * - Filter pills: All, Active, With Utang, Inactive
 * - Add Customer action
 * - Honest loading, error, and empty states
 * - Route-aware persistent bottom navigation
 */
export default function CustomersListScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [customers, setCustomers] = useState<CustomerWithCredit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<CustomerFilterTab>('All');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCustomers = useCallback(
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

        const items = await fetchStoreCustomers(searchQuery, selectedFilter);
        setCustomers(items);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load your customers. Please try again.';
        setErrorMessage(msg);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, selectedFilter]
  );

  useFocusEffect(
    useCallback(() => {
      loadCustomers(false);
    }, [loadCustomers])
  );

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'utang') {
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
    if (tab === 'sales') {
      router.replace('/sales' as any);
      return;
    }
    if (tab === 'more') {
      router.replace('/home');
      return;
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const handleCustomerPress = (customer: CustomerWithCredit) => {
    router.push(`/customers/${customer.id}` as any);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const utangCount = customers.filter(
    (c) => (c.credit_summary?.current_balance ?? 0) > 0
  ).length;

  const headerSubtitle = isInitialLoading
    ? 'Loading customers...'
    : `${customers.length} ${
        customers.length === 1 ? 'customer' : 'customers'
      } · ${utangCount} with balance`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Top Screen Header */}
        <ProductScreenHeader
          title="Customers"
          subtitle={headerSubtitle}
          showBack={true}
          onBack={handleBack}
          rightActionLabel="+ Add"
          rightActionAccessibilityLabel="Add a new customer"
          onRightActionPress={() => router.push('/customers/add' as any)}
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCustomers(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {/* Search Input Bar */}
            <View style={styles.searchBarRow}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or phone..."
                  placeholderTextColor={Colors.textPlaceholder}
                  accessibilityLabel="Search customers"
                  returnKeyType="search"
                />
              </View>
              {searchQuery.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                  onPress={handleClearSearch}
                  style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsRow}>
              {FILTER_TABS.map((tab) => {
                const isSelected = selectedFilter === tab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter tab: ${tab}`}
                    onPress={() => setSelectedFilter(tab)}
                    style={[
                      styles.filterPill,
                      isSelected && styles.filterPillSelected,
                    ]}>
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected && styles.filterPillTextSelected,
                      ]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Error Banner */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadCustomers(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* Loading State */}
            {isInitialLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Customers...</Text>
                <Text style={styles.stateSubtitle}>
                  Fetching your store customer profiles and credit balances.
                </Text>
              </View>
            ) : customers.length === 0 ? (
              searchQuery.trim().length > 0 ? (
                /* Search Empty State */
                <View style={styles.stateCard}>
                  <View style={styles.searchIconCircle}>
                    <Text style={styles.searchIconText}>🔍</Text>
                  </View>
                  <Text style={styles.stateTitle}>No Customers Found</Text>
                  <Text style={styles.stateSubtitle}>
                    No store customers matched "{searchQuery}". Try a different name or phone number.
                  </Text>
                  <View style={styles.emptyActionRow}>
                    <TindaMateButton
                      title="Clear Search"
                      variant="secondary"
                      onPress={handleClearSearch}
                    />
                  </View>
                </View>
              ) : (
                /* No Customers in Store State */
                <View style={styles.stateCard}>
                  <View style={styles.emptyIconCircle}>
                    <Text style={styles.emptyIconText}>👥</Text>
                  </View>
                  <Text style={styles.stateTitle}>No Customers Yet</Text>
                  <Text style={styles.stateSubtitle}>
                    Add your regular store patrons and suki to track customer credit (utang) easily.
                  </Text>
                  <View style={styles.emptyActionRow}>
                    <TindaMateButton
                      title="+ Add Your First Customer"
                      variant="primary"
                      onPress={() => router.push('/customers/add' as any)}
                    />
                  </View>
                </View>
              )
            ) : (
              /* Customers List */
              <View style={styles.customersList}>
                {customers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onPress={handleCustomerPress}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Route-Aware Bottom Navigation */}
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
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
    height: 48,
    fontSize: Typography.sizes.body,
    color: Colors.textPrimary,
  },
  clearSearchBtn: {
    width: 44,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: Typography.sizes.base,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterPillText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  filterPillTextSelected: {
    color: Colors.surface,
  },
  customersList: {
    gap: Spacing.twoHalf,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    textAlign: 'center',
    gap: Spacing.twoHalf,
    marginVertical: Spacing.two,
    ...Shadows.xs,
  },
  stateTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
  },
  emptyActionRow: {
    width: '100%',
    maxWidth: 280,
    marginTop: Spacing.two,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: {
    fontSize: 28,
  },
  searchIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.pastel.blue.bg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.blue.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconText: {
    fontSize: 26,
  },
});

