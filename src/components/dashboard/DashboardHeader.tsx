import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BellNotificationIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
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
 * DashboardHeader (Exact Showcase Match)
 *
 * Visually matches Screen 1 of TindaMate POS App Showcase.png:
 * - Single safe-area top clearance (parent SafeAreaView handles top inset, avoiding double padding)
 * - Left: Authentic orange TindaMate bag emblem ("T") + bold white wordmark + mint tagline
 * - Right: Unboxed solid white notification bell with red count badge
 */
export function DashboardHeader({
  notificationCount = 0,
  onNotificationPress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Decorative ambient leaf silhouettes in header background */}
      <View style={styles.floatingLeafOne} pointerEvents="none" />
      <View style={styles.floatingLeafTwo} pointerEvents="none" />

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
            Tinda<Text style={styles.brandTitleWhite}>Mate</Text>
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
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
    position: 'relative',
    overflow: 'visible',
  },
  // Ambient organic floating leaves matching showcase
  floatingLeafOne: {
    position: 'absolute',
    top: -4,
    right: 64,
    width: 34,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#10B981',
    opacity: 0.22,
    transform: [{ rotate: '34deg' }],
  },
  floatingLeafTwo: {
    position: 'absolute',
    top: 8,
    right: 108,
    width: 24,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#34D399',
    opacity: 0.16,
    transform: [{ rotate: '-22deg' }],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 240,
  },
  bagBadge: {
    width: 38,
    height: 40,
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
    borderColor: '#34D399',
    marginBottom: -1,
  },
  bagBody: {
    width: 34,
    height: 31,
    borderRadius: 9,
    backgroundColor: '#F97316',
    borderWidth: 1.2,
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
    gap: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: -0.4,
  },
  brandTitleWhite: {
    color: Colors.textInverse,
  },
  brandTagline: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: Typography.weights.medium,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 36,
    height: 36,
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
    top: 1,
    right: 1,
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
