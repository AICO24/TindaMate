import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TrendChartVectorIcon } from './DashboardNavIcons';
import { Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';

interface TodaySalesCardProps {
  amount: number;
  transactionCount: number;
  comparisonLabel: string;
  onPress?: () => void;
  isGuestMode?: boolean;
}

/**
 * TodaySalesCard (Target Reference 1:1 Hero KPI Card + Black Corner/Border on Hover)
 *
 * Visually matches the Today's Sales hero card in the Dashboard reference:
 * - Rich emerald green background (#0B6B41) with soft rounded corners (20px)
 * - Rising bar-chart & trend arrow icon on the left
 * - Vertical translucent white divider line separating the icon and text
 * - "Today's Sales" label + large bold currency value
 * - Bright emerald comparison pill on the right
 * - Layered leaf-green and warm-orange curved ribbon hugging the bottom-right corner
 * - Crisp black border outline on hover
 */
export function TodaySalesCard({
  amount,
  transactionCount,
  comparisonLabel,
  onPress,
  isGuestMode = false,
}: TodaySalesCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const displayAmount = isGuestMode ? '₱0.00' : formatPesoCurrency(amount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Today's Sales: ${displayAmount}, ${transactionCount} transactions today. Tap to view sales history.`}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.card,
        isHovered && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}>
      {/* Bottom-Right Layered Leaf-Green & Warm-Orange Corner Wave Ribbons */}
      <View style={styles.leafGreenWave} pointerEvents="none" />
      <View style={styles.brightGreenWave} pointerEvents="none" />
      <View style={styles.orangeCornerRibbon} pointerEvents="none" />

      <View style={styles.contentLeft}>
        {/* Left: Rising Bar-Chart & Upward Trend Arrow Icon */}
        <View style={styles.iconWrapper}>
          <TrendChartVectorIcon size={36} color={Colors.textInverse} />
        </View>

        {/* Vertical White Divider Line matching reference */}
        <View style={styles.verticalDivider} />

        {/* Center: Label + Large Peso Amount */}
        <View style={styles.textColumn}>
          <Text style={styles.label} maxFontSizeMultiplier={1.2}>
            Today&apos;s Sales
          </Text>
          <Text
            style={styles.amount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            maxFontSizeMultiplier={1.2}>
            {displayAmount}
          </Text>
        </View>
      </View>

      {/* Right: Bright Emerald Comparison Capsule Pill */}
      <View style={styles.badgePill}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {comparisonLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B6B41',
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#138252',
    gap: Spacing.two,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardHovered: {
    borderColor: '#000000',
  },
  cardPressed: {
    opacity: 0.92,
  },
  // Layered Bottom-Right Corner Ribbons matching reference
  leafGreenWave: {
    position: 'absolute',
    right: -12,
    bottom: -24,
    width: 155,
    height: 62,
    borderTopLeftRadius: 65,
    borderBottomLeftRadius: 30,
    backgroundColor: '#15803D',
    opacity: 0.85,
    transform: [{ rotate: '-10deg' }],
    zIndex: 1,
  },
  brightGreenWave: {
    position: 'absolute',
    right: -16,
    bottom: -26,
    width: 122,
    height: 52,
    borderTopLeftRadius: 55,
    backgroundColor: '#22C55E',
    opacity: 0.78,
    transform: [{ rotate: '-14deg' }],
    zIndex: 1,
  },
  orangeCornerRibbon: {
    position: 'absolute',
    right: -18,
    bottom: -22,
    width: 102,
    height: 40,
    borderTopLeftRadius: 44,
    backgroundColor: '#F97316',
    opacity: 0.95,
    transform: [{ rotate: '-16deg' }],
    zIndex: 1,
  },
  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 1,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#ECFDF5',
    fontSize: 13.5,
    fontWeight: Typography.weights.semiBold,
    letterSpacing: 0.1,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: -0.7,
    lineHeight: 35,
  },
  badgePill: {
    backgroundColor: '#1E9E5A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.35)',
    zIndex: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.1,
  },
});
