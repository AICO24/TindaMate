import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
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
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

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
 * A high-fidelity form input component designed after the approved TindaMate reference UI.
 * Features a stacked layout (left icon, label, input text, and optional right password toggle),
 * along with responsive focus states and clear validation error messaging.
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

  const hasError = Boolean(errorMessage);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Outer Card Container */}
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          hasError && styles.containerError,
        ]}>
        {/* Left Icon */}
        {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

        {/* Input & Label Content Area */}
        <View style={styles.inputArea}>
          <Text
            style={[
              styles.label,
              isFocused && styles.labelFocused,
              hasError && styles.labelError,
            ]}>
            {label}
          </Text>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => setShowPassword((prev) => !prev)}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.eyePressed]}>
            {showPassword ? (
              <EyeOffIcon size={20} color={hasError ? Colors.error : Colors.primary} />
            ) : (
              <EyeIcon size={20} color={Colors.textMuted} />
            )}
          </Pressable>
        )}
      </View>

      {/* Inline Validation Error Message */}
      {hasError && (
        <View style={styles.errorRow}>
          <AlertCircleIcon size={14} color={Colors.error} />
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1.2,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    minHeight: 58,
  },
  containerFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  iconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
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
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
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
    marginTop: 4,
    paddingHorizontal: Spacing.one,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
});

