import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ChevronLeftIcon } from './AuthIcons';
import { StorefrontLogo } from './StorefrontLogo';
import { Spacing } from '@/constants/theme';

interface AuthHeaderProps {
  /** Optional custom back handler */
  onBack?: () => void;
  /** Whether to show the back button (default: true) */
  showBack?: boolean;
}

/**
 * AuthHeader
 *
 * Renders the top navigation bar with the back arrow button and the centered
 * TindaMate storefront logo, wordmark, and tagline matching the reference image.
 */
export function AuthHeader({ onBack, showBack = true }: AuthHeaderProps) {
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
    <View style={styles.container}>
      {/* Back Button Area */}
      <View style={styles.sideSlot}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
            <ChevronLeftIcon size={22} color="#1F2937" />
          </Pressable>
        )}
      </View>

      {/* Centered Storefront Logo & Wordmark */}
      <View style={styles.centerSlot}>
        <StorefrontLogo scale={0.95} />
      </View>

      {/* Right spacer to balance the back button */}
      <View style={styles.sideSlot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  sideSlot: {
    width: 44,
    height: 44,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

