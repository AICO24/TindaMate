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
import { SafeAreaView } from 'react-native-safe-area-context';

import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { getQuickPaymentOptions, validatePaymentAmount } from '@/lib/sales';
import { CartItem, CartSummary } from '@/types/sale';

export interface CheckoutModalProps {
  /** Whether the checkout modal is currently visible */
  visible: boolean;
  /** Current list of items in the cart */
  cartItems: CartItem[];
  /** Derived metrics for the active cart */
  cartSummary: CartSummary;
  /** Callback triggered when user cancels or dismisses checkout */
  onClose: () => void;
  /** Callback triggered when user confirms sale with valid payment */
  onConfirmSale: (amountTendered: number, change: number) => void;
}

/**
 * CheckoutModal
 *
 * Implements Batch 7B-2: Checkout UI + Amount Tendered + Change Calculation
 * - Complete order summary review (items, quantities, unit prices, subtotals, total)
 * - Safe numeric input for customer Amount Tendered (supports Philippine Peso decimals)
 * - Integer centavo arithmetic for safe, deterministic change calculation
 * - Dynamic quick payment options (Exact amount, ₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000)
 * - Real-time payment states: Empty, Invalid, Insufficient (shortfall needed), Exact (₱0.00), Overpaid (Change)
 * - Keyboard-adaptive mobile layout preserving full scrollability and touch access
 * - Batch 7B-2 boundary: stops at UI confirmation without database mutation
 */
