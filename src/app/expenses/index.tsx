import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  usePathname,
} from 'expo-router';

import {
  DashboardBottomNav,
  NavTab,
  resolveActiveNavTab,
} from '@/components/dashboard/DashboardBottomNav';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardBadgeVectorIcon } from '@/components/dashboard/DashboardNavIcons';
import { DeleteExpenseConfirmModal } from '@/components/expenses/DeleteExpenseConfirmModal';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
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
import { deleteStoreExpense, fetchStoreExpenses } from '@/lib/expenses';
import { supabase } from '@/lib/supabase';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseFilterTab,
} from '@/types/expense';

const FILTER_TABS: ExpenseFilterTab[] = ['All', ...EXPENSE_CATEGORIES];

/**
 * TindaMate Expense Management List Screen (`/expenses`)
 *
 * Implements Batch 9A: Expense Management Foundation:
 * - View store expenses with title, category, amount, date, and optional notes
 * - Search by title, category, or notes, and filter by category
 * - Add new expense (`/expenses/add`)
 * - Open an expense for editing (`/expenses/[id]/edit`)
 * - Delete an expense with explicit confirmation modal
 * - Honest loading, empty, and error states
 */
export default function ExpensesListScreen() {
  const pathname = usePathname();
  const activeTab = resolveActiveNavTab(pathname);
  const params = useLocalSearchParams<{ status?: string }>();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseFilterTab>('All');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (params.status === 'created') {
      setFeedbackBanner('Expense successfully recorded.');
    } else if (params.status === 'updated') {
      setFeedbackBanner('Expense changes saved.');
    }
  }, [params.status]);

  const loadExpenses = useCallback(
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

        const items = await fetchStoreExpenses(searchQuery, selectedCategory);
        setExpenses(items);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load your store expenses. Please try again.';
        setErrorMessage(msg);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, selectedCategory]
  );

  useFocusEffect(
    useCallback(() => {
      loadExpenses(false);
    }, [loadExpenses])
  );

  const handleTabPress = (tab: NavTab) => {
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
    if (tab === 'utang') {
      router.replace('/customers' as any);
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

  const handleAddExpense = () => {
    setFeedbackBanner(null);
    router.push('/expenses/add' as any);
  };

  const handleEditExpense = (expense: Expense) => {
    setFeedbackBanner(null);
    router.push(`/expenses/${expense.id}/edit` as any);
  };

  const handleOpenDeleteModal = (expense: Expense) => {
    setDeleteError(null);
    setExpenseToDelete(expense);
  };

  const handleCancelDeleteModal = () => {
    if (isDeleting) return;
    setDeleteError(null);
    setExpenseToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteStoreExpense(expenseToDelete.id);

      const deletedTitle = expenseToDelete.title;
      setExpenseToDelete(null);
      setFeedbackBanner(`Removed "${deletedTitle}" from your expenses.`);

      await loadExpenses(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not delete this expense. Please try again.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const isFiltered =
    searchQuery.trim().length > 0 || selectedCategory !== 'All';

  const headerSubtitle = isInitialLoading
    ? 'Loading store expenses...'
    : `${expenses.length} ${
        expenses.length === 1 ? 'expense' : 'expenses'
      } recorded`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Top Screen Header */}
        <ProductScreenHeader
          title="Expenses"
          subtitle={headerSubtitle}
          showBack={true}
          onBack={handleBack}
          rightActionLabel="+ Add Expense"
          rightActionAccessibilityLabel="Record a new store expense"
          onRightActionPress={handleAddExpense}
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
              onRefresh={() => loadExpenses(true)}
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
                  placeholder="Search expenses by title or notes..."
                  placeholderTextColor={Colors.textPlaceholder}
                  accessibilityLabel="Search expenses"
                  returnKeyType="search"
                />
              </View>
              {searchQuery.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsRow}>
              {FILTER_TABS.map((tab) => {
                const isSelected = selectedCategory === tab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filter category: ${tab}`}
                    onPress={() => setSelectedCategory(tab)}
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

            {/* Success Feedback Banner */}
            {feedbackBanner ? (
              <View
                style={styles.successBanner}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite">
                <View style={styles.successLeft}>
                  <View style={styles.successIconCircle}>
                    <Text style={styles.successIconText}>✓</Text>
                  </View>
                  <Text style={styles.successBannerText}>{feedbackBanner}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                  onPress={() => setFeedbackBanner(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.successDismissText}>✕</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Error Banner */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadExpenses(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 1. Loading State */}
            {isInitialLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Expenses...</Text>
                <Text style={styles.stateSubtitle}>
                  Fetching your store expense records from Supabase.
                </Text>
              </View>
            ) : errorMessage && expenses.length === 0 ? (
              /* 2. Full Error State when initial fetch failed and list is empty */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>
                <Text style={styles.stateTitle}>Could Not Load Expenses</Text>
                <Text style={styles.stateSubtitle}>{errorMessage}</Text>
                <View style={styles.stateActionWrap}>
                  <TindaMateButton
                    title="Retry Loading"
                    variant="primary"
                    onPress={() => loadExpenses(true)}
                    accessibilityLabel="Retry loading expenses"
                  />
                </View>
              </View>
            ) : expenses.length === 0 ? (
              isFiltered ? (
                /* 3A. Filtered / Search Empty State */
                <View style={styles.stateCard}>
                  <View style={styles.searchIconCircle}>
                    <Text style={styles.searchIconText}>🔍</Text>
                  </View>
                  <Text style={styles.stateTitle}>No Matching Expenses</Text>
                  <Text style={styles.stateSubtitle}>
                    No expenses matched your current search or category filter.
                  </Text>
                  <View style={styles.emptyActionRow}>
                    <TindaMateButton
                      title="Show All Expenses"
                      variant="secondary"
                      onPress={handleClearFilters}
                    />
                  </View>
                </View>
              ) : (
                /* 3B. No Expenses Recorded Yet Empty State */
                <View style={styles.emptyCard}>
                  <View
                    style={styles.emptyIconCircle}
                    accessible={false}
                    importantForAccessibility="no-hide-descendants">
                    <DashboardBadgeVectorIcon
                      type="add_expense"
                      color={Colors.primary}
                    />
                  </View>
                  <Text
                    style={styles.emptyTitle}
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1.3}>
                    No expenses recorded yet
                  </Text>
                  <Text
                    style={styles.emptySubtitle}
                    maxFontSizeMultiplier={1.3}>
                    Record your store expenses such as electricity, rent, plastic
                    bags, and transportation to keep track of your business
                    costs.
                  </Text>
                  <View style={styles.emptyButtonWrap}>
                    <TindaMateButton
                      title="+ Add Your First Expense"
                      variant="primary"
                      onPress={handleAddExpense}
                      accessibilityLabel="Add your first store expense"
                    />
                  </View>
                </View>
              )
            ) : (
              /* 4. Populated Expenses List */
              <View style={styles.expensesList}>
                {expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEditExpense}
                    onDelete={handleOpenDeleteModal}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Persistent Bottom Navigation */}
        <DashboardBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Delete Confirmation Modal */}
      <DeleteExpenseConfirmModal
        visible={expenseToDelete !== null}
        expense={expenseToDelete}
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDeleteModal}
      />
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
    paddingBottom: Spacing.five,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  successLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  successIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
  },
  successBannerText: {
    flex: 1,
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  successDismissText: {
    fontSize: Typography.sizes.body,
    color: Colors.successText,
    fontWeight: Typography.weights.bold,
  },
  expensesList: {
    gap: Spacing.twoHalf,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  stateActionWrap: {
    width: '100%',
    maxWidth: 260,
    marginTop: Spacing.two,
  },
  emptyActionRow: {
    width: '100%',
    maxWidth: 260,
    marginTop: Spacing.two,
  },
  errorIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
  },
  searchIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.pastel.blue.bg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.blue.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconText: {
    fontSize: 24,
  },
  emptyCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    ...Shadows.xs,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    ...Shadows.xs,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
    maxWidth: 300,
  },
  emptyButtonWrap: {
    width: '100%',
    maxWidth: 260,
    marginTop: Spacing.two,
  },
});

