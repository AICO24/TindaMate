import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

interface TindaMateCartLogoProps {
  /** Size multiplier (default: 1) */
  scale?: number;
  /** Whether to show the tagline below the wordmark */
  showTagline?: boolean;
  /** Custom tagline text (default: "Local Vendors. Better Choices.") */
  taglineText?: string;
  /** Horizontal alignment of the logo and tagline (default: 'center') */
  align?: 'center' | 'left';
}

/**
 * TindaMateCartLogo
 *
 * Official TindaMate brand emblem used across Welcome, Auth, and Dashboard screens:
 * - Rounded chunky forest green shopping cart (Colors.primaryBrand)
 * - Two leafy sprouts extending upward from inside the cart
 * - Dual-color wordmark: "Tinda" in deep forest green + "Mate" in warm market orange
 * - Tagline: "Local Vendors. Better Choices."
 */
export function TindaMateCartLogo({
  scale = 1,
  showTagline = true,
  taglineText = 'Local Vendors. Better Choices.',
  align = 'center',
}: TindaMateCartLogoProps) {
  return (
    <View
      style={[
        styles.container,
        align === 'left' && styles.containerLeft,
      ]}>
      {/* Brand Row: Cart Emblem + Wordmark */}
      <View style={styles.brandRow}>
        {/* Shopping Cart with Sprouting Leaves */}
        <View style={[styles.cartWrapper, { transform: [{ scale }] }]}>
          {/* Leaves sprouting up from cart */}
          <View style={styles.leafGroup}>
            {/* Primary Leaf (tilted left) */}
            <View style={styles.leafLeft} />
            {/* Secondary Leaf (tilted right) */}
            <View style={styles.leafRight} />
          </View>

          {/* Cart Basket Body */}
          <View style={styles.cartBody}>
            {/* Top Wire Rim */}
            <View style={styles.cartTopRim} />
            {/* Horizontal Grid Bar */}
            <View style={styles.cartGridBar} />
          </View>

          {/* Cart Handle */}
          <View style={styles.cartHandle} />

          {/* Wheels */}
          <View style={styles.wheelsRow}>
            <View style={styles.wheel} />
            <View style={styles.wheel} />
          </View>
        </View>

        {/* Wordmark: Tinda (Forest Green) + Mate (Warm Orange) */}
        <Text style={[styles.wordmark, { fontSize: Math.round(31 * scale) }]}>
          <Text style={styles.wordmarkGreen}>Tinda</Text>
          <Text style={styles.wordmarkOrange}>Mate</Text>
        </Text>
      </View>

      {/* Official Tagline */}
      {showTagline && (
        <Text
          style={[
            styles.tagline,
            { fontSize: Math.max(11, Math.round(12.5 * scale)) },
            align === 'left' && styles.taglineLeft,
          ]}>
          {taglineText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerLeft: {
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cartWrapper: {
    width: 38,
    height: 38,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  leafGroup: {
    position: 'absolute',
    top: -3,
    left: 8,
    width: 18,
    height: 16,
    zIndex: 3,
  },
  leafLeft: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 12,
    height: 12,
    backgroundColor: Colors.primaryBrand,
    borderTopLeftRadius: 11,
    borderBottomRightRadius: 11,
    transform: [{ rotate: '-25deg' }],
  },
  leafRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 9,
    height: 9,
    backgroundColor: '#34D399',
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '30deg' }],
  },
  cartBody: {
    width: 28,
    height: 19,
    borderLeftWidth: 3.5,
    borderBottomWidth: 3.5,
    borderRightWidth: 2.8,
    borderColor: Colors.primaryBrand,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 4,
    position: 'relative',
    marginTop: 8,
  },
  cartTopRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: Colors.primaryBrand,
  },
  cartGridBar: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primaryBrand,
  },
  cartHandle: {
    position: 'absolute',
    left: 0,
    top: 9,
    width: 7,
    height: 3.5,
    backgroundColor: Colors.primaryBrand,
    borderRadius: 2,
  },
  wheelsRow: {
    flexDirection: 'row',
    width: 24,
    justifyContent: 'space-between',
    marginTop: 2,
  },
  wheel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryBrand,
  },
  wordmark: {
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.5,
  },
  wordmarkGreen: {
    color: Colors.primaryBrand,
  },
  wordmarkOrange: {
    color: Colors.accent,
  },
  tagline: {
    color: Colors.textSecondary,
    fontWeight: Typography.weights.semiBold,
    letterSpacing: 0.3,
    marginTop: 3,
    textAlign: 'center',
  },
  taglineLeft: {
    textAlign: 'left',
    marginLeft: 2,
  },
});
