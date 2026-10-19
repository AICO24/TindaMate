import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
 * Renders the authentic TindaMate sari-sari store graphic with its green-and-yellow
 * striped awning, scalloped eaves, shop counter window, and the dual-color "TindaMate" wordmark.
 * Built with pure React Native primitives - 100% visible and sharp on Android, iOS, and Web.
 */
export function StorefrontLogo({
  scale = 1,
  showWordmark = true,
  showTagline = true,
}: StorefrontLogoProps) {
  const baseWidth = 54 * scale;
  const baseHeight = 44 * scale;

  return (
    <View style={styles.container}>
      {/* Sari-sari Store Graphic */}
      <View
        style={[
          styles.storeContainer,
          { width: baseWidth, height: baseHeight },
        ]}>
        {/* Awning Canopy with 5 Stripes */}
        <View style={styles.awning}>
          <View style={[styles.stripe, styles.greenStripe]} />
          <View style={[styles.stripe, styles.yellowStripe]} />
          <View style={[styles.stripe, styles.greenStripe]} />
          <View style={[styles.stripe, styles.yellowStripe]} />
          <View style={[styles.stripe, styles.greenStripe]} />
        </View>

        {/* Scalloped Valance / Awning Eaves */}
        <View style={styles.valanceRow}>
          <View style={[styles.valance, styles.greenValance]} />
          <View style={[styles.valance, styles.yellowValance]} />
          <View style={[styles.valance, styles.greenValance]} />
          <View style={[styles.valance, styles.yellowValance]} />
          <View style={[styles.valance, styles.greenValance]} />
        </View>

        {/* Store Front Wall & Counter Window */}
        <View style={styles.storeBody}>
          <View style={styles.storeWindow}>
            {/* Window Glass / Counter Opening */}
            <View style={styles.glassOpening} />
            {/* Window Shelf Bar */}
            <View style={styles.shelfBar} />
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
  storeContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  awning: {
    flexDirection: 'row',
    width: '100%',
    height: '46%',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    overflow: 'hidden',
    borderWidth: 1.6,
    borderColor: '#064E3B',
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
    zIndex: 2,
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
    borderLeftWidth: 1.6,
    borderRightWidth: 1.6,
    borderBottomWidth: 1.6,
    borderColor: '#064E3B',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: -1,
  },
  storeWindow: {
    width: '76%',
    height: '75%',
    backgroundColor: '#E0F2FE',
    borderWidth: 1.2,
    borderColor: '#0D7A4D',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassOpening: {
    width: '65%',
    height: '50%',
    backgroundColor: '#38BDF8',
    opacity: 0.35,
    borderRadius: 1.5,
  },
  shelfBar: {
    position: 'absolute',
    bottom: 2,
    width: '100%',
    height: 1.2,
    backgroundColor: '#0D7A4D',
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
