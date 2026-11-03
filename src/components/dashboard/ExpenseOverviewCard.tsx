import React, { useState } from 'react';
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
  compact?: boolean;
}

/**
 * ExpenseOverviewCard (Design 2.0 Showcase Alignment)
 *
 * Dedicated Store Expense Summary Card for the Main Dashboard:
 * - Supports `compact` mode for side-by-side integration with Utang
 * - Authoritative store-derived expense total (e.g. ₱450.00)
 * - Recorded entry count for today
 * - Direct "View All →" navigation into Expense Management screen
 */
export function ExpenseOverviewCard({
  summary,
  isLoading = false,
  onViewExpenses,
  error,
  onRetry,
  compact = false,
}: ExpenseOverviewCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const [isHovered, setIsHovered] = useState(false);

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

  // Compact card presentation (for side-by-side Store Finances row)
  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Expenses summary: ${formatPesoCurrency(summary.totalExpenses)}, ${expenseCountLabel}. Tap to view expenses.`}
        onPress={isLoading ? undefined : onViewExpenses}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed }) => [
          styles.compactCard,
          isHovered && styles.compactCardHovered,
          pressed && styles.compactCardPressed,
        ]}>
        {/* Header: Icon + Section Title + View All */}
        <View style={styles.compactTopRow}>
          <View style={styles.compactHeaderLeft}>
            <View style={styles.compactIconCircle}>
              <NavMoreIcon size={13} color="#EF4444" />
            </View>
            <Text style={styles.compactTitleText} numberOfLines={1}>
              Expenses
            </Text>
          </View>

          {onViewExpenses && (
            <Text style={styles.compactViewAllText}>
              All →
            </Text>
          )}
        </View>

        {/* Primary Amount */}
        {isLoading ? (
          <View style={styles.compactSkeletonAmount} />
        ) : (
          <Text
            style={[
              styles.compactAmountText,
              !hasExpenses && styles.compactAmountZero,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {formatPesoCurrency(summary.totalExpenses)}
          </Text>
        )}

        {/* Footer Subtext */}
        <View style={styles.compactFooterRow}>
          <Text style={styles.compactSubtext} numberOfLines={1}>
            {expenseCountLabel}
          </Text>
          <Text
            style={[
              styles.compactStatusText,
              hasExpenses ? styles.compactStatusOutlay : styles.compactStatusNeutral,
            ]}
            numberOfLines={1}>
            {outlayStatusLabel}
          </Text>
        </View>
      </Pressable>
    );
  }

  // Full card presentation
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

      {/* 2. Error Recovery State */}
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

      {/* 4. Supporting Metrics */}
      <View style={styles.statsRow}>
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
  // Compact presentation styles
  compactCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    justifyContent: 'space-between',
    minHeight: 98,
    ...Shadows.xs,
  },
  compactCardHovered: {
    borderColor: '#000000',
  },
  compactCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIconCircleHovered: {
    transform: [{ scale: 1.12 }],
  },
  compactTitleText: {
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
  },
  compactViewAllText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  compactViewAllHovered: {
    transform: [{ translateX: 2 }],
  },
  compactAmountText: {
    fontSize: 18,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    marginVertical: 2,
  },
  compactAmountZero: {
    color: Colors.textMuted,
  },
  compactFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  compactSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  compactStatusText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  compactStatusOutlay: {
    color: '#EF4444',
  },
  compactStatusNeutral: {
    color: Colors.textMuted,
  },
  compactSkeletonAmount: {
    width: '70%',
    height: 22,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },

  // Full presentation styles
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
    color: Colors.textMuted,
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
