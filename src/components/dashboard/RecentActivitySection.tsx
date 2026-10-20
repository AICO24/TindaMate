import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';

interface RecentActivitySectionProps {
  onViewAll?: () => void;
}

/**
 * RecentActivitySection
 *
 * Empty state card matching the reference mockup:
 * - Horizontal card with soft mint background (#EDF7F2)
 * - Sparkle checklist icon on left
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
    gap: 10,
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064E3B',
  },
  emptyCard: {
    backgroundColor: '#EDF7F2',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: '#D4EBE0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clipboardBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboardIcon: {
    fontSize: 24,
  },
  sparkleLeft: {
    position: 'absolute',
    left: -10,
    top: 2,
    fontSize: 10,
  },
  sparkleRight: {
    position: 'absolute',
    right: -10,
    bottom: 2,
    fontSize: 10,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#064E3B',
  },
  emptyDescription: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  boldWord: {
    fontWeight: '700',
    color: '#475569',
  },
});
