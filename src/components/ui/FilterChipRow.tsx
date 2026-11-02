import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface FilterChipItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export interface FilterChipRowProps<T extends string = string> {
  items: FilterChipItem<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  accessibilityLabelPrefix?: string;
}

/**
 * FilterChipRow (Design 2.0 Foundation)
 *
 * Horizontally scrollable pill filter chips for list & catalog screens:
 * - Active: Deep Forest Green (#064E3B) background with crisp white text
 * - Inactive: Crisp white surface (#FFFFFF) with subtle border (#E2E8F0) and slate text
 * - Optional numeric count badge display: e.g. "All (28)", "Low Stock (3)"
 * - Accessible minimum 36px touch target and smooth scrolling
 */
export function FilterChipRow<T extends string = string>({
  items,
  selectedId,
  onSelect,
  style,
  contentContainerStyle,
  accessibilityLabelPrefix = 'Filter by',
}: FilterChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scrollContainer, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}>
      {items.map((item) => {
        const isActive = item.id === selectedId;
        const countText = item.count !== undefined ? ` (${item.count})` : '';
        const fullLabel = `${item.label}${countText}`;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${accessibilityLabelPrefix} ${fullLabel}${isActive ? ', selected' : ''}`}
            onPress={() => onSelect(item.id)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
              pressed && styles.chipPressed,
            ]}>
            <Text
              style={[
                styles.chipLabel,
                isActive ? styles.chipLabelActive : styles.chipLabelInactive,
              ]}
              numberOfLines={1}>
              {item.label}
            </Text>
            {item.count !== undefined ? (
              <View
                style={[
                  styles.countBadge,
                  isActive
                    ? styles.countBadgeActive
                    : styles.countBadgeInactive,
                ]}>
                <Text
                  style={[
                    styles.countText,
                    isActive
                      ? styles.countTextActive
                      : styles.countTextInactive,
                  ]}>
                  {item.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    minHeight: 36,
    gap: 6,
  },
  chipActive: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    ...Shadows.xs,
  },
  chipInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  chipLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  chipLabelActive: {
    color: Colors.textInverse,
  },
  chipLabelInactive: {
    color: Colors.textSecondary,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  countBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  countText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  countTextActive: {
    color: Colors.textInverse,
  },
  countTextInactive: {
    color: Colors.textSecondary,
  },
});

