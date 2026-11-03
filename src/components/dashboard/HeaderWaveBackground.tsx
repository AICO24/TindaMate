import React from 'react';
import { StyleSheet, View } from 'react-native';

interface HeaderWaveBackgroundProps {
  height?: number;
}

/**
 * HeaderWaveBackground (TindaMate Signature Zigzag & Diagonal Wave Canopy)
 *
 * Implements the authentic multi-layered zigzag / diagonal ribbon design seen in
 * the TindaMate Design 2.0 Showcase:
 * - Deep Forest Green foundation (#064E3B)
 * - Dynamic Warm Market Orange (#F59E0B / #F97316) zigzag ribbon cutting across the right
 * - Supporting vibrant Emerald (#047857) and Mint (#10B981) geometric wave bands
 * - Crisp zigzag chevron angles (/ \ /) creating the signature retail energy
 * - Organic leaf silhouettes floating in the header ambience
 * - Smooth curved bottom transition into the light hero canvas
 */
export function HeaderWaveBackground({ height = 150 }: HeaderWaveBackgroundProps) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      {/* 1. Base Deep Forest Green is set on container */}

      {/* 2. Soft Ambient Emerald Glow in top-right */}
      <View style={styles.ambientGlow} />

      {/* 3. Deep Emerald Wave Band */}
      <View style={styles.emeraldWaveBand} />

      {/* 4. Signature Dynamic Warm Orange Zigzag Ribbon 1 (Upper Diagonal) */}
      <View style={styles.orangeZigzagSegment1} />

      {/* 5. Signature Dynamic Warm Orange Zigzag Ribbon 2 (Lower Diagonal Bend) */}
      <View style={styles.orangeZigzagSegment2} />

      {/* 6. Sharp Mint Chevron / Accent Line running along the zigzag crest */}
      <View style={styles.mintAccentRibbon} />

      {/* 7. Secondary Emerald Diagonal Wave Contour */}
      <View style={styles.emeraldContourSweep} />

      {/* 8. Floating Brand Leaves */}
      <View style={styles.leafOne} />
      <View style={styles.leafTwo} />
      <View style={styles.leafThree} />

      {/* 9. Soft Curved Bottom Wave Transitions */}
      <View style={styles.bottomWaveEmerald} />
      <View style={styles.bottomWaveWhite} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#064E3B',
    overflow: 'hidden',
    zIndex: 0,
  },
  // Ambient radial glow in top right
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0D7A4D',
    opacity: 0.65,
  },
  // Deep emerald wave band cutting across
  emeraldWaveBand: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 240,
    height: 140,
    borderBottomLeftRadius: 160,
    backgroundColor: '#047857',
    opacity: 0.85,
    transform: [{ rotate: '-8deg' }],
  },
  // Segment 1 of the Warm Orange Zigzag ribbon: Sweeping down diagonally from top-right
  orangeZigzagSegment1: {
    position: 'absolute',
    top: 2,
    right: -35,
    width: 190,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F59E0B',
    opacity: 0.92,
    transform: [{ rotate: '-24deg' }],
  },
  // Segment 2 of the Warm Orange Zigzag ribbon: Angling back in an energetic zigzag bend
  orangeZigzagSegment2: {
    position: 'absolute',
    top: 36,
    right: 25,
    width: 140,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EA580C',
    opacity: 0.88,
    transform: [{ rotate: '26deg' }],
  },
  // Mint accent line highlighting the zigzag intersection
  mintAccentRibbon: {
    position: 'absolute',
    top: 48,
    right: 15,
    width: 110,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
    opacity: 0.75,
    transform: [{ rotate: '-18deg' }],
  },
  // Secondary emerald contour sweep
  emeraldContourSweep: {
    position: 'absolute',
    top: 65,
    right: -10,
    width: 170,
    height: 55,
    borderTopLeftRadius: 80,
    borderBottomLeftRadius: 90,
    backgroundColor: '#059669',
    opacity: 0.65,
    transform: [{ rotate: '-14deg' }],
  },
  // Floating organic leaves
  leafOne: {
    position: 'absolute',
    top: 14,
    right: 125,
    width: 26,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#6EE7B7',
    opacity: 0.28,
    transform: [{ rotate: '42deg' }],
  },
  leafTwo: {
    position: 'absolute',
    top: 34,
    right: 175,
    width: 18,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#34D399',
    opacity: 0.22,
    transform: [{ rotate: '-28deg' }],
  },
  leafThree: {
    position: 'absolute',
    top: -4,
    right: 200,
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#A7F3D0',
    opacity: 0.18,
    transform: [{ rotate: '18deg' }],
  },
  // Bottom curved transition into light canvas
  bottomWaveEmerald: {
    position: 'absolute',
    bottom: -14,
    left: -20,
    right: -20,
    height: 34,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 240,
    backgroundColor: '#047857',
    opacity: 0.45,
    transform: [{ rotate: '-1deg' }],
  },
  bottomWaveWhite: {
    position: 'absolute',
    bottom: -18,
    left: -20,
    right: -20,
    height: 28,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 220,
    backgroundColor: '#F2F5F3',
    opacity: 0.8,
  },
});
