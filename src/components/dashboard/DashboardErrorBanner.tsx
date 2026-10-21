import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

interface DashboardErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * DashboardErrorBanner
 *
 * Non-intrusive error & retry notification banner for the Dashboard:
 * - Alerts store vendor when store data sync or network request fails
 * - Provides a clear, high-contrast Retry action button with generous touch target
 * - Accessible with accessibilityRole="alert" and accessibilityLiveRegion="polite"
 */
export function DashboardErrorBanner({
  message,
  onRetry,
  onDismiss,
}: DashboardErrorBannerProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      {/* Left Icon + Message Text */}
      <View style={styles.messageRow}>
        <View style={styles.errorIconCircle} importantForAccessibility="no">
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text
          style={styles.messageText}
          numberOfLines={2}
          maxFontSizeMultiplier={1.3}>
          {message}
        </Text>
      </View>

      {/* Right Actions: Retry Button & Optional Dismiss */}
      <View style={styles.actionsRow}>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry syncing store data"
            accessibilityHint="Retries loading store overview data"
            onPress={onRetry}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}>
            <Text style={styles.retryButtonText} maxFontSizeMultiplier={1.25}>
              Retry
            </Text>
          </Pressable>
        ) : null}

        {onDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss error message"
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed,
            ]}>
            <Text style={styles.dismissButtonText} importantForAccessibility="no">
              ✕
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.errorLight,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    ...Shadows.xs,
  },
  messageRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorIconCircle: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: Typography.weights.extraBold,
    lineHeight: 14,
  },
  messageText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.tight,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  retryButton: {
    backgroundColor: Colors.error,
    paddingVertical: 5,
    paddingHorizontal: Spacing.twoHalf,
    borderRadius: BorderRadius.full,
  },
  retryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  retryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  dismissButton: {
    padding: Spacing.xxs,
  },
  dismissButtonPressed: {
    opacity: 0.6,
  },
  dismissButtonText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});

