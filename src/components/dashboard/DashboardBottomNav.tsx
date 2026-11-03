import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  NavCustomersIcon,
  NavFloatingCenterIcon,
  NavHomeIcon,
  NavMoreIcon,
  NavProductsIcon,
} from './DashboardNavIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export type NavTab = 'home' | 'products' | 'sales' | 'customers' | 'more' | 'utang';

interface DashboardBottomNavProps {
  /** Optional explicit tab override (e.g., when a sheet/sub-view is active on the current route) */
  activeTab?: NavTab;
  onTabPress: (tab: NavTab) => void;
}

interface TabConfig {
  key: NavTab;
  label: string;
  renderIcon: (color: string) => React.ReactNode;
}

/**
 * Derives the active bottom navigation tab from the current Expo Router pathname.
 */
export function resolveActiveNavTab(pathname: string): NavTab {
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith('/products')) return 'products';
  if (normalized.startsWith('/sales')) return 'sales';
  if (normalized.startsWith('/customers') || normalized.startsWith('/utang')) {
    return 'customers';
  }
  if (
    normalized.startsWith('/expenses') ||
    normalized.startsWith('/reports') ||
    normalized.startsWith('/more') ||
    normalized.startsWith('/profile') ||
    normalized.startsWith('/settings')
  ) {
    return 'more';
  }
  return 'home';
}

/**
 * Individual Animated Tab Item (Material 3 / Modern iOS Spring Pill & Icon Bounce)
 */
function AnimatedNavTabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const iconScale = useSharedValue(1);
  const iconTranslateY = useSharedValue(0);

  const handleHoverIn = () => {
    setIsHovered(true);
    iconScale.set(withSpring(1.14, { damping: 14, stiffness: 240 }));
    iconTranslateY.set(withSpring(-2.5, { damping: 14, stiffness: 240 }));
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    iconScale.set(withSpring(1, { damping: 15, stiffness: 220 }));
    iconTranslateY.set(withSpring(0, { damping: 15, stiffness: 220 }));
  };

  const handlePressIn = () => {
    iconScale.set(withSpring(0.92, { damping: 15, stiffness: 260 }));
  };

  const handlePressOut = () => {
    iconScale.set(
      withSpring(isHovered ? 1.14 : 1, { damping: 14, stiffness: 240 })
    );
  };

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: iconTranslateY.get() },
      { scale: iconScale.get() },
    ],
  }));

  const isHighlighted = isActive || isHovered;
  const iconColor = isHighlighted ? '#15803D' : Colors.textMuted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${tab.label} tab${isActive ? ', selected' : ''}`}
      accessibilityHint={`Navigates to ${tab.label} screen`}
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={styles.tabItem}>
      <Animated.View
        style={[
          styles.iconWrapper,
          isActive && styles.iconWrapperActive,
          isHovered && !isActive && styles.iconWrapperHovered,
          animatedIconStyle,
        ]}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        {tab.renderIcon(iconColor)}
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          isActive && styles.activeTabLabel,
          isHovered && !isActive && styles.hoveredTabLabel,
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}>
        {tab.label}
      </Text>

      {/* Active / Hover Horizontal Capsule Pill Indicator */}
      <View
        style={[
          styles.indicatorBarBase,
          isActive && styles.activeIndicatorBar,
          isActive && isHovered && styles.activeIndicatorBarExpanded,
          !isActive && isHovered && styles.hoverPreviewIndicatorBar,
        ]}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

/**
 * DashboardBottomNav (Clean Rounded Navbar + Spring Micro-Interactions)
 *
 * Distinct 5-destination bottom navigation bar:
 * - Left side: Home (1), Products (2)
 * - Center: Prominent floating circular TindaMate New Sale / POS CTA (3) rising above the bar
 * - Right side: Customers & Utang (4), More Hub (5)
 * - Zero stray background wave lines behind corners
 */
export function DashboardBottomNav({
  activeTab,
  onTabPress,
}: DashboardBottomNavProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const rawTab = activeTab ?? resolveActiveNavTab(pathname);
  const currentTab: NavTab = rawTab === 'utang' ? 'customers' : rawTab;

  const [isPosHovered, setIsPosHovered] = useState(false);
  const posScale = useSharedValue(1);
  const posTranslateY = useSharedValue(0);

  const handlePosHoverIn = () => {
    setIsPosHovered(true);
    posScale.set(withSpring(1.07, { damping: 14, stiffness: 230 }));
    posTranslateY.set(withSpring(-3, { damping: 14, stiffness: 230 }));
  };

  const handlePosHoverOut = () => {
    setIsPosHovered(false);
    posScale.set(withSpring(1, { damping: 15, stiffness: 220 }));
    posTranslateY.set(withSpring(0, { damping: 15, stiffness: 220 }));
  };

  const handlePosPressIn = () => {
    posScale.set(withSpring(0.92, { damping: 15, stiffness: 260 }));
  };

  const handlePosPressOut = () => {
    posScale.set(
      withSpring(isPosHovered ? 1.07 : 1, { damping: 14, stiffness: 230 })
    );
  };

  const animatedPosStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: posTranslateY.get() },
      { scale: posScale.get() },
    ],
  }));

  const bottomInsetPadding = insets.bottom > 0 ? insets.bottom : Spacing.two;

  const leftTabs: TabConfig[] = [
    {
      key: 'home',
      label: 'Home',
      renderIcon: (color) => <NavHomeIcon color={color} />,
    },
    {
      key: 'products',
      label: 'Products',
      renderIcon: (color) => <NavProductsIcon color={color} />,
    },
  ];

  const rightTabs: TabConfig[] = [
    {
      key: 'customers',
      label: 'Customers',
      renderIcon: (color) => <NavCustomersIcon color={color} />,
    },
    {
      key: 'more',
      label: 'More',
      renderIcon: (color) => <NavMoreIcon color={color} />,
    },
  ];

  const isPosActive = currentTab === 'sales';

  return (
    <View style={styles.outerWrapper}>
      <View
        style={[styles.navBar, { paddingBottom: bottomInsetPadding }]}
        accessibilityRole="tablist">
        {/* Left Side: Home & Products */}
        <View style={styles.sideGroup}>
          {leftTabs.map((tab) => (
            <AnimatedNavTabButton
              key={tab.key}
              tab={tab}
              isActive={currentTab === tab.key}
              onPress={() => onTabPress(tab.key)}
            />
          ))}
        </View>

        {/* Center Slot Spacer + Floating Action Button (New Sale / POS) */}
        <View style={styles.centerSlot}>
          <Animated.View style={[styles.floatingCradle, animatedPosStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New Sale POS Quick Action"
              accessibilityHint="Opens the Point of Sale screen to record a new sale"
              onPress={() => onTabPress('sales')}
              onHoverIn={handlePosHoverIn}
              onHoverOut={handlePosHoverOut}
              onPressIn={handlePosPressIn}
              onPressOut={handlePosPressOut}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.floatingButton,
                isPosActive && styles.floatingButtonActive,
                isPosHovered && styles.floatingButtonHovered,
              ]}>
              <View
                style={[
                  styles.floatingInnerRing,
                  isPosHovered && styles.floatingInnerRingHovered,
                ]}>
                <NavFloatingCenterIcon color={Colors.textInverse} size={28} />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Right Side: Customers & More */}
        <View style={styles.sideGroup}>
          {rightTabs.map((tab) => (
            <AnimatedNavTabButton
              key={tab.key}
              tab={tab}
              isActive={currentTab === tab.key}
              onPress={() => onTabPress(tab.key)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: Colors.backgroundWarm,
    position: 'relative',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.two,
    zIndex: 10,
    ...Shadows.bottomNav,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  centerSlot: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCradle: {
    marginTop: -28,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floatingCenter,
  },
  floatingButtonActive: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  floatingButtonHovered: {
    backgroundColor: '#0B6B41',
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  floatingInnerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingInnerRingHovered: {
    borderColor: 'rgba(167, 243, 208, 0.5)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
    minHeight: 48,
  },
  iconWrapper: {
    width: 44,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#ECFDF5',
  },
  iconWrapperHovered: {
    backgroundColor: 'rgba(22, 163, 74, 0.09)',
  },
  tabLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  activeTabLabel: {
    color: '#0A5234',
    fontWeight: Typography.weights.extraBold,
  },
  hoveredTabLabel: {
    color: '#15803D',
    fontWeight: Typography.weights.bold,
  },
  indicatorBarBase: {
    width: 0,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
  activeIndicatorBar: {
    width: 28,
    backgroundColor: '#15803D',
  },
  activeIndicatorBarExpanded: {
    width: 36,
    backgroundColor: '#16A34A',
  },
  hoverPreviewIndicatorBar: {
    width: 16,
    backgroundColor: '#86EFAC',
  },
});
