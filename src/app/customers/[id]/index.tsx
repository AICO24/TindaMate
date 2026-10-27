import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { CreditTransactionCard } from '@/components/customers/CreditTransactionCard';
import { PaymentSuccessModal } from '@/components/customers/PaymentSuccessModal';
import { RecordPaymentModal } from '@/components/customers/RecordPaymentModal';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  fetchCustomerCreditTransactions,
  fetchStoreCustomerById,
  recordCustomerPayment,
  toggleCustomerActiveStatus,
} from '@/lib/customers';
import { formatPesoCurrency } from '@/lib/products';
import { formatSaleDate } from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import {
  CompletedPaymentResult,
  CustomerCreditTransaction,
  CustomerWithCredit,
} from '@/types/customer';

function getCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * TindaMate Customer Details & Utang Ledger Screen (`/customers/[id]`)
 *
 * Implements Batch 8D: Customer Utang / Ledger Details:
 * 1. Customer profile: Name, phone (tap-to-call), notes, active status
 * 2. Prominent outstanding balance derived from credit ledger source of truth
 * 3. Credit / Utang transaction history in reverse-chronological order
 * 4. Tap-through to complete historical Sale Details receipt for linked POS utang sales
 * 5. Honest loading, empty, and error states
 * 6. Completely read-only (No payment or settlement actions in Batch 8D)
 */
