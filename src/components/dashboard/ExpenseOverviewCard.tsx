import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NavMoreIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { DashboardExpenseSummary } from '@/types/expense';

export interface ExpenseOverviewCardProps {
  summary: DashboardExpenseSummary;
  isLoading?: boolean;
  onViewExpenses?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * ExpenseOverviewCard (Design 2.0 Golden Screen Foundation)
 *
 * Dedicated Store Expense Summary Card for the Main Dashboard:
 * 1. Prominent Today's Expenses: Authoritative store-derived expense total (e.g. ₱450.00)
 * 2. Recorded Today: Count of expense records logged for today (e.g. 2 expenses today)
 * 3. Outlay Status: Contextual status of operating cashflow outlays
 * 4. Action: Direct "View All →" navigation into the Expense Management screen
 *
 * Designed with Design 2.0 tokens (crisp white card, slate & subtle crimson outlay accents, zero pastel blue).
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
      ? '0 entries'
      : `${summary.expenseCount} ${
          summary.expenseCount === 1 ? 'entry' : 'entries'
        }`;

  const outlayStatusLabel = hasExpenses
    ? 'Operating outlay'
    : 'Zero outlay';

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Expense Overview. Total today: ${formatPesoCurrency(
        summary.totalExpenses
      )}. ${expenseCountLabel}.`}>
      {/* 1. Header: Section Icon + Title + View All Link */}
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <NavMoreIcon size={18} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Operating Expenses
            </Text>
            <Text style={styles.sectionSubtitle}>Today&apos;s store outlays</Text>
          </View>
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
              View All
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
          <Text style={styles.statLabel}>Recorded Today</Text>
          {isLoading ? (
            <View style={styles.skeletonStatText} />
          ) : (
            <Text
              style={styles.statValue}
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
          <Text style={styles.statLabel}>Store Outlay</Text>
          {isLoading ? (
            <View style={styles.skeletonStatText} />
          ) : (
            <Text
              style={[
                styles.statValue,
                hasExpenses ? styles.statValueOutlay : styles.statValueNeutral,
              ]}
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.primaryCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.regular,
  },
  viewExpensesAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  viewExpensesActionPressed: {
    opacity: 0.65,
  },
  viewExpensesText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  viewExpensesArrow: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderColor: '#FECACA',
  },
  retryBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  mainKpiSection: {
    gap: 4,
    paddingVertical: Spacing.half,
  },
  totalExpenseAmount: {
    ...Typography.presets.heroValue,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  totalExpenseAmountCompact: {
    fontSize: Typography.sizes.displaySm,
  },
  totalExpenseAmountNarrow: {
    fontSize: Typography.sizes.xl,
  },
  totalExpenseAmountZero: {
    color: Colors.textMuted,
  },
  totalExpenseLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: 4,
  },
  statLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  statValueOutlay: {
    color: '#EF4444',
  },
  statValueNeutral: {
    color: Colors.textSecondary,
  },
  skeletonAmountWrap: {
    gap: 8,
    paddingVertical: Spacing.one,
  },
  skeletonAmount: {
    width: '60%',
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.border,
  },
  skeletonStatText: {
    width: '80%',
    height: 16,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.border,
    marginTop: 2,
  },
});
