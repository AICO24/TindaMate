import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  NavFloatingCenterIcon,
  NavHomeIcon,
  NavMoreIcon,
  NavPosIcon,
  NavProductsIcon,
} from './DashboardNavIcons';
import { OrganicWaveDecoration } from './OrganicWaveDecoration';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export type NavTab = 'home' | 'products' | 'sales' | 'utang' | 'more';

interface DashboardBottomNavProps {
  /** Optional explicit tab override (e.g., when a sheet/sub-view is active on the current route) */
  activeTab?: NavTab;
  onTabPress: (tab: NavTab) => void;
}

/**
 * Derives the active bottom navigation tab from the current Expo Router pathname.
 */
export function resolveActiveNavTab(pathname: string): NavTab {
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith('/products')) return 'products';
  if (normalized.startsWith('/sales')) return 'sales';
  if (
    normalized.startsWith('/customers') ||
    normalized.startsWith('/utang') ||
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
 * DashboardBottomNav (TindaMate Design 2.0)
 *
 * Modern asymmetric 4-tab + Floating Center Action navigation bar:
 * - Left side: Home, POS
 * - Center: Prominent floating circular TindaMate POS/Scan action button rising above the bar
 * - Right side: Products, More
 * - Clean white surface with rounded upper edges, subtle elevation, and safe-area inset support
 */
export function DashboardBottomNav({
  activeTab,
  onTabPress,
}: DashboardBottomNavProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const rawTab = activeTab ?? resolveActiveNavTab(pathname);
  const currentTab: NavTab = rawTab === 'utang' ? 'more' : rawTab;

  // Flow the clean white surface through the bottom safe area on devices with a home indicator bar
  const bottomInsetPadding = insets.bottom > 0 ? insets.bottom : Spacing.two;

  const leftTabs: {
    key: NavTab;
    label: string;
    renderIcon: (color: string) => React.ReactNode;
  }[] = [
    {
      key: 'home',
      label: 'Home',
      renderIcon: (color) => <NavHomeIcon color={color} />,
    },
    {
      key: 'sales',
      label: 'POS',
      renderIcon: (color) => <NavPosIcon color={color} />,
    },
  ];

  const rightTabs: {
    key: NavTab;
    label: string;
    renderIcon: (color: string) => React.ReactNode;
  }[] = [
    {
      key: 'products',
      label: 'Products',
      renderIcon: (color) => <NavProductsIcon color={color} />,
    },
    {
      key: 'more',
      label: 'More',
      renderIcon: (color) => <NavMoreIcon color={color} />,
    },
  ];

  const renderTabButton = (tab: {
    key: NavTab;
    label: string;
    renderIcon: (color: string) => React.ReactNode;
  }) => {
    const isActive = currentTab === tab.key;
    const iconColor = isActive ? Colors.primaryDark : Colors.textMuted;

    return (
      <Pressable
        key={tab.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${tab.label} tab${isActive ? ', selected' : ''}`}
        accessibilityHint={`Navigates to ${tab.label} screen`}
        onPress={() => onTabPress(tab.key)}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        style={({ pressed }) => [
          styles.tabItem,
          pressed && styles.tabItemPressed,
        ]}>
        <View
          style={[
            styles.iconWrapper,
            isActive && styles.iconWrapperActive,
          ]}
          accessible={false}
          importantForAccessibility="no-hide-descendants">
          {tab.renderIcon(iconColor)}
        </View>

        <Text
          style={[styles.tabLabel, isActive && styles.activeTabLabel]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  const isPosActive = currentTab === 'sales';

  return (
    <View style={styles.outerWrapper}>
      {/* Background Organic Wave Curves rising under the navbar */}
      <OrganicWaveDecoration style={styles.bottomWaveStyle} />

      <View
        style={[styles.navBar, { paddingBottom: bottomInsetPadding }]}
        accessibilityRole="tablist">
        {/* Left Side: Home & POS */}
        <View style={styles.sideGroup}>
          {leftTabs.map(renderTabButton)}
        </View>

        {/* Center Slot Spacer + Floating Action Button */}
        <View style={styles.centerSlot}>
          <View style={styles.floatingCradle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New Sale POS Quick Action"
              accessibilityHint="Opens the Point of Sale screen to record a new sale"
              onPress={() => onTabPress('sales')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.floatingButton,
                isPosActive && styles.floatingButtonActive,
                pressed && styles.floatingButtonPressed,
              ]}>
              <View style={styles.floatingInnerRing}>
                <NavFloatingCenterIcon color={Colors.textInverse} size={28} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Right Side: Products & More */}
        <View style={styles.sideGroup}>
          {rightTabs.map(renderTabButton)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  bottomWaveStyle: {
    bottom: 20,
    height: 72,
    opacity: 0.9,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EDF4EE',
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
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
  floatingButtonPressed: {
    backgroundColor: Colors.primaryPressed,
    transform: [{ scale: 0.93 }],
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
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
    minHeight: 48,
  },
  tabItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconWrapper: {
    width: 36,
    height: 26,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: Colors.primarySoft,
  },
  tabLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textMuted,
  },
  activeTabLabel: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.extraBold,
  },
  activeIndicatorBar: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primaryDark,
    marginTop: 1,
  },
  inactiveIndicatorBar: {
    width: 18,
    height: 3,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
});

