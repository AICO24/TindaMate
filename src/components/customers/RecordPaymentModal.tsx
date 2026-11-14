import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  useWindowDimensions,
  View,
} from 'react-native';

import { WarningTriangleIcon } from '@/components/dashboard/DashboardNavIcons';
import { AlertCircleIcon, CheckIcon } from '@/components/ui/AuthIcons';
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
import { getQuickPaymentOptions } from '@/lib/sales';

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
  onSubmitPayment: (
    amount: number,
    notes?: string,
    paymentMeta?: { amountTendered: number; changeDue: number }
  ) => void;
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
  const amountInputRef = useRef<TextInputInstance>(null);
  const onClearErrorRef = useRef(onClearError);

  useEffect(() => {
    onClearErrorRef.current = onClearError;
  }, [onClearError]);

  // Reset inputs only when modal transitions to visible
  useEffect(() => {
    if (visible) {
      setAmountInput('');
      setNotesInput('');
      setIsAmountFocused(false);
      setIsNotesFocused(false);
      onClearErrorRef.current?.();
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const validation = validatePaymentAmountInput(amountInput, currentBalance);
  const formattedBalance = formatPesoCurrency(currentBalance);
  const quickPaymentOptions = getQuickPaymentOptions(currentBalance);
  const hasInput = amountInput.trim().length > 0;
  const showError = Boolean(validation.error && hasInput);

  const handleAmountChange = (text: string) => {
    setAmountInput(text);
    if (submissionError) {
      onClearError?.();
    }
  };

  const handleSelectQuickAmount = (option: number) => {
    setAmountInput(option === currentBalance ? option.toFixed(2) : String(option));
    if (submissionError) {
      onClearError?.();
    }
  };

  const handleSubmit = () => {
    if (
      !validation.isValid ||
      validation.amount === null ||
      validation.amountTendered === null ||
      isSubmitting
    ) {
      return;
    }
    onSubmitPayment(validation.amount, notesInput.trim() || undefined, {
      amountTendered: validation.amountTendered,
      changeDue: validation.changeDue,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[
          styles.modalOverlay,
          isCompactPhone && styles.modalOverlayCompact,
        ]}
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
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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

              <Pressable
                accessible={false}
                onPress={() => amountInputRef.current?.focus()}
                style={[
                  styles.currencyInputWrap,
                  isAmountFocused && styles.currencyInputWrapFocused,
                  showError && styles.currencyInputWrapError,
                ]}>
                <Text style={styles.currencyPrefix}>₱</Text>
                <TextInput
                  ref={amountInputRef}
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
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  value={amountInput}
                  onChangeText={handleAmountChange}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  editable={!isSubmitting}
                  accessibilityLabel="Amount received input"
                  accessibilityHint="Enter payment amount in Philippine pesos"
                />
                {hasInput && !isSubmitting && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear amount"
                    onPress={() => handleAmountChange('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.clearInputButton}>
                    <Text style={styles.clearInputText}>✕</Text>
                  </Pressable>
                )}
              </Pressable>

              {/* Quick Action: Exact Full Amount + Bill Chips */}
              <View style={styles.quickOptionsRow}>
                {quickPaymentOptions.map((option) => {
                  const isExact = option === currentBalance;
                  const isSelected =
                    Number(amountInput) === option ||
                    amountInput === option.toFixed(2);
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isExact
                          ? `Pay full balance of ${formattedBalance}`
                          : `Enter ${formatPesoCurrency(option)} cash`
                      }
                      onPress={() => handleSelectQuickAmount(option)}
                      disabled={isSubmitting}
                      style={({ pressed }) => [
                        styles.quickChipFull,
                        isExact && styles.quickChipExact,
                        isSelected && styles.quickChipFullActive,
                        pressed && styles.quickChipPressed,
                      ]}>
                      <Text
                        style={[
                          styles.quickChipFullText,
                          isSelected && styles.quickChipFullTextActive,
                        ]}>
                        {isExact
                          ? `Pay Full (${formattedBalance})`
                          : formatPesoCurrency(option)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Validation / Helper Text */}
              {showError ? (
                <View style={styles.errorTextRow}>
                  <AlertCircleIcon size={14} color={Colors.error} />
                  <Text style={styles.validationErrorText}>{validation.error}</Text>
                </View>
              ) : (
                <Text style={styles.helperText}>
                  Enter cash received. If higher than balance, change (sukli) is computed automatically.
                </Text>
              )}
            </View>

            {/* 3. Live Payment Breakdown & Sukli Preview */}
            {validation.isValid &&
              validation.amount !== null &&
              validation.amountTendered !== null && (
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
                    <Text style={styles.summaryLabel}>
                      {validation.changeDue > 0
                        ? 'Cash Received (Bayad):'
                        : 'Amount Received:'}
                    </Text>
                    <Text style={styles.summaryValuePayment}>
                      {validation.changeDue > 0
                        ? formatPesoCurrency(validation.amountTendered)
                        : `- ${formatPesoCurrency(validation.amount)}`}
                    </Text>
                  </View>

                  {validation.changeDue > 0 ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Applied to Utang:</Text>
                      <Text style={styles.summaryValuePayment}>
                        - {formatPesoCurrency(validation.amount)}
                      </Text>
                    </View>
                  ) : null}

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
                          <CheckIcon size={10} color={Colors.successText} />
                          <Text style={styles.settledPillText}>Fully Settled</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {validation.changeDue > 0 ? (
                    <View style={styles.changeCalloutBox}>
                      <Text style={styles.changeCalloutLabel}>
                        CHANGE DUE (SUKLI)
                      </Text>
                      <Text
                        style={styles.changeCalloutAmount}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}>
                        {formatPesoCurrency(validation.changeDue)}
                      </Text>
                    </View>
                  ) : null}
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
                <WarningTriangleIcon
                  size={18}
                  bgColor={Colors.dangerLight}
                  fgColor={Colors.error}
                />
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
  modalOverlayCompact: {
    padding: Spacing.three,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  modalCard: {
    zIndex: 1,
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    backgroundColor: Colors.pastel.orange.bg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.orange.border,
    padding: Spacing.threeHalf,
    alignItems: 'center',
    gap: Spacing.one,
  },
  balanceBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  balanceBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.accentDark,
    fontVariant: ['tabular-nums'],
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
    backgroundColor: Colors.surface,
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
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  quickChipFull: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 7,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipExact: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  quickChipFullActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  quickChipPressed: {
    opacity: 0.8,
  },
  quickChipFullText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  quickChipFullTextActive: {
    color: Colors.textInverse,
  },
  errorTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  validationErrorText: {
    flex: 1,
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
    backgroundColor: Colors.surfaceSubtle,
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
    fontVariant: ['tabular-nums'],
  },
  summaryValuePayment: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
    fontVariant: ['tabular-nums'],
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
    gap: 3,
  },
  summaryTotalValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    fontVariant: ['tabular-nums'],
  },
  summaryTotalValuePartial: {
    color: Colors.accentDark,
  },
  summaryTotalValueSettled: {
    color: Colors.pastel.green.accent,
  },
  settledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  settledPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  changeCalloutBox: {
    marginTop: Spacing.one,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  changeCalloutLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: 0.4,
  },
  changeCalloutAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
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
    backgroundColor: Colors.surface,
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
