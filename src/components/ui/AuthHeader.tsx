import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ChevronLeftIcon } from './AuthIcons';
import { TindaMateCartLogo } from './TindaMateCartLogo';
import {
  AuthMaxContentWidth,
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
} from '@/constants/theme';

interface AuthHeaderProps {
  /** Optional custom back handler */
  onBack?: () => void;
  /** Whether to show the back button (default: true) */
  showBack?: boolean;
}

/**
 * AuthHeader
 *
 * Unified authentication navigation header used across Login and Register screens:
 * - Warm soft backdrop curve connecting Welcome, Login, Register, and Dashboard
 * - Accessible circular back button on the left
 * - Centered official TindaMate Cart & Sprouting Leaves emblem + tagline
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
    <View style={styles.outerWrapper}>
      <View style={styles.container}>
        {/* Back Button Area */}
        <View style={styles.sideSlot}>
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
              <ChevronLeftIcon size={IconSizes.nav} color={Colors.primaryDark} />
            </Pressable>
          )}
        </View>

        {/* Centered Official TindaMate Cart Logo & Tagline */}
        <View style={styles.centerSlot}>
          <TindaMateCartLogo scale={0.95} showTagline={true} />
        </View>

        {/* Right spacer to balance the back button */}
        <View style={styles.sideSlot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    backgroundColor: Colors.backgroundWarm,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  container: {
    width: '100%',
    maxWidth: AuthMaxContentWidth + Spacing.four * 2,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.twoHalf,
    paddingBottom: Spacing.three,
  },
  sideSlot: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xs,
  },
  backButtonPressed: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.96 }],
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


