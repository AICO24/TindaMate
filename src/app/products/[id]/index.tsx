import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import { StockStatusBadge } from '@/components/products/StockStatusBadge';
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
  fetchStoreProductById,
  formatPesoCurrency,
  getProductStockStatus,
} from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';

/**
 * Formats an ISO timestamp into a friendly vendor-readable date/time string.
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * TindaMate Product Details Screen (`/products/[id]`)
 *
 * Displays complete details for a single store product:
 * - Product name, category, and centralized Stock Status badge
 * - Selling price and optional cost price (with unit profit margin when cost price is set)
 * - Current stock quantity, unit, and low-stock alert threshold
 * - Created & Updated timestamps
 * - Clear "Edit Product" action navigating to `/products/[id]/edit`
 */
export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProduct = useCallback(
    async (showRefresh = false) => {
      if (!productId) {
        setErrorMessage('Invalid product ID.');
        setIsLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setIsRefreshing(true);
        }
        setErrorMessage(null);

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          router.replace('/');
          return;
        }

        const item = await fetchStoreProductById(productId);
        setProduct(item);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load product details. Please try again.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [productId]
  );

  useFocusEffect(
    useCallback(() => {
      loadProduct(false);
    }, [loadProduct])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products');
    }
  };

  const handleEdit = () => {
    if (!product) return;
    router.push(`/products/${product.id}/edit`);
  };

  const status = product
    ? getProductStockStatus(
        product.stock_quantity,
        product.low_stock_threshold
      )
    : 'In Stock';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mainContainer}>
        <ProductScreenHeader
          title="Product Details"
          subtitle={product ? product.name : 'Store inventory item'}
          onBack={handleBack}
          rightActionLabel={product ? 'Edit' : undefined}
          rightActionAccessibilityLabel="Edit this product"
          onRightActionPress={product ? handleEdit : undefined}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadProduct(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }>
          <View style={styles.bodyContainer}>
            {errorMessage ? (
              <DashboardErrorBanner
                message={errorMessage}
                onRetry={() => loadProduct(true)}
                onDismiss={() => setErrorMessage(null)}
              />
            ) : null}

            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Product Details...</Text>
              </View>
            ) : !product ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Product Not Found</Text>
                <Text style={styles.stateSubtitle}>
                  {errorMessage ??
                    'This product could not be found or does not belong to your store.'}
                </Text>
                <View style={styles.stateActions}>
                  {errorMessage ? (
                    <TindaMateButton
                      title="Retry"
                      variant="primary"
                      onPress={() => loadProduct(true)}
                    />
                  ) : null}
                  <TindaMateButton
                    title="Back to Products"
                    variant="secondary"
                    onPress={() => router.replace('/products')}
                  />
                </View>
              </View>
            ) : (
              <>
                {/* 1. Primary Product Identity Card */}
                <View style={styles.heroCard}>
                  {product.image_url ? (
                    <View style={styles.heroImageContainer}>
                      <Image
                        source={{ uri: product.image_url }}
                        style={styles.heroImage}
                        contentFit="cover"
                        transition={200}
                        accessibilityLabel={`${product.name} photo`}
                      />
                    </View>
                  ) : null}

                  <View style={styles.badgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText} numberOfLines={1}>
                        {product.category || 'General Item'}
                      </Text>
                    </View>
                    <StockStatusBadge status={status} size="md" />
                  </View>

                  <Text
                    style={styles.productTitle}
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1.3}>
                    {product.name}
                  </Text>

                  <Text style={styles.unitSubtext} maxFontSizeMultiplier={1.25}>
                    Sold per <Text style={styles.boldText}>{product.unit}</Text>
                  </Text>
                </View>

                {/* 2. Pricing Details Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading} accessibilityRole="header">
                    Pricing
                  </Text>

                  <View
                    style={[
                      styles.metricsGrid,
                      isCompactPhone && styles.metricsGridStacked,
                    ]}>
                    <View style={[styles.metricBox, styles.sellingPriceBox]}>
                      <Text style={styles.metricLabel}>Selling Price</Text>
                      <Text
                        style={styles.sellingPriceValue}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        numberOfLines={1}>
                        {formatPesoCurrency(product.selling_price)}
                      </Text>
                      <Text style={styles.metricCaption}>
                        per {product.unit}
                      </Text>
                    </View>

                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Cost Price</Text>
                      <Text
                        style={styles.secondaryMetricValue}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                        numberOfLines={1}>
                        {product.cost_price !== null
                          ? formatPesoCurrency(product.cost_price)
                          : 'Not set'}
                      </Text>
                      <Text style={styles.metricCaption}>
                        {product.cost_price !== null
                          ? `Est. margin: ${formatPesoCurrency(
                              product.selling_price - product.cost_price
                            )} / ${product.unit}`
                          : 'Optional store cost'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. Stock & Inventory Alert Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading} accessibilityRole="header">
                    Stock & Inventory
                  </Text>

                  <View
                    style={[
                      styles.metricsGrid,
                      isCompactPhone && styles.metricsGridStacked,
                    ]}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Current Stock</Text>
                      <Text
                        style={[
                          styles.stockBigValue,
                          status === 'Out of Stock' && { color: Colors.error },
                          status === 'Low Stock' && { color: Colors.warningText },
                        ]}>
                        {product.stock_quantity} {product.unit}
                      </Text>
                      <Text style={styles.metricCaption}>
                        Available in store
                      </Text>
                    </View>

                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>
                        Low-Stock Threshold
                      </Text>
                      <Text style={styles.secondaryMetricValue}>
                        {product.low_stock_threshold} {product.unit}
                      </Text>
                      <Text style={styles.metricCaption}>
                        Alerts at or below {product.low_stock_threshold}{' '}
                        {product.unit}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusGuidanceBanner,
                      status === 'Out of Stock'
                        ? styles.bannerOut
                        : status === 'Low Stock'
                        ? styles.bannerLow
                        : styles.bannerIn,
                    ]}>
                    <Text
                      style={[
                        styles.statusGuidanceText,
                        status === 'Out of Stock'
                          ? { color: Colors.error }
                          : status === 'Low Stock'
                          ? { color: Colors.warningText }
                          : { color: Colors.successText },
                      ]}>
                      {status === 'Out of Stock'
                        ? 'This product is currently out of stock (0 available). Tap Edit Product to restock.'
                        : status === 'Low Stock'
                        ? `Stock is at or below your alert level of ${product.low_stock_threshold} ${product.unit}. Restock soon.`
                        : `Healthy stock level (${product.stock_quantity} ${product.unit} available).`}
                    </Text>
                  </View>
                </View>

                {/* 4. Record Metadata */}
                <View style={styles.metadataCard}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text style={styles.metaValue}>{status}</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Unit</Text>
                    <Text style={styles.metaValue}>{product.unit}</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Last Updated</Text>
                    <Text style={styles.metaValue}>
                      {formatTimestamp(product.updated_at)}
                    </Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Added On</Text>
                    <Text style={styles.metaValue}>
                      {formatTimestamp(product.created_at)}
                    </Text>
                  </View>
                </View>

                {/* 5. Primary Actions */}
                <View style={styles.actionsBlock}>
                  <TindaMateButton
                    title="Edit Product"
                    variant="primary"
                    onPress={handleEdit}
                    accessibilityLabel="Edit this product"
                  />
                  <TindaMateButton
                    title="Back to Products List"
                    variant="secondary"
                    onPress={() => router.replace('/products')}
                    accessibilityLabel="Return to products list"
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
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.threeHalf,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  heroImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.one,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryBadge: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  productTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.heading,
  },
  unitSubtext: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
  },
  boldText: {
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
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
  sellingPriceBox: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  metricLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  sellingPriceValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  secondaryMetricValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  stockBigValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  metricCaption: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  statusGuidanceBanner: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.two,
  },
  bannerIn: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.primaryBorder,
  },
  bannerLow: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.accentBorder,
  },
  bannerOut: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  statusGuidanceText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    lineHeight: Typography.lineHeights.tight,
  },
  metadataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
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
  metaDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  actionsBlock: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});

