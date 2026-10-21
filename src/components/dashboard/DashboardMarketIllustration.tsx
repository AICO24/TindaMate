import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

interface DashboardMarketIllustrationProps {
  width?: number;
  height?: number;
}

/**
 * DashboardMarketIllustration
 *
 * Dedicated pure React Native marketplace illustration for the Dashboard Hero:
 * - Friendly local market stall / sari-sari storefront
 * - Hand-tilted "Small Store. Big Dreams." callout badge on the left
 * - Classic green-and-white striped awning with scalloped edge
 * - Tiered wooden shelves and crates filled with colorful fresh produce
 * - Side crate, lush green foliage plant leaves, and mini chalkboard
 * - Built with 100% pure React Native primitives (zero cropped screenshot artifacts, zero OS emojis)
 */
export function DashboardMarketIllustration({
  width = 154,
  height = 140,
}: DashboardMarketIllustrationProps) {
  return (
    <View
      style={[styles.container, { width, height }]}
      accessible={false}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants">
      {/* Soft warm circular backdrop glow */}
      <View style={styles.backdropHalo} />

      {/* Hand-tilted "Small Store. Big Dreams." Callout matching reference */}
      <View style={styles.dreamsCallout}>
        <Text style={styles.dreamsText}>Small</Text>
        <Text style={styles.dreamsText}>Store.</Text>
        <Text style={styles.dreamsText}>Big</Text>
        <Text style={styles.dreamsText}>Dreams.</Text>
        {/* Warm Amber Sparkle Rays */}
        <View style={styles.sparkleRaysTop}>
          <View style={styles.sparkleRayShort} />
          <View style={styles.sparkleRayLong} />
        </View>
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
                <View style={[styles.produceDot, { backgroundColor: Colors.pastel.orange.iconBg }]} />
                <View style={[styles.produceDot, { backgroundColor: '#FBBF24' }]} />
                <View style={[styles.produceDot, { backgroundColor: Colors.pastel.orange.iconBg }]} />
              </View>
              {/* Crate 2: Crisp Green Apples & Calamansi */}
              <View style={styles.produceCrate}>
                <View style={[styles.produceDot, { backgroundColor: Colors.pastel.green.iconBg }]} />
                <View style={[styles.produceDot, { backgroundColor: Colors.pastel.green.accent }]} />
                <View style={[styles.produceDot, { backgroundColor: '#34D399' }]} />
              </View>
            </View>

            {/* Bottom Produce Shelf */}
            <View style={styles.woodenShelfBottom}>
              {/* Crate 3: Fresh Red Tomatoes & Mangoes */}
              <View style={styles.produceCrateWide}>
                <View style={[styles.produceDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.produceDot, { backgroundColor: Colors.accentWarm }]} />
                <View style={[styles.produceDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.produceDot, { backgroundColor: Colors.pastel.green.iconBg }]} />
                <View style={[styles.produceDot, { backgroundColor: Colors.pastel.orange.iconBg }]} />
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

          {/* Mini Chalkboard */}
          <View style={styles.chalkboard}>
            <View style={styles.chalkboardDot} />
            <Text style={styles.chalkboardText}>Fresh Local</Text>
          </View>

          {/* Side Yellow Harvest Crate */}
          <View style={styles.sideCrate}>
            <View style={[styles.miniDot, { backgroundColor: Colors.pastel.green.iconBg }]} />
            <View style={[styles.miniDot, { backgroundColor: Colors.accentWarm }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  // Soft warm circular glow backdrop
  backdropHalo: {
    position: 'absolute',
    width: 144,
    height: 128,
    backgroundColor: '#FEF9EC',
    borderRadius: 72,
    borderWidth: 1,
    borderColor: '#FDE68A',
    top: 6,
    right: 0,
    opacity: 0.9,
  },
  dreamsCallout: {
    position: 'absolute',
    left: -6,
    top: 10,
    zIndex: 10,
    transform: [{ rotate: '-10deg' }],
    alignItems: 'center',
  },
  dreamsText: {
    fontSize: 9.5,
    fontWeight: Typography.weights.extraBold,
    color: Colors.warningText,
    lineHeight: 11,
    letterSpacing: -0.2,
  },
  sparkleRaysTop: {
    position: 'absolute',
    right: -8,
    top: -2,
    gap: 2,
  },
  sparkleRayShort: {
    width: 5,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accentWarm,
    transform: [{ rotate: '-25deg' }],
  },
  sparkleRayLong: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accentWarm,
    transform: [{ rotate: '15deg' }],
  },
  // Stall root wrapper
  stallWrapper: {
    width: 126,
    alignItems: 'center',
    zIndex: 4,
  },
  // Awning Canopy
  awningCanopy: {
    flexDirection: 'row',
    width: 122,
    height: 23,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
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
    backgroundColor: Colors.primary,
  },
  stripeWhite: {
    backgroundColor: Colors.surface,
  },
  awningScallopRow: {
    flexDirection: 'row',
    width: 122,
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
    width: 116,
    marginTop: 2,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  woodenPostLeft: {
    width: 5.5,
    backgroundColor: Colors.warningText,
    borderRadius: 2,
  },
  woodenPostRight: {
    width: 5.5,
    backgroundColor: Colors.warningText,
    borderRadius: 2,
  },
  shelvesCenter: {
    flex: 1,
    paddingHorizontal: 3,
    gap: 3,
  },
  // Top Shelf
  woodenShelfTop: {
    flexDirection: 'row',
    backgroundColor: '#B45309',
    borderRadius: 4,
    padding: 3,
    gap: 3,
    justifyContent: 'space-between',
  },
  produceCrate: {
    flex: 1,
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#D97706',
  },
  produceDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  // Bottom Shelf
  woodenShelfBottom: {
    backgroundColor: Colors.warningText,
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
    height: 6,
    backgroundColor: '#78350F',
    borderRadius: 2,
    marginTop: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  plankGrain: {
    height: 1,
    backgroundColor: Colors.warningText,
    width: '80%',
  },
  // Ground details
  groundRow: {
    flexDirection: 'row',
    width: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingHorizontal: 1,
  },
  // Plant Leaves
  plantContainer: {
    width: 26,
    height: 22,
    position: 'relative',
  },
  leafMain: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    width: 13,
    height: 19,
    backgroundColor: Colors.pastel.green.accent,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    transform: [{ rotate: '-15deg' }],
  },
  leafSecondary: {
    position: 'absolute',
    bottom: 2,
    left: 9,
    width: 11,
    height: 16,
    backgroundColor: Colors.pastel.green.iconBg,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    transform: [{ rotate: '25deg' }],
  },
  leafTertiary: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 10,
    height: 13,
    backgroundColor: '#34D399',
    borderRadius: 6,
  },
  // Chalkboard
  chalkboard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.warningText,
  },
  chalkboardDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
  },
  chalkboardText: {
    color: '#ECFDF5',
    fontSize: 8.5,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.2,
  },
  // Side Harvest Crate
  sideCrate: {
    width: 22,
    height: 15,
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
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
});


