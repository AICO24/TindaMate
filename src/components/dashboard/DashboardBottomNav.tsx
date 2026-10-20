import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export type NavTab = 'home' | 'products' | 'sales' | 'utang' | 'more';

interface DashboardBottomNavProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
}

interface TabConfig {
  key: NavTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'sales', label: 'Sales', icon: '🧾' },
  { key: 'utang', label: 'Utang', icon: '👛' },
  { key: 'more', label: 'More', icon: '☰' },
];

/**
 * DashboardBottomNav
 *
 * Bottom navigation bar matching the reference mockup:
 * - 5 items: Home (active green with underline bar), Products, Sales, Utang, More
 * - Pure white surface with subtle top separator
 */
export function DashboardBottomNav({
  activeTab,
  onTabPress,
}: DashboardBottomNavProps) {
  return (
    <View style={styles.navBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
            onPress={() => onTabPress(tab.key)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}>
            {/* Icon */}
            <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
              {tab.icon}
            </Text>

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
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
    gap: 3,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabIcon: {
    fontSize: 21,
    opacity: 0.6,
    color: '#64748B',
  },
  activeTabIcon: {
    opacity: 1,
    color: '#064E3B',
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
