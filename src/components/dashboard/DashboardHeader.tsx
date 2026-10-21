import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProfileAvatarIcon } from './DashboardNavIcons';
import { TindaMateCartLogo } from '@/components/ui/TindaMateCartLogo';
import {
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
} from '@/constants/theme';

interface DashboardHeaderProps {
  userEmail?: string;
  onProfilePress: () => void;
}

/**
 * DashboardHeader
 *
 * Prominent top identity bar matching the TindaMate design system:
 * - Left-aligned TindaMate Cart & Sprouting Leaves emblem + tagline
 * - Elevated circular white profile button with crisp dark green vector avatar
 */
export function DashboardHeader({
  onProfilePress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Prominent Brand Logo & Tagline */}
      <View style={styles.logoWrapper}>
        <TindaMateCartLogo scale={0.96} showTagline={true} align="left" />
      </View>

      {/* Profile Circle Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open user profile and store settings"
        accessibilityHint="Opens store account and profile modal"
        onPress={onProfilePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.avatarButtonPressed,
        ]}>
        <ProfileAvatarIcon size={IconSizes.md} color={Colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.twoHalf,
  },
  logoWrapper: {
    alignItems: 'flex-start',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  avatarButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
  },
});

