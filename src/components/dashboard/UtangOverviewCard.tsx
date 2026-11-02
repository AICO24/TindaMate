import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NavCustomersIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { DashboardUtangSummary } from '@/types/customer';

export interface UtangOverviewCardProps {
  summary: DashboardUtangSummary;
  isLoading?: boolean;
  onViewCustomers?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * UtangOverviewCard (Design 2.0 Golden Screen Foundation)
 *
 * Dedicated Customer Credit & Utang Summary Card for the Main Dashboard:
 * 1. Prominent Outstanding Utang: Authoritative ledger-derived credit balance (e.g. ₱3,250.00)
 * 2. Distinct Customers with Balance: Count of customers with positive utang (e.g. 5 customers with balance)
 * 3. Today's Collections: Total credit repayments received today (e.g. ₱850.00 paid today)
 * 4. Action: Direct "View Customers →" navigation into the Customers screen
 *
 * Styled in the clean, elevated Design 2.0 visual language (crisp white card, amber/orange highlights, zero purple).
 */
export function UtangOverviewCard({
  summary,
  isLoading = false,
  onViewCustomers,
  error,
  onRetry,
}: UtangOverviewCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const isCompactPhone = windowWidth < 380;

  const hasOutstandingBalance = summary.totalOutstandingUtang > 0;
  const customerCountLabel =
    summary.customersWithBalanceCount === 0
      ? '0 customers'
      : `${summary.customersWithBalanceCount} ${
          summary.customersWithBalanceCount === 1 ? 'customer' : 'customers'
        }`;

  const paymentsLabel = formatPesoCurrency(summary.todayPaymentsTotal);

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Customers & Utang Overview. Outstanding balance: ${formatPesoCurrency(
        summary.totalOutstandingUtang
      )}. ${customerCountLabel} with balance. ${paymentsLabel} paid today.`}>
      {/* 1. Header: Section Icon + Title + View Customers Link */}
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <NavCustomersIcon size={18} color="#D97706" />
          </View>
          <View>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Customers & Utang
            </Text>
            <Text style={styles.sectionSubtitle}>Credit balance & repayments</Text>
          </View>
        </View>

        {onViewCustomers ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all customers and credit ledger"
            accessibilityHint="Navigates to the customers list"
            onPress={isLoading ? undefined : onViewCustomers}
            disabled={isLoading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.viewCustomersAction,
              pressed && !isLoading && styles.viewCustomersActionPressed,
            ]}>
            <Text style={styles.viewCustomersText} maxFontSizeMultiplier={1.25}>
              View All
            </Text>
            <Text style={styles.viewCustomersArrow} importantForAccessibility="no">
              →
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* 2. Error Recovery State (non-crashing) */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Unable to refresh Utang summary.
          </Text>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading utang summary"
              onPress={onRetry}
              style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* 3. Primary Outstanding Balance KPI */}
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
                styles.outstandingAmount,
                isCompactPhone && styles.outstandingAmountCompact,
                isNarrowPhone && styles.outstandingAmountNarrow,
                !hasOutstandingBalance && styles.outstandingAmountZero,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.25}>
              {formatPesoCurrency(summary.totalOutstandingUtang)}
            </Text>
            <Text style={styles.outstandingLabel}>
              {hasOutstandingBalance
                ? 'Total Outstanding Utang'
                : 'All customer balances settled 🎉'}
            </Text>
          </>
        )}
      </View>

      {/* 4. Supporting Metrics: Customers with Balance & Today's Payments */}
      <View
        style={[
          styles.statsRow,
          isNarrowPhone && styles.statsRowNarrow,
        ]}>
        {/* Metric 1: Customers With Balance */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Active Debtors</Text>
          {isLoading ? (
            <View style={styles.skeletonStatText} />
          ) : (
            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.2}>
              {customerCountLabel}
            </Text>
          )}
        </View>

        {/* Metric 2: Today's Payments */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Collected Today</Text>
          {isLoading ? (
            <View style={styles.skeletonStatText} />
          ) : (
            <Text
              style={[styles.statValue, styles.statValueSuccess]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.2}>
              {paymentsLabel}
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
    backgroundColor: '#FEF3C7',
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
  viewCustomersAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  viewCustomersActionPressed: {
    opacity: 0.65,
  },
  viewCustomersText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  viewCustomersArrow: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.twoHalf,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  retryBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  mainKpiSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.threeHalf,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 2,
  },
  outstandingAmount: {
    fontSize: 28,
    fontWeight: Typography.weights.extraBold,
    color: '#D97706',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  outstandingAmountCompact: {
    fontSize: 24,
  },
  outstandingAmountNarrow: {
    fontSize: 22,
  },
  outstandingAmountZero: {
    color: Colors.success,
  },
  outstandingLabel: {
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
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 2,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  statValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statValueSuccess: {
    color: Colors.success,
  },
  skeletonAmountWrap: {
    gap: 8,
  },
  skeletonAmount: {
    width: '60%',
    height: 32,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonStatText: {
    width: '70%',
    height: 18,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 2,
  },
});
