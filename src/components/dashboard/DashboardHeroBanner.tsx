import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

interface DashboardHeroBannerProps {
  displayName: string;
  storeName?: string;
}

/**
 * DashboardHeroBanner
 *
 * Warm welcoming banner for the TindaMate dashboard:
 * - Dynamic greeting based on time of day
 * - Authenticated vendor display name
 * - Friendly mini tindahan store illustration
 * - Store context badge ("TindaMate Store")
 */
export function DashboardHeroBanner({
  displayName,
  storeName = 'TindaMate Sari-Sari Store',
}: DashboardHeroBannerProps) {
  // Determine time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Magandang umaga';
    if (hour < 18) return 'Magandang hapon';
    return 'Magandang gabi';
  };

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        {/* Left: Text & Greeting */}
        <View style={styles.textGroup}>
          <View style={styles.storeBadge}>
            <Text style={styles.storeBadgeIcon}>🏪</Text>
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              {storeName}
            </Text>
          </View>

          <Text style={styles.greetingTitle}>
            {getGreeting()},{'\n'}
            <Text style={styles.displayNameText}>{displayName}!</Text> 👋
          </Text>

          <Text style={styles.greetingSubtext}>
            Here's what's happening with your store today.
          </Text>
        </View>

        {/* Right: Friendly Storefront Mini Illustration */}
        <View style={styles.illustrationWrapper}>
          {/* Soft background halo */}
          <View style={styles.miniHalo} />

          {/* Mini Storefront Graphic */}
          <View style={styles.storeFront}>
            {/* Awning Canopy */}
            <View style={styles.awning}>
              <View style={[styles.stripe, styles.greenStripe]} />
              <View style={[styles.stripe, styles.yellowStripe]} />
              <View style={[styles.stripe, styles.greenStripe]} />
              <View style={[styles.stripe, styles.yellowStripe]} />
            </View>

            {/* Counter & Shelf */}
            <View style={styles.counterBody}>
              <View style={styles.produceRow}>
                <View style={[styles.produceDot, { backgroundColor: '#10B981' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#EF4444' }]} />
              </View>
              {/* Store chalkboard */}
              <View style={styles.chalkboard}>
                <Text style={styles.chalkboardText}>BUKAS</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#0D7A4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textGroup: {
    flex: 1,
    gap: 6,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  storeBadgeIcon: {
    fontSize: 11,
  },
  storeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  displayNameText: {
    color: '#105B48',
  },
  greetingSubtext: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  illustrationWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniHalo: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FEF3C7',
    opacity: 0.8,
  },
  storeFront: {
    width: 72,
    alignItems: 'center',
    zIndex: 2,
  },
  awning: {
    flexDirection: 'row',
    width: 68,
    height: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#064E3B',
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  greenStripe: {
    backgroundColor: '#105B48',
  },
  yellowStripe: {
    backgroundColor: '#FEF08A',
  },
  counterBody: {
    width: 62,
    height: 38,
    backgroundColor: '#D97706',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#B45309',
    padding: 3,
    justifyContent: 'space-between',
  },
  produceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 2,
  },
  produceDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  chalkboard: {
    backgroundColor: '#064E3B',
    borderRadius: 2,
    paddingVertical: 1,
    alignItems: 'center',
  },
  chalkboardText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

