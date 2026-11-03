import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
 * Visually matches media_1793685516173_46f6ff18.png and Screen 1 of Showcase:
 * - Dynamic safe-area top clearance ensuring zero collision with camera punch-holes or Dynamic Island
 * - Left: Authentic orange TindaMate bag emblem ("T") + bold white wordmark + mint tagline
 * - Center: Wide open space preventing camera notch overlap
 * - Right: Pure notification bell with red badge (3 / alert count)
 */
export function DashboardHeader({
  notificationCount = 0,
  onNotificationPress,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  // Safe clearance guaranteed below Dynamic Island / camera punch-hole on all phones
  const safeTopPadding = Math.max(insets.top, Platform.OS === 'android' ? 32 : 44) + 4;

  return (
    <View style={[styles.header, { paddingTop: safeTopPadding }]}>
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

      {/* Right: Single Notification Bell with Badge (Showcase 1:1) */}
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
          <BellNotificationIcon size={20} color={Colors.textInverse} />
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
    paddingBottom: Spacing.twoHalf,
    position: 'relative',
    overflow: 'visible',
  },
  // Ambient organic floating leaves matching showcase
  floatingLeafOne: {
    position: 'absolute',
    top: 4,
    right: 70,
    width: 32,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#10B981',
    opacity: 0.16,
    transform: [{ rotate: '34deg' }],
  },
  floatingLeafTwo: {
    position: 'absolute',
    top: 14,
    right: 110,
    width: 22,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#34D399',
    opacity: 0.12,
    transform: [{ rotate: '-22deg' }],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
    maxWidth: 220,
  },
  bagBadge: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bagHandle: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: '#34D399',
    marginBottom: -1,
  },
  bagBody: {
    width: 38,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F97316',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  bagLetter: {
    color: Colors.textInverse,
    fontSize: 19,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.5,
  },
  titleCol: {
    gap: 1,
  },
  brandTitle: {
    fontSize: 22,
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
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
});
