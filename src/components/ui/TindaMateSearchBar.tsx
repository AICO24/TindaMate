import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { SearchVectorIcon } from '@/components/dashboard/DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface TindaMateSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>;
  accessibilityLabel?: string;
  rightAction?: React.ReactNode;
}

/**
 * TindaMateSearchBar (Design 2.0 Foundation)
 *
 * Reusable, elevated pill-shaped search input for list & POS screens:
 * - Crisp white surface with subtle elevation (#FFFFFF + Shadows.xs)
 * - Search magnifying glass icon
 * - Clear button (✕) when text exists
 * - Standardized 44px touch target
 * - High-contrast placeholder and input typography
 * - Optional right-side action slot (e.g., sort/filter toggle button)
 */
export function TindaMateSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
  inputProps,
  accessibilityLabel = 'Search input',
  rightAction,
}: TindaMateSearchBarProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const hasText = value.trim().length > 0;

  return (
    <View style={[styles.containerRow, style]}>
      <View style={styles.searchBar}>
        <View style={styles.iconWrap} accessible={false} importantForAccessibility="no">
          <SearchVectorIcon color={Colors.textMuted} size={18} />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel}
          {...inputProps}
        />

        {hasText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search input"
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && styles.clearBtnPressed,
            ]}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {rightAction ? (
        <View style={styles.rightActionWrap}>
          {rightAction}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.two,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.pill,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#EDF2EE',
    ...Shadows.xs,
  },
  iconWrap: {
    marginRight: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
    height: '100%',
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.one,
  },
  clearBtnPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.94 }],
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
  },
  rightActionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

