import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardBadgeVectorIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { DashboardExpenseSummary } from '@/types/expense';

interface ExpenseOverviewCardProps {
  summary: DashboardExpenseSummary;
  isLoading?: boolean;
  onViewExpenses?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * ExpenseOverviewCard (Batch 9B)
 *
 * Dedicated Store Expense Summary Card for the Main Dashboard:
 * 1. Prominent Today's Expenses: Authoritative store-derived expense total (e.g. ₱450.00)
 * 2. Today's Records: Count of expense records logged for today (e.g. 2 expenses today)
 * 3. Action: Direct "View Expenses →" navigation into the Expense Management screen
 *
 * Designed with the TindaMate Blue pastel design tokens and zero layout shift during loading.
 */
export function ExpenseOverviewCard({
  summary,
  isLoading = false,
  onViewExpenses,
  error,
  onRetry,
}: ExpenseOverviewCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const isCompactPhone = windowWidth < 380;

  const hasExpenses = summary.totalExpenses > 0;
  const expenseCountLabel =
    summary.expenseCount === 0
      ? 'No expenses recorded'
      : `${summary.expenseCount} ${
          summary.expenseCount === 1 ? 'expense' : 'expenses'
        } today`;

  const outlayStatusLabel = hasExpenses
    ? 'Operating outlay'
    : 'Zero outlay today';

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Expense Overview. Total today: ${formatPesoCurrency(
        summary.totalExpenses
      )}. ${expenseCountLabel}.`}>
      {/* 1. Header: Pill Badge + View Expenses Action */}
      <View style={styles.topRow}>
        <View style={styles.badgePill}>
          <View style={styles.badgeIconCircle}>
            <DashboardBadgeVectorIcon type="expenses" color={Colors.textInverse} />
          </View>
          <Text style={styles.badgeText}>Today&apos;s Expenses</Text>
        </View>

        {onViewExpenses ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all store expenses"
            accessibilityHint="Navigates to the expense management screen"
            onPress={isLoading ? undefined : onViewExpenses}
            disabled={isLoading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.viewExpensesAction,
              pressed && !isLoading && styles.viewExpensesActionPressed,
            ]}>
            <Text style={styles.viewExpensesText} maxFontSizeMultiplier={1.25}>
              View Expenses
            </Text>
            <Text style={styles.viewExpensesArrow} importantForAccessibility="no">
              →
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* 2. Error Recovery State (non-crashing) */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Unable to refresh Expense summary.
          </Text>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading expense summary"
              onPress={onRetry}
              style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* 3. Primary Expense Amount KPI */}
      <View style={styles.mainKpiSection}>
        {isLoading ? (
          <View style={styles.skeletonAmountWrap}>
            <View style={styles.skeletonAmount} />
            <View style={styles.skeletonSubtitle} />
          </View>
        ) : (
          <>
            <Text
              style={[
                styles.totalExpenseAmount,
                isCompactPhone && styles.totalExpenseAmountCompact,
                isNarrowPhone && styles.totalExpenseAmountNarrow,
                !hasExpenses && styles.totalExpenseAmountZero,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.25}>
              {formatPesoCurrency(summary.totalExpenses)}
            </Text>
            <Text style={styles.totalExpenseLabel}>
              {hasExpenses
                ? "Total Today's Expenses"
                : 'No expenses recorded today'}
            </Text>
          </>
        )}
      </View>

      {/* 4. Supporting Metrics: Expense Count & Outlay Status */}
      <View
        style={[
          styles.statsRow,
          isNarrowPhone && styles.statsRowNarrow,
        ]}>
        {/* Metric 1: Expenses Count */}
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <View style={styles.expenseCountIconDot} />
            <Text style={styles.statTitle}>Recorded Today</Text>
          </View>
          {isLoading ? (
            <View style={styles.skeletonStatText} />
          ) : (
            <Text
              style={styles.statMainText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.2}>
              {expenseCountLabel}
            </Text>
          )}
        </View>

        {/* Metric 2: Status */}
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <View style={styles.statusIconDot} />
            <Text style={styles.statTitle}>Store Outlay</Text>
          </View>
          {isLoading ? (
            <View style={styles.skeletonStatText} />
          ) : (
            <Text
              style={styles.statMainText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.2}>
              {outlayStatusLabel}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.pastel.blue.bg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.pastel.blue.border,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.pastel.blue.border,
  },
  badgeIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.pastel.blue.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.blue.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  viewExpensesAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.one,
  },
  viewExpensesActionPressed: {
    opacity: 0.7,
  },
  viewExpensesText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.blue.accent,
  },
  viewExpensesArrow: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.blue.accent,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  retryBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  mainKpiSection: {
    gap: 4,
    paddingVertical: Spacing.one,
  },
  totalExpenseAmount: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.blue.text,
    letterSpacing: -0.5,
  },
  totalExpenseAmountCompact: {
    fontSize: Typography.sizes.displaySm,
  },
  totalExpenseAmountNarrow: {
    fontSize: Typography.sizes.xl,
  },
  totalExpenseAmountZero: {
    color: Colors.textSecondary,
  },
  totalExpenseLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.pastel.blue.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
  },
  statsRowNarrow: {
    flexDirection: 'column',
    gap: Spacing.two,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.twoHalf,
    borderWidth: 1,
    borderColor: Colors.pastel.blue.border,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseCountIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.pastel.blue.iconBg,
  },
  statusIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  statTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  statMainText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  skeletonAmountWrap: {
    gap: 8,
    paddingVertical: Spacing.one,
  },
  skeletonAmount: {
    width: '60%',
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.pastel.blue.border,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.pastel.blue.border,
  },
  skeletonStatText: {
    width: '80%',
    height: 16,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.pastel.blue.border,
    marginTop: 2,
  },
});

