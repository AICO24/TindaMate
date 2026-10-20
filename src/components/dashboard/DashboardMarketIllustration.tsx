import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DashboardMarketIllustrationProps {
  width?: number;
  height?: number;
}

/**
 * DashboardMarketIllustration
 *
 * Dedicated pure React Native marketplace illustration for the Dashboard Hero:
 * - Friendly local market stall / sari-sari storefront
 * - Classic green-and-white striped awning with scalloped edge
 * - Tiered wooden shelves and crates filled with colorful fresh produce (apples, oranges, greens, lemons)
 * - Side crate, lush green foliage plant leaves, and mini chalkboard
 * - Warm soft backdrop halo and friendly sparkle accents
 *
 * Built with 100% pure React Native primitives:
 * - Zero cropped screenshot artifacts
 * - Zero duplicated TindaMate branding or text fragments
 * - Sharp vector rendering across all mobile screen densities
 */
export function DashboardMarketIllustration({
  width = 150,
  height = 140,
}: DashboardMarketIllustrationProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      {/* Soft warm circular backdrop glow */}
      <View style={styles.backdropHalo} />

      {/* Floating Sparkle / Star Accents */}
      <View style={styles.sparkleTopLeft}>
        <Text style={styles.sparkleText}>✨</Text>
      </View>
      <View style={styles.sparkleTopRight}>
        <Text style={styles.sparkleTextSmall}>🌱</Text>
      </View>

      {/* The Market Stall Structure */}
      <View style={styles.stallWrapper}>
        {/* Awning Roof Canopy (Green & White Stripes) */}
        <View style={styles.awningCanopy}>
          <View style={[styles.awningStripe, styles.stripeGreen]} />
          <View style={[styles.awningStripe, styles.stripeWhite]} />
          <View style={[styles.awningStripe, styles.stripeGreen]} />
          <View style={[styles.awningStripe, styles.stripeWhite]} />
          <View style={[styles.awningStripe, styles.stripeGreen]} />
          <View style={[styles.awningStripe, styles.stripeWhite]} />
          <View style={[styles.awningStripe, styles.stripeGreen]} />
        </View>

        {/* Scalloped Awning Edge */}
        <View style={styles.awningScallopRow}>
          <View style={[styles.scallop, styles.stripeGreen]} />
          <View style={[styles.scallop, styles.stripeWhite]} />
          <View style={[styles.scallop, styles.stripeGreen]} />
          <View style={[styles.scallop, styles.stripeWhite]} />
          <View style={[styles.scallop, styles.stripeGreen]} />
          <View style={[styles.scallop, styles.stripeWhite]} />
          <View style={[styles.scallop, styles.stripeGreen]} />
        </View>

        {/* Wooden Posts & Shelves Structure */}
        <View style={styles.stallBody}>
          {/* Left Wooden Support Post */}
          <View style={styles.woodenPostLeft} />

          {/* Shelves & Fruit Crates */}
          <View style={styles.shelvesCenter}>
            {/* Top Produce Shelf */}
            <View style={styles.woodenShelfTop}>
              {/* Crate 1: Fresh Oranges & Lemons */}
              <View style={styles.produceCrate}>
                <View style={[styles.produceDot, { backgroundColor: '#F97316' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#FBBF24' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#F97316' }]} />
              </View>
              {/* Crate 2: Crisp Green Apples & Calamansi */}
              <View style={styles.produceCrate}>
                <View style={[styles.produceDot, { backgroundColor: '#10B981' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#059669' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#34D399' }]} />
              </View>
            </View>

            {/* Bottom Produce Shelf */}
            <View style={styles.woodenShelfBottom}>
              {/* Crate 3: Fresh Red Tomatoes & Mangoes */}
              <View style={styles.produceCrateWide}>
                <View style={[styles.produceDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#10B981' }]} />
                <View style={[styles.produceDot, { backgroundColor: '#F97316' }]} />
              </View>
            </View>

            {/* Wooden Counter Base Plank */}
            <View style={styles.counterBasePlank}>
              <View style={styles.plankGrain} />
            </View>
          </View>

          {/* Right Wooden Support Post */}
          <View style={styles.woodenPostRight} />
        </View>

        {/* Lower Ground Details: Side Crate & Foliage Plant */}
        <View style={styles.groundRow}>
          {/* Plant Foliage (Leaves at bottom left) */}
          <View style={styles.plantContainer}>
            <View style={styles.leafMain} />
            <View style={styles.leafSecondary} />
            <View style={styles.leafTertiary} />
          </View>

          {/* Mini Chalkboard: "Local 💚" */}
          <View style={styles.chalkboard}>
            <Text style={styles.chalkboardText}>Fresh 💚</Text>
          </View>

          {/* Side Yellow Harvest Crate */}
          <View style={styles.sideCrate}>
            <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
            <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Soft warm circular glow backdrop
  backdropHalo: {
    position: 'absolute',
    width: 140,
    height: 125,
    backgroundColor: '#FEF9EC',
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#FDE68A',
    top: 6,
    right: 2,
    opacity: 0.9,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: -4,
    left: 2,
    zIndex: 10,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  sparkleText: {
    fontSize: 14,
  },
  sparkleTextSmall: {
    fontSize: 13,
  },
  // Stall root wrapper
  stallWrapper: {
    width: 136,
    alignItems: 'center',
    zIndex: 4,
  },
  // Awning Canopy
  awningCanopy: {
    flexDirection: 'row',
    width: 132,
    height: 24,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  awningStripe: {
    flex: 1,
    height: '100%',
  },
  stripeGreen: {
    backgroundColor: '#0D7A4D',
  },
  stripeWhite: {
    backgroundColor: '#FFFFFF',
  },
  awningScallopRow: {
    flexDirection: 'row',
    width: 132,
    height: 7,
    marginTop: -1,
  },
  scallop: {
    flex: 1,
    height: 7,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  // Stall Body with Support Posts & Shelves
  stallBody: {
    flexDirection: 'row',
    width: 126,
    marginTop: 2,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  woodenPostLeft: {
    width: 6,
    backgroundColor: '#92400E',
    borderRadius: 2,
  },
  woodenPostRight: {
    width: 6,
    backgroundColor: '#92400E',
    borderRadius: 2,
  },
  shelvesCenter: {
    flex: 1,
    paddingHorizontal: 4,
    gap: 3,
  },
  // Top Shelf
  woodenShelfTop: {
    flexDirection: 'row',
    backgroundColor: '#B45309',
    borderRadius: 4,
    padding: 3,
    gap: 4,
    justifyContent: 'space-between',
  },
  produceCrate: {
    flex: 1,
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#D97706',
  },
  produceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  // Bottom Shelf
  woodenShelfBottom: {
    backgroundColor: '#92400E',
    borderRadius: 4,
    padding: 3,
  },
  produceCrateWide: {
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#D97706',
  },
  counterBasePlank: {
    height: 7,
    backgroundColor: '#78350F',
    borderRadius: 2,
    marginTop: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  plankGrain: {
    height: 1,
    backgroundColor: '#92400E',
    width: '80%',
  },
  // Ground details
  groundRow: {
    flexDirection: 'row',
    width: 130,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingHorizontal: 2,
  },
  // Plant Leaves
  plantContainer: {
    width: 28,
    height: 24,
    position: 'relative',
  },
  leafMain: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    width: 14,
    height: 20,
    backgroundColor: '#059669',
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  leafSecondary: {
    position: 'absolute',
    bottom: 2,
    left: 10,
    width: 12,
    height: 17,
    backgroundColor: '#10B981',
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    transform: [{ rotate: '25deg' }],
  },
  leafTertiary: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    width: 11,
    height: 14,
    backgroundColor: '#34D399',
    borderRadius: 6,
  },
  // Chalkboard
  chalkboard: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#92400E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chalkboardText: {
    color: '#ECFDF5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Side Harvest Crate
  sideCrate: {
    width: 24,
    height: 16,
    backgroundColor: '#FBBF24',
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
  },
  miniDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

