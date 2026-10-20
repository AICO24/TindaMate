import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

export interface OverviewItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  theme: 'green' | 'blue' | 'amber' | 'purple';
  onPress?: () => void;
}

interface StoreOverviewCardProps {
  item: OverviewItem;
}

const THEME_STYLES = {
  green: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    iconBg: '#D1FAE5',
    iconColor: '#065F46',
    titleColor: '#047857',
    badgeText: '#065F46',
  },
  blue: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    iconBg: '#DBEAFE',
    iconColor: '#1E40AF',
    titleColor: '#1D4ED8',
    badgeText: '#1E40AF',
  },
  amber: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconBg: '#FEF3C7',
    iconColor: '#92400E',
    titleColor: '#B45309',
    badgeText: '#92400E',
  },
  purple: {
    bg: '#FAF5FF',
    border: '#E9D5FF',
    iconBg: '#F3E8FF',
    iconColor: '#6B21A8',
    titleColor: '#7E22CE',
    badgeText: '#6B21A8',
  },
};

/**
 * StoreOverviewCard
 *
 * Renders an overview summary card with:
 * - Themed pastel background and soft borders
 * - Categorized icon
 * - Honest empty-state value
 * - Helpful supporting text
 * - Subtle right-arrow action affordance
 */
export function StoreOverviewCard({ item }: StoreOverviewCardProps) {
  const currentTheme = THEME_STYLES[item.theme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}: ${item.value}`}
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && styles.cardPressed,
      ]}>
      {/* Top Header: Icon + Arrow */}
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: currentTheme.iconBg }]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <Text style={[styles.arrow, { color: currentTheme.iconColor }]}>→</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: currentTheme.titleColor }]} numberOfLines={1}>
        {item.title}
      </Text>

      {/* Main Value / Status */}
      <Text style={styles.value} numberOfLines={1}>
        {item.value}
      </Text>

      {/* Subtitle / Empty State Guidance */}
      <Text style={styles.subtitle} numberOfLines={2}>
        {item.subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
});

