import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

export interface QuickActionItem {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  theme: 'emerald' | 'blue' | 'amber' | 'purple';
  onPress: () => void;
}

interface QuickActionTileProps {
  item: QuickActionItem;
}

const ACTION_THEMES = {
  emerald: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    iconBg: '#10B981',
    text: '#065F46',
  },
  blue: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    iconBg: '#3B82F6',
    text: '#1E40AF',
  },
  amber: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconBg: '#F59E0B',
    text: '#92400E',
  },
  purple: {
    bg: '#FAF5FF',
    border: '#E9D5FF',
    iconBg: '#8B5CF6',
    text: '#6B21A8',
  },
};

/**
 * QuickActionTile
 *
 * Renders a colorful quick-action button on the dashboard:
 * - High-visibility vibrant icon container
 * - Clear action label and supporting sublabel
 * - Subtle arrow indicator
 */
export function QuickActionTile({ item }: QuickActionTileProps) {
  const currentTheme = ACTION_THEMES[item.theme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && styles.tilePressed,
      ]}>
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: currentTheme.iconBg }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>

      {/* Text Group */}
      <View style={styles.textGroup}>
        <Text style={[styles.label, { color: currentTheme.text }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.sublabel} numberOfLines={1}>
          {item.sublabel}
        </Text>
      </View>

      {/* Arrow Indicator */}
      <Text style={[styles.arrow, { color: currentTheme.text }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 10,
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  textGroup: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 11,
    color: '#64748B',
  },
  arrow: {
    fontSize: 14,
    fontWeight: '700',
  },
});

