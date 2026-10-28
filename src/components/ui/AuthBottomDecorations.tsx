import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * AuthBottomDecorations
 *
 * Renders the restrained, organic TindaMate green and warm market orange corner shapes
 * at the bottom of the Login and Register screens matching the primary visual reference.
 * Uses pointerEvents="none" so it never intercepts touches or keyboard interactions.
 */
export function AuthBottomDecorations() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Bottom-left layered green hill & foliage */}
      <View style={styles.leftCornerGroup}>
        <View style={styles.leftHillBack} />
        <View style={styles.leftHillFront} />
        <View style={styles.leftLeafAccentOne} />
        <View style={styles.leftLeafAccentTwo} />
      </View>

      {/* Bottom-right warm market orange & amber curve */}
      <View style={styles.rightCornerGroup}>
        <View style={styles.rightCurveBack} />
        <View style={styles.rightCurveFront} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    overflow: 'hidden',
    zIndex: -1,
  },

  // Bottom-left green organic corner
  leftCornerGroup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 150,
    height: 100,
  },
  leftHillBack: {
    position: 'absolute',
    bottom: -36,
    left: -24,
    width: 145,
    height: 98,
    borderTopRightRadius: 110,
    borderTopLeftRadius: 40,
    backgroundColor: '#A7F3D0',
    opacity: 0.45,
  },
  leftHillFront: {
    position: 'absolute',
    bottom: -42,
    left: -30,
    width: 132,
    height: 96,
    borderTopRightRadius: 100,
    borderTopLeftRadius: 36,
    backgroundColor: Colors.primary,
  },
  leftLeafAccentOne: {
    position: 'absolute',
    bottom: 24,
    left: 10,
    width: 24,
    height: 46,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#34D399',
    opacity: 0.65,
    transform: [{ rotate: '-18deg' }],
  },
  leftLeafAccentTwo: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    width: 22,
    height: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Colors.primaryBrand,
    opacity: 0.85,
    transform: [{ rotate: '16deg' }],
  },

  // Bottom-right warm orange organic corner
  rightCornerGroup: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 150,
    height: 105,
  },
  rightCurveBack: {
    position: 'absolute',
    bottom: -38,
    right: -28,
    width: 142,
    height: 102,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 30,
    backgroundColor: Colors.accentWarm,
    opacity: 0.4,
  },
  rightCurveFront: {
    position: 'absolute',
    bottom: -42,
    right: -32,
    width: 128,
    height: 96,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 28,
    backgroundColor: Colors.accent,
  },
});
