import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius } from '@/constants/theme';

export interface OverviewItem {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  iconSymbol: string;
  theme: 'green' | 'blue' | 'amber' | 'purple';
  onPress?: () => void;
}

interface StoreOverviewCardProps {
  item: OverviewItem;
}

const THEME_STYLES = {
  green: {
    bg: '#EAF7F0',
    border: '#D1EFE0',
    iconBg: '#10B981',
    iconColor: '#FFFFFF',
    titleColor: '#064E3B',
    chevronColor: '#059669',
  },
  blue: {
    bg: '#EAF4FE',
    border: '#D0E6FC',
    iconBg: '#3B82F6',
    iconColor: '#FFFFFF',
    titleColor: '#1E3A8A',
    chevronColor: '#2563EB',
  },
  amber: {
    bg: '#FFF4E8',
    border: '#FFE4CB',
    iconBg: '#F97316',
    iconColor: '#FFFFFF',
    titleColor: '#7C2D12',
    chevronColor: '#EA580C',
  },
  purple: {
    bg: '#F5EDFE',
    border: '#E8D5FD',
    iconBg: '#8B5CF6',
    iconColor: '#FFFFFF',
    titleColor: '#581C87',
    chevronColor: '#7C3AED',
  },
};

/**
 * StoreOverviewCard
 *
 * Visually substantial summary card matching the reference mockup:
 * [ (Large 42px Icon)   Title / Subtext        › ]
 */
export function StoreOverviewCard({ item }: StoreOverviewCardProps) {
  const currentTheme = THEME_STYLES[item.theme];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}: ${item.subtitle}`}
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
        },
        pressed && styles.cardPressed,
      ]}>
      {/* Left: Prominent Round Themed Icon */}
      <View style={[styles.iconCircle, { backgroundColor: currentTheme.iconBg }]}>
        <Text style={[styles.iconSymbol, { color: currentTheme.iconColor }]}>
          {item.iconSymbol}
        </Text>
      </View>

      {/* Middle: Title & Subtitle */}
      <View style={styles.textColumn}>
        <Text style={[styles.title, { color: currentTheme.titleColor }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>

      {/* Right: Chevron */}
      <Text style={[styles.chevron, { color: currentTheme.chevronColor }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 78,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 19,
    fontWeight: '800',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '800',
    paddingLeft: 2,
  },
});
