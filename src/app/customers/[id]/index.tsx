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
  fetchStoreCustomerById,
  toggleCustomerActiveStatus,
} from '@/lib/customers';
import { formatPesoCurrency } from '@/lib/products';
import { formatSaleDate } from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { CustomerWithCredit } from '@/types/customer';

function getCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * TindaMate Customer Details Screen (`/customers/[id]`)
 *
 * Implements Batch 8B: Customer Details view:
 * - Customer Profile: Name, Phone, Notes, Active Status
 * - Credit Summary: Current Utang Balance, Total Charged, Total Paid, Last Transaction Date
 * - Edit customer navigation
 * - Deactivate / Reactivate customer action
 */
export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 360;

  const [customer, setCustomer] = useState<CustomerWithCredit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        const details = await fetchStoreCustomerById(customerId);
        if (!details) {
          setErrorMessage(
            'This customer could not be found or does not belong to your store.'
          );
        } else {
          setCustomer(details);
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

  const handleToggleActive = () => {
    if (!customer || isUpdatingStatus) return;

    const nextActive = !customer.is_active;
    const actionWord = nextActive ? 'Reactivate' : 'Deactivate';

    const confirmAction = async () => {
      try {
        setIsUpdatingStatus(true);
        const updated = await toggleCustomerActiveStatus(customer.id, nextActive);
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
  const formattedDate = lastTransAt ? formatSaleDate(lastTransAt) : 'No transactions yet';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        {/* Screen Header */}
        <ProductScreenHeader
          title={customer ? customer.name : 'Customer Details'}
          subtitle={customer?.is_active ? 'Active Customer' : 'Inactive Customer'}
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
            {/* Error Banner */}
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadCustomer(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* Loading State */}
            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.loadingText}>Loading Customer Profile...</Text>
              </View>
            ) : customer ? (
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
                      <Text style={styles.customerName} maxFontSizeMultiplier={1.3}>
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
                            {customer.is_active ? 'Active Customer' : 'Inactive'}
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
                    <Text style={styles.lastActivityLabel}>Last Credit Activity:</Text>
                    <Text style={styles.lastActivityValue}>{formattedDate}</Text>
                  </View>

                  {/* Guidance Notice */}
                  <View style={styles.infoBanner}>
                    <Text style={styles.infoBannerText}>
                      💡 Direct utang checkout from POS and payment settlements will be enabled in upcoming batches.
                    </Text>
                  </View>
                </View>

                {/* 3. Customer Status Action */}
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
            ) : null}
          </View>
        </ScrollView>
      </View>
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