export function CheckoutModal({
  visible,
  cartItems,
  cartSummary,
  onClose,
  onConfirmSale,
}: CheckoutModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 360;

  // Local payment input state (resets upon opening/closing)
  const [amountTenderedInput, setAmountTenderedInput] = useState('');

  // Reset payment input whenever modal visibility changes
  useEffect(() => {
    if (visible) {
      setAmountTenderedInput('');
    }
  }, [visible]);

  // Derived payment validation and change calculation
  const paymentValidation = validatePaymentAmount(
    amountTenderedInput,
    cartSummary.totalAmount
  );

  // Quick payment bill chips
  const quickPaymentOptions = getQuickPaymentOptions(cartSummary.totalAmount);

  const handleQuickPaymentPress = (amount: number) => {
    // If integer, display without trailing .00; if has cents, keep exact
    const formatted =
      amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    setAmountTenderedInput(formatted);
  };

  const handleConfirmPress = () => {
    if (
      !paymentValidation.isValid ||
      paymentValidation.amountTendered === null
    ) {
      return;
    }
    onConfirmSale(
      paymentValidation.amountTendered,
      paymentValidation.change
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle} accessibilityRole="header">
                POS Checkout
              </Text>
              <Text style={styles.headerSubtitle}>
                Review items and enter customer payment
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel checkout and return to cart"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Scrollable Checkout Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Total Amount Hero Card */}
            <View style={styles.totalHeroCard}>
              <View style={styles.totalHeroTop}>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>TOTAL AMOUNT DUE</Text>
                </View>
                <Text style={styles.totalCountText}>
                  {cartSummary.totalItems}{' '}
                  {cartSummary.totalItems === 1 ? 'item' : 'items'} (
                  {cartSummary.distinctCount}{' '}
                  {cartSummary.distinctCount === 1 ? 'product' : 'products'})
                </Text>
              </View>
              <Text
                style={styles.totalHeroAmount}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}>
                {formatPesoCurrency(cartSummary.totalAmount)}
              </Text>
            </View>

            {/* Order Items Breakdown */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Order Summary</Text>
                <Text style={styles.sectionItemCount}>
                  {cartItems.length} {cartItems.length === 1 ? 'line item' : 'line items'}
                </Text>
              </View>

              <View style={styles.itemsListContainer}>
                {cartItems.map((item, index) => (
                  <View
                    key={item.productId}
                    style={[
                      styles.orderItemRow,
                      index < cartItems.length - 1 && styles.orderItemDivider,
                    ]}>
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.orderItemUnitDetails}>
                        {item.quantity} {item.unit} × {formatPesoCurrency(item.sellingPrice)}
                      </Text>
                    </View>
                    <Text style={styles.orderItemSubtotal}>
                      {formatPesoCurrency(item.subtotal)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Payment Section */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Amount Tendered (Bayad)</Text>
              <Text style={styles.inputHelpText}>
                Enter the cash amount handed by the customer.
              </Text>

              {/* Amount Input Box */}
              <View
                style={[
                  styles.inputContainer,
                  paymentValidation.status === 'insufficient' &&
                    styles.inputContainerWarning,
                  paymentValidation.isValid && styles.inputContainerValid,
                ]}>
                <Text style={styles.pesoSymbol}>₱</Text>
                <TextInput
                  style={styles.numericInput}
                  value={amountTenderedInput}
                  onChangeText={setAmountTenderedInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textPlaceholder}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  returnKeyType="done"
                  autoFocus={false}
                  selectTextOnFocus={true}
                  accessibilityLabel="Amount Tendered input"
                  accessibilityHint="Enter cash payment received in Philippine Pesos"
                />
                {amountTenderedInput.length > 0 && (
                  <Pressable
                    style={styles.inputClearButton}
                    onPress={() => setAmountTenderedInput('')}
                    accessibilityRole="button"
                    accessibilityLabel="Clear payment amount">
                    <Text style={styles.inputClearButtonText}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Quick Payment Options */}
              {quickPaymentOptions.length > 0 && (
                <View style={styles.quickOptionsWrap}>
                  <Text style={styles.quickOptionsLabel}>Quick Tender:</Text>
                  <View style={styles.quickChipsRow}>
                    {quickPaymentOptions.map((option) => {
                      const isExact = option === cartSummary.totalAmount;
                      const isSelected =
                        amountTenderedInput === option.toString() ||
                        amountTenderedInput === option.toFixed(2);

                      return (
                        <Pressable
                          key={option}
                          style={({ pressed }) => [
                            styles.quickChip,
                            isExact && styles.quickChipExact,
                            isSelected && styles.quickChipSelected,
                            pressed && styles.quickChipPressed,
                          ]}
                          onPress={() => handleQuickPaymentPress(option)}
                          accessibilityRole="button"
                          accessibilityLabel={`Pay ${
                            isExact ? 'exact amount' : ''
                          } ${formatPesoCurrency(option)}`}>
                          <Text
                            style={[
                              styles.quickChipText,
                              isExact && styles.quickChipTextExact,
                              isSelected && styles.quickChipTextSelected,
                            ]}>
                            {isExact
                              ? `Exact (${formatPesoCurrency(option)})`
                              : formatPesoCurrency(option)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Payment Feedback / Validation Messages */}
              {paymentValidation.status === 'empty' && (
                <View style={styles.feedbackBoxMuted}>
                  <Text style={styles.feedbackTextMuted}>
                    Awaiting customer cash payment.
                  </Text>
                </View>
              )}

              {paymentValidation.status === 'invalid' && (
                <View style={styles.feedbackBoxError}>
                  <Text style={styles.feedbackTextError}>
                    {paymentValidation.errorMessage ?? 'Please enter a valid numeric amount.'}
                  </Text>
                </View>
              )}

              {paymentValidation.status === 'insufficient' && (
                <View style={styles.feedbackBoxWarning}>
                  <View style={styles.feedbackRow}>
                    <Text style={styles.warningBadgeIcon}>⚠️</Text>
                    <View style={styles.warningTextWrap}>
                      <Text style={styles.feedbackTitleWarning}>
                        Insufficient Payment
                      </Text>
                      <Text style={styles.feedbackTextWarning}>
                        Customer payment is lacking by{' '}
                        <Text style={styles.feedbackHighlightWarning}>
                          {formatPesoCurrency(paymentValidation.amountNeeded)}
                        </Text>
                        . Please ask for additional cash.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Change (Sukli) Display Card */}
              {paymentValidation.isValid && (
                <View
                  style={[
                    styles.changeCard,
                    paymentValidation.status === 'exact'
                      ? styles.changeCardExact
                      : styles.changeCardOverpaid,
                  ]}>
                  <View style={styles.changeCardTop}>
                    <Text style={styles.changeCardLabel}>
                      {paymentValidation.status === 'exact'
                        ? 'EXACT PAYMENT (SAKTO)'
                        : 'CHANGE DUE TO CUSTOMER (SUKLI)'}
                    </Text>
                    {paymentValidation.status === 'exact' ? (
                      <View style={styles.exactPill}>
                        <Text style={styles.exactPillText}>No change needed</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.changeAmountText,
                      paymentValidation.status === 'exact'
                        ? styles.changeAmountExact
                        : styles.changeAmountOverpaid,
                    ]}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={1}>
                    {formatPesoCurrency(paymentValidation.change)}
                  </Text>

                  {paymentValidation.status === 'overpaid' && (
                    <Text style={styles.changeHintText}>
                      Hand {formatPesoCurrency(paymentValidation.change)} back to the customer before completing.
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Architecture Scope Notice */}
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                💡 <Text style={styles.noticeBold}>Batch 7B-2 UI Verification Mode:</Text>{' '}
                Confirming sale will verify payment and change calculations without submitting to the database or modifying inventory stock.
              </Text>
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions Bar */}
          <View style={styles.bottomBar}>
            <TindaMateButton
              title={
                paymentValidation.isValid
                  ? `Confirm Sale · ${formatPesoCurrency(cartSummary.totalAmount)}`
                  : 'Enter Sufficient Payment'
              }
              variant="primary"
              disabled={!paymentValidation.isValid}
              onPress={handleConfirmPress}
              accessibilityLabel="Confirm POS sale"
              style={styles.confirmButton}
            />

            <TindaMateButton
              title="Back to Cart"
              variant="ghost"
              onPress={onClose}
              accessibilityLabel="Cancel checkout and return to cart"
              style={styles.cancelButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textBrand,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  closeButtonPressed: {
    backgroundColor: Colors.border,
  },
  closeButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  totalHeroCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  totalHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  totalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  totalBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  totalCountText: {
    fontSize: Typography.sizes.xs,
    color: '#D1FAE5',
  },
  totalHeroAmount: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    marginTop: Spacing.xs,
  },
  cardSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionItemCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  itemsListContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.xs,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  orderItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  orderItemInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  orderItemName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  orderItemUnitDetails: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  orderItemSubtotal: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  inputHelpText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  inputContainerWarning: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  inputContainerValid: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  pesoSymbol: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  numericInput: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  inputClearButton: {
    padding: Spacing.xs,
  },
  inputClearButtonText: {
    fontSize: Typography.sizes.body,
    color: Colors.textMuted,
    fontWeight: Typography.weights.bold,
  },
  quickOptionsWrap: {
    marginTop: Spacing.sm,
  },
  quickOptionsLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  quickChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipExact: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  quickChipSelected: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primary,
  },
  quickChipPressed: {
    opacity: 0.8,
  },
  quickChipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  quickChipTextExact: {
    color: Colors.primaryDark,
  },
  quickChipTextSelected: {
    color: Colors.textInverse,
  },
  feedbackBoxMuted: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.sm,
  },
  feedbackTextMuted: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  feedbackBoxError: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  feedbackTextError: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  feedbackBoxWarning: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  warningBadgeIcon: {
    fontSize: Typography.sizes.body,
  },
  warningTextWrap: {
    flex: 1,
  },
  feedbackTitleWarning: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.warningText,
  },
  feedbackTextWarning: {
    fontSize: Typography.sizes.xs,
    color: Colors.warningText,
    marginTop: 2,
  },
  feedbackHighlightWarning: {
    fontWeight: Typography.weights.bold,
  },
  changeCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  changeCardExact: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  changeCardOverpaid: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.success,
  },
  changeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeCardLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  exactPill: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  exactPillText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.successText,
  },
  changeAmountText: {
    fontSize: Typography.sizes.displaySm,
    fontWeight: Typography.weights.extraBold,
    marginTop: Spacing.xs,
  },
  changeAmountExact: {
    color: Colors.textSecondary,
  },
  changeAmountOverpaid: {
    color: Colors.success,
  },
  changeHintText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  noticeCard: {
    backgroundColor: Colors.primarySoft,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  noticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textBrand,
    lineHeight: 18,
  },
  noticeBold: {
    fontWeight: Typography.weights.bold,
  },
  bottomBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
    ...Shadows.md,
  },
  confirmButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

