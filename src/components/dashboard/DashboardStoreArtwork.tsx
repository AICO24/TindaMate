import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface DashboardStoreArtworkProps {
  size?: number;
}

const STORE_ART = require('@/assets/images/sari-sari-store-art.png');

/**
 * DashboardStoreArtwork (Professional 3D Sari-Sari Storefront Mascot Stage)
 *
 * Replaces crude rectangular crops with a professional, seamless 3D diorama medallion stage:
 * - Circular clipping mask (borderRadius: 9999) that eliminates all sharp rectangular borders
 * - Subtle warm amber glowing halo backdrop (#FEF3C7 / #FED7AA)
 * - Delicate golden rim border (#FDBA74) framing the 3D storefront
 * - Perfectly centered composition matching modern mobile app design standards
 */
export function DashboardStoreArtwork({ size = 112 }: DashboardStoreArtworkProps) {
  const maskRadius = Math.round(size / 2);

  return (
    <View
      style={[styles.stageOuter, { width: size, height: size }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {/* 1. Ambient warm golden glow ring */}
      <View
        style={[
          styles.outerGlowRing,
          {
            width: size + 10,
            height: size + 10,
            borderRadius: maskRadius + 5,
          },
        ]}
      />

      {/* 2. Soft inner warm halo */}
      <View
        style={[
          styles.innerHalo,
          {
            width: size,
            height: size,
            borderRadius: maskRadius,
          },
        ]}
      />

      {/* 3. Professional circular diorama mask (removes all rectangular crop artifacts) */}
      <View
        style={[
          styles.circularMask,
          {
            width: size,
            height: size,
            borderRadius: maskRadius,
          },
        ]}>
        <Image
          source={STORE_ART}
          style={[
            styles.storeImage,
            {
              width: size * 1.18,
              height: size * 1.18,
            },
          ]}
          resizeMode="cover"
        />
      </View>

      {/* 4. Elegant golden rim highlight */}
      <View
        style={[
          styles.goldenRim,
          {
            width: size,
            height: size,
            borderRadius: maskRadius,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stageOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  outerGlowRing: {
    position: 'absolute',
    backgroundColor: '#FED7AA',
    opacity: 0.45,
  },
  innerHalo: {
    position: 'absolute',
    backgroundColor: '#FEF3C7',
    opacity: 0.7,
  },
  circularMask: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  storeImage: {
    transform: [{ translateY: -2 }, { scale: 1.05 }],
  },
  goldenRim: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    opacity: 0.85,
  },
});
