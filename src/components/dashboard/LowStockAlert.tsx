import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KpiLowStockBoxIcon, WarningTriangleIcon } from './DashboardNavIcons';
import { Shadows, Spacing, Typography } from '@/constants/theme';

interface LowStockAlertProps {
  lowStockCount: number;
  outOfStockCount?: number;
  onPress?: () => void;
}

/**
 * LowStockAlert (Target Reference 1:1 Operational Stock Warning Banner + Black Corner Hover Line)
 *
 * Visually matches the Low-Stock warning banner in the Dashboard reference:
 * - Warm peach-cream surface (#FDE8C8) with soft amber border (#F7C98E)
 * - Left: Large rounded orange Warning Triangle (!) + vertical amber divider line
 * - Middle: Bold dark title ("5 Products Running Low") + orange "Check inventory →"
 * - Right: Curved warm orange/amber wave with a 3D Isometric Amber Box illustration
 * - Black corner/border line outline on hover
 */
export function LowStockAlert({
  lowStockCount,
  outOfStockCount = 0,
  onPress,
}: LowStockAlertProps) {
  const [isHovered, setIsHovered] = useState(false);
  const totalAlertCount = lowStockCount + outOfStockCount;

  if (totalAlertCount <= 0) return null;

  const titleText =
    lowStockCount > 0
      ? `${lowStockCount} ${lowStockCount === 1 ? 'Product Running Low' : 'Products Running Low'}`
      : `${outOfStockCount} ${outOfStockCount === 1 ? 'Product Out of Stock' : 'Products Out of Stock'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${totalAlertCount} products running low or out of stock. Tap to check inventory.`}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.card,
        isHovered && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}>
      {/* Right-Side Layered Warm Orange/Amber Wave Curves */}
      <View style={styles.rightWaveOuter} pointerEvents="none" />
      <View style={styles.rightWaveInner} pointerEvents="none" />

      {/* Left: Rounded Orange Warning Triangle */}
      <WarningTriangleIcon size={32} bgColor="#F97316" fgColor="#FFFFFF" />

      {/* Vertical Amber Divider Line matching reference */}
      <View style={styles.verticalDivider} />

      {/* Middle: Alert Headline + Action Link */}
      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {titleText}
        </Text>
        <Text style={styles.actionLink} numberOfLines={1} maxFontSizeMultiplier={1.15}>
          Check inventory →
        </Text>
      </View>

      {/* Right: 3D Isometric Amber Cardboard Box Illustration */}
      <View style={styles.rightBoxWrapper} pointerEvents="none">
        <KpiLowStockBoxIcon size={30} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDE8C8',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F7C98E',
    paddingVertical: 11,
    paddingHorizontal: Spacing.threeHalf,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardHovered: {
    borderColor: '#000000',
  },
  cardPressed: {
    opacity: 0.9,
  },
  rightWaveOuter: {
    position: 'absolute',
    right: -18,
    bottom: -24,
    width: 112,
    height: 76,
    borderTopLeftRadius: 60,
    backgroundColor: '#FDBA74',
    opacity: 0.65,
    transform: [{ rotate: '-10deg' }],
  },
  rightWaveInner: {
    position: 'absolute',
    right: -22,
    top: 4,
    width: 78,
    height: 46,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    backgroundColor: '#FB923C',
    opacity: 0.75,
    transform: [{ rotate: '-18deg' }],
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(180, 83, 9, 0.25)',
    borderRadius: 1,
  },
  textColumn: {
    flex: 1,
    gap: 2,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#C2410C',
  },
  rightBoxWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginRight: 2,
  },
});
