import React, { useState } from 'react';
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
  compact?: boolean;
}

/**
 * UtangOverviewCard (Design 2.0 Showcase Alignment)
 *
 * Dedicated Customer Credit & Utang Summary Card for the Main Dashboard:
 * - Supports `compact` mode for side-by-side integration with Expenses
 * - Authoritative ledger-derived credit balance (e.g. ₱3,250.00)
 * - Active debtor count and today's collections
 * - Direct "View All →" navigation into Customers screen
 */
export function UtangOverviewCard({
  summary,
  isLoading = false,
  onViewCustomers,
  error,
  onRetry,
  compact = false,
}: UtangOverviewCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;
  const [isHovered, setIsHovered] = useState(false);

  const hasOutstandingBalance = summary.totalOutstandingUtang > 0;
  const customerCountLabel =
    summary.customersWithBalanceCount === 0
      ? '0 debtors'
      : `${summary.customersWithBalanceCount} ${
          summary.customersWithBalanceCount === 1 ? 'debtor' : 'debtors'
        }`;

  const paymentsLabel = formatPesoCurrency(summary.todayPaymentsTotal);

  // Compact card presentation (for side-by-side Store Finances row)
  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Utang summary: ${formatPesoCurrency(summary.totalOutstandingUtang)}, ${customerCountLabel}. Tap to view customers.`}
        onPress={isLoading ? undefined : onViewCustomers}
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
              <NavCustomersIcon size={13} color="#D97706" />
            </View>
            <Text style={styles.compactTitleText} numberOfLines={1}>
              Utang
            </Text>
          </View>

          {onViewCustomers && (
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
              !hasOutstandingBalance && styles.compactAmountZero,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {formatPesoCurrency(summary.totalOutstandingUtang)}
          </Text>
        )}

        {/* Footer Subtext */}
        <View style={styles.compactFooterRow}>
          <Text style={styles.compactSubtext} numberOfLines={1}>
            {customerCountLabel}
          </Text>
          {summary.todayPaymentsTotal > 0 && (
            <Text style={styles.compactCollectedText} numberOfLines={1}>
              +{paymentsLabel}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  // Full card presentation
  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Customers & Utang Overview. Outstanding balance: ${formatPesoCurrency(
        summary.totalOutstandingUtang
      )}. ${customerCountLabel}. ${paymentsLabel} paid today.`}>
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

      {/* 2. Error Recovery State */}
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

      {/* 4. Supporting Metrics */}
      <View style={styles.statsRow}>
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
    backgroundColor: '#FEF3C7',
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
  compactCollectedText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
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
  outstandingAmount: {
    ...Typography.presets.heroValue,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  outstandingAmountNarrow: {
    fontSize: Typography.sizes.xl,
  },
  outstandingAmountZero: {
    color: Colors.textMuted,
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
  statValueSuccess: {
    color: '#16A34A',
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
