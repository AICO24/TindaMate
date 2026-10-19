import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

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
    backgroundColor: '#2563EB', // Primary brand blue
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // Mobile elevation & shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: '#1D4ED8', // Darker blue when pressed
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1', // Slate 300
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: '#94A3B8', // Slate 400
  },
});

export default TindaMateButton;

