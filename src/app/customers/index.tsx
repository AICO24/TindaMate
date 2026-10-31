import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { DashboardMarketIllustration } from '@/components/dashboard/DashboardMarketIllustration';
import {
  DashboardBadgeVectorIcon,
  NavUtangIcon,
  SearchVectorIcon,
} from '@/components/dashboard/DashboardNavIcons';
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
import { formatPesoCurrency } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { CustomerFilterTab, CustomerWithCredit } from '@/types/customer';

const FILTER_TABS: CustomerFilterTab[] = [
  'All',
  'With Utang',
  'Active',
  'Inactive',
];

/**
 * TindaMate Customers List & Credit Ledger Screen (`/customers`) — Design 2.0
 *
 * Financially professional customer & utang management experience:
 * - Deep Green header ("Customers" + "+ Add Customer" CTA) + Search Bar
 * - Prominent "Total Outstanding" Deep Green Financial KPI Hero Card
 * - Filter pills (All, With Utang, Active, Inactive)
 * - Scannable CustomerCard rows with monogram avatars, balances / PAID pills, and last activity dates
 * - "Manage Your Customers Easily" store banner card
 */
export default function CustomersListScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [customers, setCustomers] = useState<CustomerWithCredit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<CustomerFilterTab>('All');
  const [showFilterRow, setShowFilterRow] = useState(true);
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
      router.push('/more' as any);
      return;
    }
  };

  const handleCustomerPress = (customer: CustomerWithCredit) => {
    router.push(`/customers/${customer.id}` as any);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const { totalOutstanding, utangCustomerCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    customers.forEach((c) => {
      const bal = c.credit_summary?.current_balance ?? 0;
      if (bal > 0) {
        total += bal;
        count += 1;
      }
    });
    return {
      totalOutstanding: Number(total.toFixed(2)),
      utangCustomerCount: count,
    };
  }, [customers]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Deep Green Top Header + Search Bar */}
        <View style={styles.heroHeaderZone}>
          <ProductScreenHeader
            title="Customers"
            showBack={true}
            onBack={() =>
              router.canGoBack() ? router.back() : router.replace('/home')
            }
            leftIcon={<NavUtangIcon color={Colors.textInverse} />}
            rightActionLabel="+ Add Customer"
            rightActionAccessibilityLabel="Add a new customer"
            onRightActionPress={() => router.push('/customers/add' as any)}
          />

          {/* Search Customers Input + Filter Toggle Button */}
          <View style={styles.searchRowWrap}>
            <View style={styles.searchBar}>
              <SearchVectorIcon color={Colors.textMuted} size={18} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search customers..."
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Search customers"
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                  onPress={handleClearSearch}
                  style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle customer filters"
              onPress={() => setShowFilterRow((prev) => !prev)}
              style={({ pressed }) => [
                styles.filterIconButton,
                showFilterRow && styles.filterIconButtonActive,
                pressed && styles.buttonPressed,
              ]}>
              <View style={styles.filterLinesWrap}>
                <View style={[styles.filterLine, { width: 16 }]} />
                <View style={[styles.filterLine, { width: 11 }]} />
                <View style={[styles.filterLine, { width: 6 }]} />
              </View>
            </Pressable>
          </View>
        </View>

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
            {/* Total Outstanding Hero Card */}
            {!isInitialLoading ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Total Outstanding Utang ${formatPesoCurrency(totalOutstanding)} across ${utangCustomerCount} customers`}
                onPress={() =>
                  setSelectedFilter((prev) =>
                    prev === 'With Utang' ? 'All' : 'With Utang'
                  )
                }
                style={({ pressed }) => [
                  styles.outstandingHeroCard,
                  pressed && styles.buttonPressed,
                ]}>
                <View style={styles.outstandingHeroGlow} />
                <View style={styles.outstandingIconCircle}>
                  <DashboardBadgeVectorIcon type="record_utang" color={Colors.textInverse} />
                </View>

                <View style={styles.outstandingTextCol}>
                  <Text style={styles.outstandingLabel}>Total Outstanding</Text>
                  <Text
                    style={styles.outstandingAmount}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={1}>
                    {formatPesoCurrency(totalOutstanding)}
                  </Text>
                  <Text style={styles.outstandingSubtext}>
                    {utangCustomerCount}{' '}
                    {utangCustomerCount === 1
                      ? 'customer with active utang'
                      : 'customers with active utang'}
                  </Text>
                </View>

                <Text style={styles.outstandingChevron}>›</Text>
              </Pressable>
            ) : null}

            {/* Filter Pills */}
            {showFilterRow ? (
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
            ) : null}

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
                    <SearchVectorIcon color={Colors.primaryDark} size={22} />
                  </View>
                  <Text style={styles.stateTitle}>No Customers Found</Text>
                  <Text style={styles.stateSubtitle}>
                    No store customers matched &ldquo;{searchQuery}&rdquo;. Try a
                    different name or phone number.
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
                    <NavUtangIcon color={Colors.primary} />
                  </View>
                  <Text style={styles.stateTitle}>No Customers Yet</Text>
                  <Text style={styles.stateSubtitle}>
                    Add your regular store patrons and suki to track customer
                    credit (utang) easily.
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

            {/* Bottom Customer Guidance Banner Card */}
            {!isInitialLoading ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Manage Your Customers Easily, tap to add a new customer"
                onPress={() => router.push('/customers/add' as any)}
                style={({ pressed }) => [
                  styles.promoCard,
                  pressed && styles.buttonPressed,
                ]}>
                <View style={styles.promoIllustrationWrap}>
                  <DashboardMarketIllustration compact />
                </View>
                <View style={styles.promoTextCol}>
                  <Text style={styles.promoTitle}>
                    Manage Your Customers Easily
                  </Text>
                  <Text style={styles.promoSubtitle}>
                    Keep track of utang and payments in one place.
                  </Text>
                </View>
                <View style={styles.promoArrowCircle}>
                  <Text style={styles.promoArrowText}>→</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {/* Route-Aware Bottom Navigation */}
        <DashboardBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </KeyboardAvoidingView>
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
    paddingBottom: Spacing.twoHalf,
    ...Shadows.sm,
  },
  searchRowWrap: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.threeHalf,
    paddingRight: 10,
    minHeight: 46,
    gap: 10,
    ...Shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  clearSearchBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  filterIconButton: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  filterIconButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  filterLinesWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  filterLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.primaryDark,
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
  // Total Outstanding Hero Card
  outstandingHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: Spacing.four,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  outstandingHeroGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  outstandingIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outstandingTextCol: {
    flex: 1,
    gap: 2,
  },
  outstandingLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#A7F3D0',
    letterSpacing: 0.2,
  },
  outstandingAmount: {
    fontSize: 28,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  outstandingSubtext: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  outstandingChevron: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  filterPillSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  filterPillTextSelected: {
    color: Colors.surface,
  },
  customersList: {
    gap: 10,
  },
  // Promo Guidance Banner Card
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 14,
    paddingHorizontal: Spacing.threeHalf,
    gap: 12,
    marginTop: 4,
    ...Shadows.xs,
  },
  promoIllustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTextCol: {
    flex: 1,
    gap: 3,
  },
  promoTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  promoSubtitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.primaryDeep,
    lineHeight: 16,
  },
  promoArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  promoArrowText: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
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
  buttonPressed: {
    opacity: 0.88,
  },
});
