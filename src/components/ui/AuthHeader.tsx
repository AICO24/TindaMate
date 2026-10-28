import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ArrowLeftIcon } from './AuthIcons';
import { StorefrontLogo } from './StorefrontLogo';
import {
  AuthMaxContentWidth,
  Colors,
  Spacing,
} from '@/constants/theme';

interface AuthHeaderProps {
  /** Optional custom back handler */
  onBack?: () => void;
  /** Whether to show the back button (default: true) */
  showBack?: boolean;
  /** Optional logo scale multiplier (default: 1.02) */
  logoScale?: number;
}

/**
 * AuthHeader
 *
 * Unified authentication header matching the primary visual reference for Login & Register:
 * 1. Top navigation bar clearing the device notch / Dynamic Island with a clean back arrow (←)
 * 2. Prominent centered TindaMate Storefront Emblem & Tagline directly below
 */
export function AuthHeader({
  onBack,
  showBack = true,
  logoScale = 1.02,
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();
  // Guarantees clearance below Dynamic Island / status bar on both native devices and web mobile viewers
  const safeTopPadding = Math.max(insets.top, 42) + 4;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.outerWrapper, { paddingTop: safeTopPadding }]}>
      <View style={styles.container}>
        {/* Top Row: Back Navigation Arrow */}
        <View style={styles.navRow}>
          {showBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}>
              <ArrowLeftIcon size={24} color={Colors.primaryDark} />
            </Pressable>
          )}
        </View>

        {/* Brand Row: Prominent Centered TindaMate Storefront Logo */}
        <View style={styles.brandRow}>
          <StorefrontLogo scale={logoScale} layout="horizontal" align="center" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    maxWidth: AuthMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  navRow: {
    width: '100%',
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  brandRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: Spacing.two,
  },
});
