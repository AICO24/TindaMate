import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { GoogleGIcon } from './AuthIcons';
import {
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * GoogleSignInButton
 *
 * Renders the official "Continue with Google" pill button matching TindaMateButton's
 * geometry and elevation tokens with real authentication integration.
 */
export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
  label = 'Continue with Google',
  style,
}: GoogleSignInButtonProps) {
  const isInteractive = !loading && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && isInteractive && styles.buttonPressed,
        !isInteractive && styles.buttonDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <>
          <GoogleGIcon size={IconSizes.md} />
          <Text style={styles.buttonText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.twoHalf,
    backgroundColor: Colors.surface,
    borderWidth: 1.4,
    borderColor: Colors.border,
    paddingVertical: 13,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.full,
    ...Shadows.xs,
  },
  buttonPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.disabled,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semiBold,
  },
});
