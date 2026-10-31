import React from 'react';
import { StyleSheet, View } from 'react-native';

interface OrganicWaveDecorationProps {
  style?: any;
  inverted?: boolean;
}

/**
 * OrganicWaveDecoration
 * 
 * Renders the layered, flowing green, mint and warm-orange organic wave curves
 * seen above bottom navigation bars and beneath header sections in the TindaMate Design 2.0 reference.
 */
export function OrganicWaveDecoration({
  style,
  inverted = false,
}: OrganicWaveDecorationProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        inverted && styles.inverted,
        style,
      ]}>
      {/* Wave Layer 1: Soft warm orange/amber under-glow on one side */}
      <View style={styles.orangeGlow} />

      {/* Wave Layer 2: Soft mint/sage green background wave */}
      <View style={styles.mintWave} />

      {/* Wave Layer 3: Vibrant emerald curve */}
      <View style={styles.emeraldWave} />

      {/* Wave Layer 4: Deep forest green base curve */}
      <View style={styles.forestWave} />

      {/* Sprouting leaf accent on the curve edge */}
      <View style={styles.sproutWrapper}>
        <View style={styles.sproutStem} />
        <View style={styles.sproutLeafLeft} />
        <View style={styles.sproutLeafRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    overflow: 'hidden',
    zIndex: 1,
  },
  inverted: {
    bottom: undefined,
    top: 0,
    transform: [{ scaleY: -1 }],
  },
  orangeGlow: {
    position: 'absolute',
    bottom: -15,
    right: -20,
    width: 140,
    height: 55,
    borderRadius: 35,
    backgroundColor: '#FDBA74',
    opacity: 0.75,
    transform: [{ rotate: '-8deg' }],
  },
  mintWave: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    right: -40,
    height: 65,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 240,
    backgroundColor: '#A7F3D0',
    opacity: 0.65,
    transform: [{ scaleX: 1.15 }],
  },
  emeraldWave: {
    position: 'absolute',
    bottom: -24,
    left: -30,
    right: -30,
    height: 58,
    borderTopLeftRadius: 220,
    borderTopRightRadius: 160,
    backgroundColor: '#10B981',
    opacity: 0.78,
  },
  forestWave: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    right: -20,
    height: 52,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 260,
    backgroundColor: '#064E3B',
    opacity: 0.95,
  },
  sproutWrapper: {
    position: 'absolute',
    left: 28,
    bottom: 24,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 0.9,
  },
  sproutStem: {
    width: 2,
    height: 10,
    backgroundColor: '#34D399',
    borderRadius: 1,
  },
  sproutLeafLeft: {
    position: 'absolute',
    left: 1,
    top: 2,
    width: 7,
    height: 6,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 6,
    transform: [{ rotate: '-25deg' }],
  },
  sproutLeafRight: {
    position: 'absolute',
    right: 1,
    top: 0,
    width: 8,
    height: 7,
    backgroundColor: '#34D399',
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 7,
    transform: [{ rotate: '25deg' }],
  },
});
