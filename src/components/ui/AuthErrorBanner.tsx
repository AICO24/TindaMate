import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertCircleIcon } from './AuthIcons';
import {
  BorderRadius,
  Colors,
  IconSizes,
  Spacing,
  Typography,
} from '@/constants/theme';

interface AuthErrorBannerProps {
  message: string | null;
}

/**
 * AuthErrorBanner
 *
 * Reusable alert banner for form/authentication errors across Login, Register,
 * and future data-entry screens.
 */
export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <AlertCircleIcon size={IconSizes.sm} color={Colors.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.twoHalf,
    marginBottom: Spacing.three,
  },
  text: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.tight,
  },
});

