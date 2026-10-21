import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import {
  PickedImageAsset,
  ProductImagePicker,
} from '@/components/products/ProductImagePicker';
import { StockStatusBadge } from '@/components/products/StockStatusBadge';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateInput } from '@/components/ui/TindaMateInput';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import {
  getProductStockStatus,
  uploadProductImage,
  validateProductForm,
} from '@/lib/products';
import {
  COMMON_PRODUCT_UNITS,
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_PRODUCT_UNIT,
  ProductFormErrors,
  ProductFormValues,
  ValidatedProductInput,
} from '@/types/product';

const QUICK_CATEGORIES = [
  'Beverages',
  'Canned Goods',
  'Instant Noodles',
  'Snacks',
  'Condiments',
  'Rice & Grains',
  'Personal Care',
  'Household',
] as const;

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  submitError: string | null;
  onClearSubmitError?: () => void;
  onSubmit: (validated: ValidatedProductInput) => Promise<void> | void;
  onCancel?: () => void;
}

/**
 * ProductForm
 *
 * Shared, mobile-first form for creating and editing store products.
 * - Uses TindaMateInput and TindaMateButton design-system components
 * - Displays live Stock Status calculation based on Stock Quantity & Low-Stock Threshold
 * - Provides quick-select category & unit chips alongside freeform input for fast sari-sari store entry
 * - Prevents duplicate submissions and preserves user input if saving fails
 */
