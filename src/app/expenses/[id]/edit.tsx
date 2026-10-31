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

import { DeleteExpenseConfirmModal } from '@/components/expenses/DeleteExpenseConfirmModal';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
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
  deleteStoreExpense,
  fetchStoreExpenseById,
  updateStoreExpense,
} from '@/lib/expenses';
import { supabase } from '@/lib/supabase';
import { CreateExpenseInput, Expense } from '@/types/expense';

/**
 * TindaMate Edit Expense Screen (`/expenses/[id]/edit`)
 *
 * Preloads an existing expense belonging to the authenticated store owner,
 * validates changes, updates the database record in place, and returns to
 * the refreshed expense list. Also allows deleting the expense with confirmation.
 */
export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = Array.isArray(id) ? id[0] : id;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadExistingExpense = useCallback(async () => {
    if (!expenseId) {
      setLoadError('Invalid expense ID.');
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

      const existing = await fetchStoreExpenseById(expenseId);
      if (!existing) {
        setLoadError(
          'This expense could not be found or you do not have permission to edit it.'
        );
      } else {
        setExpense(existing);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not load expense for editing.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    loadExistingExpense();
  }, [loadExistingExpense]);

  const handleUpdateExpense = async (validated: CreateExpenseInput) => {
    if (!expenseId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await updateStoreExpense(expenseId, validated);

      router.replace({
        pathname: '/expenses' as any,
        params: { status: 'updated' },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not save expense changes. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!expense || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteStoreExpense(expense.id);
      setIsDeleteModalVisible(false);

      router.replace('/expenses' as any);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not delete expense. Please try again.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
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
          title="Edit Expense"
          subtitle={expense ? expense.title : 'Update store expense'}
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
                <Text style={styles.stateTitle}>Loading Expense...</Text>
              </View>
            ) : !expense ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Unable to Edit Expense</Text>
                <Text style={styles.stateSubtitle}>
                  {loadError ?? 'Expense record not found.'}
                </Text>
                <View style={styles.stateActions}>
                  <TindaMateButton
                    title="Retry"
                    variant="primary"
                    onPress={loadExistingExpense}
                  />
                  <TindaMateButton
                    title="Back to Expenses"
                    variant="secondary"
                    onPress={() => router.replace('/expenses' as any)}
                  />
                </View>
              </View>
            ) : (
              <>
                <ExpenseForm
                  key={expense.id}
                  initialValues={{
                    title: expense.title,
                    category: expense.category,
                    amount: expense.amount.toFixed(2),
                    expenseDate: expense.expense_date,
                    notes: expense.notes ?? '',
                  }}
                  submitLabel="Save Changes"
                  submittingLabel="Saving Changes..."
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  onClearSubmitError={() => setSubmitError(null)}
                  onSubmit={handleUpdateExpense}
                  onCancel={handleBack}
                />

                {/* Danger Zone: Delete Expense */}
                <View style={styles.deleteCard}>
                  <View style={styles.deleteInfoCol}>
                    <Text style={styles.deleteCardTitle}>Remove Expense</Text>
                    <Text style={styles.deleteCardSubtitle}>
                      Permanently delete this expense record from your store.
                    </Text>
                  </View>
                  <TindaMateButton
                    title="Delete Expense"
                    variant="danger"
                    disabled={isSubmitting || isDeleting}
                    onPress={() => {
                      setDeleteError(null);
                      setIsDeleteModalVisible(true);
                    }}
                    accessibilityLabel={`Delete expense ${expense.title}`}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DeleteExpenseConfirmModal
        visible={isDeleteModalVisible}
        expense={expense}
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteError(null);
            setIsDeleteModalVisible(false);
          }
        }}
      />
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
  deleteCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    padding: Spacing.threeHalf,
    gap: Spacing.twoHalf,
    marginTop: Spacing.one,
    ...Shadows.xs,
  },
  deleteInfoCol: {
    gap: 2,
  },
  deleteCardTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  deleteCardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
});

