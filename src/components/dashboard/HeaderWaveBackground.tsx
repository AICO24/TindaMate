import React from 'react';
import { StyleSheet, View } from 'react-native';

interface HeaderWaveBackgroundProps {
  height?: number;
}

/**
 * HeaderWaveBackground (TindaMate Design 2.0 Showcase Signature Waves)
 *
 * Renders the authentic, multi-layered flowing diagonal wave ribbons seen across
 * all screens of TindaMate POS App Showcase.png (Dashboard, Product Details, Reports, More):
 * - Deep Forest Green (#064E3B) rich foundation
 * - Flowing vibrant Emerald (#059669 / #0D7A4D) diagonal wave sweep
 * - Warm Market Orange (#F97316 / #F59E0B) dynamic accent ribbon on the right edge
 * - Mint / Sage (#34D399 / #A7F3D0) soft wave crest
 * - Organic foliage leaf silhouettes floating in the header ambience
 */
export function HeaderWaveBackground({ height = 156 }: HeaderWaveBackgroundProps) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      {/* 1. Base Deep Forest Green is set on container */}

      {/* 2. Top-Right Ambient Glow Circle */}
      <View style={styles.ambientGlow} />

      {/* 3. Sweeping Warm Orange / Amber Dynamic Ribbon on the Right */}
      <View style={styles.orangeWaveRibbon} />

      {/* 4. Layered Diagonal Emerald Green Wave Sweep */}
      <View style={styles.emeraldWaveSweep} />

      {/* 5. Supporting Deep Mint Wave Ribbon */}
      <View style={styles.mintWaveRibbon} />

      {/* 6. Ambient Organic Leaf Silhouettes floating in the header */}
      <View style={styles.leafOne} />
      <View style={styles.leafTwo} />
      <View style={styles.leafThree} />

      {/* 7. Bottom Organic S-Wave Transition into White Canvas */}
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
  // Soft ambient emerald glow
  ambientGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0D7A4D',
    opacity: 0.6,
  },
  // Signature Warm Market Orange Wave Ribbon on the right
  orangeWaveRibbon: {
    position: 'absolute',
    top: 10,
    right: -45,
    width: 170,
    height: 120,
    borderTopLeftRadius: 90,
    borderBottomLeftRadius: 110,
    backgroundColor: '#F59E0B',
    opacity: 0.85,
    transform: [{ rotate: '-18deg' }],
  },
  // Main sweeping emerald wave cutting diagonally across the header
  emeraldWaveSweep: {
    position: 'absolute',
    top: -15,
    left: -40,
    right: 30,
    height: 130,
    borderBottomRightRadius: 180,
    borderBottomLeftRadius: 140,
    backgroundColor: '#047857',
    opacity: 0.88,
    transform: [{ rotate: '-5deg' }],
  },
  // Soft mint wave ribbon
  mintWaveRibbon: {
    position: 'absolute',
    top: 35,
    left: 20,
    right: -20,
    height: 85,
    borderTopLeftRadius: 160,
    borderBottomLeftRadius: 140,
    backgroundColor: '#10B981',
    opacity: 0.38,
    transform: [{ rotate: '-12deg' }],
  },
  // Floating organic leaf silhouettes matching showcase header
  leafOne: {
    position: 'absolute',
    top: 8,
    right: 80,
    width: 32,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#34D399',
    opacity: 0.22,
    transform: [{ rotate: '38deg' }],
  },
  leafTwo: {
    position: 'absolute',
    top: 24,
    right: 120,
    width: 22,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#10B981',
    opacity: 0.18,
    transform: [{ rotate: '-24deg' }],
  },
  leafThree: {
    position: 'absolute',
    top: -6,
    right: 170,
    width: 18,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#A7F3D0',
    opacity: 0.15,
    transform: [{ rotate: '15deg' }],
  },
  // Bottom transition curves into #F8FAFC canvas
  bottomWaveEmerald: {
    position: 'absolute',
    bottom: -16,
    left: -30,
    right: -30,
    height: 38,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 260,
    backgroundColor: '#059669',
    opacity: 0.45,
    transform: [{ rotate: '-1.5deg' }],
  },
  bottomWaveWhite: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    right: -20,
    height: 32,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 240,
    backgroundColor: '#F8FAFC',
  },
});

