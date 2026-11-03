import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface DashboardStoreArtworkProps {
  size?: number;
}

const STORE_STAGE = require('@/assets/images/dashboard-store-stage.png');

/**
 * DashboardStoreArtwork (Authentic Showcase 3D Tindahan Stage)
 *
 * Renders the authentic 3D sari-sari storefront stage from Screen 1 of TindaMate POS App Showcase.png:
 * - High-detail 3D storefront with orange-and-white striped awning and scalloped fringe
 * - Warm amber circular halo backdrop
 * - Lush layered green foliage bushes framing the building
 * - Crisp resolution and seamless overlap across the green header wave and light canvas
 */
export function DashboardStoreArtwork({ size = 114 }: DashboardStoreArtworkProps) {
  const height = Math.round(size * 0.94);

  return (
    <View
      style={[styles.container, { width: size, height }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {/* Soft warm under-glow */}
      <View style={[styles.haloGlow, { width: size * 0.9, height: size * 0.9 }]} />

      <Image
        source={STORE_STAGE}
        style={[styles.storeImage, { width: size, height }]}
        resizeMode="contain"
      />
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
  haloGlow: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#FED7AA',
    opacity: 0.45,
    transform: [{ scale: 1.05 }],
  },
  storeImage: {
    zIndex: 2,
  },
});
