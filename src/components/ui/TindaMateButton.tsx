import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { BorderRadius, Colors, Typography } from '@/constants/theme';

export type TindaMateButtonProps = {
  /** Text displayed inside the button */
  title: string;
  /** Function triggered when the button is pressed */
  onPress: () => void;
  /** Optional custom accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Optional flag to disable interactions */
  disabled?: boolean;
};

/**
 * TindaMateButton
 *
 * A reusable, accessible button component styled for TindaMate.
 * Provides touch feedback (color change & subtle press-down scale).
 */
export function TindaMateButton({
  title,
  onPress,
  accessibilityLabel,
  disabled = false,
}: TindaMateButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}>
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Mobile elevation & shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: Colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  buttonTextDisabled: {
    color: Colors.disabledText,
  },
});

export default TindaMateButton;

