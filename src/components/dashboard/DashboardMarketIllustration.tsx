import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DashboardMarketIllustrationProps {
  width?: number;
  height?: number;
  compact?: boolean;
}

/**
 * DashboardMarketIllustration (Target Reference 3D Sari-Sari Store House)
 *
 * Pure React Native vector/geometric reconstruction of the charming front-facing
 * Sari-Sari Store House from the Dashboard reference:
 * - Warm golden-peach sun halo circle behind the store
 * - Lush layered green trees and bushes on left and right
 * - Terracotta roof ridge + 5-stripe orange-and-white overhanging awning with scalloped tips
 * - Cream storefront facade with two paned teal windows (with wooden frames & sills)
 * - Dark brown wooden center door with golden knob and stone entrance step
 * - Soft elliptical ground shadow sitting naturally on the mint-sage canvas
 */
export function DashboardMarketIllustration({
  width = 162,
  height = 138,
  compact = false,
}: DashboardMarketIllustrationProps) {
  const scaleFactor = compact ? 0.42 : 1;

  const storeScene = (
    <View style={styles.sceneCanvas}>
      {/* 1. Soft Elliptical Ground Shadow */}
      <View style={styles.groundShadow} />

      {/* 2. Warm Golden-Peach Circular Sun Halo */}
      <View style={styles.sunHaloOuter}>
        <View style={styles.sunHaloInner} />
      </View>

      {/* 3. Upper-Right Floating Leaf Accents */}
      <View style={styles.topRightLeaf1} />
      <View style={styles.topRightLeaf2} />

      {/* 4. Left Tree & Layered Bushes */}
      <View style={styles.leftTreeGroup}>
        <View style={styles.treeCrownBack} />
        <View style={styles.treeCrownTop} />
        <View style={styles.treeCrownLeft} />
        <View style={styles.treeTrunk} />
        <View style={styles.leftBushFront} />
        <View style={styles.leftBushMini} />
      </View>

      {/* 5. Main Front-Facing Sari-Sari Store House */}
      <View style={styles.houseContainer}>
        {/* Terracotta Roof Ridge Cap */}
        <View style={styles.roofRidgeCap}>
          <View style={styles.roofRidgeHighlight} />
        </View>

        {/* Overhanging 5-Stripe Orange & White Awning */}
        <View style={styles.awningWrapper}>
          <View style={styles.awningSlantRow}>
            <View style={[styles.awningStripe, styles.stripeOrange]} />
            <View style={[styles.awningStripe, styles.stripeWhite]} />
            <View style={[styles.awningStripe, styles.stripeOrange]} />
            <View style={[styles.awningStripe, styles.stripeWhite]} />
            <View style={[styles.awningStripe, styles.stripeOrange]} />
          </View>

          {/* Scalloped Awning Bottom Edge */}
          <View style={styles.scallopRow}>
            <View style={[styles.scallopCap, styles.scallopOrange]} />
            <View style={[styles.scallopCap, styles.scallopWhite]} />
            <View style={[styles.scallopCap, styles.scallopOrange]} />
            <View style={[styles.scallopCap, styles.scallopWhite]} />
            <View style={[styles.scallopCap, styles.scallopOrange]} />
          </View>
        </View>

        {/* Cream Storefront Facade Body */}
        <View style={styles.facadeBody}>
          {/* Awning Drop Shadow on Upper Wall */}
          <View style={styles.wallTopShadow} />

          <View style={styles.facadeContentRow}>
            {/* Left Paned Window */}
            <View style={styles.windowUnit}>
              <View style={styles.windowFrame}>
                <View style={styles.windowGlass}>
                  <View style={styles.windowDividerV} />
                  <View style={styles.windowDividerH} />
                  <View style={styles.windowReflection} />
                </View>
              </View>
              <View style={styles.windowSill} />
            </View>

            {/* Center Wooden Doorway */}
            <View style={styles.doorUnit}>
              <View style={styles.doorFrame}>
                <View style={styles.doorInnerPanelTop} />
                <View style={styles.doorKnob} />
              </View>
            </View>

            {/* Right Paned Window */}
            <View style={styles.windowUnit}>
              <View style={styles.windowFrame}>
                <View style={styles.windowGlass}>
                  <View style={styles.windowDividerV} />
                  <View style={styles.windowDividerH} />
                  <View style={styles.windowReflection} />
                </View>
              </View>
              <View style={styles.windowSill} />
            </View>
          </View>

          {/* Terracotta Base Plinth + Center Stone Step */}
          <View style={styles.foundationRow}>
            <View style={styles.foundationBrickLeft} />
            <View style={styles.doorStoneStep} />
            <View style={styles.foundationBrickRight} />
          </View>
        </View>
      </View>

      {/* 6. Right Foreground Lush Bushes */}
      <View style={styles.rightBushGroup}>
        <View style={styles.rightBushTall} />
        <View style={styles.rightBushMid} />
        <View style={styles.rightBushFront} />
      </View>
    </View>
  );

  if (compact) {
    return (
      <View
        style={{
          width: 68,
          height: 60,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        accessible={false}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants">
        <View style={{ transform: [{ scale: scaleFactor }] }}>{storeScene}</View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { width, height }]}
      accessible={false}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants">
      {storeScene}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sceneCanvas: {
    width: 162,
    height: 138,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    paddingBottom: 6,
  },
  // 1. Ground Shadow
  groundShadow: {
    position: 'absolute',
    bottom: 2,
    width: 146,
    height: 14,
    borderRadius: 73,
    backgroundColor: 'rgba(6, 78, 59, 0.18)',
    zIndex: 1,
  },
  // 2. Golden-Peach Sun Halo
  sunHaloOuter: {
    position: 'absolute',
    top: 4,
    right: 10,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#FDE68A',
    borderWidth: 3,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sunHaloInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FEF3C7',
    opacity: 0.75,
  },
  // 3. Upper-Right Leaf Accents
  topRightLeaf1: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 16,
    height: 24,
    borderRadius: 10,
    backgroundColor: '#84CC16',
    transform: [{ rotate: '28deg' }],
    zIndex: 2,
  },
  topRightLeaf2: {
    position: 'absolute',
    top: 24,
    right: 2,
    width: 14,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    transform: [{ rotate: '52deg' }],
    zIndex: 2,
  },
  // 4. Left Tree & Bushes
  leftTreeGroup: {
    position: 'absolute',
    left: 2,
    bottom: 8,
    width: 54,
    height: 92,
    zIndex: 2,
  },
  treeCrownBack: {
    position: 'absolute',
    top: 4,
    left: 18,
    width: 32,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ADE80',
  },
  treeCrownTop: {
    position: 'absolute',
    top: 12,
    left: 4,
    width: 36,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#86EFAC',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  treeCrownLeft: {
    position: 'absolute',
    top: 26,
    left: 0,
    width: 34,
    height: 32,
    borderRadius: 17,
    backgroundColor: '#22C55E',
  },
  treeTrunk: {
    position: 'absolute',
    bottom: 12,
    left: 19,
    width: 7,
    height: 26,
    borderRadius: 3,
    backgroundColor: '#B45309',
    transform: [{ rotate: '-8deg' }],
  },
  leftBushFront: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    width: 34,
    height: 22,
    borderRadius: 12,
    backgroundColor: '#16A34A',
  },
  leftBushMini: {
    position: 'absolute',
    bottom: 0,
    left: -2,
    width: 20,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  // 5. Storefront House
  houseContainer: {
    width: 108,
    alignItems: 'center',
    zIndex: 4,
    marginLeft: 6,
  },
  roofRidgeCap: {
    width: 82,
    height: 8,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#C2410C',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 1.5,
  },
  roofRidgeHighlight: {
    width: '90%',
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#FB923C',
  },
  awningWrapper: {
    width: 108,
    alignItems: 'center',
    zIndex: 5,
  },
  awningSlantRow: {
    width: 106,
    height: 26,
    flexDirection: 'row',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#C2410C',
  },
  awningStripe: {
    flex: 1,
    height: '100%',
  },
  stripeOrange: {
    backgroundColor: '#EA580C',
  },
  stripeWhite: {
    backgroundColor: '#FFFBEB',
  },
  scallopRow: {
    width: 106,
    height: 9,
    flexDirection: 'row',
    marginTop: -1,
  },
  scallopCap: {
    flex: 1,
    height: 9,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  scallopOrange: {
    backgroundColor: '#C2410C',
    borderColor: '#9A3412',
  },
  scallopWhite: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  facadeBody: {
    width: 92,
    backgroundColor: '#FDEFD5',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#D97706',
    alignItems: 'center',
    marginTop: -2,
    overflow: 'hidden',
  },
  wallTopShadow: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(180, 83, 9, 0.18)',
  },
  facadeContentRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 5,
  },
  windowUnit: {
    alignItems: 'center',
    marginBottom: 6,
  },
  windowFrame: {
    width: 22,
    height: 22,
    borderRadius: 2.5,
    backgroundColor: '#92400E',
    padding: 2,
  },
  windowGlass: {
    flex: 1,
    backgroundColor: '#0D9488',
    borderRadius: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  windowDividerV: {
    position: 'absolute',
    width: 1.5,
    height: '100%',
    backgroundColor: '#5EEAD4',
    opacity: 0.65,
  },
  windowDividerH: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: '#5EEAD4',
    opacity: 0.65,
  },
  windowReflection: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 10,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{ rotate: '25deg' }],
  },
  windowSill: {
    width: 25,
    height: 3.5,
    borderRadius: 1.5,
    backgroundColor: '#B45309',
    marginTop: 1,
  },
  doorUnit: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  doorFrame: {
    width: 24,
    height: 34,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: '#451A03',
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#78350F',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 8,
    position: 'relative',
  },
  doorInnerPanelTop: {
    width: 14,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#0F766E',
    opacity: 0.65,
  },
  doorKnob: {
    position: 'absolute',
    right: 3.5,
    top: 17,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FDE047',
  },
  foundationRow: {
    width: '100%',
    height: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  foundationBrickLeft: {
    flex: 1,
    height: 6,
    backgroundColor: '#B45309',
  },
  doorStoneStep: {
    width: 28,
    height: 7,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: '#A8A29E',
    borderTopWidth: 1.5,
    borderColor: '#E7E5E4',
  },
  foundationBrickRight: {
    flex: 1,
    height: 6,
    backgroundColor: '#92400E',
  },
  // 6. Right Foreground Bushes
  rightBushGroup: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 44,
    height: 48,
    zIndex: 6,
  },
  rightBushTall: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 24,
    height: 28,
    borderRadius: 13,
    backgroundColor: '#4ADE80',
  },
  rightBushMid: {
    position: 'absolute',
    right: 0,
    bottom: 6,
    width: 28,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
  },
  rightBushFront: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    width: 28,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#15803D',
  },
});
