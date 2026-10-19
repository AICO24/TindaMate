import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface StorefrontLogoProps {
  /** Size scale factor, default 1 */
  scale?: number;
  /** Whether to show the wordmark text */
  showWordmark?: boolean;
  /** Whether to show the subtitle tagline */
  showTagline?: boolean;
}

/**
 * StorefrontLogo
 *
 * Renders the iconic TindaMate sari-sari store graphic with its green-and-yellow
 * striped awning, storefront counter window, and the dual-color "TindaMate" wordmark.
 */
export function StorefrontLogo({
  scale = 1,
  showWordmark = true,
  showTagline = true,
}: StorefrontLogoProps) {
  const baseWidth = 56 * scale;
  const baseHeight = 48 * scale;

  return (
    <View style={styles.container}>
      {/* Sari-sari Store Icon */}
      <View
        style={[
          styles.storeIconContainer,
          { width: baseWidth, height: baseHeight },
        ]}>
        {/* Awning Roof */}
        <View style={styles.awning}>
          <View style={[styles.stripe, styles.greenStripe]} />
          <View style={[styles.stripe, styles.yellowStripe]} />
          <View style={[styles.stripe, styles.greenStripe]} />
          <View style={[styles.stripe, styles.yellowStripe]} />
          <View style={[styles.stripe, styles.greenStripe]} />
        </View>

        {/* Awning Scalloped Valance / Eaves */}
        <View style={styles.valanceRow}>
          <View style={[styles.valance, styles.greenValance]} />
          <View style={[styles.valance, styles.yellowValance]} />
          <View style={[styles.valance, styles.greenValance]} />
          <View style={[styles.valance, styles.yellowValance]} />
          <View style={[styles.valance, styles.greenValance]} />
        </View>

        {/* Store Front Wall & Window */}
        <View style={styles.storeBody}>
          <View style={styles.storeWindow}>
            {/* Window Glass / Counter opening */}
            <View style={styles.glassOpening} />
          </View>
        </View>
      </View>

      {/* Brand Wordmark: Tinda (Green) + Mate (Orange) */}
      {showWordmark && (
        <Text style={styles.wordmark}>
          <Text style={styles.wordmarkGreen}>Tinda</Text>
          <Text style={styles.wordmarkOrange}>Mate</Text>
        </Text>
      )}

      {/* Tagline */}
      {showTagline && (
        <Text style={styles.tagline}>Your Digital Tindahan Assistant</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  awning: {
    flexDirection: 'row',
    width: '100%',
    height: '46%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#0A5C3A',
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  greenStripe: {
    backgroundColor: '#0D7A4D',
  },
  yellowStripe: {
    backgroundColor: '#FDE047',
  },
  valanceRow: {
    flexDirection: 'row',
    width: '100%',
    height: 5,
    marginTop: -1,
  },
  valance: {
    flex: 1,
    height: 5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  greenValance: {
    backgroundColor: '#0D7A4D',
  },
  yellowValance: {
    backgroundColor: '#F59E0B',
  },
  storeBody: {
    width: '88%',
    height: '46%',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#0A5C3A',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  storeWindow: {
    width: '74%',
    height: '75%',
    backgroundColor: '#E0F2FE',
    borderWidth: 1.2,
    borderColor: '#0D7A4D',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassOpening: {
    width: '80%',
    height: '40%',
    backgroundColor: '#0284C7',
    opacity: 0.25,
    borderRadius: 1,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  wordmarkGreen: {
    color: '#0D7A4D',
  },
  wordmarkOrange: {
    color: '#F59E0B',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
});

