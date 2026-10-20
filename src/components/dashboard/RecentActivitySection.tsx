import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

interface RecentActivitySectionProps {
  onViewAll?: () => void;
}

/**
 * RecentActivitySection
 *
 * Displays the recent transactions list or an honest empty state:
 * - Section title + "View All" link
 * - Calibrated empty-state illustration/card
 * - Friendly guidance for the sari-sari store owner
 */
export function RecentActivitySection({ onViewAll }: RecentActivitySectionProps) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {onViewAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all recent activity"
            onPress={onViewAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        )}
      </View>

      {/* Honest Empty State Card */}
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>📋</Text>
        </View>

        <Text style={styles.emptyTitle}>No recent activity yet</Text>

        <Text style={styles.emptyDescription}>
          Sales recordings, inventory updates, and customer credit transactions will
          appear here once you start using the app.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#105B48',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyIcon: {
    fontSize: 22,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
});

