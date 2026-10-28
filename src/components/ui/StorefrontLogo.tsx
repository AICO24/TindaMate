import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

interface StorefrontLogoProps {
  /** Size multiplier (default: 1) */
  scale?: number;
  /** Whether to show the wordmark text */
  showWordmark?: boolean;
  /** Whether to show the subtitle tagline */
  showTagline?: boolean;
  /** Layout direction: 'horizontal' (default) or 'vertical' */
  layout?: 'horizontal' | 'vertical';
  /** Horizontal alignment */
  align?: 'center' | 'left';
}

const STORE_EMBLEM = require('@/assets/images/tindamate-store-emblem.png');

/**
 * StorefrontLogo
 *
 * Renders the authentic TindaMate Storefront Emblem and dual-color wordmark
 * with strong visual weight matching the primary visual reference:
 * - Authentic green & orange sari-sari storefront emblem
 * - High-contrast display wordmark: "Tinda" (Deep forest green) + "Mate" (Warm orange)
 * - Tagline: "Your Digital Tindahan Assistant"
 */
export function StorefrontLogo({
  scale = 1,
  showWordmark = true,
  showTagline = true,
  layout = 'horizontal',
  align = 'center',
}: StorefrontLogoProps) {
  const isHorizontal = layout === 'horizontal';
  const emblemWidth = Math.round((isHorizontal ? 46 : 56) * scale);
  const emblemHeight = Math.round((isHorizontal ? 45 : 55) * scale);

  const graphicNode = (
    <View
      style={[
        styles.emblemWrapper,
        isHorizontal && styles.emblemWrapperHorizontal,
      ]}>
      <Image
        source={STORE_EMBLEM}
        style={{
          width: emblemWidth,
          height: emblemHeight,
        }}
        resizeMode="contain"
        accessibilityLabel="TindaMate Storefront Emblem"
      />
    </View>
  );

  const textNode = (showWordmark || showTagline) && (
    <View style={[styles.textBlock, isHorizontal && styles.textBlockHorizontal]}>
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: Math.round((isHorizontal ? 25 : 28) * scale),
              lineHeight: Math.round((isHorizontal ? 28 : 32) * scale),
            },
          ]}>
          <Text style={styles.wordmarkGreen}>Tinda</Text>
          <Text style={styles.wordmarkOrange}>Mate</Text>
        </Text>
      )}

      {showTagline && (
        <Text
          style={[
            styles.tagline,
            { fontSize: Math.max(11, Math.round((isHorizontal ? 12 : 13) * scale)) },
            isHorizontal && styles.taglineHorizontal,
          ]}>
          Your Digital Tindahan Assistant
        </Text>
      )}
    </View>
  );

  if (isHorizontal) {
    return (
      <View
        style={[
          styles.horizontalContainer,
          align === 'left' ? styles.alignLeft : styles.alignCenter,
        ]}>
        {graphicNode}
        {textNode}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.verticalContainer,
        align === 'left' ? styles.alignLeft : styles.alignCenter,
      ]}>
      {graphicNode}
      {textNode}
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignLeft: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  emblemWrapper: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemWrapperHorizontal: {
    marginBottom: 0,
    marginRight: 11,
  },
  textBlock: {
    alignItems: 'center',
  },
  textBlockHorizontal: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.6,
  },
  wordmarkGreen: {
    color: Colors.primaryDark,
  },
  wordmarkOrange: {
    color: Colors.accent,
  },
  tagline: {
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginTop: 1,
    letterSpacing: 0.1,
  },
  taglineHorizontal: {
    textAlign: 'left',
  },
});
