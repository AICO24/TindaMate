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
 * Production-quality form input matching the TindaMate visual reference:
 * - Strong top label with warm brand-dark contrast
 * - Elevated white card surface (#FFFFFF) with warm stone border (#E5E0D0) and 14pt radius
 * - Left icon slot + right password visibility toggle
 * - Crisp TindaMate green focus border (#0D7A4D) with subtle elevation
 * - Clear inline validation feedback
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
      {/* Top Field Label */}
      <Text
        style={[
          styles.label,
          isFocused && styles.labelFocused,
          hasError && styles.labelError,
        ]}>
        {label}
      </Text>

      {/* Input Card Container */}
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

        {/* Text Input */}
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

        {/* Right Action Slot (Password Visibility Toggle) */}
        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => setShowPassword((prev) => !prev)}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.eyePressed]}>
            {showPassword ? (
              <EyeOffIcon size={IconSizes.md} color={hasError ? Colors.error : Colors.primary} />
            ) : (
              <EyeIcon size={IconSizes.md} color={Colors.textMuted} />
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
    marginBottom: 18,
  },
  label: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  labelFocused: {
    color: Colors.primaryDark,
  },
  labelError: {
    color: Colors.error,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.4,
    borderColor: '#E5E0D0',
    paddingHorizontal: 14,
    height: 54,
    ...Shadows.xs,
  },
  containerFocused: {
    borderColor: Colors.primary,
    borderWidth: 1.8,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  iconSlot: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'android' ? 2 : 0,
    paddingHorizontal: 0,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.one,
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
