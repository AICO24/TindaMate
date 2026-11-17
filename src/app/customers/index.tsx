import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, usePathname } from 'expo-router';

import { CustomerCard } from '@/components/customers/CustomerCard';
import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { TindaMateLoadingView } from '@/components/animated-icon';
import {
  DashboardBadgeVectorIcon,
  NavCustomersIcon,
  NavUtangIcon,
  SearchVectorIcon,
  WarningTriangleIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { FilterChipItem, FilterChipRow } from '@/components/ui/FilterChipRow';
import { TindaMateSearchBar } from '@/components/ui/TindaMateSearchBar';
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

type CustomerSortOption = 'name' | 'balance_desc' | 'recent';

const SORT_LABELS: Record<CustomerSortOption, string> = {
  name: 'Name A–Z',
  balance_desc: 'Highest Utang',
  recent: 'Recent Activity',
};

function getFilterEmptyCopy(filter: CustomerFilterTab): {
  title: string;
  subtitle: string;
} {
  if (filter === 'With Utang') {
    return {
      title: 'No Customers with Utang',
      subtitle:
        'All of your registered customers are currently settled with zero balance.',
    };
  }
  if (filter === 'Active') {
    return {
      title: 'No Active Customers',
      subtitle:
        'There are no active customer profiles right now. Switch to All to view inactive records.',
    };
  }
  if (filter === 'Inactive') {
    return {
      title: 'No Inactive Customers',
      subtitle: 'All of your registered customers are currently active.',
    };
  }
  return {
    title: 'No Matching Customers',
    subtitle: 'Try switching back to All customers.',
  };
}

/**
 * TindaMate Customers List & Credit Ledger Screen (`/customers`) — Design 2.0
 *
 * Financially professional customer & utang management experience:
 * - Deep Green header ("Customers" + dynamic subtitle + "+ Add Customer" CTA) + Search Bar
 * - Store-wide "Total Outstanding" Deep Green Financial KPI Hero Card
 * - Shared FilterChipRow with live counts (All, With Utang, Active, Inactive)
 * - Scannable CustomerCard rows with semantic Orange/Green avatars, phone & activity metadata, and tabular-nums
 */
export default function CustomersListScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);

  const [allCustomers, setAllCustomers] = useState<CustomerWithCredit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState<CustomerFilterTab>('All');
  const [sortBy, setSortBy] = useState<CustomerSortOption>('name');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCustomers = useCallback(async (showRefreshIndicator = false) => {
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

      const items = await fetchStoreCustomers('', 'All');
      setAllCustomers(items);
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCustomers(false);
    }, [loadCustomers])
  );

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'customers' || tab === 'utang') {
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

  const { totalOutstanding, utangCustomerCount, filterCounts } = useMemo(() => {
    let total = 0;
    let withUtang = 0;
    let active = 0;
    let inactive = 0;

    allCustomers.forEach((c) => {
      const bal = c.credit_summary?.current_balance ?? 0;
      if (bal > 0) {
        total += bal;
        withUtang += 1;
      }
      if (c.is_active) {
        active += 1;
      } else {
        inactive += 1;
      }
    });

    return {
      totalOutstanding: Number(total.toFixed(2)),
      utangCustomerCount: withUtang,
      filterCounts: {
        all: allCustomers.length,
        withUtang,
        active,
        inactive,
      },
    };
  }, [allCustomers]);

  const filterChipItems: FilterChipItem<CustomerFilterTab>[] = useMemo(
    () => [
      { id: 'All', label: 'All', count: filterCounts.all },
      { id: 'With Utang', label: 'With Utang', count: filterCounts.withUtang },
      { id: 'Active', label: 'Active', count: filterCounts.active },
      { id: 'Inactive', label: 'Inactive', count: filterCounts.inactive },
    ],
    [filterCounts]
  );

  const filteredCustomers = useMemo(() => {
    const tabMatched = allCustomers.filter((c) => {
      if (selectedFilter === 'Active') {
        return c.is_active;
      }
      if (selectedFilter === 'With Utang') {
        return (c.credit_summary?.current_balance ?? 0) > 0;
      }
      if (selectedFilter === 'Inactive') {
        return !c.is_active;
      }
      return true;
    });

    const trimmedQuery = searchQuery.trim().toLowerCase();
    const searchMatched = !trimmedQuery
      ? tabMatched
      : tabMatched.filter((c) => {
          const nameMatch = c.name.toLowerCase().includes(trimmedQuery);
          const phoneMatch = c.phone
            ? c.phone.toLowerCase().includes(trimmedQuery)
            : false;
          const notesMatch = c.notes
            ? c.notes.toLowerCase().includes(trimmedQuery)
            : false;
          return nameMatch || phoneMatch || notesMatch;
        });

    if (sortBy === 'balance_desc') {
      return [...searchMatched].sort(
        (a, b) =>
          (b.credit_summary?.current_balance ?? 0) -
            (a.credit_summary?.current_balance ?? 0) ||
          a.name.localeCompare(b.name)
      );
    }

    if (sortBy === 'recent') {
      return [...searchMatched].sort((a, b) => {
        const timeA = a.credit_summary?.last_transaction_at
          ? new Date(a.credit_summary.last_transaction_at).getTime()
          : 0;
        const timeB = b.credit_summary?.last_transaction_at
          ? new Date(b.credit_summary.last_transaction_at).getTime()
          : 0;
        return timeB - timeA || a.name.localeCompare(b.name);
      });
    }

    return [...searchMatched].sort((a, b) => a.name.localeCompare(b.name));
  }, [allCustomers, selectedFilter, searchQuery, sortBy]);

  const cycleSortOption = () => {
    setSortBy((prev) => {
      if (prev === 'name') return 'balance_desc';
      if (prev === 'balance_desc') return 'recent';
      return 'name';
    });
  };

  const isAnyFilterActive =
    selectedFilter !== 'All' || searchQuery.trim().length > 0;

  const headerSubtitle = isInitialLoading
    ? 'Loading customer ledger...'
    : errorMessage && allCustomers.length === 0
    ? 'Unable to load customer ledger'
    : `${allCustomers.length} ${
        allCustomers.length === 1 ? 'customer' : 'customers'
      } • ${utangCustomerCount} with utang`;

  const filterEmptyCopy = getFilterEmptyCopy(selectedFilter);

  const renderListHeader = () => (
    <View style={styles.headerControlsBlock}>
      {/* Error Banner on Refresh Failure */}
      {errorMessage && allCustomers.length > 0 ? (
        <DashboardErrorBanner
          message={errorMessage}
          onRetry={() => loadCustomers(true)}
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}

      {/* Store-wide Total Outstanding Hero Card + Filter Chips + Sort Toolbar */}
      {!isInitialLoading && allCustomers.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Total Outstanding Utang ${formatPesoCurrency(totalOutstanding)} across ${utangCustomerCount} customers. ${
              selectedFilter === 'With Utang'
                ? 'Currently filtering by With Utang. Tap to show all customers.'
                : 'Tap to filter by With Utang.'
            }`}
            onPress={() =>
              setSelectedFilter((prev) =>
                prev === 'With Utang' ? 'All' : 'With Utang'
              )
            }
            style={({ pressed }) => [
              styles.outstandingHeroCard,
              isCompactPhone && styles.outstandingHeroCardCompact,
              selectedFilter === 'With Utang' &&
                styles.outstandingHeroCardFiltering,
              pressed && styles.buttonPressed,
            ]}>
            <View style={styles.outstandingHeroGlow} />
            <View style={styles.outstandingIconCircle}>
              <DashboardBadgeVectorIcon
                type="record_utang"
                color={Colors.textInverse}
              />
            </View>

            <View style={styles.outstandingTextCol}>
              <Text style={styles.outstandingLabel}>Total Outstanding</Text>
              <Text
                style={styles.outstandingAmount}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                numberOfLines={1}>
                {formatPesoCurrency(totalOutstanding)}
              </Text>
              <Text style={styles.outstandingSubtext}>
                {totalOutstanding === 0
                  ? 'All customer accounts settled'
                  : `${utangCustomerCount} ${
                      utangCustomerCount === 1
                        ? 'customer with active utang'
                        : 'customers with active utang'
                    }`}
              </Text>
            </View>

            <View
              style={[
                styles.heroFilterPill,
                selectedFilter === 'With Utang' && styles.heroFilterPillActive,
              ]}>
              <Text
                style={[
                  styles.heroFilterPillText,
                  selectedFilter === 'With Utang' &&
                    styles.heroFilterPillTextActive,
                ]}
                numberOfLines={1}>
                {selectedFilter === 'With Utang'
                  ? 'Filtering Utang ✕'
                  : 'Filter Utang'}
              </Text>
            </View>
          </Pressable>

          {/* Shared Filter Chip Row with Live Counts */}
          <FilterChipRow<CustomerFilterTab>
            items={filterChipItems}
            selectedId={selectedFilter}
            onSelect={setSelectedFilter}
            accessibilityLabelPrefix="Filter customers by"
            contentContainerStyle={styles.filterRowContent}
          />

          {/* Results Count & Sort Toolbar */}
          <View style={styles.resultsToolbar}>
            <Text
              style={styles.resultsCountText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {isAnyFilterActive
                ? `Showing ${filteredCustomers.length} of ${allCustomers.length} customers`
                : `${allCustomers.length} ${
                    allCustomers.length === 1 ? 'Customer' : 'Customers'
                  }`}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sort customers, currently sorted by ${SORT_LABELS[sortBy]}`}
              accessibilityHint="Cycles between sorting by Name A to Z, Highest Utang, and Recent Activity"
              onPress={cycleSortOption}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.sortPill,
                sortBy !== 'name' && styles.sortPillActive,
                pressed && styles.buttonPressed,
              ]}>
              <Text
                style={[
                  styles.sortPillText,
                  sortBy !== 'name' && styles.sortPillTextActive,
                ]}
                maxFontSizeMultiplier={1.2}>
                Sort: {SORT_LABELS[sortBy]} ▾
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );

  const renderEmptyComponent = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.stateCard}>
          <TindaMateLoadingView
            compact
            message="Fetching customer records & utang..."
          />
        </View>
      );
    }

    if (errorMessage && allCustomers.length === 0) {
      return (
        <View style={styles.stateCard}>
          <View style={styles.errorIconCircle}>
            <WarningTriangleIcon
              size={24}
              bgColor={Colors.errorLight}
              fgColor={Colors.error}
            />
          </View>
          <Text style={styles.stateTitle}>Could Not Load Customers</Text>
          <Text style={styles.stateSubtitle}>{errorMessage}</Text>
          <View style={styles.emptyActionRow}>
            <TindaMateButton
              title="Retry Loading"
              variant="primary"
              onPress={() => loadCustomers(true)}
              accessibilityLabel="Retry loading customers"
            />
          </View>
        </View>
      );
    }

    if (allCustomers.length === 0) {
      return (
        <View style={styles.stateCard}>
          <View style={styles.emptyIconCircle}>
            <NavUtangIcon color={Colors.primary} />
          </View>
          <Text style={styles.stateTitle}>No Customers Yet</Text>
          <Text style={styles.stateSubtitle}>
            Add your regular store patrons and suki to track customer credit
            (utang) easily.
          </Text>
          <View style={styles.emptyActionRow}>
            <TindaMateButton
              title="+ Add Your First Customer"
              variant="primary"
              onPress={() => router.push('/customers/add' as any)}
            />
          </View>
        </View>
      );
    }

    if (searchQuery.trim().length > 0) {
      return (
        <View style={styles.stateCard}>
          <View style={styles.searchIconCircle}>
            <SearchVectorIcon color={Colors.primaryDark} size={22} />
          </View>
          <Text style={styles.stateTitle}>No Customers Found</Text>
          <Text style={styles.stateSubtitle}>
            No customers matched &ldquo;{searchQuery.trim()}&rdquo;
            {selectedFilter !== 'All' ? ` in ${selectedFilter}` : ''}. Try a
            different name, phone number, or landmark note.
          </Text>
          <View style={styles.emptyActionRow}>
            <TindaMateButton
              title="Clear Search"
              variant="secondary"
              onPress={handleClearSearch}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <View style={styles.emptyIconCircle}>
          <NavUtangIcon color={Colors.primary} />
        </View>
        <Text style={styles.stateTitle}>{filterEmptyCopy.title}</Text>
        <Text style={styles.stateSubtitle}>{filterEmptyCopy.subtitle}</Text>
        <View style={styles.emptyActionRow}>
          <TindaMateButton
            title="Show All Customers"
            variant="secondary"
            onPress={() => setSelectedFilter('All')}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Deep Green Top Header + Embedded Search Bar */}
        <ProductScreenHeader
          title="Customers"
          subtitle={headerSubtitle}
          showBack={false}
          leftIcon={<NavCustomersIcon color={Colors.textInverse} />}
          rightActionLabel="+ Add Customer"
          rightActionAccessibilityLabel="Add a new customer"
          onRightActionPress={() => router.push('/customers/add' as any)}>
          <TindaMateSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, phone, or notes..."
            accessibilityLabel="Search customers"
            inputProps={{ editable: !isInitialLoading }}
          />
        </ProductScreenHeader>

        {/* Virtualized Customers List */}
        <FlatList
          data={
            isInitialLoading || (errorMessage && allCustomers.length === 0)
              ? []
              : filteredCustomers
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerCard customer={item} onPress={handleCustomerPress} />
          )}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          style={styles.flatList}
          contentContainerStyle={[
            styles.listContentContainer,
            isCompactPhone && styles.listContentContainerCompact,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCustomers(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }
        />

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
  flatList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContentContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  listContentContainerCompact: {
    paddingHorizontal: Spacing.twoHalf,
  },
  headerControlsBlock: {
    gap: Spacing.twoHalf,
    marginBottom: Spacing.twoHalf,
  },
  itemSeparator: {
    height: 10,
  },
  // Total Outstanding Hero Card
  outstandingHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: 18,
    paddingHorizontal: Spacing.four,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  outstandingHeroCardCompact: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  outstandingHeroCardFiltering: {
    borderWidth: 1.5,
    borderColor: '#34D399',
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontVariant: ['tabular-nums'],
  },
  outstandingSubtext: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  heroFilterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  heroFilterPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentLight,
  },
  heroFilterPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
  },
  heroFilterPillTextActive: {
    color: Colors.textInverse,
  },
  filterRowContent: {
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  resultsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: Spacing.two,
  },
  resultsCountText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortPillActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  sortPillTextActive: {
    color: Colors.primaryDark,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.twoHalf,
    marginVertical: Spacing.two,
    ...Shadows.xs,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
