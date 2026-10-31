import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BellNotificationIcon, ProfileAvatarIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

interface DashboardHeaderProps {
  userEmail?: string;
  onProfilePress: () => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

/**
 * DashboardHeader (TindaMate Design 2.0)
 *
 * Prominent top store identity bar on deep forest green hero backdrop:
 * - Warm orange TindaMate shopping bag badge ("T") + bold white wordmark + tagline
 * - Notification bell indicator (displays low-stock alert badge count when > 0)
 * - Profile circle button
 */
export function DashboardHeader({
  onProfilePress,
  notificationCount = 0,
  onNotificationPress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left: Brand Bag Emblem + Wordmark + Tagline */}
      <View style={styles.brandRow}>
        <View
          style={styles.bagBadge}
          accessible={false}
          importantForAccessibility="no-hide-descendants">
          <View style={styles.bagHandle} />
          <View style={styles.bagBody}>
            <Text style={styles.bagLetter}>T</Text>
          </View>
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.brandTitle} maxFontSizeMultiplier={1.2}>
            Tinda<Text style={styles.brandTitleAccent}>Mate</Text>
          </Text>
          <Text style={styles.brandTagline} maxFontSizeMultiplier={1.15}>
            Your Digital Tindahan Assistant
          </Text>
        </View>
      </View>

      {/* Right: Notification Bell + Profile Avatar */}
      <View style={styles.rightActions}>
        {onNotificationPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              notificationCount > 0
                ? `Store alerts, ${notificationCount} items low in stock`
                : 'Store alerts and notifications'
            }
            onPress={onNotificationPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}>
            <BellNotificationIcon size={19} color={Colors.textInverse} />
            {notificationCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open user profile and store settings"
          accessibilityHint="Opens store account and profile modal"
          onPress={onProfilePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.iconButtonPressed,
          ]}>
          <ProfileAvatarIcon size={IconSizes.md} color={Colors.primaryDark} />
        </Pressable>
      </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    flex: 1,
  },
  bagBadge: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bagHandle: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: Colors.accentWarm,
    marginBottom: -1,
  },
  bagBody: {
    width: 36,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  bagLetter: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.5,
  },
  titleCol: {
    flex: 1,
    gap: 1,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: -0.4,
  },
  brandTitleAccent: {
    color: '#A7F3D0',
  },
  brandTagline: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: Typography.weights.medium,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    ...Shadows.xs,
  },
  iconButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
});

