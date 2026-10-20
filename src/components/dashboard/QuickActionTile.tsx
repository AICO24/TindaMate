import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface QuickActionItem {
  id: string;
  labelLine1: string;
  labelLine2: string;
  icon: string;
  theme: 'green' | 'orange' | 'blue' | 'purple';
  onPress: () => void;
}

interface QuickActionTileProps {
  item: QuickActionItem;
}

const ACTION_THEMES = {
  green: {
    bg: '#EAF7F0',
    border: '#D1EFE0',
    iconBg: '#10B981',
    text: '#064E3B',
    arrowColor: '#059669',
  },
  orange: {
    bg: '#FFF4E8',
    border: '#FFE4CB',
    iconBg: '#F97316',
    text: '#7C2D12',
    arrowColor: '#EA580C',
  },
  blue: {
    bg: '#EAF4FE',
    border: '#D0E6FC',
    iconBg: '#3B82F6',
    text: '#1E3A8A',
    arrowColor: '#2563EB',
  },
  purple: {
    bg: '#F5EDFE',
    border: '#E8D5FD',
    iconBg: '#8B5CF6',
    text: '#581C87',
    arrowColor: '#7C3AED',
  },
};

/**
 * QuickActionTile
 *
 * Visually strong, large action tile matching the reference mockup:
 * - Large 46px circular icon container at top
 * - Bold two-line centered title
 * - Prominent bottom arrow (→) indicator
 * - Soft pastel background with subtle border and elevation
 */
export function QuickActionTile({ item }: QuickActionTileProps) {
  const currentTheme = ACTION_THEMES[item.theme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.labelLine1} ${item.labelLine2}`}
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && styles.tilePressed,
      ]}>
      {/* Top Large Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor: currentTheme.iconBg }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>

      {/* Two-Line Centered Label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.labelText, { color: currentTheme.text }]} numberOfLines={1}>
          {item.labelLine1}
        </Text>
        <Text style={[styles.labelText, { color: currentTheme.text }]} numberOfLines={1}>
          {item.labelLine2}
        </Text>
      </View>

      {/* Bottom Arrow Indicator */}
      <Text style={[styles.arrow, { color: currentTheme.arrowColor }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderWidth: 1,
    minHeight: 125,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  iconText: {
    fontSize: 21,
    color: '#FFFFFF',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  arrow: {
    fontSize: 15,
    fontWeight: '800',
  },
});
