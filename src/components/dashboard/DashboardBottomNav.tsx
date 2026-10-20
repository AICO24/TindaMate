import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  NavHomeIcon,
  NavMoreIcon,
  NavProductsIcon,
  NavSalesIcon,
  NavUtangIcon,
} from './DashboardNavIcons';
import { Spacing } from '@/constants/theme';

export type NavTab = 'home' | 'products' | 'sales' | 'utang' | 'more';

interface DashboardBottomNavProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

/**
 * DashboardBottomNav
 *
 * Professional bottom navigation matching the reference mockup:
 * - Pure vector line/fill icons (ZERO emoji, no red roofs or pink purses)
 * - Home has active deep green icon (#064E3B) and green underline bar
 * - Products, Sales, Utang, More in subtle slate (#64748B)
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
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const iconColor = isActive ? '#064E3B' : '#64748B';

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

            {/* Active Green Underline Bar matching reference */}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: Spacing.one,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#064E3B',
    fontWeight: '800',
  },
  activeIndicatorBar: {
    width: 22,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#064E3B',
    marginTop: 2,
  },
  inactiveIndicatorBar: {
    width: 22,
    height: 3,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
});
