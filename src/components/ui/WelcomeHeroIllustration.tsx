import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * WelcomeHeroIllustration
 *
 * Renders the friendly TindaMate community market scene:
 * - A smiling local vendor holding a smartphone
 * - Fresh market fruit & veggie stall with green-striped awning
 * - Chalkboard easel: "Support Local Business 💚"
 * - Floating badges for "Storefront" and "Fresh Produce"
 * - Soft warm circular backdrop
 *
 * Built with pure React Native primitives for instantaneous loading,
 * zero network delay, and pixel-sharp rendering across all screen densities.
 */
export function WelcomeHeroIllustration() {
  return (
    <View style={styles.container}>
      {/* Soft warm circular backdrop halo */}
      <View style={styles.backdropHalo} />

      {/* Floating Badge 1: Storefront / Tindahan Badge (Top Left) */}
      <View style={[styles.floatingBadge, styles.badgeStore]}>
        <Text style={styles.badgeStoreIcon}>🏪</Text>
      </View>

      {/* Floating Badge 2: Fresh Produce Badge (Mid Left) */}
      <View style={[styles.floatingBadge, styles.badgeProduce]}>
        <Text style={styles.badgeProduceIcon}>🍎🍊</Text>
      </View>

      {/* Market Scene Layout: Vendor on left + Stall on right */}
      <View style={styles.sceneContainer}>
        {/* Left: Vendor Figure */}
        <View style={styles.vendorContainer}>
          {/* Vendor Head & Hair */}
          <View style={styles.vendorHeadWrapper}>
            <View style={styles.vendorHair} />
            <View style={styles.vendorFace}>
              {/* Smiling Eyes & Smile */}
              <View style={styles.vendorEyesRow}>
                <View style={styles.vendorEye} />
                <View style={styles.vendorEye} />
              </View>
              <View style={styles.vendorSmile} />
            </View>
          </View>

          {/* Vendor Torso in Green Shirt */}
          <View style={styles.vendorBody}>
            <View style={styles.vendorCollar} />
            {/* Hand holding Smartphone */}
            <View style={styles.phoneArm}>
              <View style={styles.smartphone}>
                <View style={styles.phoneScreen} />
              </View>
            </View>
          </View>
        </View>

        {/* Right: Fruit Stall & Chalkboard */}
        <View style={styles.stallContainer}>
          {/* Awning Canopy (Green and White stripes) */}
          <View style={styles.awning}>
            <View style={[styles.awningStripe, styles.stripeGreen]} />
            <View style={[styles.awningStripe, styles.stripeWhite]} />
            <View style={[styles.awningStripe, styles.stripeGreen]} />
            <View style={[styles.awningStripe, styles.stripeWhite]} />
            <View style={[styles.awningStripe, styles.stripeGreen]} />
          </View>
          {/* Scalloped Awning Edge */}
          <View style={styles.awningEdge}>
            <View style={[styles.scallop, styles.stripeGreen]} />
            <View style={[styles.scallop, styles.stripeWhite]} />
            <View style={[styles.scallop, styles.stripeGreen]} />
            <View style={[styles.scallop, styles.stripeWhite]} />
            <View style={[styles.scallop, styles.stripeGreen]} />
          </View>

          {/* Wooden Shelf / Produce Crates */}
          <View style={styles.shelves}>
            {/* Top Crate: Greens & Oranges */}
            <View style={styles.crate}>
              <View style={styles.produceRow}>
                <View style={[styles.produceItem, { backgroundColor: '#10B981' }]} />
                <View style={[styles.produceItem, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.produceItem, { backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
            {/* Bottom Crate: Bread & Fruits */}
            <View style={styles.crate}>
              <View style={styles.produceRow}>
                <View style={[styles.produceItem, { backgroundColor: '#FBBF24' }]} />
                <View style={[styles.produceItem, { backgroundColor: '#34D399' }]} />
                <View style={[styles.produceItem, { backgroundColor: '#F97316' }]} />
              </View>
            </View>
          </View>

          {/* Chalkboard Sign: Support Local Business */}
          <View style={styles.chalkboardWrapper}>
            <View style={styles.chalkboardBoard}>
              <Text style={styles.chalkboardTitle}>Support</Text>
              <Text style={styles.chalkboardTitle}>Local</Text>
              <Text style={styles.chalkboardTitle}>Business</Text>
              <Text style={styles.chalkboardHeart}>💚</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  backdropHalo: {
    position: 'absolute',
    width: 280,
    height: 210,
    backgroundColor: '#FEF9EE',
    borderRadius: 140,
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
  },
  floatingBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeStore: {
    top: 18,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D7A4D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeStoreIcon: {
    fontSize: 22,
  },
  badgeProduce: {
    top: 76,
    left: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeProduceIcon: {
    fontSize: 16,
  },
  sceneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 12,
  },
  // Vendor styling
  vendorContainer: {
    alignItems: 'center',
    zIndex: 5,
    marginRight: -10,
    marginBottom: 6,
  },
  vendorHeadWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  vendorHair: {
    width: 72,
    height: 52,
    backgroundColor: '#33231B',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    position: 'absolute',
    top: -4,
  },
  vendorFace: {
    width: 54,
    height: 54,
    backgroundColor: '#FBCFE8',
    borderRadius: 27,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  vendorEyesRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  vendorEye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E293B',
  },
  vendorSmile: {
    width: 14,
    height: 7,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    borderBottomWidth: 2,
    borderColor: '#BE185D',
  },
  vendorBody: {
    width: 90,
    height: 94,
    backgroundColor: '#0D7A4D',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 32,
    alignItems: 'center',
    marginTop: -4,
    position: 'relative',
  },
  vendorCollar: {
    width: 28,
    height: 12,
    backgroundColor: '#FBCFE8',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  phoneArm: {
    position: 'absolute',
    right: 4,
    top: 28,
    zIndex: 6,
  },
  smartphone: {
    width: 26,
    height: 48,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#475569',
    transform: [{ rotate: '-10deg' }],
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  // Stall styling
  stallContainer: {
    width: 150,
    alignItems: 'center',
    zIndex: 4,
    marginBottom: 8,
  },
  awning: {
    flexDirection: 'row',
    width: 136,
    height: 28,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  awningStripe: {
    flex: 1,
    height: '100%',
  },
  awningEdge: {
    flexDirection: 'row',
    width: 136,
    height: 8,
  },
  scallop: {
    flex: 1,
    height: 8,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  stripeGreen: {
    backgroundColor: '#0D7A4D',
  },
  stripeWhite: {
    backgroundColor: '#F8FAFC',
  },
  shelves: {
    width: 126,
    backgroundColor: '#D97706',
    borderRadius: 4,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#B45309',
    marginTop: 2,
  },
  crate: {
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    padding: 3,
  },
  produceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  produceItem: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  chalkboardWrapper: {
    width: 82,
    backgroundColor: '#78350F',
    borderRadius: 4,
    padding: 3,
    marginTop: 6,
    alignSelf: 'flex-end',
    marginRight: 6,
  },
  chalkboardBoard: {
    backgroundColor: '#064E3B',
    borderRadius: 3,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chalkboardTitle: {
    color: '#F0FDF4',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  chalkboardHeart: {
    fontSize: 10,
    marginTop: 2,
  },
});

