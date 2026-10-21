import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ProductForm } from '@/components/products/ProductForm';
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
import { fetchStoreProductById, updateStoreProduct } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { Product, ValidatedProductInput } from '@/types/product';

/**
 * TindaMate Edit Product Screen (`/products/[id]/edit`)
 *
 * Loads an existing product belonging to the authenticated vendor's store
 * and updates that exact record in place (`updateStoreProduct`).
 * Never creates a duplicate product when saving edits.
 */
export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(id) ? id[0] : id;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadExistingProduct = useCallback(async () => {
    if (!productId) {
      setLoadError('Invalid product ID.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.replace('/');
        return;
      }

      const existing = await fetchStoreProductById(productId);
      if (!existing) {
        setLoadError(
          'This product could not be found or you do not have permission to edit it.'
        );
      } else {
        setProduct(existing);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not load product for editing.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadExistingProduct();
  }, [loadExistingProduct]);

  const handleUpdateProduct = async (validated: ValidatedProductInput) => {
    if (!productId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await updateStoreProduct(productId, validated);

      // Return to Product Details screen so updated values are immediately shown
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/products/${productId}`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not save product changes. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (productId) {
      router.replace(`/products/${productId}`);
    } else {
      router.replace('/products');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ProductScreenHeader
          title="Edit Product"
          subtitle={product ? product.name : 'Update store item'}
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.bodyContainer}>
            {isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.stateTitle}>Loading Product...</Text>
              </View>
            ) : !product ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Unable to Edit Product</Text>
                <Text style={styles.stateSubtitle}>
                  {loadError ?? 'Product not found.'}
                </Text>
                <View style={styles.stateActions}>
                  <TindaMateButton
                    title="Retry"
                    variant="primary"
                    onPress={loadExistingProduct}
                  />
                  <TindaMateButton
                    title="Back to Products"
                    variant="secondary"
                    onPress={() => router.replace('/products')}
                  />
                </View>
              </View>
            ) : (
              <ProductForm
                key={product.id}
                initialValues={{
                  name: product.name,
                  category: product.category ?? '',
                  imageUrl: product.image_url ?? '',
                  sellingPrice: product.selling_price.toFixed(2),
                  costPrice:
                    product.cost_price !== null
                      ? product.cost_price.toFixed(2)
                      : '',
                  stockQuantity: String(product.stock_quantity),
                  lowStockThreshold: String(product.low_stock_threshold),
                  unit: product.unit,
                }}
                submitLabel="Save Changes"
                submittingLabel="Saving Changes..."
                isSubmitting={isSubmitting}
                submitError={submitError}
                onClearSubmitError={() => setSubmitError(null)}
                onSubmit={handleUpdateProduct}
                onCancel={handleBack}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  keyboardView: {
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
});

