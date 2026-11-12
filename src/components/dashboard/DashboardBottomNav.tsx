import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  NavCustomersIcon,
  NavFloatingCenterIcon,
  NavHomeIcon,
  NavMoreIcon,
  NavProductsIcon,
} from './DashboardNavIcons';
import {
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
 * Individual Clean Nav Tab Button
 * Style: Clean Rounded Floating Pill Navbar (Matching Image Option #3 Reels Squircle)
 * - Zero hover spring/reanimated bounce animations for smooth, instant feel
 * - Active state renders an attractive rounded squircle badge behind the active icon
 */
function NavTabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const iconColor = isActive ? '#FFFFFF' : '#475569';

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${tab.label} tab${isActive ? ', selected' : ''}`}
      accessibilityHint={`Navigates to ${tab.label} screen`}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && styles.tabItemPressed,
      ]}>
      <View
        style={[
          styles.iconSquircle,
          isActive && styles.iconSquircleActive,
        ]}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        {tab.renderIcon(iconColor)}
      </View>

      <Text
        style={[
          styles.tabLabel,
          isActive && styles.activeTabLabel,
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

/**
 * DashboardBottomNav (Floating Rounded Capsule Navbar)
 *
 * Modeled after the minimalist floating pill dock:
 * - Floating rounded capsule geometry (`borderRadius: 999`) with subtle drop shadow
 * - No mouse hover jumps or bounce animations
 * - Left side: Home (1), Products (2)
 * - Center: Floating circular POS action button
 * - Right side: Customers (4), More (5)
 */
export function DashboardBottomNav({
  activeTab,
  onTabPress,
}: DashboardBottomNavProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const rawTab = activeTab ?? resolveActiveNavTab(pathname);
  const currentTab: NavTab = rawTab === 'utang' ? 'customers' : rawTab;

  const bottomInsetPadding = insets.bottom > 0 ? insets.bottom : Spacing.two;

  const leftTabs: TabConfig[] = [
    {
      key: 'home',
      label: 'Home',
      renderIcon: (color) => <NavHomeIcon color={color} size={22} />,
    },
    {
      key: 'products',
      label: 'Products',
      renderIcon: (color) => <NavProductsIcon color={color} size={22} />,
    },
  ];

  const rightTabs: TabConfig[] = [
    {
      key: 'customers',
      label: 'Customers',
      renderIcon: (color) => <NavCustomersIcon color={color} size={22} />,
    },
    {
      key: 'more',
      label: 'More',
      renderIcon: (color) => <NavMoreIcon color={color} size={22} />,
    },
  ];

  const isPosActive = currentTab === 'sales';

  return (
    <View style={[styles.outerWrapper, { paddingBottom: bottomInsetPadding }]}>
      <View style={styles.floatingCapsuleDock} accessibilityRole="tablist">
        {/* Left Side: Home & Products */}
        <View style={styles.sideGroup}>
          {leftTabs.map((tab) => (
            <NavTabButton
              key={tab.key}
              tab={tab}
              isActive={currentTab === tab.key}
              onPress={() => onTabPress(tab.key)}
            />
          ))}
        </View>

        {/* Center Slot Spacer + Center Action Button (New Sale / POS) */}
        <View style={styles.centerSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New Sale POS Quick Action"
            accessibilityHint="Opens the Point of Sale screen to record a new sale"
            onPress={() => onTabPress('sales')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.centerButton,
              isPosActive && styles.centerButtonActive,
              pressed && styles.centerButtonPressed,
            ]}>
            <NavFloatingCenterIcon color="#FFFFFF" size={24} />
          </Pressable>
        </View>

        {/* Right Side: Customers & More */}
        <View style={styles.sideGroup}>
          {rightTabs.map((tab) => (
            <NavTabButton
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    backgroundColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCapsuleDock: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  centerSlot: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  centerButtonActive: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  centerButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabItemPressed: {
    opacity: 0.75,
  },
  iconSquircle: {
    width: 42,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconSquircleActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
});
