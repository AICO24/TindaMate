import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { DashboardBadgeVectorIcon } from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  PastelThemeKey,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface QuickActionItem {
  id: string;
  labelLine1: string;
  labelLine2: string;
  icon?: string;
  theme: PastelThemeKey;
  /** Whether this tile represents the primary high-frequency store action */
  isPrimary?: boolean;
  onPress: () => void;
}

interface QuickActionTileProps {
  item: QuickActionItem;
}

const ACTION_VECTOR_IDS = new Set([
  'add_product',
  'record_sale',
  'add_expense',
  'record_utang',
]);

/**
 * QuickActionTile (Design 2.0 Showcase Alignment)
 *
 * Compact, thumb-friendly retail action tile:
 * - Reduced vertical footprint (~58px height instead of 124px)
 * - Prominent vibrant orange background for primary CTA (New Sale)
 * - Clean elevated white surface for secondary operations (Product, Utang, Expense)
 * - Crisp vector icons and legible typography that never crowds the viewport
 */
export function QuickActionTile({ item }: QuickActionTileProps) {
  const currentTheme = Colors.pastel[item.theme];
  const hasVectorIcon = ACTION_VECTOR_IDS.has(item.id);
  const { width: windowWidth } = useWindowDimensions();
  const isNarrowPhone = windowWidth < 350;

  const iconCircleSize = isNarrowPhone ? 24 : 28;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        item.isPrimary
          ? `${item.labelLine1} ${item.labelLine2}, primary action`
          : `${item.labelLine1} ${item.labelLine2}`
      }
      accessibilityHint={`Opens quick action to ${item.labelLine1.toLowerCase()} ${item.labelLine2.toLowerCase()}`}
      onPress={item.onPress}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      style={({ pressed }) => [
        styles.tile,
        item.isPrimary ? styles.tilePrimary : styles.tileSecondary,
        pressed && styles.tilePressed,
      ]}>
      {/* Icon Circle */}
      <View
        style={[
          styles.iconCircle,
          {
            width: iconCircleSize,
            height: iconCircleSize,
            borderRadius: iconCircleSize / 2,
            backgroundColor: item.isPrimary ? 'rgba(255, 255, 255, 0.22)' : currentTheme.iconBg,
          },
        ]}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        {hasVectorIcon ? (
          <DashboardBadgeVectorIcon
            type={
              item.id as
                | 'add_product'
                | 'record_sale'
                | 'add_expense'
                | 'record_utang'
            }
            color={Colors.textInverse}
          />
        ) : (
          <Text style={styles.iconText}>{item.icon}</Text>
        )}
      </View>

      {/* Label */}
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.labelText,
            item.isPrimary ? styles.labelTextPrimary : styles.labelTextSecondary,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          maxFontSizeMultiplier={1.2}>
          {item.labelLine1} {item.labelLine2}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    minHeight: 58,
    gap: 4,
    ...Shadows.xs,
  },
  tilePrimary: {
    backgroundColor: '#EA580C',
    borderWidth: 1,
    borderColor: '#C2410C',
    ...Shadows.sm,
  },
  tileSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tilePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    color: Colors.textInverse,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    lineHeight: 13,
  },
  labelTextPrimary: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.extraBold,
  },
  labelTextSecondary: {
    color: '#334155',
  },
});
