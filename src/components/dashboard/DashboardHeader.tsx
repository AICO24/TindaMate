import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BellNotificationIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';

const TINDAMATE_EMBLEM = require('@/assets/images/tindamate-official-emblem.png');

interface DashboardHeaderProps {
  userEmail?: string;
  onProfilePress?: () => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

/**
 * DashboardHeader (TindaMate Showcase Alignment with Authentic Brand Assets)
 *
 * Visually matches Screen 1 of TindaMate POS App Showcase.png:
 * - Uses the authentic TindaMate Storefront Emblem ("T" shaped tindahan with orange awning & green leaf)
 * - Clear single safe-area top clearance
 * - Bold white "Tinda" + vibrant orange "Mate" wordmark + soft mint tagline
 * - Clean unboxed white notification bell with red alert badge
 */
export function DashboardHeader({
  notificationCount = 0,
  onNotificationPress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left: Authentic TindaMate Brand Emblem + Wordmark + Tagline */}
      <View style={styles.brandRow}>
        <View style={styles.emblemContainer}>
          <Image
            source={TINDAMATE_EMBLEM}
            style={styles.emblemImage}
            resizeMode="contain"
            accessibilityLabel="TindaMate Logo"
          />
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.brandTitle} maxFontSizeMultiplier={1.2}>
            Tinda<Text style={styles.brandTitleOrange}>Mate</Text>
          </Text>
          <Text style={styles.brandTagline} maxFontSizeMultiplier={1.15}>
            Your Digital Tindahan Assistant
          </Text>
        </View>
      </View>

      {/* Right: Clean Unboxed Notification Bell with Red Badge (Showcase 1:1) */}
      <View style={styles.rightActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            notificationCount > 0
              ? `Store alerts, ${notificationCount} items low in stock`
              : 'Store alerts and notifications'
          }
          onPress={onNotificationPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}>
          <BellNotificationIcon size={24} color={Colors.textInverse} />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
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
    paddingBottom: Spacing.twoHalf,
    position: 'relative',
    zIndex: 5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 260,
  },
  emblemContainer: {
    width: 52,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemImage: {
    width: 50,
    height: 36,
  },
  titleCol: {
    gap: 1.5,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  brandTitleOrange: {
    color: '#FB923C',
  },
  brandTagline: {
    fontSize: 11.5,
    color: '#D1FAE5',
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: Colors.textInverse,
    fontSize: 9.5,
    fontWeight: Typography.weights.extraBold,
    lineHeight: 11,
  },
});
