import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  NavHomeIcon,
  NavMoreIcon,
  NavProductsIcon,
  NavSalesIcon,
  NavUtangIcon,
} from './DashboardNavIcons';
import {
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

export type NavTab = 'home' | 'products' | 'sales' | 'utang' | 'more';

interface DashboardBottomNavProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

/**
 * DashboardBottomNav
 *
 * Persistent bottom navigation bar using the TindaMate Design System:
 * - Pure vector icons with standardized IconSizes.nav (22px)
 * - Active tab highlighted in Colors.primaryDark with bottom indicator bar
 * - Inactive tabs in Colors.textMuted
 */
export function DashboardBottomNav({
  activeTab,
  onTabPress,
}: DashboardBottomNavProps) {
  const tabs: { key: NavTab; label: string; renderIcon: (color: string) => React.ReactNode }[] = [
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
    {
      key: 'sales',
      label: 'Sales',
      renderIcon: (color) => <NavSalesIcon color={color} />,
    },
    {
      key: 'utang',
      label: 'Utang',
      renderIcon: (color) => <NavUtangIcon color={color} />,
    },
    {
      key: 'more',
      label: 'More',
      renderIcon: (color) => <NavMoreIcon color={color} />,
    },
  ];

  return (
    <View style={styles.navBar} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const iconColor = isActive ? Colors.primaryDark : Colors.textMuted;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            onPress={() => onTabPress(tab.key)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}>
            {/* Vector Icon */}
            <View style={styles.iconWrapper}>
              {tab.renderIcon(iconColor)}
            </View>

            {/* Label */}
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>

            {/* Active Green Underline Bar */}
            {isActive ? (
              <View style={styles.activeIndicatorBar} />
            ) : (
              <View style={styles.inactiveIndicatorBar} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.two,
    paddingBottom: 6,
    paddingHorizontal: Spacing.one,
    ...Shadows.bottomNav,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
    minHeight: 48,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 22,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primaryDark,
    marginTop: 2,
  },
  inactiveIndicatorBar: {
    width: 22,
    height: 3,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
});

