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
 * Exact replica of the reference dashboard banner:
 * - Left side: Dynamic time-based greeting ("Good morning,"), bold user name,
 *   supporting text, and the white "TindaMate Store >" pill button.
 * - Right side: Authentic 3D market stall illustration with awning, fruit crates,
 *   lush green leaves, and chalkboard ("Small Store. Big Dreams.").
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

  // Dimensions for extracting the exact 3D market stall illustration
  const { width: windowWidth } = Dimensions.get('window');
  const baseWidth = Math.min(windowWidth - 32, 380);
  const baseHeight = baseWidth * 2.16;

  const illustrationBoxWidth = 165;
  const illustrationBoxHeight = 135;
  const illustrationTopOffset = -baseHeight * 0.106;
  const illustrationLeftOffset = -baseWidth * 0.50;

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        {/* Left Side: Greeting & Store Context */}
        <View style={styles.leftColumn}>
          <Text style={styles.greetingGreeting}>{getGreeting()}</Text>
          <Text style={styles.displayNameText} numberOfLines={1}>
            {displayName}!
          </Text>

          <Text style={styles.greetingSubtext}>
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

        {/* Right Side: Authentic 3D Market Stall Illustration */}
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
  card: {
    backgroundColor: '#F2F9F4',
    borderRadius: BorderRadius.xl,
    paddingLeft: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    paddingRight: 0,
    borderWidth: 1,
    borderColor: '#E1EFE6',
    overflow: 'hidden',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: Spacing.two,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
    zIndex: 2,
  },
  greetingGreeting: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  displayNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.3,
    lineHeight: 26,
    marginBottom: 2,
  },
  greetingSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 12.5,
    fontWeight: '700',
    color: '#064E3B',
  },
  storePillChevron: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
  },
  illustrationBox: {
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
