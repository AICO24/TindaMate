import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BellNotificationIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';

interface DashboardHeaderProps {
  userEmail?: string;
  onProfilePress?: () => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

/**
 * MiniHeaderStoreIcon (Code-Driven 3D Storefront Emblem for Header)
 *
 * Matches the charming orange-and-white striped storefront icon on the top-left
 * of the target Dashboard reference:
 * - 5 alternating orange & white awning stripes with scalloped bottom edge
 * - Cream store facade with two mint windows and a dark brown center door
 * - Little green bushes on both sides and warm ground base
 */
function MiniHeaderStoreIcon() {
  return (
    <View
      style={styles.storeIconWrap}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {/* Side Mini Bushes */}
      <View style={styles.miniBushLeft} />
      <View style={styles.miniBushRight} />

      {/* Roof Ridge */}
      <View style={styles.miniRoofRidge} />

      {/* 5-Stripe Orange & White Awning */}
      <View style={styles.miniAwningRow}>
        <View style={[styles.miniStripe, styles.miniStripeOrange]} />
        <View style={[styles.miniStripe, styles.miniStripeWhite]} />
        <View style={[styles.miniStripe, styles.miniStripeOrange]} />
        <View style={[styles.miniStripe, styles.miniStripeWhite]} />
        <View style={[styles.miniStripe, styles.miniStripeOrange]} />
      </View>

      {/* Storefront Facade */}
      <View style={styles.miniFacade}>
        <View style={styles.miniWindow} />
        <View style={styles.miniDoor}>
          <View style={styles.miniDoorKnob} />
        </View>
        <View style={styles.miniWindow} />
      </View>

      {/* Base Step */}
      <View style={styles.miniBaseStep} />
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
  // Mini 3D Storefront Icon Styles
  storeIconWrap: {
    width: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    paddingBottom: 2,
  },
  miniBushLeft: {
    position: 'absolute',
    left: 1,
    bottom: 3,
    width: 11,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  miniBushRight: {
    position: 'absolute',
    right: 1,
    bottom: 3,
    width: 11,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  miniRoofRidge: {
    width: 34,
    height: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: '#EA580C',
  },
  miniAwningRow: {
    flexDirection: 'row',
    width: 40,
    height: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: 'hidden',
  },
  miniStripe: {
    flex: 1,
    height: '100%',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  miniStripeOrange: {
    backgroundColor: '#F97316',
  },
  miniStripeWhite: {
    backgroundColor: '#FFFBEB',
  },
  miniFacade: {
    width: 34,
    height: 18,
    backgroundColor: '#FDE68A',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 2,
  },
  miniWindow: {
    width: 7,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: '#14B8A6',
    borderWidth: 1,
    borderColor: '#92400E',
  },
  miniDoor: {
    width: 8,
    height: 14,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: '#1E3A2F',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 1.5,
  },
  miniDoorKnob: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FBBF24',
  },
  miniBaseStep: {
    width: 42,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#D97706',
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
