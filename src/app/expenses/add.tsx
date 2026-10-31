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

import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { ProductScreenHeader } from '@/components/products/ProductScreenHeader';
import {
  Colors,
  DashboardMaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { createStoreExpense } from '@/lib/expenses';
import { supabase } from '@/lib/supabase';
import { CreateExpenseInput } from '@/types/expense';

/**
 * TindaMate Add Expense Screen (`/expenses/add`)
 *
 * Allows an authenticated store owner to record a new business expense.
 * Flow: Dashboard or Expenses List -> Add Expense -> Save -> Expenses List (`/expenses`).
 */
export default function AddExpenseScreen() {
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

  const handleCreateExpense = async (validated: CreateExpenseInput) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createStoreExpense(validated);

      // Navigate to Expenses list with creation feedback so the new expense is displayed
      router.replace({
        pathname: '/expenses' as any,
        params: { status: 'created' },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save expense. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/expenses' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ProductScreenHeader
          title="Add Expense"
          subtitle="Record a store business expense"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.bodyContainer}>
            <ExpenseForm
              submitLabel="Save Expense"
              submittingLabel="Saving Expense..."
              isSubmitting={isSubmitting}
              submitError={submitError}
              onClearSubmitError={() => setSubmitError(null)}
              onSubmit={handleCreateExpense}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
});

