import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { GoogleGIcon } from './AuthIcons';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

interface GoogleSignInButtonProps {
  onPress?: () => void;
}

/**
 * GoogleSignInButton
 *
 * Renders the "Continue with Google" button matching the approved reference design.
 * UI only - notifies the user that third-party authentication will be available in an upcoming release.
 */
export function GoogleSignInButton({ onPress }: GoogleSignInButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    const message = 'Google authentication is a UI-only preview in Batch 3A and will be connected in a future update.';
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
      <GoogleGIcon size={20} />
      <Text style={styles.buttonText}>Continue with Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: Colors.border,
    paddingVertical: 13,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semiBold,
  },
});

