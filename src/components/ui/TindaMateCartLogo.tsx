import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TindaMateCartLogoProps {
  /** Size multiplier (default: 1) */
  scale?: number;
  /** Whether to show the "Local Vendors. Better Choices." tagline */
  showTagline?: boolean;
}

/**
 * TindaMateCartLogo
 *
 * Renders the authentic TindaMate brand emblem matching the reference mockup:
 * - Rounded chunky forest green shopping cart (#105B48)
 * - Two leafy sprouts extending upward from inside the cart
 * - Dual-color wordmark: "Tinda" in forest green (#105B48) + "Mate" in warm orange (#EA580C)
 * - Tagline: "Local Vendors. Better Choices."
 */
export function TindaMateCartLogo({
  scale = 1,
  showTagline = true,
}: TindaMateCartLogoProps) {
  return (
    <View style={styles.container}>
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
        <Text style={[styles.wordmark, { fontSize: 31 * scale }]}>
          <Text style={styles.wordmarkGreen}>Tinda</Text>
          <Text style={styles.wordmarkOrange}>Mate</Text>
        </Text>
      </View>

      {/* Official Tagline */}
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: 12.5 * scale }]}>
          Local Vendors. Better Choices.
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
    backgroundColor: '#105B48',
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
    borderColor: '#105B48',
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
    backgroundColor: '#105B48',
  },
  cartGridBar: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#105B48',
  },
  cartHandle: {
    position: 'absolute',
    left: 0,
    top: 9,
    width: 7,
    height: 3.5,
    backgroundColor: '#105B48',
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
    backgroundColor: '#105B48',
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  wordmarkGreen: {
    color: '#105B48',
  },
  wordmarkOrange: {
    color: '#EA580C',
  },
  tagline: {
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.35,
    marginTop: 3,
    textAlign: 'center',
  },
});
