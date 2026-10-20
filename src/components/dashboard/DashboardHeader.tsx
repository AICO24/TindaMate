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
 * Prominent top identity bar matching the reference mockup:
 * - Full-sized, high-visibility TindaMate logo & tagline on left
 * - Premium white circular profile button with dark teal user avatar on right
 */
export function DashboardHeader({
  userEmail,
  onProfilePress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Prominent Brand Logo & Tagline */}
      <View style={styles.logoWrapper}>
        <TindaMateCartLogo scale={1.0} showTagline={true} />
      </View>

      {/* Profile Circle Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open user profile and store settings"
        onPress={onProfilePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.avatarButtonPressed,
        ]}>
        <Text style={styles.avatarIcon}>👤</Text>
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
    paddingBottom: Spacing.three,
  },
  logoWrapper: {
    alignItems: 'flex-start',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: '#F8FAFC',
  },
  avatarIcon: {
    fontSize: 20,
    color: '#064E3B',
  },
});
