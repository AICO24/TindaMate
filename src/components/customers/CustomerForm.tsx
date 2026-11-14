import React, { useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { validateCustomerForm } from '@/lib/customers';
import {
  CreateCustomerInput,
  CustomerFormErrors,
  CustomerFormValues,
} from '@/types/customer';

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  submitError: string | null;
  isEditMode?: boolean;
  onClearSubmitError?: () => void;
  onSubmit: (values: CreateCustomerInput & { is_active?: boolean }) => Promise<void> | void;
  onCancel?: () => void;
}

/**
 * CustomerForm
 *
 * Mobile-first form for adding or editing a sari-sari store customer:
 * - Uses standard TindaMateInput and TindaMateButton components
 * - Clear inline validation for required customer name
 * - Phone and notes fields with helpful placeholders
 * - Active / Inactive switch in edit mode
 * - Duplicate submission prevention
 */
export function CustomerForm({
  initialValues,
  submitLabel,
  submittingLabel,
  isSubmitting,
  submitError,
  isEditMode = false,
  onClearSubmitError,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 360;

  const [values, setValues] = useState<CustomerFormValues>({
    name: initialValues?.name ?? '',
    phone: initialValues?.phone ?? '',
    notes: initialValues?.notes ?? '',
    isActive: initialValues?.isActive ?? true,
  });

  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isNotesFocused, setIsNotesFocused] = useState(false);

  const handleFieldChange = (field: keyof CustomerFormValues, text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    if (errors[field as keyof CustomerFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError && onClearSubmitError) {
      onClearSubmitError();
    }
  };

  const handleToggleActive = (val: boolean) => {
    setValues((prev) => ({ ...prev, isActive: val }));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const validation = validateCustomerForm(values);
    if (!validation.isValid || !validation.sanitized) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit({
      ...validation.sanitized,
      ...(isEditMode ? { is_active: values.isActive } : {}),
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Error Banner */}
      {submitError ? (
        <DashboardErrorBanner
          message={submitError}
          onRetry={handleSubmit}
          onDismiss={onClearSubmitError}
        />
      ) : null}

      {/* Main Form Card */}
      <View style={[styles.card, isNarrowPhone && styles.cardCompact]}>
        {/* Customer Name (Required) */}
        <TindaMateInput
          label="Customer Name *"
          value={values.name}
          onChangeText={(t) => handleFieldChange('name', t)}
          placeholder="e.g. Aling Nena or Juan Dela Cruz"
          autoCapitalize="words"
          accessibilityLabel="Customer Name, required"
          errorMessage={errors.name}
          returnKeyType="next"
        />

        {/* Contact Phone (Optional) */}
        <TindaMateInput
          label="Mobile / Phone Number"
          value={values.phone}
          onChangeText={(t) => handleFieldChange('phone', t)}
          placeholder="e.g. 0917 123 4567"
          keyboardType="phone-pad"
          accessibilityLabel="Customer phone number"
          errorMessage={errors.phone}
          returnKeyType="next"
        />

        {/* Notes (Optional Multiline) */}
        <View style={styles.fieldGroup}>
          <Text
            style={[styles.label, isNotesFocused && styles.labelFocused]}>
            Notes / Landmark (Optional)
          </Text>
          <TextInput
            value={values.notes}
            onChangeText={(t) => handleFieldChange('notes', t)}
            placeholder="e.g. Suki sa kanto, tapat ng barangay hall"
            placeholderTextColor={Colors.textPlaceholder}
            accessibilityLabel="Customer notes"
            editable={!isSubmitting}
            multiline
            numberOfLines={3}
            onFocus={() => setIsNotesFocused(true)}
            onBlur={() => setIsNotesFocused(false)}
            style={[
              styles.notesInput,
              isNotesFocused && styles.notesInputFocused,
            ]}
            maxLength={300}
          />
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>
              Helpful store notes, location, or relationship details.
            </Text>
            <Text style={styles.charCounter}>{values.notes.length}/300</Text>
          </View>
        </View>

        {/* Status Switch (Edit Mode Only) */}
        {isEditMode ? (
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Customer Status</Text>
              <Text style={styles.switchSubtitle}>
                {values.isActive
                  ? 'Active — Can record new utang'
                  : 'Inactive — Hidden from quick POS selection'}
              </Text>
            </View>
            <Switch
              value={values.isActive}
              onValueChange={handleToggleActive}
              trackColor={{
                false: Colors.border,
                true: Colors.primaryLight,
              }}
              thumbColor={values.isActive ? Colors.primaryDark : Colors.textMuted}
              disabled={isSubmitting}
            />
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionsRow, isNarrowPhone && styles.actionsRowNarrow]}>
        <View style={styles.buttonFlex}>
          <TindaMateButton
            title={isSubmitting ? submittingLabel : submitLabel}
            variant="primary"
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityLabel={submitLabel}
          />
        </View>

        {onCancel ? (
          <View style={styles.buttonFlex}>
            <TindaMateButton
              title="Cancel"
              variant="secondary"
              onPress={onCancel}
              disabled={isSubmitting}
              accessibilityLabel="Cancel changes"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.four,
    ...Shadows.xs,
  },
  cardCompact: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  labelFocused: {
    color: Colors.primary,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  helperText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  charCounter: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  notesInput: {
    minHeight: 84,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    fontSize: Typography.sizes.body,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  notesInputFocused: {
    borderColor: Colors.borderFocused,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: Spacing.three,
  },
  switchInfo: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
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

