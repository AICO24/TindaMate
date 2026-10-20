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

const DASHBOARD_REFERENCE_IMAGE = require('@/assets/images/dashboard-reference.png');

interface DashboardHeroBannerProps {
  displayName: string;
  storeName?: string;
  onStorePress?: () => void;
}

/**
 * DashboardHeroBanner
 *
 * Enhanced Hero Section matching the official reference mockup:
 * - Strong greeting typography: "Good morning," and large bold "[User Name]!"
 * - Clean supporting message and white "TindaMate Store ›" pill button
 * - Large, vibrant 3D market stall illustration (stall, produce, leaves, chalkboard)
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
  const baseWidth = Math.min(windowWidth, 420);
  const baseHeight = baseWidth * 2.16;

  // Sizing for the large, prominent 3D market stall illustration
  const isSmallPhone = windowWidth < 375;
  const illustrationBoxWidth = isSmallPhone ? 155 : 180;
  const illustrationBoxHeight = isSmallPhone ? 135 : 155;
  const illustrationTopOffset = -baseHeight * 0.104;
  const illustrationLeftOffset = -baseWidth * 0.50;

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

        {/* Right Side: Large 3D Market Stall Illustration */}
        <View
          style={[
            styles.illustrationBox,
            { width: illustrationBoxWidth, height: illustrationBoxHeight },
          ]}>
          <Image
            source={DASHBOARD_REFERENCE_IMAGE}
            style={{
              width: baseWidth,
              height: baseHeight,
              marginTop: illustrationTopOffset,
              marginLeft: illustrationLeftOffset,
            }}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  displayNameText: {
    fontSize: 25,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 3,
  },
  greetingSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
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
  illustrationBox: {
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginRight: -12,
  },
});
