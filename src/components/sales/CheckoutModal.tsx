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

import {
  CartVectorIcon,
  NavCustomersIcon,
  NavUtangIcon,
  SearchVectorIcon,
  WarningTriangleIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { CheckIcon, UserIcon } from '@/components/ui/AuthIcons';
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

const DEFAULT_CUSTOMER_DISPLAY_LIMIT = 5;

/**
 * CheckoutModal (Batch S-2)
 *
 * Mobile POS checkout interface:
 * 1. Compact deep-green header with close action
 * 2. Prominent Transaction Total card (tabular-nums)
 * 3. Clear Cash vs Utang payment method selector
 * 4. Cash tendered input + quick tender chips + sukli card OR Utang customer selector
 * 5. Collapsible Order Summary preserving full line-item breakdown
 * 6. Sticky primary confirmation CTA + Back to Cart action
 *
 * Preserves 100% of existing `validatePaymentAmount`, `getQuickPaymentOptions`,
 * `fetchStoreCustomers`, and `onConfirmSale` transaction logic.
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

  // Collapsible order summary state
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);

  // Active customer state for Utang
  const [customers, setCustomers] = useState<CustomerWithCredit[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithCredit | null>(null);
  const [customerLoadError, setCustomerLoadError] = useState<string | null>(
    null
  );
  const [showAllCustomers, setShowAllCustomers] = useState(false);

  // Reset payment input and utang state whenever modal visibility changes
  useEffect(() => {
    if (visible) {
      setAmountTenderedInput('');
      setPaymentMethod('cash');
      setIsOrderSummaryExpanded(false);
      setCustomerSearchQuery('');
      setSelectedCustomer(null);
      setCustomerLoadError(null);
      setShowAllCustomers(false);
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
      setCustomerLoadError(
        'Could not load active customers. Please check your connection.'
      );
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (visible && paymentMethod === 'credit' && customers.length === 0) {
      loadActiveCustomers();
    }
  }, [visible, paymentMethod, customers.length]);

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

  const visibleCustomers = showAllCustomers
    ? filteredCustomers
    : filteredCustomers.slice(0, DEFAULT_CUSTOMER_DISPLAY_LIMIT);

  // Derived payment validation and change calculation (for cash)
  const paymentValidation = validatePaymentAmount(
    amountTenderedInput,
    cartSummary.totalAmount
  );

  // Quick payment bill chips
  const quickPaymentOptions = getQuickPaymentOptions(cartSummary.totalAmount);

  const handleQuickPaymentPress = (amount: number) => {
    onClearError?.();
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
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Deep Green POS Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBadge}>
                <CartVectorIcon color={Colors.textInverse} size={18} />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle} accessibilityRole="header">
                  POS Checkout
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {cartSummary.totalItems}{' '}
                  {cartSummary.totalItems === 1 ? 'item' : 'items'} • Review &
                  confirm payment
                </Text>
              </View>
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
            contentContainerStyle={[
              styles.scrollContent,
              isNarrow && styles.scrollContentNarrow,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* 1. Prominent Total Amount Due Card */}
            <View style={styles.totalHeroCard}>
              <View style={styles.totalHeroTop}>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>TOTAL AMOUNT DUE</Text>
                </View>
                <Text style={styles.totalCountText}>
                  {cartSummary.distinctCount}{' '}
                  {cartSummary.distinctCount === 1 ? 'product' : 'products'} ·{' '}
                  {cartSummary.totalItems}{' '}
                  {cartSummary.totalItems === 1 ? 'unit' : 'units'}
                </Text>
              </View>
              <Text
                style={[
                  styles.totalHeroAmount,
                  isNarrow && styles.totalHeroAmountNarrow,
                ]}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}>
                {formatPesoCurrency(cartSummary.totalAmount)}
              </Text>
            </View>

            {/* 2. Payment Method Selector */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Payment Method</Text>
              <View style={styles.paymentMethodToggleRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.paymentMethodTab,
                    paymentMethod === 'cash' && styles.paymentMethodTabCashActive,
                    pressed && styles.paymentMethodTabPressed,
                  ]}
                  onPress={() => {
                    onClearError?.();
                    setPaymentMethod('cash');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: paymentMethod === 'cash' }}
                  accessibilityLabel="Pay with Cash">
                  <View
                    style={[
                      styles.methodIconWrap,
                      paymentMethod === 'cash' && styles.methodIconWrapActive,
                    ]}>
                    <Text
                      style={[
                        styles.methodPesoGlyph,
                        paymentMethod === 'cash' && styles.methodPesoGlyphActive,
                      ]}>
                      ₱
                    </Text>
                  </View>
                  <View style={styles.methodTextWrap}>
                    <Text
                      style={[
                        styles.paymentMethodTabText,
                        paymentMethod === 'cash' &&
                          styles.paymentMethodTabTextCashActive,
                      ]}
                      numberOfLines={1}>
                      Cash
                    </Text>
                    <Text style={styles.paymentMethodSubtext} numberOfLines={1}>
                      Bayad
                    </Text>
                  </View>
                  {paymentMethod === 'cash' ? (
                    <View style={styles.methodCheckCircle}>
                      <CheckIcon size={11} color={Colors.textInverse} />
                    </View>
                  ) : null}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.paymentMethodTab,
                    paymentMethod === 'credit' &&
                      styles.paymentMethodTabUtangActive,
                    pressed && styles.paymentMethodTabPressed,
                  ]}
                  onPress={() => {
                    onClearError?.();
                    setPaymentMethod('credit');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: paymentMethod === 'credit' }}
                  accessibilityLabel="Record as Utang">
                  <View
                    style={[
                      styles.methodIconWrap,
                      paymentMethod === 'credit' &&
                        styles.methodIconWrapUtangActive,
                    ]}>
                    <NavUtangIcon
                      size={16}
                      color={
                        paymentMethod === 'credit'
                          ? Colors.textInverse
                          : Colors.textSecondary
                      }
                    />
                  </View>
                  <View style={styles.methodTextWrap}>
                    <Text
                      style={[
                        styles.paymentMethodTabText,
                        paymentMethod === 'credit' &&
                          styles.paymentMethodTabTextUtangActive,
                      ]}
                      numberOfLines={1}>
                      Utang
                    </Text>
                    <Text style={styles.paymentMethodSubtext} numberOfLines={1}>
                      Store Credit
                    </Text>
                  </View>
                  {paymentMethod === 'credit' ? (
                    <View style={styles.methodCheckCircleUtang}>
                      <CheckIcon size={11} color={Colors.textInverse} />
                    </View>
                  ) : null}
                </Pressable>
              </View>
            </View>

            {/* 3A. Cash Payment Section */}
            {paymentMethod === 'cash' && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>
                  Amount Tendered (Bayad)
                </Text>
                <Text style={styles.inputHelpText}>
                  Enter the cash handed by the customer or tap a quick amount.
                </Text>

                {/* Amount Input Box */}
                <View
                  style={[
                    styles.inputContainer,
                    paymentValidation.status === 'insufficient' &&
                      styles.inputContainerWarning,
                    paymentValidation.status === 'invalid' &&
                      styles.inputContainerError,
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
                      accessibilityLabel="Clear payment amount"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.inputClearButtonText}>✕</Text>
                    </Pressable>
                  )}
                </View>

                {/* Quick Payment Options */}
                {quickPaymentOptions.length > 0 && (
                  <View style={styles.quickOptionsWrap}>
                    <Text style={styles.quickOptionsLabel}>Quick Tender</Text>
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
                      {paymentValidation.errorMessage ??
                        'Please enter a valid numeric amount.'}
                    </Text>
                  </View>
                )}

                {paymentValidation.status === 'insufficient' && (
                  <View style={styles.feedbackBoxWarning}>
                    <View style={styles.feedbackRow}>
                      <View style={styles.feedbackIconWrap}>
                        <WarningTriangleIcon
                          size={18}
                          bgColor={Colors.warningText}
                          fgColor={Colors.textInverse}
                        />
                      </View>
                      <View style={styles.warningTextWrap}>
                        <Text style={styles.feedbackTitleWarning}>
                          Insufficient Payment
                        </Text>
                        <Text style={styles.feedbackTextWarning}>
                          Short by{' '}
                          <Text style={styles.feedbackHighlightWarning}>
                            {formatPesoCurrency(paymentValidation.amountNeeded)}
                          </Text>
                          . Please collect the remaining amount.
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
                          : 'CHANGE DUE (SUKLI)'}
                      </Text>
                      {paymentValidation.status === 'exact' ? (
                        <View style={styles.exactPill}>
                          <Text style={styles.exactPillText}>
                            No change needed
                          </Text>
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
                        Return {formatPesoCurrency(paymentValidation.change)} to
                        the customer before confirming.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 3B. Utang (Credit) Customer Selector Section */}
            {paymentMethod === 'credit' && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionHeading}>
                  Select Customer for Utang
                </Text>
                <Text style={styles.inputHelpText}>
                  This sale will be charged to the selected customer&apos;s
                  credit account.
                </Text>

                {selectedCustomer ? (
                  /* Selected Customer Card */
                  <View style={styles.selectedCustomerCard}>
                    <View style={styles.selectedCustomerHeader}>
                      <View style={styles.selectedCustomerAvatar}>
                        <UserIcon size={18} color={Colors.primaryDark} />
                      </View>
                      <View style={styles.selectedCustomerInfo}>
                        <Text
                          style={styles.selectedCustomerName}
                          numberOfLines={1}>
                          {selectedCustomer.name}
                        </Text>
                        {selectedCustomer.phone ? (
                          <Text style={styles.selectedCustomerPhone}>
                            {selectedCustomer.phone}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.changeCustomerButton,
                          pressed && styles.quickChipPressed,
                        ]}
                        onPress={() => {
                          onClearError?.();
                          setSelectedCustomer(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Change selected customer">
                        <Text style={styles.changeCustomerButtonText}>
                          Change
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.customerBalanceDivider} />

                    <View style={styles.balanceComparisonRow}>
                      <View style={styles.balanceComparisonCol}>
                        <Text style={styles.balanceComparisonLabel}>
                          Current Utang
                        </Text>
                        <Text style={styles.balanceComparisonValue}>
                          {formatPesoCurrency(
                            selectedCustomer.credit_summary?.current_balance ??
                              0
                          )}
                        </Text>
                      </View>
                      <Text style={styles.balanceComparisonArrow}>→</Text>
                      <View style={styles.balanceComparisonCol}>
                        <Text style={styles.balanceComparisonLabel}>
                          New Total Utang
                        </Text>
                        <Text
                          style={[
                            styles.balanceComparisonValue,
                            styles.balanceComparisonNew,
                          ]}>
                          {formatPesoCurrency(
                            (selectedCustomer.credit_summary
                              ?.current_balance ?? 0) + cartSummary.totalAmount
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Search and Customer List */
                  <View style={styles.customerSelectorContainer}>
                    <View style={styles.customerRequiredBanner}>
                      <Text style={styles.customerRequiredText}>
                        Required: Choose a customer below to enable Record
                        Utang.
                      </Text>
                    </View>

                    <View style={styles.customerSearchContainer}>
                      <SearchVectorIcon size={17} color={Colors.textMuted} />
                      <TextInput
                        style={styles.customerSearchInput}
                        value={customerSearchQuery}
                        onChangeText={setCustomerSearchQuery}
                        placeholder="Search active customer by name or phone..."
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
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
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
                        <View style={styles.customerEmptyIconWrap}>
                          <NavCustomersIcon
                            size={24}
                            color={Colors.textMuted}
                          />
                        </View>
                        <Text style={styles.customerEmptyTitle}>
                          No Active Customers
                        </Text>
                        <Text style={styles.customerEmptyText}>
                          Add active customers in the Customers module first
                          before recording utang sales.
                        </Text>
                      </View>
                    ) : filteredCustomers.length === 0 ? (
                      <View style={styles.customerEmptyWrap}>
                        <Text style={styles.customerEmptyTitle}>
                          No matching customer
                        </Text>
                        <Text style={styles.customerEmptyText}>
                          No customer found matching &quot;{customerSearchQuery}
                          &quot;.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.customerList}>
                        {visibleCustomers.map((c, idx) => {
                          const currentUtang =
                            c.credit_summary?.current_balance ?? 0;
                          const isLast = idx === visibleCustomers.length - 1;
                          return (
                            <Pressable
                              key={c.id}
                              style={({ pressed }) => [
                                styles.customerItemRow,
                                isLast && styles.customerItemRowLast,
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
                                  Current Utang
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
                        {filteredCustomers.length >
                          DEFAULT_CUSTOMER_DISPLAY_LIMIT && (
                          <Pressable
                            style={styles.customerMoreBtn}
                            onPress={() =>
                              setShowAllCustomers((prev) => !prev)
                            }
                            accessibilityRole="button"
                            accessibilityLabel={
                              showAllCustomers
                                ? 'Show fewer customers'
                                : `Show all ${filteredCustomers.length} customers`
                            }>
                            <Text style={styles.customerMoreCountText}>
                              {showAllCustomers
                                ? 'Show fewer'
                                : `Showing ${DEFAULT_CUSTOMER_DISPLAY_LIMIT} of ${filteredCustomers.length} • Show all`}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* 4. Collapsible Order Summary */}
            <View style={styles.cardSection}>
              <Pressable
                style={styles.summaryToggleHeader}
                onPress={() => setIsOrderSummaryExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOrderSummaryExpanded }}
                accessibilityLabel={
                  isOrderSummaryExpanded
                    ? 'Collapse order summary'
                    : 'Expand order summary'
                }>
                <View style={styles.summaryToggleLeft}>
                  <Text style={styles.sectionHeading}>Order Summary</Text>
                  <Text style={styles.sectionItemCount}>
                    {cartSummary.totalItems}{' '}
                    {cartSummary.totalItems === 1 ? 'item' : 'items'} (
                    {cartItems.length}{' '}
                    {cartItems.length === 1 ? 'line' : 'lines'})
                  </Text>
                </View>
                <View style={styles.summaryTogglePill}>
                  <Text style={styles.summaryTogglePillText}>
                    {isOrderSummaryExpanded ? 'Hide ▲' : 'View ▼'}
                  </Text>
                </View>
              </Pressable>

              {isOrderSummaryExpanded ? (
                <View style={styles.itemsListContainer}>
                  {cartItems.map((item, index) => (
                    <View
                      key={item.productId}
                      style={[
                        styles.orderItemRow,
                        index < cartItems.length - 1 && styles.orderItemDivider,
                      ]}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName} numberOfLines={2}>
                          {item.productName}
                        </Text>
                        <Text style={styles.orderItemUnitDetails}>
                          {item.quantity} {item.unit} ×{' '}
                          {formatPesoCurrency(item.sellingPrice)}
                        </Text>
                      </View>
                      <Text style={styles.orderItemSubtotal}>
                        {formatPesoCurrency(item.subtotal)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.summaryTotalFooter}>
                    <Text style={styles.summaryTotalFooterLabel}>
                      Transaction Total
                    </Text>
                    <Text style={styles.summaryTotalFooterValue}>
                      {formatPesoCurrency(cartSummary.totalAmount)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Submission Error Banner */}
            {submissionError ? (
              <View style={styles.errorBannerCard}>
                <View style={styles.errorBannerHeader}>
                  <WarningTriangleIcon
                    size={18}
                    bgColor={Colors.error}
                    fgColor={Colors.textInverse}
                  />
                  <Text style={styles.errorBannerTitle}>
                    Could Not Complete Sale
                  </Text>
                </View>
                <Text style={styles.errorBannerText}>{submissionError}</Text>
                <Text style={styles.errorBannerHint}>
                  Your cart is safely preserved. You can retry with the same
                  payment or return to cart to adjust items.
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
              variant={paymentMethod === 'credit' ? 'accent' : 'primary'}
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
    backgroundColor: Colors.primaryDark,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    backgroundColor: Colors.primaryDark,
    ...Shadows.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.primaryBorder,
    marginTop: 1,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  closeButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    paddingBottom: Spacing.four,
  },
  scrollContentNarrow: {
    padding: Spacing.twoHalf,
    gap: Spacing.two,
  },
  totalHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    ...Shadows.sm,
  },
  totalHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  totalBadge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  totalCountText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
  },
  totalHeroAmount: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  totalHeroAmountNarrow: {
    fontSize: 28,
  },
  cardSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  sectionHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  sectionItemCount: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Payment Method Selector
  paymentMethodToggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  paymentMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.twoHalf,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    minHeight: 54,
  },
  paymentMethodTabCashActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  paymentMethodTabUtangActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  paymentMethodTabPressed: {
    opacity: 0.85,
  },
  methodIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  methodIconWrapUtangActive: {
    backgroundColor: Colors.accent,
  },
  methodPesoGlyph: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textSecondary,
  },
  methodPesoGlyphActive: {
    color: Colors.textInverse,
  },
  methodTextWrap: {
    flex: 1,
  },
  paymentMethodTabText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  paymentMethodTabTextCashActive: {
    color: Colors.primaryDark,
  },
  paymentMethodTabTextUtangActive: {
    color: Colors.accentDark,
  },
  paymentMethodSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  methodCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCheckCircleUtang: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Cash Input
  inputHelpText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.two,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    height: 54,
  },
  inputContainerWarning: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  inputContainerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  inputContainerValid: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  pesoSymbol: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textSecondary,
    marginRight: Spacing.two,
  },
  numericInput: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
  },
  inputClearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputClearButtonText: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  quickOptionsWrap: {
    marginTop: Spacing.twoHalf,
  },
  quickOptionsLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.one,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickChip: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  quickChipExact: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  quickChipSelected: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryDark,
  },
  quickChipPressed: {
    opacity: 0.8,
  },
  quickChipText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  quickChipTextExact: {
    color: Colors.primaryDark,
  },
  quickChipTextSelected: {
    color: Colors.textInverse,
  },
  feedbackBoxMuted: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.sm,
  },
  feedbackTextMuted: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  feedbackBoxError: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  feedbackTextError: {
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    fontWeight: Typography.weights.semiBold,
  },
  feedbackBoxWarning: {
    marginTop: Spacing.two,
    padding: Spacing.twoHalf,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  feedbackIconWrap: {
    marginTop: 1,
  },
  warningTextWrap: {
    flex: 1,
  },
  feedbackTitleWarning: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.warningText,
  },
  feedbackTextWarning: {
    fontSize: Typography.sizes.caption,
    color: Colors.warningText,
    marginTop: 2,
  },
  feedbackHighlightWarning: {
    fontWeight: Typography.weights.extraBold,
    fontVariant: ['tabular-nums'],
  },
  changeCard: {
    marginTop: Spacing.twoHalf,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  changeCardExact: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  changeCardOverpaid: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  changeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  changeCardLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  exactPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  exactPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  changeAmountText: {
    fontSize: Typography.sizes.displaySm,
    fontWeight: Typography.weights.extraBold,
    fontVariant: ['tabular-nums'],
    marginTop: Spacing.one,
  },
  changeAmountExact: {
    color: Colors.textSecondary,
  },
  changeAmountOverpaid: {
    color: Colors.primaryDark,
  },
  changeHintText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Utang / Customer Selection Styles
  selectedCustomerCard: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  selectedCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  selectedCustomerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  changeCustomerButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeCustomerButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  customerBalanceDivider: {
    height: 1,
    backgroundColor: Colors.primaryBorder,
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
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  balanceComparisonArrow: {
    fontSize: Typography.sizes.body,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.two,
  },
  balanceComparisonNew: {
    color: Colors.accentDark,
  },
  customerSelectorContainer: {
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  customerRequiredBanner: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.one + 2,
  },
  customerRequiredText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.accentDark,
  },
  customerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.twoHalf,
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
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  customerLoadingText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  customerErrorWrap: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.twoHalf,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: Spacing.one,
  },
  customerErrorText: {
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    textAlign: 'center',
  },
  customerRetryBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  customerRetryText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  customerEmptyWrap: {
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 4,
  },
  customerEmptyIconWrap: {
    marginBottom: 4,
  },
  customerEmptyTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  customerEmptyText: {
    fontSize: Typography.sizes.caption,
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    minHeight: 48,
  },
  customerItemRowLast: {
    borderBottomWidth: 0,
  },
  customerItemRowPressed: {
    backgroundColor: Colors.surfaceSubtle,
  },
  customerItemInfo: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.two,
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
    fontSize: 11,
    color: Colors.textMuted,
  },
  customerItemBalanceAmount: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  customerItemBalanceAmountPositive: {
    color: Colors.accentDark,
  },
  customerMoreBtn: {
    paddingVertical: Spacing.two,
    backgroundColor: Colors.surfaceSubtle,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  customerMoreCountText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.primaryDark,
  },
  // Collapsible Order Summary
  summaryToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  summaryToggleLeft: {
    flex: 1,
  },
  summaryTogglePill: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 5,
  },
  summaryTogglePillText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  itemsListContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.twoHalf,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  orderItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  orderItemInfo: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  orderItemName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  orderItemUnitDetails: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderItemSubtotal: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  summaryTotalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryTotalFooterLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  summaryTotalFooterValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  // Submission Error
  errorBannerCard: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.three,
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
  errorBannerTitle: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  errorBannerText: {
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
  },
  errorBannerHint: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Sticky Bottom Actions
  bottomBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.one,
    ...Shadows.md,
  },
  confirmButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});
