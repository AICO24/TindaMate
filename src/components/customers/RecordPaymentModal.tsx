import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { validatePaymentAmountInput } from '@/lib/customers';
import { formatPesoCurrency } from '@/lib/products';

export interface RecordPaymentModalProps {
  /** Whether the payment modal is visible */
  visible: boolean;
  /** Customer display name */
  customerName: string;
  /** Authoritative outstanding balance in Philippine Pesos */
  currentBalance: number;
  /** Whether the payment RPC is actively submitting */
  isSubmitting?: boolean;
  /** Submission error message if previous attempt failed */
  submissionError?: string | null;
  /** Callback to clear submission error */
  onClearError?: () => void;
  /** Callback triggered when user cancels or dismisses modal */
  onClose: () => void;
  /** Callback triggered when user confirms payment with valid amount */
  onSubmitPayment: (amount: number, notes?: string) => void;
}

/**
 * RecordPaymentModal
 *
 * Implements Batch 8E: Customer Payment & Settlement UI
 * - Real-time client-side preview of remaining balance using integer centavo arithmetic
 * - Quick "Pay Full Balance" 1-tap option
 * - Strict input validation against zero, negative, invalid, and overpayment
 * - Notes field for optional payment memo
 * - Keyboard-adaptive mobile layout preserving full scrollability and touch access
 * - Duplicate-tap lock during active database submission
 */
