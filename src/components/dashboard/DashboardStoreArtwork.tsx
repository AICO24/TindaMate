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
 * - Layered lush green foliage / bush accents
 * - Authentic Filipino tindahan with orange-and-white striped awning roof & scalloped edge
 * - Cozy wooden facade, counter window with display jars, and storefront door
 * - Crisp pure React Native primitives (zero blurry screenshots, resolution-independent)
 */
export function DashboardStoreArtwork({ size = 120 }: DashboardStoreArtworkProps) {
  const scale = size / 120;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.scaler, { transform: [{ scale }] }]}>
        {/* 1. Warm Golden/Amber Circular Halo Backdrop */}
        <View style={styles.haloBackdrop} />

        {/* 2. Layered Lush Green Foliage Bushes */}
        <View style={styles.bushBackdropLeft} />
        <View style={styles.bushBackdropRight} />
        <View style={styles.bushFrontLeft} />
        <View style={styles.bushFrontRight} />

        {/* 3. Drop Shadow under the shop */}
        <View style={styles.storeGroundShadow} />

        {/* 4. The Sari-Sari Storefront Building */}
        <View style={styles.storeBuilding}>
          {/* Main Facade Wall */}
          <View style={styles.storeWall}>
            {/* Left Door */}
            <View style={styles.storeDoor}>
              <View style={styles.doorWindow} />
              <View style={styles.doorKnob} />
            </View>

            {/* Center Storefront Counter Window */}
            <View style={styles.storeWindow}>
              {/* Window Interior Display Jars */}
              <View style={styles.windowInterior}>
                <View style={styles.shelfRow}>
                  <View style={[styles.jarItem, { backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.jarItem, { backgroundColor: '#EF4444' }]} />
                  <View style={[styles.jarItem, { backgroundColor: '#10B981' }]} />
                </View>
              </View>
              {/* Wooden Window Counter Sills */}
              <View style={styles.windowCounterSill} />
            </View>
          </View>

          {/* Awning Roof Canopy */}
          <View style={styles.awningContainer}>
            {/* Slanted Striped Roof */}
            <View style={styles.awningSlantedRoof}>
              <View style={[styles.awningStripe, styles.stripeOrange]} />
              <View style={[styles.awningStripe, styles.stripeCream]} />
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
              <View style={[styles.scallopTab, styles.stripeCream]} />
              <View style={[styles.scallopTab, styles.stripeOrange]} />
            </View>

            {/* Awning Soft Shadow */}
            <View style={styles.awningShadow} />
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
    overflow: 'visible',
  },
  scaler: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // 1. Halo Backdrop
  haloBackdrop: {
    position: 'absolute',
    top: 6,
    right: 4,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FED7AA',
    opacity: 0.85,
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },

  // 2. Foliage Bushes
  bushBackdropLeft: {
    position: 'absolute',
    top: 26,
    left: 2,
    width: 36,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#059669',
    transform: [{ rotate: '-18deg' }],
  },
  bushBackdropRight: {
    position: 'absolute',
    top: 24,
    right: 2,
    width: 34,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#047857',
    transform: [{ rotate: '16deg' }],
  },
  bushFrontLeft: {
    position: 'absolute',
    bottom: 12,
    left: 6,
    width: 28,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#10B981',
    transform: [{ rotate: '-12deg' }],
    zIndex: 3,
  },
  bushFrontRight: {
    position: 'absolute',
    bottom: 14,
    right: 6,
    width: 26,
    height: 36,
    borderRadius: 13,
    backgroundColor: '#34D399',
    transform: [{ rotate: '14deg' }],
    zIndex: 3,
  },

  // 3. Ground Shadow
  storeGroundShadow: {
    position: 'absolute',
    bottom: 8,
    width: 82,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },

  // 4. Store Building
  storeBuilding: {
    position: 'absolute',
    bottom: 14,
    width: 82,
    alignItems: 'center',
    zIndex: 2,
  },

  // Awning Roof
  awningContainer: {
    width: 86,
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    zIndex: 4,
  },
  awningSlantedRoof: {
    width: '100%',
    height: 22,
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EA580C',
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
    height: 6,
    flexDirection: 'row',
  },
  scallopTab: {
    flex: 1,
    height: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  awningShadow: {
    width: '94%',
    height: 3,
    backgroundColor: 'rgba(124, 45, 18, 0.22)',
  },

  // Store Facade Wall
  storeWall: {
    width: 76,
    height: 44,
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingTop: 4,
    gap: 5,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  // Door
  storeDoor: {
    width: 18,
    height: 34,
    backgroundColor: '#78350F',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#92400E',
    alignItems: 'center',
    paddingTop: 3,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  doorWindow: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#34D399',
    borderWidth: 0.8,
    borderColor: '#059669',
  },
  doorKnob: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FDE68A',
    alignSelf: 'flex-end',
    marginRight: 2,
  },

  // Window Counter
  storeWindow: {
    flex: 1,
    height: 30,
    backgroundColor: '#064E3B',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#92400E',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  windowInterior: {
    flex: 1,
    padding: 2,
    justifyContent: 'center',
  },
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 2,
  },
  jarItem: {
    width: 6,
    height: 8,
    borderRadius: 2,
  },
  windowCounterSill: {
    width: '100%',
    height: 4,
    backgroundColor: '#B45309',
  },
});

