import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DashboardStoreArtworkProps {
  size?: number;
}

/**
 * DashboardStoreArtwork
 *
 * Dedicated pure React Native 3D-styled Sari-Sari Storefront Artwork:
 * Matches Screen 1 of TindaMate POS App Showcase.png:
 * - Warm golden/amber circular halo backdrop
 * - Layered lush green foliage / bush accents + sprouting leaves on top-left
 * - Authentic Filipino tindahan with 5-stripe orange-and-white awning roof & scalloped edge
 * - Cozy wooden facade with center wooden door + flanking display counter windows
 * - Gold coin accents at the base
 */
export function DashboardStoreArtwork({ size = 120 }: DashboardStoreArtworkProps) {
  const scale = size / 120;

  return (
    <View
      style={[styles.container, { width: size, height: size * 0.9 }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.scaler, { transform: [{ scale }] }]}>
        {/* 1. Warm Golden/Amber Circular Halo Backdrop */}
        <View style={styles.haloBackdrop} />

        {/* 2. Top-Left Sprouting Leaf Silhouettes above Awning */}
        <View style={styles.topSproutLeft} />
        <View style={styles.topSproutRight} />

        {/* 3. Layered Lush Green Foliage Bushes */}
        <View style={styles.bushBackdropLeft} />
        <View style={styles.bushBackdropRight} />
        <View style={styles.bushFrontLeft} />
        <View style={styles.bushFrontRight} />

        {/* 4. Ground Plinth & Drop Shadow under the shop */}
        <View style={styles.storeGroundShadow} />

        {/* 5. The Sari-Sari Storefront Building */}
        <View style={styles.storeBuilding}>
          {/* Awning Roof Canopy (5 bold stripes: Orange - Cream - Orange - Cream - Orange) */}
          <View style={styles.awningContainer}>
            {/* Top Roof Ridge Cap */}
            <View style={styles.roofRidgeCap} />

            {/* Slanted Striped Roof */}
            <View style={styles.awningSlantedRoof}>
              <View style={[styles.awningStripe, styles.stripeOrange]} />
              <View style={[styles.awningStripe, styles.stripeCream]} />
              <View style={[styles.awningStripe, styles.stripeOrange]} />
              <View style={[styles.awningStripe, styles.stripeCream]} />
              <View style={[styles.awningStripe, styles.stripeOrange]} />
            </View>

            {/* Scalloped Awning Fringe */}
            <View style={styles.scallopRow}>
              <View style={[styles.scallopTab, styles.stripeOrange]} />
              <View style={[styles.scallopTab, styles.stripeCream]} />
              <View style={[styles.scallopTab, styles.stripeOrange]} />
              <View style={[styles.scallopTab, styles.stripeCream]} />
              <View style={[styles.scallopTab, styles.stripeOrange]} />
            </View>

            {/* Awning Soft Shadow */}
            <View style={styles.awningShadow} />
          </View>

          {/* Main Facade Wall (Left Window + Center Door + Right Window) */}
          <View style={styles.storeWall}>
            {/* Left Storefront Display Window */}
            <View style={styles.sideWindowFrame}>
              <View style={styles.windowPaneTop}>
                <View style={[styles.jarItem, { backgroundColor: '#10B981' }]} />
                <View style={[styles.jarItem, { backgroundColor: '#F59E0B' }]} />
              </View>
              <View style={styles.windowSill} />
            </View>

            {/* Center Storefront Door */}
            <View style={styles.centerDoor}>
              <View style={styles.doorGlassPane} />
              <View style={styles.doorLowerPanel} />
            </View>

            {/* Right Storefront Display Window */}
            <View style={styles.sideWindowFrame}>
              <View style={styles.windowPaneTop}>
                <View style={[styles.jarItem, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.jarItem, { backgroundColor: '#3B82F6' }]} />
              </View>
              <View style={styles.windowSill} />
            </View>
          </View>

          {/* Wooden Base Foundation Step */}
          <View style={styles.woodenFoundationStep} />
        </View>

        {/* 6. Decorative Gold Coins at Base */}
        <View style={styles.goldCoinLeft} />
        <View style={styles.goldCoinRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  scaler: {
    width: 120,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // 1. Halo Backdrop
  haloBackdrop: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#FDE68A',
    opacity: 0.72,
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },

  // 2. Top Sprouting Leaves
  topSproutLeft: {
    position: 'absolute',
    top: 6,
    left: 24,
    width: 14,
    height: 22,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#10B981',
    transform: [{ rotate: '-32deg' }],
    zIndex: 1,
  },
  topSproutRight: {
    position: 'absolute',
    top: 2,
    left: 36,
    width: 12,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#34D399',
    transform: [{ rotate: '14deg' }],
    zIndex: 1,
  },

  // 3. Foliage Bushes
  bushBackdropLeft: {
    position: 'absolute',
    top: 28,
    left: 2,
    width: 34,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#059669',
    transform: [{ rotate: '-18deg' }],
  },
  bushBackdropRight: {
    position: 'absolute',
    top: 26,
    right: 2,
    width: 32,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#047857',
    transform: [{ rotate: '16deg' }],
  },
  bushFrontLeft: {
    position: 'absolute',
    bottom: 10,
    left: 4,
    width: 28,
    height: 30,
    borderRadius: 14,
    backgroundColor: '#10B981',
    transform: [{ rotate: '-10deg' }],
    zIndex: 3,
  },
  bushFrontRight: {
    position: 'absolute',
    bottom: 10,
    right: 4,
    width: 26,
    height: 28,
    borderRadius: 13,
    backgroundColor: '#34D399',
    transform: [{ rotate: '12deg' }],
    zIndex: 3,
  },

  // 4. Ground Shadow
  storeGroundShadow: {
    position: 'absolute',
    bottom: 5,
    width: 96,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.14)',
  },

  // 5. Store Building
  storeBuilding: {
    position: 'absolute',
    bottom: 9,
    width: 90,
    alignItems: 'center',
    zIndex: 2,
  },

  // Awning Roof
  awningContainer: {
    width: 94,
    alignItems: 'center',
    zIndex: 4,
    marginBottom: -2,
  },
  roofRidgeCap: {
    width: 78,
    height: 6,
    backgroundColor: '#C2410C',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  awningSlantedRoof: {
    width: '100%',
    height: 22,
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#C2410C',
  },
  awningStripe: {
    flex: 1,
    height: '100%',
  },
  stripeOrange: {
    backgroundColor: '#EA580C',
  },
  stripeCream: {
    backgroundColor: '#FFFBEB',
  },
  scallopRow: {
    width: '100%',
    height: 7,
    flexDirection: 'row',
    marginTop: -1,
  },
  scallopTab: {
    flex: 1,
    height: 7,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 0.8,
    borderTopWidth: 0,
    borderColor: '#C2410C',
  },
  awningShadow: {
    width: '92%',
    height: 3,
    backgroundColor: 'rgba(124, 45, 18, 0.24)',
  },

  // Store Facade Wall
  storeWall: {
    width: 82,
    height: 44,
    backgroundColor: '#FDE68A',
    borderWidth: 1.5,
    borderColor: '#B45309',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingTop: 4,
  },

  // Side Display Windows
  sideWindowFrame: {
    width: 21,
    height: 32,
    marginBottom: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: '#92400E',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  windowPaneTop: {
    flex: 1,
    backgroundColor: '#064E3B',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingBottom: 2,
  },
  jarItem: {
    width: 5.5,
    height: 8,
    borderRadius: 1.5,
  },
  windowSill: {
    width: '100%',
    height: 4,
    backgroundColor: '#B45309',
  },

  // Center Door
  centerDoor: {
    width: 22,
    height: 37,
    backgroundColor: '#92400E',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderColor: '#78350F',
    alignItems: 'center',
    padding: 2.5,
    justifyContent: 'space-between',
  },
  doorGlassPane: {
    width: '100%',
    height: 15,
    borderRadius: 1.5,
    backgroundColor: '#FEF3C7',
    borderWidth: 0.8,
    borderColor: '#78350F',
  },
  doorLowerPanel: {
    width: '100%',
    height: 12,
    borderRadius: 1,
    backgroundColor: '#78350F',
  },

  // Wooden Base Step
  woodenFoundationStep: {
    width: 88,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#92400E',
    borderWidth: 1,
    borderColor: '#78350F',
  },

  // 6. Gold Coins
  goldCoinLeft: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    zIndex: 5,
  },
  goldCoinRight: {
    position: 'absolute',
    bottom: 7,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    zIndex: 5,
  },
});


