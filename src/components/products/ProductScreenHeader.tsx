import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ChevronLeftIcon } from '@/components/ui/AuthIcons';
import {
  BorderRadius,
  Colors,
  DashboardMaxContentWidth,
  IconSizes,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

interface ProductScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  rightActionAccessibilityLabel?: string;
}

/**
 * ProductScreenHeader
 *
 * Unified header bar for the Products module (List, Details, Add, Edit):
 * - Warm curved backdrop matching the Batch 2 Dashboard hero aesthetic
 * - Accessible circular back button
 * - Clear title and supporting subtitle hierarchy
 * - Optional primary pill CTA on the right (e.g., "+ Add Product" or "Edit")
 */
export function ProductScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightActionLabel,
  onRightActionPress,
  rightActionAccessibilityLabel,
}: ProductScreenHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <View style={styles.outerZone}>
      <View style={styles.innerContainer}>
        <View style={styles.topRow}>
          <View style={styles.leftRow}>
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                accessibilityHint="Returns to the previous screen"
                onPress={handleBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}>
                <ChevronLeftIcon
                  size={IconSizes.nav}
                  color={Colors.primaryDark}
                />
              </Pressable>
            ) : null}

            <View style={styles.titleBlock}>
              <Text
                style={styles.title}
                accessibilityRole="header"
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={styles.subtitle}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.25}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>

          {rightActionLabel && onRightActionPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                rightActionAccessibilityLabel ?? rightActionLabel
              }
              onPress={onRightActionPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.rightActionPill,
                pressed && styles.rightActionPillPressed,
              ]}>
              <Text
                style={styles.rightActionText}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}>
                {rightActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerZone: {
    width: '100%',
    backgroundColor: Colors.backgroundWarm,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  innerContainer: {
    width: '100%',
    maxWidth: DashboardMaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoHalf,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  backButtonPressed: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.96 }],
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  rightActionPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    ...Shadows.xs,
  },
  rightActionPillPressed: {
    backgroundColor: Colors.primaryPressed,
    transform: [{ scale: 0.97 }],
  },
  rightActionText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
    letterSpacing: 0.2,
  },
});

