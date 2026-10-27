import React, { useEffect, useState } from 'react';
import {
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
 * - Cross-platform clean input with zero browser outline bleeding on web
 * - High-contrast, reassuring financial layout for sari-sari store owners
 * - Real-time breakdown of current balance, payment deducted, and remaining balance
 * - 1-tap "Pay Full Amount" shortcut
 * - Strict client-side validation against zero, negative, invalid, and overpayment
 * - Notes field for optional payment memo
 * - Keyboard-adaptive mobile layout
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
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isNotesFocused, setIsNotesFocused] = useState(false);

  // Reset inputs whenever modal opens
  useEffect(() => {
    if (visible) {
      setAmountInput('');
      setNotesInput('');
      setIsAmountFocused(false);
      setIsNotesFocused(false);
      onClearError?.();
    }
  }, [visible, onClearError]);

  const validation = validatePaymentAmountInput(amountInput, currentBalance);
  const formattedBalance = formatPesoCurrency(currentBalance);
  const hasInput = amountInput.trim().length > 0;
  const showError = Boolean(validation.error && hasInput);

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
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeText}>Current Outstanding Utang</Text>
              </View>
              <Text style={styles.balanceAmount}>{formattedBalance}</Text>
            </View>

            {/* 2. Amount Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Amount Received (Bayad)</Text>

              <View
                style={[
                  styles.currencyInputWrap,
                  isAmountFocused && styles.currencyInputWrapFocused,
                  showError && styles.currencyInputWrapError,
                ]}>
                <Text style={styles.currencyPrefix}>₱</Text>
                <TextInput
                  style={[
                    styles.currencyInput,
                    Platform.OS === 'web'
                      ? ({
                          outlineStyle: 'none',
                          outlineWidth: 0,
                          boxShadow: 'none',
                        } as any)
                      : {},
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textPlaceholder}
                  keyboardType="decimal-pad"
                  value={amountInput}
                  onChangeText={handleAmountChange}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  editable={!isSubmitting}
                  autoFocus
                  accessibilityLabel="Amount received input"
                  accessibilityHint="Enter payment amount in Philippine pesos"
                />
                {hasInput && !isSubmitting && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear amount"
                    onPress={() => handleAmountChange('')}
                    style={styles.clearInputButton}>
                    <Text style={styles.clearInputText}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Quick Action: Pay Full Amount */}
              <View style={styles.quickOptionsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Pay full balance of ${formattedBalance}`}
                  onPress={handlePayFullAmount}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.quickChipFull,
                    amountInput === currentBalance.toFixed(2) && styles.quickChipFullActive,
                    pressed && styles.quickChipPressed,
                  ]}>
                  <Text style={styles.quickChipFullText}>
                    ⚡ Pay Full Amount ({formattedBalance})
                  </Text>
                </Pressable>
              </View>

              {/* Validation / Helper Text */}
              {showError ? (
                <View style={styles.errorTextRow}>
                  <Text style={styles.errorTextIcon}>⚠️</Text>
                  <Text style={styles.validationErrorText}>{validation.error}</Text>
                </View>
              ) : (
                <Text style={styles.helperText}>
                  Enter the amount paid by the customer. Cannot exceed outstanding balance.
                </Text>
              )}
            </View>

            {/* 3. Live Payment Breakdown Preview */}
            {validation.isValid && validation.amount !== null && (
              <View
                style={[
                  styles.summaryBox,
                  validation.remainingBalance === 0
                    ? styles.summaryBoxSettled
                    : styles.summaryBoxPartial,
                ]}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Current Balance:</Text>
                  <Text style={styles.summaryValueMuted}>{formattedBalance}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Received:</Text>
                  <Text style={styles.summaryValuePayment}>
                    - {formatPesoCurrency(validation.amount)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Remaining Balance:</Text>
                  <View style={styles.summaryTotalRight}>
                    <Text
                      style={[
                        styles.summaryTotalValue,
                        validation.remainingBalance === 0
                          ? styles.summaryTotalValueSettled
                          : styles.summaryTotalValuePartial,
                      ]}>
                      {formatPesoCurrency(validation.remainingBalance)}
                    </Text>
                    {validation.remainingBalance === 0 ? (
                      <View style={styles.settledPill}>
                        <Text style={styles.settledPillText}>✓ Fully Settled</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            )}

            {/* 4. Optional Payment Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.inputLabel}>Payment Notes (Optional)</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  isNotesFocused && styles.notesInputFocused,
                  Platform.OS === 'web'
                    ? ({
                        outlineStyle: 'none',
                        outlineWidth: 0,
                        boxShadow: 'none',
                      } as any)
                    : {},
                ]}
                placeholder="e.g. Cash bayad, partial payment"
                placeholderTextColor={Colors.textPlaceholder}
                value={notesInput}
                onChangeText={setNotesInput}
                onFocus={() => setIsNotesFocused(true)}
                onBlur={() => setIsNotesFocused(false)}
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
                style={styles.modalBtn}
                textStyle={styles.modalBtnText}
                accessibilityLabel="Cancel payment"
              />
            </View>

            <View style={styles.actionButtonWrap}>
              <TindaMateButton
                title={isSubmitting ? 'Recording...' : 'Record Payment'}
                variant="primary"
                onPress={handleSubmit}
                disabled={!validation.isValid || isSubmitting}
                style={styles.modalBtn}
                textStyle={styles.modalBtnText}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
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
    backgroundColor: Colors.backgroundWarm,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  scrollBody: {
    maxHeight: 500,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.threeHalf,
  },
  balanceCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    padding: Spacing.threeHalf,
    alignItems: 'center',
    gap: Spacing.one,
  },
  balanceBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  balanceBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#C2410C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.accent,
  },
  inputSection: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.threeHalf,
    height: 54,
  },
  currencyInputWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    ...Shadows.xs,
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
    minWidth: 0,
    width: '100%',
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  clearInputButton: {
    padding: Spacing.one,
  },
  clearInputText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  quickOptionsRow: {
    marginTop: Spacing.one,
  },
  quickChipFull: {
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipFullActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  quickChipPressed: {
    opacity: 0.8,
  },
  quickChipFullText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  errorTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  errorTextIcon: {
    fontSize: 12,
  },
  validationErrorText: {
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  helperText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.threeHalf,
    borderWidth: 1,
    gap: Spacing.two,
  },
  summaryBoxPartial: {
    backgroundColor: '#F8FAFC',
    borderColor: Colors.border,
  },
  summaryBoxSettled: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  summaryValueMuted: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  summaryValuePayment: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },
  summaryTotalLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  summaryTotalRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  summaryTotalValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
  },
  summaryTotalValuePartial: {
    color: Colors.accent,
  },
  summaryTotalValueSettled: {
    color: Colors.pastel.green.accent,
  },
  settledPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  settledPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  notesSection: {
    gap: Spacing.one,
  },
  notesInput: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    fontSize: Typography.sizes.bodySm,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  notesInputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: Colors.backgroundWarm,
  },
  actionButtonWrap: {
    flex: 1,
  },
  modalBtn: {
    height: 48,
    minHeight: 48,
    paddingVertical: 0,
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
  },
});
