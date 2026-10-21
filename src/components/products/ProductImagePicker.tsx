import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import {
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface PickedImageAsset {
  uri: string;
  base64?: string | null;
  mimeType?: string;
}

interface ProductImagePickerProps {
  currentImageUrl?: string | null;
  onImageSelected: (asset: PickedImageAsset) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

/**
 * ProductImagePicker
 *
 * Senior-vendor-friendly, accessible camera & gallery image picker:
 * - Direct "Take Photo" (Camera) and "Choose from Gallery" actions
 * - Big, high-contrast touch targets ideal for small-store owners
 * - Immediate live preview with remove button
 * - Handles camera and gallery permissions gracefully
 */
export function ProductImagePicker({
  currentImageUrl,
  onImageSelected,
  onImageRemoved,
  disabled = false,
}: ProductImagePickerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 360;
  const [isPicking, setIsPicking] = useState(false);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      const msg = 'Camera permission is required to take product photos.';
      Alert.alert('Camera Permission Required', msg, [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      const msg = 'Gallery access is required to select product pictures.';
      Alert.alert('Gallery Permission Required', msg, [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    if (disabled || isPicking) return;
    try {
      setIsPicking(true);
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onImageSelected({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
      }
    } catch (err: unknown) {
      console.warn('[Camera Launch Error]:', err);
      Alert.alert(
        'Camera Error',
        'Unable to open device camera. You can choose from your gallery instead.'
      );
    } finally {
      setIsPicking(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (disabled || isPicking) return;
    try {
      setIsPicking(true);
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onImageSelected({
          uri: asset.uri,
          base64: asset.base64,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
      }
    } catch (err: unknown) {
      console.warn('[Gallery Launch Error]:', err);
      Alert.alert(
        'Gallery Error',
        'Unable to open photo gallery. Please try again.'
      );
    } finally {
      setIsPicking(false);
    }
  };

  const hasPhoto = Boolean(currentImageUrl && currentImageUrl.trim().length > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.label} accessibilityRole="header">
        Product Photo
      </Text>
      <Text style={styles.helperText}>
        Take a photo of the product using the camera or choose from your gallery.
      </Text>

      {/* Photo Preview Container if photo is present */}
      {hasPhoto ? (
        <View style={styles.previewCard}>
          <Image
            source={{ uri: currentImageUrl! }}
            style={styles.previewImage}
            contentFit="cover"
            transition={200}
            accessibilityLabel="Selected product photo preview"
          />

          <View style={styles.previewOverlayActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove this product photo"
              onPress={onImageRemoved}
              disabled={disabled}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.removeButton,
                pressed && styles.removeButtonPressed,
              ]}>
              <Text style={styles.removeButtonText}>✕ Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Action Buttons Row */}
      <View
        style={[
          styles.buttonsRow,
          isNarrowPhone && styles.buttonsRowNarrow,
        ]}>
        {/* Button 1: Take Photo */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take Photo with camera"
          accessibilityHint="Opens device camera to snap product picture"
          disabled={disabled || isPicking}
          onPress={handleTakePhoto}
          style={({ pressed }) => [
            styles.actionButton,
            styles.cameraButton,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
          ]}>
          {isPicking ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <>
              <Text style={styles.actionIcon} importantForAccessibility="no">
                📷
              </Text>
              <Text style={styles.cameraButtonText} maxFontSizeMultiplier={1.2}>
                Take Photo
              </Text>
            </>
          )}
        </Pressable>

        {/* Button 2: Choose from Gallery */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose photo from device gallery"
          accessibilityHint="Opens photo library to pick product picture"
          disabled={disabled || isPicking}
          onPress={handlePickFromGallery}
          style={({ pressed }) => [
            styles.actionButton,
            styles.galleryButton,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
          ]}>
          <Text style={styles.actionIcon} importantForAccessibility="no">
            🖼️
          </Text>
          <Text style={styles.galleryButtonText} maxFontSizeMultiplier={1.2}>
            Choose from Gallery
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.one,
  },
  label: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.tight,
    marginBottom: Spacing.one,
  },
  previewCard: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1.4,
    borderColor: Colors.border,
    marginBottom: Spacing.two,
    position: 'relative',
    ...Shadows.xs,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlayActions: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  removeButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  removeButtonPressed: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  removeButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonsRowNarrow: {
    flexDirection: 'column',
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.md,
    gap: Spacing.one,
  },
  cameraButton: {
    backgroundColor: Colors.primary,
    ...Shadows.xs,
  },
  galleryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    fontSize: IconSizes.sm,
  },
  cameraButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  galleryButtonText: {
    color: Colors.primary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
});

