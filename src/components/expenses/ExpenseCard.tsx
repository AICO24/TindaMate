import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BorderRadius,
  Colors,
  PastelThemeKey,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatExpenseDate } from '@/lib/expenses';
import { formatPesoCurrency } from '@/lib/products';
import { Expense, ExpenseCategory } from '@/types/expense';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

/**
 * Returns a consistent pastel theme key and icon glyph for each expense category.
 */
export function getCategoryVisualMeta(category: ExpenseCategory): {
  theme: PastelThemeKey;
  emoji: string;
} {
  switch (category) {
    case 'Utilities':
      return { theme: 'blue', emoji: '💡' };
    case 'Rent':
      return { theme: 'purple', emoji: '🏪' };
    case 'Supplies':
      return { theme: 'green', emoji: '🛍️' };
    case 'Transportation':
      return { theme: 'orange', emoji: '🛵' };
    case 'Restocking-related Expense':
      return { theme: 'green', emoji: '📦' };
    case 'Maintenance':
      return { theme: 'orange', emoji: '🔧' };
    case 'Salaries':
      return { theme: 'purple', emoji: '👥' };
    case 'Other':
    default:
      return { theme: 'neutral', emoji: '🧾' };
  }
}

/**
 * ExpenseCard
 *
 * Scannable, mobile-first expense card for sari-sari store owners:
 * - Displays expense title, category pill, formatted date, optional notes, and readable Peso amount
 * - Tapping the card or "Edit" opens the expense for editing
 * - Tapping "Delete" opens the confirmation modal
 */
export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const formattedAmount = formatPesoCurrency(expense.amount);
  const formattedDate = formatExpenseDate(expense.expense_date);
  const { theme, emoji } = getCategoryVisualMeta(expense.category);
  const pastelColors = Colors.pastel[theme];

  const accessibilityLabel = `${expense.title}, Category: ${expense.category}, Amount: ${formattedAmount}, Date: ${formattedDate}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to edit this expense"
      onPress={() => onEdit(expense)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        pressed && styles.cardPressed,
      ]}>
      {/* Top Row: Category Icon + Title/Meta + Amount */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: pastelColors.bg,
              borderColor: pastelColors.border,
            },
          ]}
          accessible={false}
          importantForAccessibility="no-hide-descendants">
          <Text style={styles.iconEmoji}>{emoji}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text
            style={styles.titleText}
            numberOfLines={2}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}>
            {expense.title}
          </Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: pastelColors.bg,
                  borderColor: pastelColors.border,
                },
              ]}>
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: pastelColors.text },
                ]}
                numberOfLines={1}>
                {expense.category}
              </Text>
            </View>

            <Text style={styles.dateText} maxFontSizeMultiplier={1.2}>
              📅 {formattedDate}
            </Text>
          </View>
        </View>

        <View style={styles.amountCol}>
          <Text
            style={styles.amountValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.25}>
            {formattedAmount}
          </Text>
          <Text style={styles.amountCaption}>Expense</Text>
        </View>
      </View>

      {/* Optional Notes Snippet */}
      {expense.notes ? (
        <View style={styles.notesRow}>
          <Text
            style={styles.notesText}
            numberOfLines={2}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.2}>
            📝 {expense.notes}
          </Text>
        </View>
      ) : null}

      {/* Bottom Action Footer: Edit & Delete */}
      <View style={styles.actionsFooter}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit expense ${expense.title}`}
          onPress={(e) => {
            e.stopPropagation();
            onEdit(expense);
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.editButtonPressed,
          ]}>
          <Text style={styles.editButtonText}>✎ Edit</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete expense ${expense.title}`}
          onPress={(e) => {
            e.stopPropagation();
            onDelete(expense);
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [
            styles.actionButton,
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}>
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.threeHalf,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  cardCompact: {
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.twoHalf,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconEmoji: {
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
    gap: 5,
  },
  titleText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.normal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
  },
  dateText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
    gap: 2,
  },
  amountValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  amountCaption: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notesRow: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  notesText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
  },
  actionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  actionButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryBorder,
  },
  editButtonPressed: {
    backgroundColor: Colors.primaryLight,
  },
  editButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
  deleteButton: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
  },
  deleteButtonPressed: {
    backgroundColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
});