export function ProductForm({
  initialValues,
  submitLabel,
  submittingLabel,
  isSubmitting,
  submitError,
  onClearSubmitError,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 360;

  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? '',
    category: initialValues?.category ?? '',
    imageUrl: initialValues?.imageUrl ?? '',
    sellingPrice: initialValues?.sellingPrice ?? '',
    costPrice: initialValues?.costPrice ?? '',
    stockQuantity: initialValues?.stockQuantity ?? '0',
    lowStockThreshold:
      initialValues?.lowStockThreshold ?? String(DEFAULT_LOW_STOCK_THRESHOLD),
    unit: initialValues?.unit ?? DEFAULT_PRODUCT_UNIT,
  });

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [pendingImageAsset, setPendingImageAsset] = useState<PickedImageAsset | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);

  const updateField = <K extends keyof ProductFormValues>(
    field: K,
    nextValue: ProductFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError && onClearSubmitError) {
      onClearSubmitError();
    }
  };

  const handleImageSelected = (asset: PickedImageAsset) => {
    setPendingImageAsset(asset);
    setPhotoUploadError(null);
    updateField('imageUrl', asset.uri);
  };

  const handleImageRemoved = () => {
    setPendingImageAsset(null);
    setPhotoUploadError(null);
    updateField('imageUrl', '');
  };

  // Compute live preview of Stock Status from current numeric inputs
  const previewStock = Number(values.stockQuantity.trim());
  const previewThreshold = Number(values.lowStockThreshold.trim());
  const liveStockStatus = getProductStockStatus(
    Number.isFinite(previewStock) && values.stockQuantity.trim() !== ''
      ? previewStock
      : 0,
    Number.isFinite(previewThreshold) && values.lowStockThreshold.trim() !== ''
      ? previewThreshold
      : DEFAULT_LOW_STOCK_THRESHOLD
  );

  const handleSavePress = async () => {
    if (isSubmitting || isUploadingPhoto) return;

    const validation = validateProductForm(values);
    if (!validation.isValid || !validation.sanitized) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    let finalImageUrl = validation.sanitized.image_url;

    // If vendor snapped or selected a new local image, upload to Supabase Storage first
    if (pendingImageAsset) {
      try {
        setIsUploadingPhoto(true);
        setPhotoUploadError(null);
        finalImageUrl = await uploadProductImage(
          pendingImageAsset.uri,
          pendingImageAsset.base64,
          pendingImageAsset.mimeType
        );
      } catch (uploadErr: unknown) {
        const msg =
          uploadErr instanceof Error
            ? uploadErr.message
            : 'Hindi mai-upload ang litrato sa storage. Pakisuri ang internet connection.';
        setPhotoUploadError(msg);
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    await onSubmit({
      ...validation.sanitized,
      image_url: finalImageUrl,
    });
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

      {/* Section 1: Basic Product Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Product Information
        </Text>
        <Text style={styles.sectionSubtitle}>
          Enter the product name and optional category for easy scanning.
        </Text>

        <TindaMateInput
          label="Product Name *"
          placeholder="e.g., Lucky Me! Pancit Canton Original"
          value={values.name}
          onChangeText={(text) => updateField('name', text)}
          autoCapitalize="words"
          returnKeyType="next"
          errorMessage={errors.name}
          accessibilityLabel="Product Name, required"
        />

        <TindaMateInput
          label="Category (Optional)"
          placeholder="e.g., Instant Noodles, Beverages, Canned Goods"
          value={values.category}
          onChangeText={(text) => updateField('category', text)}
          autoCapitalize="words"
          returnKeyType="next"
          errorMessage={errors.category}
          accessibilityLabel="Product Category, optional"
          style={styles.inputWithChipsMargin}
        />

        {/* Quick Category Chips */}
        <View style={styles.chipsBlock}>
          <Text style={styles.chipsHelperLabel}>Quick select category:</Text>
          <View style={styles.chipsWrap}>
            {QUICK_CATEGORIES.map((cat) => {
              const isSelected =
                values.category.trim().toLowerCase() === cat.toLowerCase();
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Category ${cat}`}
                  onPress={() =>
                    updateField('category', isSelected ? '' : cat)
                  }
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
        </View>

        {/* Photo Upload Error Banner if storage fails */}
        {photoUploadError ? (
          <DashboardErrorBanner
            message={photoUploadError}
            onDismiss={() => setPhotoUploadError(null)}
          />
        ) : null}

        {/* Senior-friendly Camera & Gallery Photo Picker */}
        <ProductImagePicker
          currentImageUrl={values.imageUrl}
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
          disabled={isSubmitting || isUploadingPhoto}
        />

        {/* Optional Manual URL Link Input Toggle */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle manual image web link input"
          onPress={() => setShowManualUrlInput((prev) => !prev)}
          style={styles.manualUrlToggle}>
          <Text style={styles.manualUrlToggleText}>
            {showManualUrlInput
              ? '▾ Hide manual URL link'
              : '▸ Or paste image URL from web (Optional)'}
          </Text>
        </Pressable>

        {showManualUrlInput ? (
          <TindaMateInput
            label="Image Web URL (Optional)"
            placeholder="https://example.com/product.jpg"
            value={values.imageUrl}
            onChangeText={(text) => {
              setPendingImageAsset(null);
              updateField('imageUrl', text);
            }}
            autoCapitalize="none"
            keyboardType="default"
            returnKeyType="next"
            errorMessage={errors.imageUrl}
            accessibilityLabel="Product Image URL, optional"
          />
        ) : null}
      </View>

      {/* Section 2: Pricing */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Pricing (₱)
        </Text>
        <Text style={styles.sectionSubtitle}>
          Set your store selling price and optional cost price per unit.
        </Text>

        <View style={[styles.twoColumnRow, isNarrowPhone && styles.twoColumnStacked]}>
          <View style={styles.columnField}>
            <TindaMateInput
              label="Selling Price (₱) *"
              placeholder="0.00"
              value={values.sellingPrice}
              onChangeText={(text) => updateField('sellingPrice', text)}
              keyboardType="decimal-pad"
              returnKeyType="next"
              errorMessage={errors.sellingPrice}
              accessibilityLabel="Selling Price in Pesos, required"
              style={styles.zeroBottomMargin}
            />
          </View>

          <View style={styles.columnField}>
            <TindaMateInput
              label="Cost Price (₱, Optional)"
              placeholder="0.00"
              value={values.costPrice}
              onChangeText={(text) => updateField('costPrice', text)}
              keyboardType="decimal-pad"
              returnKeyType="next"
              errorMessage={errors.costPrice}
              accessibilityLabel="Cost Price in Pesos, optional"
              style={styles.zeroBottomMargin}
            />
          </View>
        </View>
      </View>

      {/* Section 3: Stock & Inventory Threshold */}
      <View style={styles.sectionCard}>
        <View style={styles.stockHeaderRow}>
          <View style={styles.stockHeaderTextCol}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Inventory & Stock Alert
            </Text>
            <Text style={styles.sectionSubtitle}>
              Track available quantity and when TindaMate flags low stock.
            </Text>
          </View>
          <StockStatusBadge status={liveStockStatus} size="md" />
        </View>

        <View style={[styles.twoColumnRow, isNarrowPhone && styles.twoColumnStacked]}>
          <View style={styles.columnField}>
            <TindaMateInput
              label="Current Stock *"
              placeholder="0"
              value={values.stockQuantity}
              onChangeText={(text) => updateField('stockQuantity', text)}
              keyboardType="number-pad"
              returnKeyType="next"
              errorMessage={errors.stockQuantity}
              accessibilityLabel="Current Stock Quantity, required"
              style={styles.zeroBottomMargin}
            />
          </View>

          <View style={styles.columnField}>
            <TindaMateInput
              label="Low-Stock Alert Level *"
              placeholder="5"
              value={values.lowStockThreshold}
              onChangeText={(text) => updateField('lowStockThreshold', text)}
              keyboardType="number-pad"
              returnKeyType="next"
              errorMessage={errors.lowStockThreshold}
              accessibilityLabel="Low-Stock Threshold, required"
              style={styles.zeroBottomMargin}
            />
          </View>
        </View>

        <View style={styles.thresholdHintBox}>
          <Text style={styles.thresholdHintText} maxFontSizeMultiplier={1.25}>
            Status rule: <Text style={styles.boldText}>0</Text> = Out of Stock ·{' '}
            <Text style={styles.boldText}>
              1 to {values.lowStockThreshold.trim() || '0'}
            </Text>{' '}
            = Low Stock ·{' '}
            <Text style={styles.boldText}>
              Above {values.lowStockThreshold.trim() || '0'}
            </Text>{' '}
            = In Stock
          </Text>
        </View>

        {/* Unit Input + Quick Unit Chips */}
        <TindaMateInput
          label="Unit of Measure"
          placeholder="pcs"
          value={values.unit}
          onChangeText={(text) => updateField('unit', text)}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleSavePress}
          errorMessage={errors.unit}
          accessibilityLabel="Unit of measure, defaults to pcs"
          style={styles.inputWithChipsMargin}
        />

        <View style={styles.chipsBlock}>
          <Text style={styles.chipsHelperLabel}>Common units:</Text>
          <View style={styles.chipsWrap}>
            {COMMON_PRODUCT_UNITS.map((unitOption) => {
              const isSelected =
                values.unit.trim().toLowerCase() === unitOption.toLowerCase();
              return (
                <Pressable
                  key={unitOption}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Unit ${unitOption}`}
                  onPress={() => updateField('unit', unitOption)}
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
                    {unitOption}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Form Actions */}
      <View style={styles.actionsBlock}>
        <TindaMateButton
          title={
            isUploadingPhoto
              ? 'Uploading photo...'
              : isSubmitting
              ? submittingLabel
              : submitLabel
          }
          variant="primary"
          loading={isSubmitting || isUploadingPhoto}
          disabled={isSubmitting || isUploadingPhoto}
          onPress={handleSavePress}
          accessibilityLabel={submitLabel}
        />

        {onCancel ? (
          <TindaMateButton
            title="Cancel"
            variant="ghost"
            disabled={isSubmitting || isUploadingPhoto}
            onPress={onCancel}
            accessibilityLabel="Cancel and go back"
          />
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
    padding: Spacing.three,
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
  stockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  stockHeaderTextCol: {
    flex: 1,
    minWidth: 180,
    gap: 2,
  },
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.twoHalf,
  },
  twoColumnStacked: {
    flexDirection: 'column',
    gap: Spacing.twoHalf,
  },
  columnField: {
    flex: 1,
    width: '100%',
  },
  zeroBottomMargin: {
    marginBottom: 0,
  },
  inputWithChipsMargin: {
    marginBottom: Spacing.one,
  },
  chipsBlock: {
    gap: Spacing.one,
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
  },
  chip: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
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
  thresholdHintBox: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.two,
  },
  thresholdHintText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    lineHeight: Typography.lineHeights.tight,
  },
  boldText: {
    fontWeight: Typography.weights.extraBold,
  },
  manualUrlToggle: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.half,
  },
  manualUrlToggleText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  actionsBlock: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});

