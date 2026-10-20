import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TindaMateCartLogo } from '@/components/ui/TindaMateCartLogo';
import { BorderRadius, Spacing } from '@/constants/theme';

interface DashboardHeaderProps {
  userEmail?: string;
  onProfilePress: () => void;
}

/**
 * DashboardHeader
 *
 * Top navigation bar of the TindaMate Dashboard:
 * - Brand emblem on the left
 * - User profile avatar button on the right
 */
export function DashboardHeader({
  userEmail,
  onProfilePress,
}: DashboardHeaderProps) {
  // Extract user initial
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <View style={styles.header}>
      {/* Brand Logo & Tagline */}
      <View style={styles.logoWrapper}>
        <TindaMateCartLogo scale={0.78} showTagline={true} />
      </View>

      {/* Profile Avatar Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open user profile and settings"
        onPress={onProfilePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.avatarButtonPressed,
        ]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: Spacing.two,
  },
  logoWrapper: {
    alignItems: 'flex-start',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: '#105B48',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    shadowColor: '#105B48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

