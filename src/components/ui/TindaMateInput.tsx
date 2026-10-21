import React, { useRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ReturnKeyTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import { AlertCircleIcon, EyeIcon, EyeOffIcon } from './AuthIcons';
import {
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface TindaMateInputProps {
  /** Label displayed above the input value */
  label: string;
  /** Controlled value */
  value: string;
  /** Change callback */
  onChangeText: (text: string) => void;
  /** Placeholder when empty */
  placeholder?: string;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Whether this is a password / secure entry field */
  isPassword?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Keyboard type (default: 'default') */
  keyboardType?: KeyboardTypeOptions;
  /** Auto capitalization */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto correct */
  autoCorrect?: boolean;
  /** Return key type */
  returnKeyType?: ReturnKeyTypeOptions;
  /** Submit callback */
  onSubmitEditing?: () => void;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * TindaMateInput
 *
 * Unified design-system form input component shared across Login, Register,
 * and future TindaMate store forms.
 * Features a full-card touch target, stacked label, left icon slot, right password toggle,
 * clear focus/error states, and reliable keyboard handling across Android, iOS, and Web.
 */
export function TindaMateInput({
  label,
  value,
  onChangeText,
  placeholder,
  leftIcon,
  isPassword = false,
  errorMessage,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  style,
  accessibilityLabel,
}: TindaMateInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasError = Boolean(errorMessage);

  /** Modern inputMode for rock-solid stability on Android & Web */
  const computedInputMode =
    keyboardType === 'email-address'
      ? 'email'
      : keyboardType === 'decimal-pad'
      ? 'decimal'
      : keyboardType === 'numeric' || keyboardType === 'number-pad'
      ? 'numeric'
      : 'text';

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Outer Card Container with full touch focus */}
      <Pressable
        onPress={handleContainerPress}
        accessible={false}
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          hasError && styles.containerError,
        ]}>
        {/* Left Icon Slot */}
        {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

        {/* Input & Label Content Area */}
        <View style={styles.inputArea} pointerEvents="box-none">
          <Text
            style={[
              styles.label,
              isFocused && styles.labelFocused,
              hasError && styles.labelError,
            ]}>
            {label}
          </Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textPlaceholder}
            secureTextEntry={isPassword && !showPassword}
            inputMode={computedInputMode}
            keyboardType={Platform.OS === 'ios' ? keyboardType : undefined}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            autoComplete={keyboardType === 'email-address' ? 'email' : undefined}
            textContentType={
              keyboardType === 'email-address'
                ? 'emailAddress'
                : isPassword
                ? 'password'
                : undefined
            }
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            accessibilityLabel={accessibilityLabel ?? label}
            style={styles.textInput}
          />
        </View>

        {/* Right Action Slot (Password Visibility Toggle) */}
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            onPress={() => setShowPassword((prev) => !prev)}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.eyePressed]}>
            {showPassword ? (
              <EyeOffIcon size={IconSizes.md} color={hasError ? Colors.error : Colors.primary} />
            ) : (
              <EyeIcon size={IconSizes.md} color={Colors.textSecondary} />
            )}
          </Pressable>
        )}
      </Pressable>

      {/* Inline Validation Error Message */}
      {hasError && (
        <View style={styles.errorRow} accessibilityRole="alert">
          <AlertCircleIcon size={IconSizes.xs} color={Colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.4,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    minHeight: 60,
  },
  containerFocused: {
    borderColor: Colors.borderFocused,
    backgroundColor: Colors.surface,
    ...Shadows.xs,
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  iconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.twoHalf,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textSecondary,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: Colors.primary,
  },
  labelError: {
    color: Colors.error,
  },
  textInput: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'android' ? 2 : 0,
    paddingHorizontal: 0,
    minHeight: 26,
    textAlignVertical: 'center',
  },
  eyeButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePressed: {
    opacity: 0.6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 5,
    paddingHorizontal: Spacing.one,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
});
