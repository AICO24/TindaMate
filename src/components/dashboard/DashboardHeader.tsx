import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BellNotificationIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';

const STORE_EMBLEM = require('@/assets/images/tindamate-emblem-clean.png');

interface DashboardHeaderProps {
  userEmail?: string;
  onProfilePress?: () => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

/**
 * MiniHeaderStoreIcon
 *
 * Renders the improved official TindaMate Storefront Emblem on the top-left
 * of the Dashboard header.
 */
function MiniHeaderStoreIcon() {
  return (
    <View
      style={styles.storeIconWrap}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <Image
        source={STORE_EMBLEM}
        style={styles.storeEmblemImage}
        resizeMode="contain"
        accessibilityLabel="TindaMate Storefront Emblem"
      />
    </View>
  );
}

/**
 * DashboardHeader (Target Reference 1:1 Alignment)
 *
 * Visually matches the top header of the Dashboard reference:
 * - Left: 3D Orange-Awning Storefront Emblem + "TindaMate" wordmark + "Your Digital Tindahan Assistant"
 * - Right: Large crisp white Notification Bell with bright red badge
 */
export function DashboardHeader({
  notificationCount = 0,
  onNotificationPress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left: Brand Storefront Icon + Wordmark + Tagline */}
      <View style={styles.brandRow}>
        <MiniHeaderStoreIcon />

        <View style={styles.titleCol}>
          <Text style={styles.brandTitle} maxFontSizeMultiplier={1.2}>
            Tinda<Text style={styles.brandTitleOrange}>Mate</Text>
          </Text>
          <Text style={styles.brandTagline} maxFontSizeMultiplier={1.15}>
            Your Digital Tindahan Assistant
          </Text>
        </View>
      </View>

      {/* Right: Crisp White Notification Bell with Red Alert Badge */}
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
          <BellNotificationIcon size={25} color={Colors.textInverse} />
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
    paddingTop: Spacing.one,
    paddingBottom: Spacing.twoHalf,
    position: 'relative',
    zIndex: 5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    maxWidth: 275,
  },
  // Official Improved Storefront Emblem Styles
  storeIconWrap: {
    width: 52,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeEmblemImage: {
    width: 52,
    height: 45,
  },
  titleCol: {
    gap: 1,
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: Typography.weights.extraBold,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  brandTitleOrange: {
    color: '#F97316',
  },
  brandTagline: {
    fontSize: 11.5,
    color: '#ECFDF5',
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    lineHeight: 12,
  },
});
