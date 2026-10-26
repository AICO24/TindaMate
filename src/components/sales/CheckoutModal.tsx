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
import { SafeAreaView } from 'react-native-safe-area-context';

import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { fetchStoreCustomers } from '@/lib/customers';
import { formatPesoCurrency } from '@/lib/products';
import { getQuickPaymentOptions, validatePaymentAmount } from '@/lib/sales';
import { CustomerWithCredit } from '@/types/customer';
import { CartItem, CartSummary, SalePaymentMethod } from '@/types/sale';

export interface CheckoutModalProps {
  /** Whether the checkout modal is currently visible */
  visible: boolean;
  /** Current list of items in the cart */
  cartItems: CartItem[];
  /** Derived metrics for the active cart */
  cartSummary: CartSummary;
  /** Whether the transaction is actively submitting to the database */
  isSubmitting?: boolean;
  /** Any submission error message from the previous attempt */
  submissionError?: string | null;
  /** Callback to clear any checkout submission error */
  onClearError?: () => void;
  /** Callback triggered when user cancels or dismisses checkout */
  onClose: () => void;
  /** Callback triggered when user confirms sale with valid payment */
  onConfirmSale: (
    paymentMethod: SalePaymentMethod,
    amountTendered: number | null,
    change: number,
    customerId?: string | null,
    customerName?: string | null
  ) => void;
}

/**
 * CheckoutModal
 *
 * Implements Batch 7B-3: Checkout UI + Amount Tendered + Atomic RPC Integration
 * - Complete order summary review (items, quantities, unit prices, subtotals, total)
 * - Safe numeric input for customer Amount Tendered (supports Philippine Peso decimals)
 * - Integer centavo arithmetic for safe, deterministic change calculation
 * - Dynamic quick payment options (Exact amount, ₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000)
 * - Real-time payment states: Empty, Invalid, Insufficient (shortfall needed), Exact (₱0.00), Overpaid (Change)
 * - Interactive submission state ("Recording Sale...") with duplicate tap lock
 * - Actionable submission error reporting with inline retry support
 * - Keyboard-adaptive mobile layout preserving full scrollability and touch access
 */
