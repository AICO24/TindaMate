import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatExpenseDate } from '@/lib/expenses';
import { formatPesoCurrency } from '@/lib/products';
import { Expense } from '@/types/expense';

export interface DeleteExpenseConfirmModalProps {
  visible: boolean;
  expense: Expense | null;
  isDeleting: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteExpenseConfirmModal
 *
 * Branded confirmation modal for deleting an expense record:
 * - Clearly identifies the expense title, category, amount, and date that will be removed
 * - Handles confirmation, cancellation, loading state, and error feedback
 * - Prevents accidental silent deletions
 */
export function DeleteExpenseConfirmModal({
  visible,
  expense,
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteExpenseConfirmModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 360;

  if (!expense) return null;

  const formattedAmount = formatPesoCurrency(expense.amount);
  const formattedDate = formatExpenseDate(expense.expense_date);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={isDeleting ? undefined : onCancel}>
      <Pressable
        style={styles.backdrop}
        onPress={isDeleting ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss delete expense modal">
        <Pressable
          style={[styles.modalCard, isNarrow && styles.modalCardNarrow]}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert">
          {/* Top Warning Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji} importantForAccessibility="no">
                🗑️
              </Text>
            </View>
          </View>

          {/* Heading & Explanation */}
          <View style={styles.contentBlock}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}>
              Delete Expense?
            </Text>

            <Text style={styles.description} maxFontSizeMultiplier={1.3}>
              Are you sure you want to permanently remove this expense from your
              store records? This action cannot be undone.
            </Text>

            {/* Expense Summary Box */}
            <View style={styles.expenseSummaryBox}>
              <Text
                style={styles.expenseTitleText}
                numberOfLines={2}
                ellipsizeMode="tail">
                {expense.title}
              </Text>
              <View style={styles.expenseMetaRow}>
                <Text style={styles.expenseCategoryBadge}>
                  {expense.category}
                </Text>
                <Text style={styles.expenseDot}>·</Text>
                <Text style={styles.expenseDateText}>{formattedDate}</Text>
              </View>
              <Text style={styles.expenseAmountText}>{formattedAmount}</Text>
            </View>

            {/* Error Feedback if Deletion Fails */}
            {errorMessage ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TindaMateButton
              title={isDeleting ? 'Deleting Expense...' : 'Yes, Delete Expense'}
              variant="danger"
              loading={isDeleting}
              disabled={isDeleting}
              onPress={onConfirm}
              accessibilityLabel={`Confirm delete expense ${expense.title}`}
              style={styles.confirmButton}
            />

            <TindaMateButton
              title="Cancel"
              variant="ghost"
              disabled={isDeleting}
              onPress={onCancel}
              accessibilityLabel="Cancel and keep expense"
              style={styles.cancelButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  modalCardNarrow: {
    paddingHorizontal: Spacing.three,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.errorLight,
    borderWidth: 1.5,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  contentBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    paddingHorizontal: Spacing.one,
  },
  expenseSummaryBox: {
    width: '100%',
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.one,
  },
  expenseTitleText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  expenseCategoryBadge: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  expenseDot: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  expenseDateText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  expenseAmountText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.error,
    marginTop: 2,
  },
  errorBanner: {
    width: '100%',
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.semiBold,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  confirmButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

