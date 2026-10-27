import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

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
import { formatSaleDate, formatSaleTime } from '@/lib/sales';
import { CompletedPaymentResult } from '@/types/customer';

export interface PaymentSuccessModalProps {
  /** Whether the success modal is visible */
  visible: boolean;
  /** Customer display name */
  customerName: string;
  /** Completed payment result from database RPC */
  paymentResult: CompletedPaymentResult | null;
  /** Callback to dismiss modal and return to customer details */
  onDismiss: () => void;
}

/**
 * PaymentSuccessModal
 *
 * Implements Batch 8E: Payment Confirmation & Receipt Feedback
 * - Clear visual confirmation with checkmark badge
 * - Amount received, previous balance, and remaining balance summary
 * - Clear "Fully Paid" announcement if balance reached ₱0.00
 * - Reference tag and timestamp
 */
export function PaymentSuccessModal({
  visible,
  customerName,
  paymentResult,
  onDismiss,
}: PaymentSuccessModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  if (!paymentResult) {
    return null;
  }

  const formattedAmount = formatPesoCurrency(paymentResult.amount);
  const formattedPrevious = formatPesoCurrency(paymentResult.previousBalance);
  const formattedRemaining = formatPesoCurrency(paymentResult.remainingBalance);
  const formattedDate = formatSaleDate(paymentResult.payment.created_at);
  const formattedTime = formatSaleTime(paymentResult.payment.created_at);
  const referenceTag = `#${paymentResult.payment.id.slice(0, 8).toUpperCase()}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            isCompactPhone && styles.cardCompact,
          ]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Success Check Icon */}
            <View style={styles.checkCircle}>
              <CheckIcon size={28} color={Colors.textInverse} />
            </View>

            {/* Header Titles */}
            <View style={styles.titleWrap}>
              <Text style={styles.titleText}>Payment Recorded!</Text>
              <Text style={styles.subtitleText}>
                Received from {customerName}
              </Text>
            </View>

            {/* Amount Paid Callout */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Amount Paid</Text>
              <Text style={styles.amountValue}>{formattedAmount}</Text>
            </View>

            {/* Account Status / Settlement Banner */}
            {paymentResult.isFullyPaid ? (
              <View style={styles.fullyPaidBanner}>
                <Text style={styles.fullyPaidBannerEmoji}>🎉</Text>
                <View style={styles.fullyPaidBannerInfo}>
                  <Text style={styles.fullyPaidBannerTitle}>Account Fully Settled!</Text>
                  <Text style={styles.fullyPaidBannerSub}>
                    Outstanding utang balance is now ₱0.00.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Breakdown Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Previous Balance</Text>
                <Text style={styles.detailValue}>{formattedPrevious}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={[styles.detailValue, styles.detailValuePayment]}>
                  - {formattedAmount}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Remaining Balance</Text>
                <Text
                  style={[
                    styles.detailValueBold,
                    paymentResult.isFullyPaid
                      ? styles.remainingSettled
                      : styles.remainingActive,
                  ]}>
                  {formattedRemaining}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference No.</Text>
                <Text style={styles.detailValueMono}>{referenceTag}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formattedDate} · {formattedTime}
                </Text>
              </View>
            </View>

            {paymentResult.isRetry ? (
              <Text style={styles.retryNote}>
                ℹ️ Note: This was a duplicate retry of a previously processed payment.
              </Text>
            ) : null}

            {/* Action Button */}
            <View style={styles.actionWrap}>
              <TindaMateButton
                title="Done"
                variant="primary"
                onPress={onDismiss}
                accessibilityLabel="Close confirmation and view updated ledger"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardCompact: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.threeHalf,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
    ...Shadows.xs,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  amountBox: {
    width: '100%',
    backgroundColor: Colors.pastel.green.bg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    padding: Spacing.threeHalf,
    alignItems: 'center',
    gap: 2,
  },
  amountLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: Typography.sizes.displaySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  fullyPaidBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
  },
  fullyPaidBannerEmoji: {
    fontSize: 24,
  },
  fullyPaidBannerInfo: {
    flex: 1,
    gap: 2,
  },
  fullyPaidBannerTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.green.accent,
  },
  fullyPaidBannerSub: {
    fontSize: Typography.sizes.caption,
    color: Colors.pastel.green.text,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  detailLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  detailLabelBold: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  detailValue: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  detailValuePayment: {
    color: Colors.pastel.green.accent,
  },
  detailValueBold: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
  },
  remainingActive: {
    color: Colors.pastel.orange.accent,
  },
  remainingSettled: {
    color: Colors.pastel.green.accent,
  },
  detailValueMono: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  retryNote: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  actionWrap: {
    width: '100%',
    marginTop: Spacing.two,
  },
});