export function CheckoutModal({
  visible,
  cartItems,
  cartSummary,
  isSubmitting = false,
  submissionError = null,
  onClearError,
  onClose,
  onConfirmSale,
}: CheckoutModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 360;

  // Payment method selection ('cash' vs 'credit')
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash');

  // Local payment input state for Cash
  const [amountTenderedInput, setAmountTenderedInput] = useState('');

  // Active customer state for Utang
  const [customers, setCustomers] = useState<CustomerWithCredit[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCredit | null>(null);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(null);

  // Reset payment input and utang state whenever modal visibility changes
  useEffect(() => {
    if (visible) {
      setAmountTenderedInput('');
      setPaymentMethod('cash');
      setCustomerSearchQuery('');
      setSelectedCustomer(null);
      setCustomerLoadError(null);
    }
  }, [visible]);

  // Load active customers when user opens modal or toggles to credit
  const loadActiveCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      setCustomerLoadError(null);
      const list = await fetchStoreCustomers('', 'Active');
      setCustomers(list);
    } catch {
      setCustomerLoadError('Could not load active customers. Please check your connection.');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (visible && paymentMethod === 'credit' && customers.length === 0) {
      loadActiveCustomers();
    }
  }, [visible, paymentMethod]);

  // Derived filtered customers for Utang selector
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchQuery.trim()) {
      return true;
    }
    const q = customerSearchQuery.toLowerCase().trim();
    const nameMatch = c.name.toLowerCase().includes(q);
    const phoneMatch = c.phone ? c.phone.toLowerCase().includes(q) : false;
    return nameMatch || phoneMatch;
  });

  // Derived payment validation and change calculation (for cash)
  const paymentValidation = validatePaymentAmount(
    amountTenderedInput,
    cartSummary.totalAmount
  );

  // Quick payment bill chips
  const quickPaymentOptions = getQuickPaymentOptions(cartSummary.totalAmount);

  const handleQuickPaymentPress = (amount: number) => {
    onClearError?.();
    // If integer, display without trailing .00; if has cents, keep exact
    const formatted =
      amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    setAmountTenderedInput(formatted);
  };

  const handleInputChange = (text: string) => {
    if (submissionError) {
      onClearError?.();
    }
    setAmountTenderedInput(text);
  };

  const handleConfirmPress = () => {
    if (isSubmitting) {
      return;
    }

    if (paymentMethod === 'cash') {
      if (
        !paymentValidation.isValid ||
        paymentValidation.amountTendered === null
      ) {
        return;
      }
      onConfirmSale(
        'cash',
        paymentValidation.amountTendered,
        paymentValidation.change,
        null,
        null
      );
    } else {
      if (!selectedCustomer) {
        return;
      }
      onConfirmSale(
        'credit',
        null,
        0,
        selectedCustomer.id,
        selectedCustomer.name
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={isSubmitting ? undefined : onClose}>
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
                pressed && !isSubmitting && styles.closeButtonPressed,
                isSubmitting && styles.closeButtonDisabled,
              ]}
              disabled={isSubmitting}
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

            {/* Payment Method Selector */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Payment Method</Text>
              <View style={styles.paymentMethodToggleRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.paymentMethodTab,
                    paymentMethod === 'cash' && styles.paymentMethodTabActive,
                    pressed && styles.paymentMethodTabPressed,
                  ]}
                  onPress={() => {
                    onClearError?.();
                    setPaymentMethod('cash');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Pay with Cash">
                  <Text
                    style={[
                      styles.paymentMethodTabText,
                      paymentMethod === 'cash' && styles.paymentMethodTabTextActive,
                    ]}>
                    💵 Cash (Bayad)
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.paymentMethodTab,
                    paymentMethod === 'credit' && styles.paymentMethodTabActive,
                    pressed && styles.paymentMethodTabPressed,
                  ]}
                  onPress={() => {
                    onClearError?.();
                    setPaymentMethod('credit');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Record as Utang">
                  <Text
                    style={[
                      styles.paymentMethodTabText,
                      paymentMethod === 'credit' && styles.paymentMethodTabTextActive,
                    ]}>
                    📝 Utang (Credit)
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Cash Payment Section */}
            {paymentMethod === 'cash' && (
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
                    onChangeText={handleInputChange}
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
            )}

            {/* Utang (Credit) Customer Selector Section */}
            {paymentMethod === 'credit' && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>Select Customer for Utang</Text>
                <Text style={styles.inputHelpText}>
                  This purchase will be charged to the customer&apos;s store credit account.
                </Text>

                {selectedCustomer ? (
                  /* Selected Customer Card */
                  <View style={styles.selectedCustomerCard}>
                    <View style={styles.selectedCustomerHeader}>
                      <View style={styles.selectedCustomerInfo}>
                        <Text style={styles.selectedCustomerName} numberOfLines={1}>
                          {selectedCustomer.name}
                        </Text>
                        {selectedCustomer.phone ? (
                          <Text style={styles.selectedCustomerPhone}>
                            📞 {selectedCustomer.phone}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        style={styles.changeCustomerButton}
                        onPress={() => {
                          onClearError?.();
                          setSelectedCustomer(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Change selected customer">
                        <Text style={styles.changeCustomerButtonText}>Change</Text>
                      </Pressable>
                    </View>

                    <View style={styles.customerBalanceDivider} />

                    <View style={styles.balanceComparisonRow}>
                      <View style={styles.balanceComparisonCol}>
                        <Text style={styles.balanceComparisonLabel}>Current Utang</Text>
                        <Text style={styles.balanceComparisonValue}>
                          {formatPesoCurrency(
                            selectedCustomer.credit_summary?.current_balance ?? 0
                          )}
                        </Text>
                      </View>
                      <Text style={styles.balanceComparisonArrow}>→</Text>
                      <View style={styles.balanceComparisonCol}>
                        <Text style={styles.balanceComparisonLabel}>New Total Utang</Text>
                        <Text
                          style={[
                            styles.balanceComparisonValue,
                            styles.balanceComparisonNew,
                          ]}>
                          {formatPesoCurrency(
                            (selectedCustomer.credit_summary?.current_balance ?? 0) +
                              cartSummary.totalAmount
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Search and Customer List */
                  <View style={styles.customerSelectorContainer}>
                    <View style={styles.customerSearchContainer}>
                      <TextInput
                        style={styles.customerSearchInput}
                        value={customerSearchQuery}
                        onChangeText={setCustomerSearchQuery}
                        placeholder="Search active customer..."
                        placeholderTextColor={Colors.textPlaceholder}
                        returnKeyType="search"
                        accessibilityLabel="Search customer for utang"
                      />
                      {customerSearchQuery.length > 0 && (
                        <Pressable
                          style={styles.inputClearButton}
                          onPress={() => setCustomerSearchQuery('')}
                          accessibilityRole="button"
                          accessibilityLabel="Clear customer search">
                          <Text style={styles.inputClearButtonText}>✕</Text>
                        </Pressable>
                      )}
                    </View>

                    {isLoadingCustomers ? (
                      <View style={styles.customerLoadingWrap}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.customerLoadingText}>
                          Loading active customers...
                        </Text>
                      </View>
                    ) : customerLoadError ? (
                      <View style={styles.customerErrorWrap}>
                        <Text style={styles.customerErrorText}>
                          {customerLoadError}
                        </Text>
                        <Pressable
                          style={styles.customerRetryBtn}
                          onPress={loadActiveCustomers}>
                          <Text style={styles.customerRetryText}>Retry</Text>
                        </Pressable>
                      </View>
                    ) : customers.length === 0 ? (
                      <View style={styles.customerEmptyWrap}>
                        <Text style={styles.customerEmptyIcon}>👥</Text>
                        <Text style={styles.customerEmptyTitle}>
                          No Active Customers
                        </Text>
                        <Text style={styles.customerEmptyText}>
                          Add active customers in the Customers module first before recording utang sales.
                        </Text>
                      </View>
                    ) : filteredCustomers.length === 0 ? (
                      <View style={styles.customerEmptyWrap}>
                        <Text style={styles.customerEmptyTitle}>
                          No matching customer
                        </Text>
                        <Text style={styles.customerEmptyText}>
                          No customer found matching &quot;{customerSearchQuery}&quot;.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.customerList}>
                        {filteredCustomers.slice(0, 5).map((c) => {
                          const currentUtang =
                            c.credit_summary?.current_balance ?? 0;
                          return (
                            <Pressable
                              key={c.id}
                              style={({ pressed }) => [
                                styles.customerItemRow,
                                pressed && styles.customerItemRowPressed,
                              ]}
                              onPress={() => {
                                onClearError?.();
                                setSelectedCustomer(c);
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={`Select ${c.name}`}>
                              <View style={styles.customerItemInfo}>
                                <Text
                                  style={styles.customerItemName}
                                  numberOfLines={1}>
                                  {c.name}
                                </Text>
                                {c.phone ? (
                                  <Text style={styles.customerItemPhone}>
                                    {c.phone}
                                  </Text>
                                ) : null}
                              </View>
                              <View style={styles.customerItemBalanceCol}>
                                <Text style={styles.customerItemBalanceLabel}>
                                  Utang
                                </Text>
                                <Text
                                  style={[
                                    styles.customerItemBalanceAmount,
                                    currentUtang > 0 &&
                                      styles.customerItemBalanceAmountPositive,
                                  ]}>
                                  {formatPesoCurrency(currentUtang)}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                        {filteredCustomers.length > 5 && (
                          <Text style={styles.customerMoreCountText}>
                            Showing 5 of {filteredCustomers.length} customers. Search to narrow down.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Submission Error Banner */}
            {submissionError ? (
              <View style={styles.errorBannerCard}>
                <View style={styles.errorBannerHeader}>
                  <Text style={styles.errorBannerIcon}>⚠️</Text>
                  <Text style={styles.errorBannerTitle}>Could Not Complete Sale</Text>
                </View>
                <Text style={styles.errorBannerText}>{submissionError}</Text>
                <Text style={styles.errorBannerHint}>
                  Your cart is safely preserved. You can retry with the same payment or return to cart to adjust items.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky Bottom Actions Bar */}
          <View style={styles.bottomBar}>
            <TindaMateButton
              title={
                isSubmitting
                  ? paymentMethod === 'credit'
                    ? 'Recording Utang...'
                    : 'Recording Sale...'
                  : paymentMethod === 'credit'
                  ? selectedCustomer
                    ? `Record Utang · ${formatPesoCurrency(cartSummary.totalAmount)}`
                    : 'Select Customer for Utang'
                  : paymentValidation.isValid
                  ? `Confirm Sale · ${formatPesoCurrency(cartSummary.totalAmount)}`
                  : 'Enter Sufficient Payment'
              }
              variant="primary"
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                (paymentMethod === 'cash' && !paymentValidation.isValid) ||
                (paymentMethod === 'credit' && !selectedCustomer)
              }
              onPress={handleConfirmPress}
              accessibilityLabel={
                paymentMethod === 'credit'
                  ? 'Record Utang for customer'
                  : 'Confirm POS sale'
              }
              style={styles.confirmButton}
            />

            <TindaMateButton
              title="Back to Cart"
              variant="ghost"
              disabled={isSubmitting}
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
  closeButtonDisabled: {
    opacity: 0.4,
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
  // Payment Method Tabs
  paymentMethodToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  paymentMethodTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentMethodTabPressed: {
    opacity: 0.8,
  },
  paymentMethodTabText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  paymentMethodTabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },

  // Utang / Customer Selection Styles
  selectedCustomerCard: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  selectedCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCustomerInfo: {
    flex: 1,
    gap: 2,
  },
  selectedCustomerName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  selectedCustomerPhone: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  changeCustomerButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeCustomerButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  customerBalanceDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 2,
  },
  balanceComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceComparisonCol: {
    flex: 1,
    gap: 2,
  },
  balanceComparisonLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  balanceComparisonValue: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  balanceComparisonArrow: {
    fontSize: Typography.sizes.body,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xs,
  },
  balanceComparisonNew: {
    color: Colors.accent,
  },

  // Customer List & Selector
  customerSelectorContainer: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  customerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 44,
  },
  customerSearchInput: {
    flex: 1,
    fontSize: Typography.sizes.bodySm,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  customerLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  customerLoadingText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  customerErrorWrap: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  customerErrorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    textAlign: 'center',
  },
  customerRetryBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  customerRetryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  customerEmptyWrap: {
    backgroundColor: Colors.backgroundAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 4,
  },
  customerEmptyIcon: {
    fontSize: 24,
  },
  customerEmptyTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  customerEmptyText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  customerList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  customerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  customerItemRowPressed: {
    backgroundColor: Colors.backgroundAlt,
  },
  customerItemInfo: {
    flex: 1,
    gap: 2,
  },
  customerItemName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  customerItemPhone: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  customerItemBalanceCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  customerItemBalanceLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  customerItemBalanceAmount: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  customerItemBalanceAmountPositive: {
    color: Colors.accent,
  },
  customerMoreCountText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.backgroundAlt,
  },

  errorBannerCard: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.errorBorder,
    gap: 4,
  },
  errorBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBannerIcon: {
    fontSize: Typography.sizes.body,
  },
  errorBannerTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  errorBannerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
  },
  errorBannerHint: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 4,
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

