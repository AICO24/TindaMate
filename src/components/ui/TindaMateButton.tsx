import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export type TindaMateButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type TindaMateButtonProps = {
  /** Text displayed inside the button */
  title: string;
  /** Function triggered when the button is pressed */
  onPress: () => void;
  /** Visual hierarchy variant (default: 'primary') */
  variant?: TindaMateButtonVariant;
  /** Whether an async action is in progress (shows spinner & disables duplicate presses) */
  loading?: boolean;
  /** Whether to append a right arrow indicator (→) */
  showArrow?: boolean;
  /** Optional custom accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Optional flag to disable interactions */
  disabled?: boolean;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Optional custom text style */
  textStyle?: StyleProp<TextStyle>;
};

/**
 * TindaMateButton
 *
 * Unified design-system button component used across Welcome, Login, Register,
 * Dashboard, and future business modules:
 * - 'primary': Solid TindaMate green pill button with high contrast and soft elevation
 * - 'secondary': Outlined TindaMate green pill button on clean surface
 * - 'ghost': Subtle text/link action button
 * - 'danger': Soft destructive action button (e.g., Log Out)
 */
export function TindaMateButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  showArrow = false,
  accessibilityLabel,
  disabled = false,
  style,
  textStyle,
}: TindaMateButtonProps) {
  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === 'primary'
      ? Colors.textInverse
      : variant === 'danger'
      ? Colors.error
      : Colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && !isDisabled && variant === 'primary' && styles.primaryPressed,
        pressed && !isDisabled && variant === 'secondary' && styles.secondaryPressed,
        pressed && !isDisabled && variant === 'ghost' && styles.ghostPressed,
        pressed && !isDisabled && variant === 'danger' && styles.dangerPressed,
        isDisabled && variant === 'primary' && styles.primaryDisabled,
        isDisabled && variant !== 'primary' && styles.nonPrimaryDisabled,
        style,
      ]}>
      <View style={styles.contentRow}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={spinnerColor}
            style={styles.spinner}
          />
        )}
        <Text
          style={[
            styles.baseText,
            variant === 'primary' && styles.primaryText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'ghost' && styles.ghostText,
            variant === 'danger' && styles.dangerText,
            isDisabled && variant === 'primary' && styles.primaryTextDisabled,
            textStyle,
          ]}>
          {title}
        </Text>
        {showArrow && !loading && (
          <Text
            style={[
              styles.arrowText,
              variant === 'primary' ? styles.primaryText : styles.secondaryText,
            ]}>
            →
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  spinner: {
    marginRight: 2,
  },
  // Primary Variant
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.primaryButton,
  },
  primaryPressed: {
    backgroundColor: Colors.primaryPressed,
    transform: [{ scale: 0.985 }],
  },
  primaryDisabled: {
    backgroundColor: Colors.disabled,
    ...Shadows.none,
  },
  // Secondary Outlined Variant
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1.8,
    borderColor: Colors.primary,
  },
  secondaryPressed: {
    backgroundColor: Colors.primaryLight,
    transform: [{ scale: 0.985 }],
  },
  // Ghost / Tertiary Text Variant
  ghost: {
    minHeight: 40,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    opacity: 0.65,
  },
  // Danger / Destructive Variant
  danger: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  dangerPressed: {
    backgroundColor: '#FECACA',
    transform: [{ scale: 0.985 }],
  },
  nonPrimaryDisabled: {
    opacity: 0.6,
  },
  // Typography
  baseText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  primaryText: {
    color: Colors.textInverse,
  },
  primaryTextDisabled: {
    color: Colors.disabledText,
  },
  secondaryText: {
    color: Colors.primary,
  },
  ghostText: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  dangerText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.error,
  },
  arrowText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    marginLeft: 2,
  },
});

export default TindaMateButton;


