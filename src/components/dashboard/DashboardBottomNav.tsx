import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

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
  { key: 'sales', label: 'Sales', icon: '💵' },
  { key: 'utang', label: 'Utang', icon: '📝' },
  { key: 'more', label: 'More', icon: '⚙️' },
];

/**
 * DashboardBottomNav
 *
 * Persistent mobile bottom navigation bar:
 * - 5 core tabs: Home (active), Products, Sales, Utang, More
 * - High-contrast active tab state (#105B48)
 * - Safe touch targets with subtle press feedback
 * - Rounded top border separation
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
            {/* Active Pill Indicator behind Icon */}
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                {tab.icon}
              </Text>
            </View>

            {/* Tab Label */}
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
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
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 58,
    gap: 3,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeIconWrapper: {
    backgroundColor: '#DCFCE7',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.65,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#105B48',
    fontWeight: '800',
  },
});

