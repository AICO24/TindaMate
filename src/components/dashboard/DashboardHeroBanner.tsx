import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DashboardMarketIllustration } from '@/components/dashboard/DashboardMarketIllustration';
import { BorderRadius, Spacing } from '@/constants/theme';

interface DashboardHeroBannerProps {
  displayName: string;
  storeName?: string;
  onStorePress?: () => void;
}

/**
 * DashboardHeroBanner
 *
 * Visually polished mobile Hero section matching TindaMate specifications:
 * - Dynamic greeting ("Good morning," / "Good afternoon," / "Good evening,")
 * - Dynamic user name with responsive scaling for long names
 * - Friendly store overview supporting text
 * - Compact interactive store pill: [ 🏪 TindaMate Store → ]
 * - Dedicated pure React Native marketplace illustration (zero logo fragments, zero screenshot artifacts)
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
  const isLargePhone = windowWidth >= 414;

  // Responsive illustration size occupying right 35-45% of banner
  const illustrationWidth = isSmallPhone ? 135 : isLargePhone ? 165 : 150;
  const illustrationHeight = isSmallPhone ? 125 : isLargePhone ? 150 : 138;

  // Responsive typography for long names (e.g., "Gochaico, Manolo Jr. A.!")
  const nameFontSize =
    displayName.length > 22
      ? isSmallPhone ? 18 : 20
      : displayName.length > 14
      ? isSmallPhone ? 20 : 22
      : isSmallPhone ? 22 : 25;

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        {/* Left Side: Text Hierarchy & Store Badge (55-65% width) */}
        <View style={styles.leftColumn}>
          {/* 1. Greeting - medium / semibold */}
          <Text style={styles.greetingTitle}>{getGreeting()}</Text>

          {/* 2. User Name - large / bold / responsive */}
          <Text
            style={[styles.displayNameText, { fontSize: nameFontSize }]}
            numberOfLines={2}>
            {displayName}!
          </Text>

          {/* 3. Supporting sentence */}
          <Text style={styles.greetingSubtext} numberOfLines={2}>
            Here's what's happening with your store today.
          </Text>

          {/* 4. Store Context Pill: [ 🏪 TindaMate Store → ] */}
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
            <Text style={styles.storePillArrow}>→</Text>
          </Pressable>
        </View>

        {/* Right Side: Dedicated Marketplace Illustration (35-45% width) */}
        <View style={styles.illustrationWrapper}>
          <DashboardMarketIllustration
            width={illustrationWidth}
            height={illustrationHeight}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.one,
    paddingBottom: Spacing.four,
    minHeight: 165,
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1.25,
    gap: 4,
    paddingRight: 8,
    zIndex: 2,
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  displayNameText: {
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 2,
  },
  greetingSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 8,
  },
  // Store pill button: [ 🏪 TindaMate Store → ]
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
  storePillArrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
});
