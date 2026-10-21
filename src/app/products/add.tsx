import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ProductForm } from '@/components/products/ProductForm';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import {
  Colors,
  DashboardMaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { createStoreProduct } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { ValidatedProductInput } from '@/types/product';

/**
 * TindaMate Add Product Screen (`/products/add`)
 *
 * Allows an authenticated store vendor to add a new product to their store.
 * Flow: Home or Products -> Add Product -> Save -> Products (`/products`).
 */
export default function AddProductScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session && isMounted) {
        router.replace('/');
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateProduct = async (validated: ValidatedProductInput) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createStoreProduct(validated);

      // Navigate to Products list so the vendor immediately sees the newly added product
      router.replace('/products');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save product. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
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
          title="Add Product"
          subtitle="Create a new item for your store"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.bodyContainer}>
            <ProductForm
              submitLabel="Save Product"
              submittingLabel="Saving Product..."
              isSubmitting={isSubmitting}
              submitError={submitError}
              onClearSubmitError={() => setSubmitError(null)}
              onSubmit={handleCreateProduct}
              onCancel={handleBack}
            />
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
});

