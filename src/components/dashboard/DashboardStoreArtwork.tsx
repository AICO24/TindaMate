import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DashboardMarketIllustration } from './DashboardMarketIllustration';

interface DashboardStoreArtworkProps {
  size?: number;
}

/**
 * DashboardStoreArtwork (Strategy 1: Pure Native Marketplace Illustration)
 *
 * Renders the clean, code-driven marketplace stall illustration:
 * - Scalloped canopy awning with classic market stripes
 * - Wooden posts, counter, and tiered fruit/produce crates
 * - Organic foliage leaves at the base and soft warm sun backdrop halo
 * - 100% pure React Native primitives (zero bitmap cropping, zero white frames, zero circular token borders)
 */
export function DashboardStoreArtwork({ size = 112 }: DashboardStoreArtworkProps) {
  return (
    <View style={styles.container}>
      <DashboardMarketIllustration
        width={Math.round(size * 1.35)}
        height={Math.round(size * 1.22)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
