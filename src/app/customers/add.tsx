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

import { CustomerForm } from '@/components/customers/CustomerForm';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import {
  Colors,
  DashboardMaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { createStoreCustomer } from '@/lib/customers';
import { supabase } from '@/lib/supabase';
import { CreateCustomerInput } from '@/types/customer';

/**
 * TindaMate Add Customer Screen (`/customers/add`)
 *
 * Allows an authenticated store owner to register a new store customer/suki.
 * Flow: Customers List -> Add Customer -> Save -> Customer Details (`/customers/[id]`).
 */
export default function AddCustomerScreen() {
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

  const handleCreateCustomer = async (input: CreateCustomerInput) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const created = await createStoreCustomer(input);

      // Navigate directly to the newly created customer details
      router.replace(`/customers/${created.id}` as any);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save customer. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/customers' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ProductScreenHeader
          title="Add Customer"
          subtitle="Register a new store patron or suki"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.bodyContainer}>
            <CustomerForm
              submitLabel="Save Customer"
              submittingLabel="Saving Customer..."
              isSubmitting={isSubmitting}
              submitError={submitError}
              onClearSubmitError={() => setSubmitError(null)}
              onSubmit={handleCreateCustomer}
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
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  bodyContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
});

