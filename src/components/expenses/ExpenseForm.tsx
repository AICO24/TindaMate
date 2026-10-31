import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { AlertCircleIcon } from '@/components/ui/AuthIcons';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  getTodayDateISO,
  getYesterdayDateISO,
  validateExpenseForm,
} from '@/lib/expenses';
import {
  CreateExpenseInput,
  EXPENSE_CATEGORIES,
  ExpenseFormErrors,
  ExpenseFormValues,
} from '@/types/expense';

interface ExpenseFormProps {
  initialValues?: Partial<ExpenseFormValues>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  submitError: string | null;
  onClearSubmitError?: () => void;
  onSubmit: (validated: CreateExpenseInput) => Promise<void> | void;
  onCancel?: () => void;
}

/**
 * ExpenseForm
 *
 * Shared, mobile-first form for adding and editing store expenses:
 * - Uses TindaMateInput and TindaMateButton design-system components
 * - Practical Philippine sari-sari store category selector chips
 * - Safe integer-centavo monetary validation for Amount
 * - Historical expense date input (YYYY-MM-DD) with "Today" and "Yesterday" quick pills
 * - Optional multiline notes field
 * - Prevents duplicate submissions and displays clear validation errors
 */
export function ExpenseForm({
  initialValues,
  submitLabel,
  submittingLabel,
  isSubmitting,
  submitError,
  onClearSubmitError,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 360;

  const todayISO = getTodayDateISO();
  const yesterdayISO = getYesterdayDateISO();

  const [values, setValues] = useState<ExpenseFormValues>({
    title: initialValues?.title ?? '',
    category: initialValues?.category ?? 'Utilities',
    amount: initialValues?.amount ?? '',
    expenseDate: initialValues?.expenseDate ?? todayISO,
    notes: initialValues?.notes ?? '',
  });

  const [errors, setErrors] = useState<ExpenseFormErrors>({});

  const updateField = <K extends keyof ExpenseFormValues>(
    field: K,
    nextValue: ExpenseFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError && onClearSubmitError) {
      onClearSubmitError();
    }
  };

  const handleSavePress = async () => {
    if (isSubmitting) return;

    const validation = validateExpenseForm(values);
    if (!validation.isValid || !validation.sanitized) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    await onSubmit(validation.sanitized);
  };

  return (
    <View style={styles.formContainer}>
      {/* Server / Save Error Banner */}
      {submitError ? (
        <DashboardErrorBanner
          message={submitError}
          onRetry={handleSavePress}
          onDismiss={onClearSubmitError}
        />
      ) : null}

      {/* Section 1: Expense Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Expense Details
        </Text>
        <Text style={styles.sectionSubtitle}>
          Record your store operating cost, amount, and category.
        </Text>

        {/* Expense Name / Title */}
        <TindaMateInput
          label="Expense Name / Title *"
          placeholder="e.g., Meralco Electric Bill, Ice Delivery, Plastic Bags"
          value={values.title}
          onChangeText={(text) => updateField('title', text)}
          autoCapitalize="words"
          returnKeyType="next"
          errorMessage={errors.title}
          accessibilityLabel="Expense Name or Title, required"
        />

        {/* Amount (₱) */}
        <TindaMateInput
          label="Amount (₱) *"
          placeholder="0.00"
          value={values.amount}
          onChangeText={(text) => updateField('amount', text)}
          keyboardType="decimal-pad"
          returnKeyType="next"
          errorMessage={errors.amount}
          accessibilityLabel="Expense Amount in Pesos, required"
        />

        {/* Category Selector Chips */}
        <View style={styles.fieldBlock}>
          <Text
            style={[
              styles.fieldLabel,
              Boolean(errors.category) && styles.fieldLabelError,
            ]}>
            Category *
          </Text>
          <Text style={styles.chipsHelperLabel}>
            Select the category that best fits this store expense:
          </Text>
          <View style={styles.chipsWrap}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = values.category === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Category ${cat}`}
                  disabled={isSubmitting}
                  onPress={() => updateField('category', cat)}
                  style={({ pressed }) => [
                    styles.chip,
                    isSelected && styles.chipSelected,
                    pressed && styles.chipPressed,
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                    maxFontSizeMultiplier={1.2}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {errors.category ? (
            <View style={styles.errorRow} accessibilityRole="alert">
              <AlertCircleIcon size={IconSizes.xs} color={Colors.error} />
              <Text style={styles.errorText}>{errors.category}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Section 2: Date & Notes */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Date & Notes
        </Text>
        <Text style={styles.sectionSubtitle}>
          Supports today&apos;s expenses or historical records (YYYY-MM-DD).
        </Text>

        <TindaMateInput
          label="Expense Date (YYYY-MM-DD) *"
          placeholder={todayISO}
          value={values.expenseDate}
          onChangeText={(text) => updateField('expenseDate', text)}
          autoCapitalize="none"
          returnKeyType="next"
          errorMessage={errors.expenseDate}
          accessibilityLabel="Expense Date in YYYY-MM-DD format, required"
          style={styles.inputWithChipsMargin}
        />

        {/* Quick Date Presets */}
        <View style={styles.quickDateRow}>
          <Text style={styles.chipsHelperLabel}>Quick date:</Text>
          <View style={styles.chipsWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: values.expenseDate === todayISO }}
              accessibilityLabel={`Set date to Today (${todayISO})`}
              disabled={isSubmitting}
              onPress={() => updateField('expenseDate', todayISO)}
              style={({ pressed }) => [
                styles.chip,
                values.expenseDate === todayISO && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}>
              <Text
                style={[
                  styles.chipText,
                  values.expenseDate === todayISO && styles.chipTextSelected,
                ]}>
                Today ({todayISO})
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: values.expenseDate === yesterdayISO,
              }}
              accessibilityLabel={`Set date to Yesterday (${yesterdayISO})`}
              disabled={isSubmitting}
              onPress={() => updateField('expenseDate', yesterdayISO)}
              style={({ pressed }) => [
                styles.chip,
                values.expenseDate === yesterdayISO && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}>
              <Text
                style={[
                  styles.chipText,
                  values.expenseDate === yesterdayISO &&
                    styles.chipTextSelected,
                ]}>
                Yesterday ({yesterdayISO})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Optional Notes */}
        <View style={styles.notesFieldGroup}>
          <Text
            style={[
              styles.fieldLabel,
              Boolean(errors.notes) && styles.fieldLabelError,
            ]}>
            Notes (Optional)
          </Text>
          <TextInput
            value={values.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="e.g., Paid in cash to supplier, receipt #1042, or monthly stall rental"
            placeholderTextColor={Colors.textPlaceholder}
            accessibilityLabel="Expense notes, optional"
            editable={!isSubmitting}
            multiline
            numberOfLines={3}
            maxLength={300}
            style={[
              styles.notesInput,
              Boolean(errors.notes) && styles.notesInputError,
            ]}
          />
          <Text style={styles.helperText}>
            Optional details such as supplier name, receipt number, or remarks.
          </Text>
          {errors.notes ? (
            <View style={styles.errorRow} accessibilityRole="alert">
              <AlertCircleIcon size={IconSizes.xs} color={Colors.error} />
              <Text style={styles.errorText}>{errors.notes}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Form Actions */}
      <View
        style={[styles.actionsRow, isNarrowPhone && styles.actionsRowNarrow]}>
        <View style={styles.buttonFlex}>
          <TindaMateButton
            title={isSubmitting ? submittingLabel : submitLabel}
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSavePress}
            accessibilityLabel={submitLabel}
          />
        </View>

        {onCancel ? (
          <View style={styles.buttonFlex}>
            <TindaMateButton
              title="Cancel"
              variant="secondary"
              disabled={isSubmitting}
              onPress={onCancel}
              accessibilityLabel="Cancel and go back"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    gap: Spacing.three,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.threeHalf,
    gap: Spacing.twoHalf,
    ...Shadows.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.tight,
    marginBottom: Spacing.xxs,
  },
  fieldBlock: {
    gap: Spacing.one,
  },
  fieldLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  fieldLabelError: {
    color: Colors.error,
  },
  chipsHelperLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
  inputWithChipsMargin: {
    marginBottom: Spacing.one,
  },
  quickDateRow: {
    gap: 4,
    marginBottom: Spacing.one,
  },
  notesFieldGroup: {
    gap: 6,
    marginTop: Spacing.one,
  },
  notesInput: {
    minHeight: 84,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.4,
    borderColor: '#E5E0D0',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    fontSize: Typography.sizes.body,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  notesInputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  helperText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 4,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.twoHalf,
    marginTop: Spacing.one,
  },
  actionsRowNarrow: {
    flexDirection: 'column',
  },
  buttonFlex: {
    flex: 1,
  },
});

