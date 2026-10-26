import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/ui/AuthIcons';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { Sale, SaleItem } from '@/types/sale';

export interface SaleSuccessModalProps {
  /** Whether the success modal is visible */
  visible: boolean;
  /** Authoritative sale transaction header returned by the server */
  sale: Sale | null;
  /** Line items recorded under this transaction */
  items?: SaleItem[];
  /** Cash amount tendered by customer */
  amountTendered: number | null;
  /** Actual change calculated against server-authoritative total */
  change: number;
  /** Whether this was an idempotent retry */
  isRetry?: boolean;
  /** Optional notice if server price differed from client estimate */
  priceDifferenceNotice?: string | null;
  /** Callback to start a new sale */
  onDismiss: () => void;
  /** Callback to view transaction details in `/sales/[id]` */
  onViewDetails?: (saleId: string) => void;
}

/**
 * SaleSuccessModal
 *
 * Implements Batch 7B-3 POS transaction completion screen:
 * - Confirmed server-authoritative total amount
 * - Large high-contrast Change Due (Sukli) display for the cashier
 * - Item count and unit breakdown
 * - Transaction reference number
 * - Retried transaction indicator (idempotency verification)
 * - Clear actions to record another sale or inspect full receipt details
 */
export function SaleSuccessModal({
  visible,
  sale,
  items = [],
  amountTendered,
  change,
  isRetry = false,
  priceDifferenceNotice,
  onDismiss,
  onViewDetails,
}: SaleSuccessModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 360;

  if (!sale) {
    return null;
  }

  const distinctCount = sale.item_count ?? items.length;
  const totalUnits = sale.quantity;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalCard, isNarrow && styles.modalCardNarrow]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              {/* Top Success Badge */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <CheckIcon size={32} color={Colors.surface} />
                </View>
              </View>

              {/* Title & Status */}
              <Text style={styles.title} accessibilityRole="header">
                Sale Recorded!
              </Text>
              <Text style={styles.subtitle}>
                Transaction saved to your store database.
              </Text>

              {/* Idempotency Retry Badge */}
              {isRetry && (
                <View style={styles.retryBadge}>
                  <Text style={styles.retryBadgeText}>
                    ✓ Restored from previous attempt (No double-deduction)
                  </Text>
                </View>
              )}

              {/* Price Difference Notice */}
              {priceDifferenceNotice ? (
                <View style={styles.priceNoticeBox}>
                  <Text style={styles.priceNoticeText}>
                    ℹ️ {priceDifferenceNotice}
                  </Text>
                </View>
              ) : null}

              {/* Total Amount Hero Card */}
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>FINAL TOTAL AMOUNT</Text>
                <Text
                  style={styles.amountValue}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}>
                  {formatPesoCurrency(sale.total_amount)}
                </Text>
                <Text style={styles.amountItemsSub}>
                  {distinctCount} {distinctCount === 1 ? 'product' : 'products'} · {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                </Text>
              </View>

              {/* Payment & Change Breakdown */}
              <View style={styles.breakdownCard}>
                {amountTendered !== null && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Amount Tendered:</Text>
                    <Text style={styles.breakdownValue}>
                      {formatPesoCurrency(amountTendered)}
                    </Text>
                  </View>
                )}

                <View style={[styles.breakdownRow, styles.changeRow]}>
                  <Text style={styles.changeLabel}>Change Due (Sukli):</Text>
                  <Text style={styles.changeValue}>
                    {formatPesoCurrency(change)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.breakdownRow}>
                  <Text style={styles.refLabel}>Reference No.:</Text>
                  <Text style={styles.refValue}>
                    #{sale.id.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.actionsWrap}>
              <TindaMateButton
                title="Record Another Sale"
                variant="primary"
                onPress={onDismiss}
                accessibilityLabel="Record another sale"
                style={styles.actionBtn}
              />

              {onViewDetails && (
                <TindaMateButton
                  title="View Sale Details"
                  variant="secondary"
                  onPress={() => onViewDetails(sale.id)}
                  accessibilityLabel="View full sale details"
                  style={styles.actionBtn}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.55)', // Deep forest green backdrop
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    paddingHorizontal: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '100%',
    ...Shadows.md,
  },
  modalCardNarrow: {
    padding: Spacing.md,
  },
  scrollView: {
    maxHeight: 460,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  retryBadge: {
    backgroundColor: Colors.pastel.blue.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.blue.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    width: '100%',
  },
  retryBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.pastel.blue.accent,
    textAlign: 'center',
    fontWeight: Typography.weights.semiBold,
  },
  priceNoticeBox: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    width: '100%',
  },
  priceNoticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.warningText,
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  amountLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    marginVertical: 4,
  },
  amountItemsSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  breakdownCard: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  changeRow: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  changeLabel: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  changeValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.successText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  refLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  refValue: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  actionsWrap: {
    width: '100%',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
});