export function RecordPaymentModal({
  visible,
  customerName,
  currentBalance,
  isSubmitting = false,
  submissionError = null,
  onClearError,
  onClose,
  onSubmitPayment,
}: RecordPaymentModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [amountInput, setAmountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Reset inputs whenever modal opens
  useEffect(() => {
    if (visible) {
      setAmountInput('');
      setNotesInput('');
      onClearError?.();
    }
  }, [visible, onClearError]);

  const validation = validatePaymentAmountInput(amountInput, currentBalance);
  const formattedBalance = formatPesoCurrency(currentBalance);

  const handleAmountChange = (text: string) => {
    setAmountInput(text);
    if (submissionError) {
      onClearError?.();
    }
  };

  const handlePayFullAmount = () => {
    setAmountInput(currentBalance.toFixed(2));
    if (submissionError) {
      onClearError?.();
    }
  };

  const handleSubmit = () => {
    if (!validation.isValid || validation.amount === null || isSubmitting) {
      return;
    }
    onSubmitPayment(validation.amount, notesInput.trim() || undefined);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={styles.backdropPressable}
          onPress={isSubmitting ? undefined : onClose}
          accessibilityLabel="Dismiss payment modal"
        />

        <View
          style={[
            styles.modalCard,
            isCompactPhone && styles.modalCardCompact,
          ]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>Record Payment</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Customer: {customerName}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close payment modal"
              onPress={isSubmitting ? undefined : onClose}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* 1. Outstanding Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Outstanding Balance</Text>
              <Text style={styles.balanceAmount}>{formattedBalance}</Text>
            </View>

            {/* 2. Amount Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Amount Received (Bayad)</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Pay full balance of ${formattedBalance}`}
                  onPress={handlePayFullAmount}
                  disabled={isSubmitting}
                  style={styles.fullPayChip}>
                  <Text style={styles.fullPayChipText}>Pay Full Amount</Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.currencyInputWrap,
                  validation.error && amountInput.trim() !== '' && styles.currencyInputWrapError,
                ]}>
                <Text style={styles.currencyPrefix}>₱</Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textPlaceholder}
                  keyboardType="decimal-pad"
                  value={amountInput}
                  onChangeText={handleAmountChange}
                  editable={!isSubmitting}
                  autoFocus
                  accessibilityLabel="Amount received input"
                  accessibilityHint="Enter payment amount in Philippine pesos"
                />
                {amountInput.length > 0 && !isSubmitting && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear amount"
                    onPress={() => handleAmountChange('')}
                    style={styles.clearInputButton}>
                    <Text style={styles.clearInputText}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Validation / Helper Text */}
              {validation.error && amountInput.trim() !== '' ? (
                <Text style={styles.validationErrorText}>{validation.error}</Text>
              ) : (
                <Text style={styles.helperText}>
                  Enter the amount paid by the customer. Cannot exceed outstanding balance.
                </Text>
              )}
            </View>

            {/* 3. Live Remaining Balance Preview */}
            {validation.isValid && validation.amount !== null && (
              <View
                style={[
                  styles.previewCard,
                  validation.remainingBalance === 0
                    ? styles.previewCardSettled
                    : styles.previewCardPartial,
                ]}>
                <View style={styles.previewRow}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewLabel}>Remaining Balance</Text>
                    <Text
                      style={[
                        styles.previewAmount,
                        validation.remainingBalance === 0
                          ? styles.previewAmountSettled
                          : styles.previewAmountPartial,
                      ]}>
                      {formatPesoCurrency(validation.remainingBalance)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.previewBadge,
                      validation.remainingBalance === 0
                        ? styles.previewBadgeSettled
                        : styles.previewBadgePartial,
                    ]}>
                    <Text
                      style={[
                        styles.previewBadgeText,
                        validation.remainingBalance === 0
                          ? styles.previewBadgeTextSettled
                          : styles.previewBadgeTextPartial,
                      ]}>
                      {validation.remainingBalance === 0
                        ? '✨ Fully Settled'
                        : 'Partial Payment'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 4. Optional Payment Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.inputLabel}>Payment Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Cash bayad, partial payment"
                placeholderTextColor={Colors.textPlaceholder}
                value={notesInput}
                onChangeText={setNotesInput}
                editable={!isSubmitting}
                maxLength={120}
                accessibilityLabel="Optional payment notes"
              />
            </View>

            {/* 5. Submission Error Banner */}
            {submissionError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{submissionError}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <View style={styles.actionButtonWrap}>
              <TindaMateButton
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                disabled={isSubmitting}
                accessibilityLabel="Cancel payment"
              />
            </View>

            <View style={styles.actionButtonWrap}>
              <TindaMateButton
                title={isSubmitting ? 'Recording...' : 'Record Payment'}
                variant="primary"
                onPress={handleSubmit}
                disabled={!validation.isValid || isSubmitting}
                accessibilityLabel="Confirm and record payment"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },
  modalCardCompact: {
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.threeHalf,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.backgroundAlt,
  },
  headerTitleCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  scrollBody: {
    maxHeight: 460,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.threeHalf,
  },
  balanceCard: {
    backgroundColor: Colors.pastel.orange.bg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.orange.border,
    padding: Spacing.threeHalf,
    alignItems: 'center',
    gap: 2,
  },
  balanceLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.orange.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: Typography.sizes.displaySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.orange.accent,
  },
  inputSection: {
    gap: Spacing.two,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  fullPayChip: {
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  fullPayChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  currencyInputWrapError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  currencyPrefix: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    marginRight: Spacing.two,
  },
  currencyInput: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },
  clearInputButton: {
    padding: Spacing.one,
  },
  clearInputText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  validationErrorText: {
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  helperText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  previewCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
  },
  previewCardPartial: {
    backgroundColor: Colors.pastel.blue.bg,
    borderColor: Colors.pastel.blue.border,
  },
  previewCardSettled: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewInfo: {
    gap: 2,
  },
  previewLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  previewAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
  },
  previewAmountPartial: {
    color: Colors.pastel.blue.accent,
  },
  previewAmountSettled: {
    color: Colors.pastel.green.accent,
  },
  previewBadge: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  previewBadgePartial: {
    backgroundColor: Colors.surface,
    borderColor: Colors.pastel.blue.border,
  },
  previewBadgeSettled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.pastel.green.border,
  },
  previewBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  previewBadgeTextPartial: {
    color: Colors.pastel.blue.accent,
  },
  previewBadgeTextSettled: {
    color: Colors.pastel.green.accent,
  },
  notesSection: {
    gap: Spacing.two,
  },
  notesInput: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    fontSize: Typography.sizes.bodySm,
    color: Colors.textPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
  },
  errorBannerIcon: {
    fontSize: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    padding: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.backgroundAlt,
  },
  actionButtonWrap: {
    flex: 1,
  },
});
