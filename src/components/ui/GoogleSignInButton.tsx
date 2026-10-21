import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
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

interface GoogleSignInButtonProps {
  onPress?: () => void;
}

/**
 * GoogleSignInButton
 *
 * Renders the "Continue with Google" pill button matching TindaMateButton's
 * geometry and elevation tokens.
 * UI only - notifies the user that third-party authentication will be available in an upcoming release.
 */
export function GoogleSignInButton({ onPress }: GoogleSignInButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    const message =
      'Google authentication is a UI-only preview in Batch 3A and will be connected in a future update.';
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Google Sign-In', message, [{ text: 'Understood' }]);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}>
      <GoogleGIcon size={IconSizes.md} />
      <Text style={styles.buttonText}>Continue with Google</Text>
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
  buttonText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semiBold,
  },
});


