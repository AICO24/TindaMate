import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ArrowLeftIcon } from '@/components/ui/AuthIcons';
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
  leftIcon?: React.ReactNode;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  rightActionAccessibilityLabel?: string;
  rightElement?: React.ReactNode;
}

/**
 * ProductScreenHeader (TindaMate Design 2.0)
 *
 * Unified deep forest green header bar across POS, Products, Customers,
 * Sales History, Expenses, Reports, and More screens:
 * - Rich TindaMate Deep Green (#064E3B) surface with subtle emerald & warm organic accents
 * - Accessible back button or custom module icon
 * - Crisp white title and soft mint subtitle hierarchy
 * - Optional primary green pill CTA or custom action element on the right
 */
export function ProductScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  leftIcon,
  rightActionLabel,
  onRightActionPress,
  rightActionAccessibilityLabel,
  rightElement,
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
      {/* Subtle Decorative Organic Header Curves */}
      <View
        style={styles.decorCircleRight}
        importantForAccessibility="no"
        pointerEvents="none"
      />
      <View
        style={styles.decorWarmAccent}
        importantForAccessibility="no"
        pointerEvents="none"
      />

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
                <ArrowLeftIcon
                  size={IconSizes.nav}
                  color={Colors.textInverse}
                />
              </Pressable>
            ) : leftIcon ? (
              <View style={styles.leftIconBadge}>{leftIcon}</View>
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

          {rightElement ? (
            rightElement
          ) : rightActionLabel && onRightActionPress ? (
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
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    paddingTop: Spacing.twoHalf,
    paddingBottom: Spacing.threeHalf,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.sm,
  },
  decorCircleRight: {
    position: 'absolute',
    right: -28,
    top: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    opacity: 0.35,
  },
  decorWarmAccent: {
    position: 'absolute',
    right: -40,
    bottom: -48,
    width: 110,
    height: 80,
    borderRadius: 50,
    backgroundColor: Colors.accentWarm,
    opacity: 0.22,
    transform: [{ rotate: '-18deg' }],
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
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    transform: [{ scale: 0.95 }],
  },
  leftIconBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#D1FAE5',
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  rightActionPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
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

