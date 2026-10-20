import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

// Dedicated standalone market stall artwork (no status bars, no crop boxes, zero white lines)
const DASHBOARD_STALL_IMAGE = require('@/assets/images/dashboard-stall.png');

interface DashboardHeroBannerProps {
  displayName: string;
  storeName?: string;
  onStorePress?: () => void;
}

/**
 * DashboardHeroBanner
 *
 * Visually polished Hero Section matching the official reference mockup:
 * - Dynamic greeting ("Good morning," / "Good afternoon," / "Good evening,")
 * - Bold user display name and store context subtitle
 * - White interactive store pill: [ 🏪 TindaMate Store › ]
 * - Standalone market stall illustration ("Small Store. Big Dreams.", canopy, crates)
 *   blending seamlessly into the warm cream hero background with zero screenshot artifacts.
 */
export function DashboardHeroBanner({
  displayName,
  storeName = 'TindaMate Store',
  onStorePress,
}: DashboardHeroBannerProps) {
  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const { width: windowWidth } = Dimensions.get('window');
  const isSmallPhone = windowWidth < 375;
  // dashboard-stall.png is 385 x 218 (ratio = 1.766)
  const stallWidth = isSmallPhone ? 150 : 175;
  const stallHeight = Math.round(stallWidth / 1.766);

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        {/* Left Side: Strong Greeting & Store Context */}
        <View style={styles.leftColumn}>
          <Text style={styles.greetingTitle}>{getGreeting()}</Text>
          <Text style={styles.displayNameText} numberOfLines={1}>
            {displayName}!
          </Text>

          <Text style={styles.greetingSubtext} numberOfLines={2}>
            Here's what's happening with your store today.
          </Text>

          {/* Store Context Pill Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Active store: ${storeName}`}
            onPress={onStorePress}
            style={({ pressed }) => [
              styles.storePill,
              pressed && styles.storePillPressed,
            ]}>
            <View style={styles.storeIconCircle}>
              <Text style={styles.storeIcon}>🏪</Text>
            </View>
            <Text style={styles.storePillText} numberOfLines={1}>
              {storeName}
            </Text>
            <Text style={styles.storePillChevron}>›</Text>
          </Pressable>
        </View>

        {/* Right Side: Clean Market Stall Illustration */}
        <View style={styles.illustrationWrapper}>
          <Image
            source={DASHBOARD_STALL_IMAGE}
            style={{ width: stallWidth, height: stallHeight }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1.15,
    gap: 4,
    paddingRight: 6,
    zIndex: 2,
  },
  greetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  displayNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.4,
    lineHeight: 29,
    marginBottom: 2,
  },
  greetingSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  storePillPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  storeIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIcon: {
    fontSize: 12,
  },
  storePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064E3B',
  },
  storePillChevron: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
});
