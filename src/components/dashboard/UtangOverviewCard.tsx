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
import { DashboardUtangSummary } from '@/types/customer';

interface UtangOverviewCardProps {
  summary: DashboardUtangSummary;
  isLoading?: boolean;
  onViewCustomers?: () => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * UtangOverviewCard (Batch 8F)
 *
 * Dedicated Customer Credit & Utang Summary Card for the Main Dashboard:
 * 1. Prominent Outstanding Utang: Authoritative ledger-derived credit balance (e.g. ₱3,250.00)
 * 2. Distinct Customers with Balance: Count of customers with positive utang (e.g. 12 customers with balance)
 * 3. Today's Payments: Total credit repayments received today (e.g. ₱850.00 paid today)
 * 4. Action: Direct "View Customers →" navigation into the Customers screen
 *
 * Designed with the TindaMate Purple pastel design tokens and zero layout shift during loading.
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
      ? 'No customers with balance'
      : `${summary.customersWithBalanceCount} ${
          summary.customersWithBalanceCount === 1 ? 'customer' : 'customers'
        } with balance`;

  const paymentsLabel = `${formatPesoCurrency(summary.todayPaymentsTotal)} paid today`;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Utang Overview. Outstanding balance: ${formatPesoCurrency(
        summary.totalOutstandingUtang
      )}. ${customerCountLabel}. ${paymentsLabel}.`}>
      {/* 1. Header: Pill Badge + View Customers Action */}
      <View style={styles.topRow}>
        <View style={styles.badgePill}>
          <View style={styles.badgeIconCircle}>
            <DashboardBadgeVectorIcon type="utang" color={Colors.textInverse} />
          </View>
          <Text style={styles.badgeText}>Utang Overview</Text>
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
              View Customers
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
                : 'No outstanding customer utang'}
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
          <View style={styles.statHeader}>
            <View style={styles.customerIconDot} />
            <Text style={styles.statTitle}>Active Accounts</Text>
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
              {customerCountLabel}
            </Text>
          )}
        </View>

        {/* Metric 2: Today's Payments */}
        <View style={styles.statBox}>
          <View style={styles.statHeader}>
            <View style={styles.paymentIconDot} />
            <Text style={styles.statTitle}>Collections Today</Text>
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
    backgroundColor: Colors.pastel.purple.bg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.pastel.purple.border,
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
    borderColor: Colors.pastel.purple.border,
  },
  badgeIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.pastel.purple.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.purple.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    color: Colors.pastel.purple.accent,
  },
  viewCustomersArrow: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.purple.accent,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  errorText: {
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  retryBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  retryBtnText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  mainKpiSection: {
    gap: 2,
  },
  outstandingAmount: {
    fontSize: 32,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.purple.text,
    letterSpacing: -0.5,
  },
  outstandingAmountCompact: {
    fontSize: 28,
  },
  outstandingAmountNarrow: {
    fontSize: 24,
  },
  outstandingAmountZero: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.pastel.purple.iconBg,
  },
  paymentIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statMainText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  skeletonAmountWrap: {
    gap: 6,
    paddingVertical: 4,
  },
  skeletonAmount: {
    width: '60%',
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.pastel.purple.border,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.pastel.purple.border,
  },
  skeletonStatText: {
    width: '80%',
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.pastel.purple.border,
    marginTop: 2,
  },
});
