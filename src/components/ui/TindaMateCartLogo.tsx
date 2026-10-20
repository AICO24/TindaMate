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
 * Renders the primary TindaMate brand emblem:
 * A green shopping cart with a sprouting leaf, paired with the
 * dual-color "TindaMate" wordmark and the official tagline
 * "Local Vendors. Better Choices."
 */
export function TindaMateCartLogo({
  scale = 1,
  showTagline = true,
}: TindaMateCartLogoProps) {
  const iconSize = 42 * scale;

  return (
    <View style={styles.container}>
      {/* Brand Row: Cart Emblem + TindaMate Wordmark */}
      <View style={styles.brandRow}>
        {/* Shopping Cart Icon with Leaf Accent */}
        <View style={[styles.cartIconWrapper, { width: iconSize, height: iconSize }]}>
          {/* Sprouting Leaf Accent */}
          <View style={styles.leafContainer}>
            <View style={styles.leafMain} />
            <View style={styles.leafSmall} />
          </View>

          {/* Cart Basket Wireframe */}
          <View style={styles.cartBasket}>
            <View style={styles.cartHorizontalBar} />
            <View style={styles.cartDiagonalArm} />
            <View style={styles.cartHandle} />
          </View>

          {/* Cart Wheels */}
          <View style={styles.wheelRow}>
            <View style={styles.wheel} />
            <View style={styles.wheel} />
          </View>
        </View>

        {/* Wordmark: Tinda (Green) + Mate (Orange) */}
        <Text style={[styles.wordmark, { fontSize: 32 * scale }]}>
          <Text style={styles.wordmarkGreen}>Tinda</Text>
          <Text style={styles.wordmarkOrange}>Mate</Text>
        </Text>
      </View>

      {/* Official Tagline */}
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: 13 * scale }]}>
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
  cartIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafContainer: {
    position: 'absolute',
    top: 2,
    right: 14,
    width: 14,
    height: 14,
    zIndex: 2,
  },
  leafMain: {
    width: 11,
    height: 11,
    backgroundColor: '#0D7A4D',
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
  leafSmall: {
    position: 'absolute',
    top: 5,
    right: -2,
    width: 7,
    height: 7,
    backgroundColor: '#34D399',
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 6,
    transform: [{ rotate: '20deg' }],
  },
  cartBasket: {
    width: 30,
    height: 22,
    borderLeftWidth: 3.5,
    borderBottomWidth: 3.5,
    borderColor: '#0D7A4D',
    borderBottomLeftRadius: 4,
    position: 'relative',
    marginTop: 4,
  },
  cartHorizontalBar: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#0D7A4D',
    borderRadius: 1,
  },
  cartDiagonalArm: {
    position: 'absolute',
    right: -4,
    top: -2,
    width: 3,
    height: 14,
    backgroundColor: '#0D7A4D',
    borderRadius: 1.5,
    transform: [{ rotate: '18deg' }],
  },
  cartHandle: {
    position: 'absolute',
    top: -4,
    left: -7,
    width: 8,
    height: 3.5,
    backgroundColor: '#0D7A4D',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  wheelRow: {
    flexDirection: 'row',
    width: 26,
    justifyContent: 'space-between',
    paddingLeft: 3,
    marginTop: 3,
  },
  wheel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D7A4D',
  },
  wordmark: {
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
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 3,
    textAlign: 'center',
  },
});

