import React, { useCallback, useState } from 'react';
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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { CustomerForm } from '@/components/customers/CustomerForm';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  fetchStoreCustomerById,
  updateStoreCustomer,
} from '@/lib/customers';
import { supabase } from '@/lib/supabase';
import { CreateCustomerInput, CustomerWithCredit } from '@/types/customer';

/**
 * TindaMate Edit Customer Screen (`/customers/[id]/edit`)
 *
 * Allows an authenticated store owner to modify customer profile details:
 * Name, Phone, Notes, and Active/Inactive status.
 */
export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Array.isArray(id) ? id[0] : id;

  const [customer, setCustomer] = useState<CustomerWithCredit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    if (!customerId) {
      setLoadError('Invalid customer ID.');
      setIsLoading(false);
      return;
    }

    try {
      setLoadError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.replace('/');
        return;
      }

      const details = await fetchStoreCustomerById(customerId);
      if (!details) {
        setLoadError(
          'Customer record not found or does not belong to your store.'
        );
      } else {
        setCustomer(details);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not load customer for editing.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      loadCustomer();
    }, [loadCustomer])
  );

  const handleUpdateCustomer = async (
    values: CreateCustomerInput & { is_active?: boolean }
  ) => {
    if (!customer || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await updateStoreCustomer(customer.id, {
        name: values.name,
        phone: values.phone,
        notes: values.notes,
        is_active: values.is_active,
      });

      // Navigate back to the customer details screen
      router.replace(`/customers/${customer.id}` as any);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to update customer. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (customer) {
      router.replace(`/customers/${customer.id}` as any);
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
          title="Edit Customer"
          subtitle={customer?.name ? `Editing ${customer.name}` : undefined}
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.bodyContainer}>
            {loadError ? (
              <DashboardErrorBanner
                message={loadError}
                onRetry={loadCustomer}
                onDismiss={() => setLoadError(null)}
              />
            ) : null}

            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.loadingText}>Loading Customer...</Text>
              </View>
            ) : customer ? (
              <CustomerForm
                initialValues={{
                  name: customer.name,
                  phone: customer.phone ?? '',
                  notes: customer.notes ?? '',
                  isActive: customer.is_active,
                }}
                submitLabel="Save Changes"
                submittingLabel="Saving Changes..."
                isSubmitting={isSubmitting}
                submitError={submitError}
                isEditMode={true}
                onClearSubmitError={() => setSubmitError(null)}
                onSubmit={handleUpdateCustomer}
                onCancel={handleBack}
              />
            ) : null}
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
});

