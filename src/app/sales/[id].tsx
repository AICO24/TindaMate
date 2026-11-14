import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { TindaMateLoadingView } from '@/components/animated-icon';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import {
  NavUtangIcon,
  WarningTriangleIcon,
} from '@/components/dashboard/DashboardNavIcons';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { CheckIcon } from '@/components/ui/AuthIcons';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import {
  fetchStoreSaleById,
  formatSaleDate,
  formatSaleTime,
} from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import { SaleTransactionDetails } from '@/types/sale';

/**
 * TindaMate Individual Sale Details Screen (`/sales/[id]`) — Batch S-3
 *
 * Receipt-style historical transaction record:
 * - Clean human-readable Reference (#XXXXXXXX), Date, Time, and Cash vs Utang status
 * - Itemized `sale_items` breakdown with historical unit prices and tabular-nums subtotals
 * - Honest Cash vs Utang payment classification (never misrepresents Utang as paid)
 * - Removes raw database UUIDs & idempotency keys from the normal user-facing UI
 */
export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saleId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [transactionDetails, setTransactionDetails] =
    useState<SaleTransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sale = transactionDetails?.sale ?? null;
  const items = transactionDetails?.items ?? [];
  const isMultiItem = (sale?.item_count ?? items.length) > 1;
  const isUtang = sale?.payment_method === 'credit';
  const refCode = sale ? `#${sale.id.slice(0, 8).toUpperCase()}` : '';

  const loadSaleDetails = useCallback(
    async (showRefresh = false) => {
      if (!saleId) {
        setErrorMessage('Invalid sale transaction ID.');
        setIsLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setIsRefreshing(true);
        }
        setErrorMessage(null);

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError) {
          setErrorMessage(
            'Unable to verify your store session. Check your connection and retry.'
          );
          return;
        }

        if (!sessionData?.session) {
          router.replace('/');
          return;
        }

        const details = await fetchStoreSaleById(saleId);
        if (!details) {
          setErrorMessage(
            'This sale record could not be found or does not belong to your store.'
          );
        } else {
          setTransactionDetails(details);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load sale details. Please try again.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [saleId]
  );

  useFocusEffect(
    useCallback(() => {
      loadSaleDetails(false);
    }, [loadSaleDetails])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/sales/history');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Top Screen Header */}
        <ProductScreenHeader
          title="Sale Details"
          subtitle={
            sale
              ? `Ref ${refCode} · ${formatPesoCurrency(sale.total_amount)}`
              : 'Transaction receipt'
          }
          showBack={true}
          onBack={handleBack}
        />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadSaleDetails(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View
            style={[
              styles.bodyContainer,
              isCompactPhone && styles.bodyContainerCompact,
            ]}>
            {/* Error Banner */}
            {errorMessage && sale ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadSaleDetails(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {/* 1. Loading State */}
            {isLoading ? (
              <View style={styles.stateCard}>
                <TindaMateLoadingView
                  compact
                  message="Loading Sale Details..."
                />
              </View>
            ) : !sale ? (
              /* 2. Error / Not Found State */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <WarningTriangleIcon
                    size={22}
                    bgColor={Colors.error}
                    fgColor={Colors.textInverse}
                  />
                </View>
                <Text style={styles.stateTitle}>Sale Not Found</Text>
                <Text style={styles.stateSubtitle}>
                  {errorMessage ??
                    'This transaction record could not be found or does not belong to your store.'}
                </Text>
                <View style={styles.stateActions}>
                  {errorMessage ? (
                    <TindaMateButton
                      title="Retry"
                      variant="primary"
                      onPress={() => loadSaleDetails(true)}
                    />
                  ) : null}
                  <TindaMateButton
                    title="Back to Sales History"
                    variant="secondary"
                    onPress={() => router.replace('/sales/history')}
                  />
                </View>
              </View>
            ) : (
              /* 3. Populated Historical Sale Receipt */
              <>
                {/* Receipt Hero / Overview Card */}
                <View style={styles.heroCard}>
                  <View style={styles.badgeRow}>
                    {isUtang ? (
                      <View style={styles.utangStatusBadge}>
                        <NavUtangIcon size={13} color={Colors.textInverse} />
                        <Text style={styles.utangStatusBadgeText}>
                          UNPAID · UTANG
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.completedBadge}>
                        <View style={styles.checkDot}>
                          <CheckIcon size={11} color={Colors.textInverse} />
                        </View>
                        <Text style={styles.completedBadgeText}>
                          PAID · CASH SALE
                        </Text>
                      </View>
                    )}

                    {isMultiItem && (
                      <View style={styles.multiItemBadge}>
                        <Text style={styles.multiItemBadgeText}>
                          {items.length} products
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.heroMetaHeader}>
                    <Text
                      style={styles.productTitle}
                      accessibilityRole="header"
                      maxFontSizeMultiplier={1.3}>
                      Receipt {refCode}
                    </Text>
                    <Text style={styles.heroDateTime}>
                      {formatSaleDate(sale.created_at)} •{' '}
                      {formatSaleTime(sale.created_at)}
                    </Text>
                  </View>

                  {/* Total Amount Callout */}
                  <View
                    style={[
                      styles.totalAmountBox,
                      isUtang && styles.totalAmountBoxUtang,
                    ]}>
                    <Text
                      style={[
                        styles.totalAmountLabel,
                        isUtang && styles.totalAmountLabelUtang,
                      ]}>
                      {isUtang
                        ? 'Total Utang Amount (Store Credit)'
                        : 'Total Amount Paid'}
                    </Text>
                    <Text
                      style={[
                        styles.totalAmountValue,
                        isCompactPhone && styles.totalAmountValueCompact,
                        isUtang && styles.totalAmountValueUtang,
                      ]}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      numberOfLines={1}>
                      {formatPesoCurrency(sale.total_amount)}
                    </Text>
                    <Text style={styles.totalAmountSub}>
                      {items.length}{' '}
                      {items.length === 1 ? 'product line' : 'product lines'} ·{' '}
                      {sale.quantity} {sale.quantity === 1 ? 'unit' : 'units'}{' '}
                      sold
                    </Text>
                  </View>
                </View>

                {/* Itemized Line Items Breakdown Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Text
                      style={styles.sectionHeading}
                      accessibilityRole="header">
                      Purchased Items ({items.length})
                    </Text>
                    <Text style={styles.itemCountSub}>
                      {sale.quantity} {sale.quantity === 1 ? 'unit' : 'units'}{' '}
                      total
                    </Text>
                  </View>

                  <View style={styles.itemsList}>
                    {items.map((item, index) => (
                      <View
                        key={`${item.id}-${index}`}
                        style={[
                          styles.itemRow,
                          index < items.length - 1 && styles.itemRowDivider,
                        ]}>
                        <View style={styles.itemInfoCol}>
                          <Text
                            style={styles.itemName}
                            numberOfLines={2}
                            maxFontSizeMultiplier={1.3}>
                            {item.product_name}
                          </Text>
                          <Text
                            style={styles.itemCalculation}
                            maxFontSizeMultiplier={1.2}>
                            {item.quantity} {item.unit} ×{' '}
                            {formatPesoCurrency(item.unit_price)}
                          </Text>
                        </View>
                        <Text
                          style={styles.itemSubtotal}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}>
                          {formatPesoCurrency(item.subtotal)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Receipt Total Footer Row */}
                  <View style={styles.receiptTotalFooter}>
                    <Text style={styles.receiptTotalFooterLabel}>
                      Transaction Total
                    </Text>
                    <Text style={styles.receiptTotalFooterValue}>
                      {formatPesoCurrency(sale.total_amount)}
                    </Text>
                  </View>
                </View>

                {/* Payment & Transaction Summary Card (Human-Readable Only) */}
                <View style={styles.metadataCard}>
                  <Text
                    style={styles.sectionHeading}
                    accessibilityRole="header">
                    Payment &amp; Record Summary
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Reference No.</Text>
                    <Text style={styles.metaValue}>{refCode}</Text>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>
                      {formatSaleDate(sale.created_at)}
                    </Text>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>
                      {formatSaleTime(sale.created_at)}
                    </Text>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Payment Method</Text>
                    <Text
                      style={[
                        styles.metaValue,
                        isUtang && styles.metaValueUtang,
                      ]}>
                      {isUtang ? 'Utang (Store Credit)' : 'Cash'}
                    </Text>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text
                      style={[
                        styles.metaValue,
                        isUtang ? styles.metaValueUtang : styles.metaValueCash,
                      ]}>
                      {isUtang ? 'Unpaid Store Credit' : 'Paid'}
                    </Text>
                  </View>

                  {isUtang && sale.customer_name && (
                    <>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Customer</Text>
                        <Text
                          style={[styles.metaValue, styles.metaValueUtang]}
                          numberOfLines={1}>
                          {sale.customer_name}
                        </Text>
                      </View>
                    </>
                  )}

                  {isUtang ? (
                    <View style={styles.utangLedgerNote}>
                      <Text style={styles.utangLedgerNoteText}>
                        Recorded as store credit (Utang). Any subsequent
                        customer payments are tracked separately in the Utang
                        ledger and do not change this original sale record.
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Primary Actions */}
                <View style={styles.actionsBlock}>
                  <TindaMateButton
                    title="Record Another Sale"
                    variant="primary"
                    showArrow
                    onPress={() => router.push('/sales' as any)}
                    accessibilityLabel="Record another sale"
                  />
                  <TindaMateButton
                    title="Back to Sales History"
                    variant="secondary"
                    onPress={() => router.replace('/sales/history')}
                    accessibilityLabel="Return to sales history log"
                  />
                  <TindaMateButton
                    title="Return to Dashboard"
                    variant="ghost"
                    onPress={() => router.replace('/home')}
                    accessibilityLabel="Return to store dashboard"
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.twoHalf,
  },
  bodyContainerCompact: {
    paddingHorizontal: Spacing.twoHalf,
    gap: Spacing.two,
  },
  stateCard: {
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
  stateTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal,
  },
  stateActions: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
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
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    ...Shadows.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: 0.4,
  },
  utangStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
  },
  utangStatusBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: 0.4,
  },
  multiItemBadge: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  multiItemBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  heroMetaHeader: {
    gap: 2,
  },
  productTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  heroDateTime: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },
  totalAmountBox: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.three,
    gap: 4,
  },
  totalAmountBoxUtang: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentBorder,
  },
  totalAmountLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  totalAmountLabelUtang: {
    color: Colors.accentDark,
  },
  totalAmountValue: {
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  totalAmountValueCompact: {
    fontSize: 26,
  },
  totalAmountValueUtang: {
    color: Colors.accentDark,
  },
  totalAmountSub: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  itemCountSub: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  itemInfoCol: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  itemCalculation: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  itemSubtotal: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  receiptTotalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  receiptTotalFooterLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
  receiptTotalFooterValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  metadataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: 2,
  },
  metaLabel: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  metaValue: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
    textAlign: 'right',
    flexShrink: 1,
  },
  metaValueCash: {
    color: Colors.primaryDark,
  },
  metaValueUtang: {
    color: Colors.accentDark,
  },
  metaDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  utangLedgerNote: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.twoHalf,
    marginTop: Spacing.one,
  },
  utangLedgerNoteText: {
    fontSize: Typography.sizes.caption,
    color: Colors.accentDark,
    lineHeight: 17,
  },
  actionsBlock: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
