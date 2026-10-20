import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

interface RecentActivitySectionProps {
  onViewAll?: () => void;
}

/**
 * RecentActivitySection
 *
 * Visually polished empty state card matching the reference mockup:
 * - Full-width horizontal card with generous padding (#EDF7F2)
 * - Large sparkling checklist icon on left
 * - "No recent activity yet." title and transaction guidance on right
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
            <Text style={styles.viewAllText}>View All  ›</Text>
          </Pressable>
        )}
      </View>

      {/* Empty State Card matching mockup */}
      <View style={styles.emptyCard}>
        {/* Checklist with sparkles */}
        <View style={styles.iconContainer}>
          <Text style={styles.sparkleLeft}>✨</Text>
          <View style={styles.clipboardBox}>
            <Text style={styles.clipboardIcon}>📋</Text>
          </View>
          <Text style={styles.sparkleRight}>✨</Text>
        </View>

        {/* Text Details */}
        <View style={styles.textGroup}>
          <Text style={styles.emptyTitle}>No recent activity yet.</Text>
          <Text style={styles.emptyDescription}>
            Your <Text style={styles.boldWord}>transactions</Text> and updates will
            appear here once you start using the app.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#064E3B',
  },
  emptyCard: {
    backgroundColor: '#EDF7F2',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D4EBE0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clipboardBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clipboardIcon: {
    fontSize: 26,
  },
  sparkleLeft: {
    position: 'absolute',
    left: -11,
    top: 2,
    fontSize: 12,
  },
  sparkleRight: {
    position: 'absolute',
    right: -11,
    bottom: 2,
    fontSize: 12,
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
  },
  emptyDescription: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  boldWord: {
    fontWeight: '800',
    color: '#334155',
  },
});
