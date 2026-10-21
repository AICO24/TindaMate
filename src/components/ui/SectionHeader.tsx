import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface SectionHeaderProps {
  /** Primary section title (e.g., "Store Overview", "Quick Actions") */
  title: string;
  /** Optional muted subtitle on the right (e.g., "Manage your store, faster.") */
  subtitle?: string;
  /** Optional interactive link label on the right (e.g., "View All") */
  actionLabel?: string;
  /** Callback when actionLabel is pressed */
  onActionPress?: () => void;
  /** Optional custom right element (e.g., date filter pill) */
  rightElement?: React.ReactNode;
}

/**
 * SectionHeader
 *
 * Reusable section heading component for TindaMate Dashboard and future
 * Products, Inventory, Sales, and Utang modules.
 * Uses TindaMate deep brand green (Colors.textBrand) for strong section hierarchy.
 */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  rightElement,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text
        style={styles.title}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.3}>
        {title}
      </Text>

      {rightElement ? (
        rightElement
      ) : actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          accessibilityHint={`Navigates to full ${title.toLowerCase()} screen`}
          onPress={onActionPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}>
          <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>
            {actionLabel}  ›
          </Text>
        </Pressable>
      ) : subtitle ? (
        <Text
          style={styles.subtitle}
          numberOfLines={1}
          ellipsizeMode="tail"
          maxFontSizeMultiplier={1.3}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxs,
  },
  title: {
    fontSize: Typography.sizes.sectionHeading,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    letterSpacing: -0.3,
  },
  subtitle: {
    flexShrink: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    textAlign: 'right',
    marginLeft: Spacing.two,
  },
  actionButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  actionButtonPressed: {
    opacity: 0.65,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
  },
});

