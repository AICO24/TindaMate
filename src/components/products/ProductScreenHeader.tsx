import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';

import { CartVectorIcon } from '@/components/dashboard/DashboardNavIcons';
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
import {
  getCartSnapshot,
  getCartTotalItemCount,
  getPersistedCart,
  subscribeToCartChanges,
} from '@/lib/cartStore';

export interface ProductScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftIcon?: React.ReactNode;
  /** Shows the live shopping cart icon & item counter badge in the top-right header */
  showCartButton?: boolean;
  onCartPress?: () => void;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  rightActionAccessibilityLabel?: string;
  rightElement?: React.ReactNode;
  /** Optional embedded search bar, filter chip row, or custom controls inside the curved green zone */
  children?: React.ReactNode;
  /** Optional style override for outer curved container */
  style?: StyleProp<ViewStyle>;
  /** Optional style override for inner centered container */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * HeaderCartBadgeButton — Live shopping cart icon button with item counter badge
 * (TikTok Shop / Shopee style) synchronized across Products & POS screens.
 */
export function HeaderCartBadgeButton({
  onPress,
}: {
  onPress?: () => void;
}) {
  const [cartItemCount, setCartItemCount] = useState<number>(() =>
    getCartTotalItemCount(getCartSnapshot())
  );

  useEffect(() => {
    getPersistedCart().then((cart) => {
      setCartItemCount(getCartTotalItemCount(cart));
    });

    const unsubscribe = subscribeToCartChanges((cart) => {
      setCartItemCount(getCartTotalItemCount(cart));
    });

    return () => unsubscribe();
  }, []);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push('/sales');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        cartItemCount > 0
          ? `Shopping cart, ${cartItemCount} ${
              cartItemCount === 1 ? 'item' : 'items'
            } in cart`
          : 'Shopping cart, empty'
      }
      accessibilityHint="Opens the POS cart to review items and checkout"
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.cartButton,
        cartItemCount > 0 && styles.cartButtonActive,
        pressed && styles.backButtonPressed,
      ]}>
      <CartVectorIcon color={Colors.textInverse} size={IconSizes.md} />
      {cartItemCount > 0 ? (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText} numberOfLines={1}>
            {cartItemCount > 99 ? '99+' : String(cartItemCount)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * ProductScreenHeader / ScreenHeroHeader (TindaMate Design 2.0)
 *
 * Unified deep forest green header foundation across POS, Products, Customers,
 * Sales History, Expenses, Reports, and More screens:
 * - Rich TindaMate Deep Green (#064E3B) surface with subtle organic curves
 * - Accessible back button or custom module icon
 * - Crisp white title and soft mint subtitle hierarchy
 * - Optional primary green pill CTA or custom action element on the right
 * - Direct first-class support for embedded children (search bars, filter chips)
 *   without requiring duplicate nested hero header zones.
 */
export function ProductScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  leftIcon,
  showCartButton = false,
  onCartPress,
  rightActionLabel,
  onRightActionPress,
  rightActionAccessibilityLabel,
  rightElement,
  children,
  style,
  contentContainerStyle,
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
    <View style={[styles.outerZone, style]}>
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

      <View style={[styles.innerContainer, contentContainerStyle]}>
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
          ) : showCartButton || (rightActionLabel && onRightActionPress) ? (
            <View style={styles.rightActionsRow}>
              {showCartButton ? (
                <HeaderCartBadgeButton onPress={onCartPress} />
              ) : null}
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
          ) : null}
        </View>

        {/* Embedded Children (e.g. Search Bar, Filter Chips) */}
        {children ? (
          <View style={styles.embeddedChildrenWrap}>
            {children}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * ScreenHeroHeader — Semantic alias for ProductScreenHeader
 */
export const ScreenHeroHeader = ProductScreenHeader;

const styles = StyleSheet.create({
  outerZone: {
    width: '100%',
    backgroundColor: Colors.primaryDark,
    borderBottomLeftRadius: BorderRadius.heroHeader,
    borderBottomRightRadius: BorderRadius.heroHeader,
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
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#10B981',
    opacity: 0.38,
  },
  decorWarmAccent: {
    position: 'absolute',
    right: -25,
    bottom: -40,
    width: 130,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F59E0B',
    opacity: 0.35,
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
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    minWidth: 19,
    height: 19,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    ...Shadows.xs,
  },
  cartBadgeText: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.extraBold,
    fontSize: 10,
    lineHeight: 12,
    includeFontPadding: false,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
  embeddedChildrenWrap: {
    marginTop: Spacing.twoHalf,
    width: '100%',
  },
});