export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 360;

  const [customer, setCustomer] = useState<CustomerWithCredit | null>(null);
  const [transactions, setTransactions] = useState<CustomerCreditTransaction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Modal & Submission State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSubmissionError, setPaymentSubmissionError] = useState<
    string | null
  >(null);
  const [paymentResult, setPaymentResult] =
    useState<CompletedPaymentResult | null>(null);

  const loadCustomer = useCallback(
    async (showRefreshIndicator = false) => {
      if (!customerId) {
        setErrorMessage('Invalid customer ID.');
        setIsLoading(false);
        return;
      }

      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        }
        setErrorMessage(null);

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError || !sessionData?.session) {
          router.replace('/');
          return;
        }

        // Fetch customer profile & balance summary alongside full transaction ledger
        const [details, txList] = await Promise.all([
          fetchStoreCustomerById(customerId),
          fetchCustomerCreditTransactions(customerId),
        ]);

        if (!details) {
          setErrorMessage(
            'This customer could not be found or does not belong to your store.'
          );
        } else {
          setCustomer(details);
          setTransactions(txList);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load customer details. Please try again.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [customerId]
  );

  useFocusEffect(
    useCallback(() => {
      loadCustomer(false);
    }, [loadCustomer])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/customers' as any);
    }
  };

  const handleEdit = () => {
    if (!customer) return;
    router.push(`/customers/${customer.id}/edit` as any);
  };

  const handleCallPhone = () => {
    if (!customer?.phone) return;
    Linking.openURL(`tel:${customer.phone}`);
  };

  const handlePressSale = (saleId: string) => {
    router.push(`/sales/${saleId}` as any);
  };

  const handleOpenPaymentModal = () => {
    setPaymentSubmissionError(null);
    setIsPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    if (isSubmittingPayment) return;
    setPaymentSubmissionError(null);
    setIsPaymentModalVisible(false);
  };

  const handleSubmitPayment = async (amount: number, notes?: string) => {
    if (!customer || isSubmittingPayment) return;

    try {
      setIsSubmittingPayment(true);
      setPaymentSubmissionError(null);

      const result = await recordCustomerPayment({
        customerId: customer.id,
        amount,
        notes,
      });

      // Close payment input modal and open confirmation receipt
      setIsPaymentModalVisible(false);
      setPaymentResult(result);

      // Re-fetch authoritative customer balance and credit ledger transactions
      await loadCustomer(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not record customer payment. Please try again.';
      setPaymentSubmissionError(msg);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDismissSuccessModal = () => {
    setPaymentResult(null);
  };

  const handleToggleActive = () => {
    if (!customer || isUpdatingStatus) return;

    const nextActive = !customer.is_active;
    const actionWord = nextActive ? 'Reactivate' : 'Deactivate';

    const confirmAction = async () => {
      try {
        setIsUpdatingStatus(true);
        const updated = await toggleCustomerActiveStatus(
          customer.id,
          nextActive
        );
        setCustomer(updated);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : `Failed to ${actionWord.toLowerCase()} customer. Please try again.`;
        Alert.alert('Status Update Failed', msg);
      } finally {
        setIsUpdatingStatus(false);
      }
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          `Are you sure you want to ${actionWord.toLowerCase()} ${customer.name}?`
        )
      ) {
        confirmAction();
      }
    } else {
      Alert.alert(
        `${actionWord} Customer?`,
        `Are you sure you want to ${actionWord.toLowerCase()} "${customer.name}"? ${
          nextActive
            ? 'They will be active for store credit again.'
            : 'Their credit records will remain safe, but they will be marked inactive.'
        }`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: actionWord,
            style: nextActive ? 'default' : 'destructive',
            onPress: confirmAction,
          },
        ]
      );
    }
  };

  const balance = customer?.credit_summary?.current_balance ?? 0;
  const totalCharged = customer?.credit_summary?.total_charged ?? 0;
  const totalPaid = customer?.credit_summary?.total_paid ?? 0;
  const lastTransAt = customer?.credit_summary?.last_transaction_at;

  const formattedBalance = formatPesoCurrency(balance);
  const formattedCharged = formatPesoCurrency(totalCharged);
  const formattedPaid = formatPesoCurrency(totalPaid);
  const formattedDate = lastTransAt
    ? formatSaleDate(lastTransAt)
    : 'No transactions yet';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Screen Header */}
        <ProductScreenHeader
          title={customer ? customer.name : 'Customer Details'}
          subtitle={
            customer?.is_active ? 'Active Customer' : 'Inactive Customer'
          }
          showBack={true}
          onBack={handleBack}
          rightActionLabel={customer ? 'Edit' : undefined}
          rightActionAccessibilityLabel="Edit customer details"
          onRightActionPress={customer ? handleEdit : undefined}
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCustomer(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {/* Error Banner when customer was already loaded */}
            {errorMessage && customer ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadCustomer(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 1. Loading State */}
            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.loadingText}>
                  Loading Customer Profile & Ledger...
                </Text>
              </View>
            ) : !customer ? (
              /* 2. Error / Not Found State */
              <View style={styles.errorCard}>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>
                <Text style={styles.errorTitle}>Customer Not Found</Text>
                <Text style={styles.errorSubtitle}>
                  {errorMessage ??
                    'This customer could not be found or does not belong to your store.'}
                </Text>
                <View style={styles.errorActions}>
                  {errorMessage ? (
                    <TindaMateButton
                      title="Retry"
                      variant="primary"
                      onPress={() => loadCustomer(true)}
                    />
                  ) : null}
                  <TindaMateButton
                    title="Back to Customers"
                    variant="secondary"
                    onPress={handleBack}
                  />
                </View>
              </View>
            ) : (
              /* 3. Normal State: Customer Profile + Balance + History */
              <>
                {/* 1. Customer Profile Card */}
                <View style={styles.profileCard}>
                  <View style={styles.profileTopRow}>
                    <View
                      style={[
                        styles.avatarCircle,
                        balance > 0 && styles.avatarCircleUtang,
                        !customer.is_active && styles.avatarCircleInactive,
                      ]}>
                      <Text
                        style={[
                          styles.avatarText,
                          balance > 0 && styles.avatarTextUtang,
                          !customer.is_active && styles.avatarTextInactive,
                        ]}>
                        {getCustomerInitials(customer.name)}
                      </Text>
                    </View>

                    <View style={styles.profileInfoCol}>
                      <Text
                        style={styles.customerName}
                        maxFontSizeMultiplier={1.3}>
                        {customer.name}
                      </Text>

                      <View style={styles.statusPillRow}>
                        <View
                          style={[
                            styles.statusPill,
                            customer.is_active
                              ? styles.statusPillActive
                              : styles.statusPillInactive,
                          ]}>
                          <View
                            style={[
                              styles.statusDot,
                              customer.is_active
                                ? styles.statusDotActive
                                : styles.statusDotInactive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              customer.is_active
                                ? styles.statusPillTextActive
                                : styles.statusPillTextInactive,
                            ]}>
                            {customer.is_active
                              ? 'Active Customer'
                              : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Phone Row */}
                  {customer.phone ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${customer.name} at ${customer.phone}`}
                      onPress={handleCallPhone}
                      style={({ pressed }) => [
                        styles.contactRow,
                        pressed && styles.contactRowPressed,
                      ]}>
                      <Text style={styles.contactIcon}>📞</Text>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Mobile Phone</Text>
                        <Text style={styles.contactValue}>{customer.phone}</Text>
                      </View>
                      <Text style={styles.callBadge}>Tap to Call</Text>
                    </Pressable>
                  ) : null}

                  {/* Notes Row */}
                  {customer.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Notes / Landmark</Text>
                      <Text style={styles.notesText}>{customer.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* 2. Credit Summary Card */}
                <View style={styles.creditCard}>
                  <View style={styles.creditHeaderRow}>
                    <View style={styles.creditHeaderTitleRow}>
                      <Text style={styles.creditIcon}>💳</Text>
                      <Text style={styles.creditSectionTitle}>
                        Customer Credit (Utang)
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.balanceBadge,
                        balance > 0
                          ? styles.balanceBadgeActive
                          : styles.balanceBadgeClear,
                      ]}>
                      <Text
                        style={[
                          styles.balanceBadgeText,
                          balance > 0
                            ? styles.balanceBadgeTextActive
                            : styles.balanceBadgeTextClear,
                        ]}>
                        {balance > 0 ? 'Unpaid Balance' : 'Fully Paid'}
                      </Text>
                    </View>
                  </View>

                  {/* Big Balance Callout */}
                  <View
                    style={[
                      styles.balanceCallout,
                      balance > 0
                        ? styles.balanceCalloutActive
                        : styles.balanceCalloutClear,
                    ]}>
                    <Text style={styles.balanceCalloutLabel}>
                      Outstanding Balance
                    </Text>
                    <Text
                      style={[
                        styles.balanceCalloutAmount,
                        balance > 0
                          ? styles.balanceCalloutAmountActive
                          : styles.balanceCalloutAmountClear,
                      ]}
                      numberOfLines={1}>
                      {formattedBalance}
                    </Text>
                  </View>

                  {/* Payment Action: Record Payment when balance > 0, Fully Paid badge when 0 */}
                  {balance > 0 ? (
                    <View style={styles.recordPaymentActionBox}>
                      <TindaMateButton
                        title="Record Payment"
                        variant="primary"
                        showArrow
                        onPress={handleOpenPaymentModal}
                        accessibilityLabel={`Record payment for ${customer.name}`}
                      />
                    </View>
                  ) : (
                    <View style={styles.fullyPaidBadgeBox}>
                      <Text style={styles.fullyPaidBadgeText}>
                        ✓ Fully Paid · No Outstanding Balance
                      </Text>
                    </View>
                  )}

                  {/* Stat Breakdown Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Total Charged</Text>
                      <Text style={styles.statValue}>{formattedCharged}</Text>
                      <Text style={styles.statHelper}>Purchases on credit</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Total Paid</Text>
                      <Text style={styles.statValue}>{formattedPaid}</Text>
                      <Text style={styles.statHelper}>Settled payments</Text>
                    </View>
                  </View>

                  <View style={styles.lastActivityRow}>
                    <Text style={styles.lastActivityLabel}>
                      Last Credit Activity:
                    </Text>
                    <Text style={styles.lastActivityValue}>{formattedDate}</Text>
                  </View>

                  {/* Informational Hint */}
                  <View style={styles.infoBanner}>
                    <Text style={styles.infoBannerText}>
                      💡 Purchases recorded as Utang from the POS are automatically logged into this customer's credit ledger.
                    </Text>
                  </View>
                </View>

                {/* 3. Utang / Credit Transaction History Section */}
                <View style={styles.historySection}>
                  <View style={styles.historyHeaderRow}>
                    <View style={styles.historyHeaderLeft}>
                      <Text style={styles.historySectionTitle}>
                        Credit & Utang History
                      </Text>
                      <View style={styles.historyCountBadge}>
                        <Text style={styles.historyCountBadgeText}>
                          {transactions.length}
                        </Text>
                      </View>
                    </View>
                    {transactions.length > 0 && (
                      <Text style={styles.historySubtitle}>Newest first</Text>
                    )}
                  </View>

                  {transactions.length === 0 ? (
                    /* Clean Empty State for Customer with no credit transactions */
                    <View style={styles.emptyHistoryCard}>
                      <View style={styles.emptyIconCircle}>
                        <Text style={styles.emptyIconEmoji}>📋</Text>
                      </View>
                      <Text style={styles.emptyHistoryTitle}>
                        No Credit Transactions Yet
                      </Text>
                      <Text style={styles.emptyHistorySubtitle}>
                        This customer currently has no recorded utang or credit transactions in your store.
                      </Text>
                    </View>
                  ) : (
                    /* Populated Transaction List */
                    <View style={styles.transactionsList}>
                      {transactions.map((tx) => (
                        <CreditTransactionCard
                          key={tx.id}
                          transaction={tx}
                          onPressSale={handlePressSale}
                        />
                      ))}
                    </View>
                  )}
                </View>

                {/* 4. Customer Status Action */}
                <View style={styles.actionCard}>
                  <TindaMateButton
                    title={
                      isUpdatingStatus
                        ? 'Updating Status...'
                        : customer.is_active
                        ? 'Deactivate Customer'
                        : 'Reactivate Customer'
                    }
                    variant={customer.is_active ? 'secondary' : 'primary'}
                    onPress={handleToggleActive}
                    disabled={isUpdatingStatus}
                    accessibilityLabel={
                      customer.is_active
                        ? 'Deactivate this customer'
                        : 'Reactivate this customer'
                    }
                  />
                  <Text style={styles.deactivateHelperText}>
                    {customer.is_active
                      ? 'Deactivating hides this customer from active lists while preserving all credit ledger history.'
                      : 'Reactivating restores this customer to active lists for POS credit transactions.'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Record Payment Input Modal */}
      {customer && (
        <RecordPaymentModal
          visible={isPaymentModalVisible}
          customerName={customer.name}
          currentBalance={balance}
          isSubmitting={isSubmittingPayment}
          submissionError={paymentSubmissionError}
          onClearError={() => setPaymentSubmissionError(null)}
          onClose={handleClosePaymentModal}
          onSubmitPayment={handleSubmitPayment}
        />
      )}

      {/* Payment Success Confirmation Receipt */}
      <PaymentSuccessModal
        visible={paymentResult !== null}
        customerName={customer?.name ?? 'Customer'}
        paymentResult={paymentResult}
        onDismiss={handleDismissSuccessModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  errorCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    ...Shadows.xs,
  },
  errorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
  },
  errorTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
  },
  errorActions: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.threeHalf,
    ...Shadows.xs,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.threeHalf,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 2,
    borderColor: Colors.pastel.green.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleUtang: {
    backgroundColor: Colors.pastel.orange.bg,
    borderColor: Colors.pastel.orange.border,
  },
  avatarCircleInactive: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.green.accent,
  },
  avatarTextUtang: {
    color: Colors.pastel.orange.accent,
  },
  avatarTextInactive: {
    color: Colors.textMuted,
  },
  profileInfoCol: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  statusPillRow: {
    flexDirection: 'row',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  statusPillInactive: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: Colors.pastel.green.accent,
  },
  statusDotInactive: {
    backgroundColor: Colors.textMuted,
  },
  statusPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  statusPillTextActive: {
    color: Colors.pastel.green.accent,
  },
  statusPillTextInactive: {
    color: Colors.textMuted,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  contactRowPressed: {
    opacity: 0.85,
  },
  contactIcon: {
    fontSize: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  contactValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  callBadge: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  notesBox: {
    backgroundColor: Colors.backgroundWarm,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: 3,
  },
  notesLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: Typography.sizes.body,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
  creditCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.threeHalf,
    ...Shadows.xs,
  },
  creditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditIcon: {
    fontSize: 18,
  },
  creditSectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  balanceBadge: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  balanceBadgeActive: {
    backgroundColor: Colors.pastel.orange.bg,
    borderColor: Colors.pastel.orange.border,
  },
  balanceBadgeClear: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  balanceBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  balanceBadgeTextActive: {
    color: Colors.pastel.orange.accent,
  },
  balanceBadgeTextClear: {
    color: Colors.pastel.green.accent,
  },
  balanceCallout: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
  },
  balanceCalloutActive: {
    backgroundColor: Colors.pastel.orange.bg,
    borderColor: Colors.pastel.orange.border,
  },
  balanceCalloutClear: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  balanceCalloutLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceCalloutAmount: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extraBold,
  },
  balanceCalloutAmountActive: {
    color: Colors.pastel.orange.accent,
  },
  balanceCalloutAmountClear: {
    color: Colors.pastel.green.accent,
  },
  recordPaymentActionBox: {
    width: '100%',
    marginTop: Spacing.one,
  },
  fullyPaidBadgeBox: {
    width: '100%',
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  fullyPaidBadgeText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  statValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  statHelper: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  lastActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  lastActivityLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  lastActivityValue: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  infoBanner: {
    backgroundColor: Colors.pastel.blue.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.pastel.blue.border,
  },
  infoBannerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.pastel.blue.accent,
    lineHeight: Typography.lineHeights.normal,
  },
  historySection: {
    gap: Spacing.twoHalf,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  historySectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  historyCountBadge: {
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  historyCountBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
  },
  historySubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  emptyHistoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
    ...Shadows.xs,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyIconEmoji: {
    fontSize: 22,
  },
  emptyHistoryTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyHistorySubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
    maxWidth: 280,
  },
  transactionsList: {
    gap: Spacing.twoHalf,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.two,
  },
  deactivateHelperText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
  },
});
