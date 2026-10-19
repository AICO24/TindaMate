import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface StorefrontLogoProps {
  /** Size scale factor, default 1 */
  scale?: number;
  /** Whether to show the wordmark text */
  showWordmark?: boolean;
  /** Whether to show the subtitle tagline */
  showTagline?: boolean;
}

const storefrontSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56" fill="none">
  <!-- Store Base/Walls -->
  <rect x="7" y="22" width="50" height="30" rx="5" fill="#F8FAFC" stroke="#0D7A4D" stroke-width="2.5" />
  <!-- Store Window Counter Opening -->
  <rect x="15" y="27" width="34" height="20" rx="3" fill="#E0F2FE" stroke="#0D7A4D" stroke-width="2" />
  <!-- Window Glass divider / Counter shelf -->
  <path d="M15 37h34" stroke="#0D7A4D" stroke-width="1.5" />
  <rect x="23" y="30" width="18" height="14" rx="2" fill="#38BDF8" fill-opacity="0.3" />
  <!-- Awning Stripes Canopy -->
  <path d="M4 14c0-4.418 3.582-8 8-8h2.4v18H4V14z" fill="#0D7A4D" />
  <path d="M14.4 6h11.2v18H14.4V6z" fill="#FDE047" />
  <path d="M25.6 6h12.8v18H25.6V6z" fill="#0D7A4D" />
  <path d="M38.4 6h11.2v18H38.4V6z" fill="#FDE047" />
  <path d="M49.6 6H52c4.418 0 8 3.582 8 8v10H49.6V6z" fill="#0D7A4D" />
  <!-- Scalloped Awning Valance -->
  <path d="M4 24a5.2 5.2 0 0 0 10.4 0" fill="#0D7A4D" />
  <path d="M14.4 24a5.2 5.2 0 0 0 10.4 0" fill="#F59E0B" />
  <path d="M24.8 24a7.2 7.2 0 0 0 14.4 0" fill="#0D7A4D" />
  <path d="M38.4 24a5.2 5.2 0 0 0 10.4 0" fill="#F59E0B" />
  <path d="M48.8 24a5.6 5.6 0 0 0 11.2 0" fill="#0D7A4D" />
  <!-- Awning Outer Roof Outline -->
  <path d="M4 14C4 9.582 7.582 6 12 6h40c4.418 0 8 3.582 8 8v10H4V14z" stroke="#064E3B" stroke-width="2.5" />
</svg>
`;

const storefrontUri = `data:image/svg+xml;utf8,${encodeURIComponent(storefrontSvg)}`;

/**
 * StorefrontLogo
 *
 * Renders the authentic TindaMate storefront graphic with its striped awning,
 * scalloped eaves, shop counter window, and the dual-color "TindaMate" wordmark.
 */
export function StorefrontLogo({
  scale = 1,
  showWordmark = true,
  showTagline = true,
}: StorefrontLogoProps) {
  const iconWidth = 58 * scale;
  const iconHeight = 50 * scale;

  return (
    <View style={styles.container}>
      {/* Store Graphic */}
      <Image
        source={{ uri: storefrontUri }}
        style={{ width: iconWidth, height: iconHeight, marginBottom: 6 }}
        contentFit="contain"
      />

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
