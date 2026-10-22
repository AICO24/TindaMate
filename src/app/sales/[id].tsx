import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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
import { Sale } from '@/types/sale';

/**
 * TindaMate Individual Sale Details Screen (`/sales/[id]`)
 *
 * Displays complete details for an individual historical transaction:
 * - Product Sold (name from historical record)
 * - Unit Price (historical snapshot at time of sale)
 * - Quantity Sold & Unit
 * - Total Amount (historical snapshot)
 * - Date of transaction
 * - Time of transaction
 * - Transaction Reference ID
 *
 * Source of truth is strictly `public.sales`. Never fetches current product
 * prices to display old sales.
 */
export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saleId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

        const item = await fetchStoreSaleById(saleId);
        if (!item) {
          setErrorMessage(
            'This sale record could not be found or does not belong to your store.'
          );
        } else {
          setSale(item);
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
      <View style={styles.mainContainer}>
        {/* Top Screen Header */}
        <ProductScreenHeader
          title="Sale Details"
          subtitle={sale ? sale.product_name : 'Transaction details'}
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
          <View style={styles.bodyContainer}>
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
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Sale Details...</Text>
              </View>
            ) : !sale ? (
              /* 2. Error / Not Found State */
              <View style={styles.stateCard}>
                <View style={styles.errorIconCircle}>
                  <Text style={styles.errorIconText}>!</Text>
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
              /* 3. Populated Historical Sale Details */
              <>
                {/* Hero / Overview Card */}
                <View style={styles.heroCard}>
                  <View style={styles.badgeRow}>
                    <View style={styles.completedBadge}>
                      <View style={styles.checkDot}>
                        <CheckIcon size={12} color={Colors.textInverse} />
                      </View>
                      <Text style={styles.completedBadgeText}>
                        Completed Sale
                      </Text>
                    </View>

                    <Text style={styles.historicalSnapshotNote}>
                      Historical Record
                    </Text>
                  </View>

                  <Text
                    style={styles.productTitle}
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1.3}>
                    {sale.product_name}
                  </Text>

                  {/* Total Amount Big Callout */}
                  <View style={styles.totalAmountBox}>
                    <Text style={styles.totalAmountLabel}>
                      Total Amount Paid
                    </Text>
                    <Text
                      style={styles.totalAmountValue}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      numberOfLines={1}>
                      {formatPesoCurrency(sale.total_amount)}
                    </Text>
                  </View>
                </View>

                {/* Line Item Breakdown Card */}
                <View style={styles.sectionCard}>
                  <Text
                    style={styles.sectionHeading}
                    accessibilityRole="header">
                    Transaction Breakdown
                  </Text>

                  <View
                    style={[
                      styles.metricsGrid,
                      isCompactPhone && styles.metricsGridStacked,
                    ]}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Unit Price at Sale</Text>
                      <Text
                        style={styles.metricValue}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}>
                        {formatPesoCurrency(sale.unit_price)}
                      </Text>
                      <Text style={styles.metricCaption}>
                        per {sale.unit}
                      </Text>
                    </View>

                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Quantity Sold</Text>
                      <Text style={styles.metricValue}>
                        {sale.quantity} {sale.unit}
                      </Text>
                      <Text style={styles.metricCaption}>Units deducted</Text>
                    </View>
                  </View>

                  <View style={styles.formulaNoticeBox}>
                    <Text style={styles.formulaNoticeText}>
                      Calculation: {sale.quantity} ×{' '}
                      {formatPesoCurrency(sale.unit_price)} ={' '}
                      <Text style={styles.boldText}>
                        {formatPesoCurrency(sale.total_amount)}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Date & Time Metadata Card */}
                <View style={styles.metadataCard}>
                  <Text
                    style={styles.sectionHeading}
                    accessibilityRole="header">
                    Date & Time
                  </Text>

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
                    <Text style={styles.metaLabel}>Transaction ID</Text>
                    <Text
                      style={[styles.metaValue, styles.monospaceId]}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {sale.id}
                    </Text>
                  </View>
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
    backgroundColor: Colors.backgroundWarm,
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
    paddingBottom: Spacing.six,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
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
  errorIconText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.threeHalf,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.successText,
  },
  historicalSnapshotNote: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
  },
  productTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.heading,
  },
  totalAmountBox: {
    backgroundColor: Colors.pastel.green.bg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    padding: Spacing.three,
    gap: 2,
  },
  totalAmountLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalAmountValue: {
    fontSize: Typography.sizes.displaySm,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  sectionHeading: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
  },
  metricsGridStacked: {
    flexDirection: 'column',
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.twoHalf,
    gap: 4,
  },
  metricLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  metricCaption: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  formulaNoticeBox: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.two,
  },
  formulaNoticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  boldText: {
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  metadataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  metaLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  metaValue: {
    fontSize: Typography.sizes.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  monospaceId: {
    maxWidth: '55%',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.textSecondary,
  },
  metaDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  actionsBlock: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});

