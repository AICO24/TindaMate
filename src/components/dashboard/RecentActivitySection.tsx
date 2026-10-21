import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

interface RecentActivitySectionProps {
  onViewAll?: () => void;
  hasActivity?: boolean;
  activityCount?: number;
}

/**
 * RecentActivitySection
 *
 * Visually polished empty state card using the TindaMate Design System:
 * - Reusable SectionHeader ("Recent Activity", conditional "View All ›" only when activity exists)
 * - Full-width horizontal card with soft mint/slate surface
 * - Pure React Native vector checklist pad with warm orange sparkle rays (zero OS emojis)
 * - Friendly, non-alarming empty state guidance
 */
export function RecentActivitySection({
  onViewAll,
  hasActivity = false,
  activityCount = 0,
}: RecentActivitySectionProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 375;

  const showViewAll = (hasActivity || activityCount > 0) && !!onViewAll;

  return (
    <View style={styles.container}>
      {/* Reusable Design-System Section Header (hides View All when empty) */}
      <SectionHeader
        title="Recent Activity"
        actionLabel={showViewAll ? 'View All' : undefined}
        onActionPress={showViewAll ? onViewAll : undefined}
      />

      {/* Empty State Card */}
      <View style={[styles.emptyCard, isCompactPhone && styles.emptyCardCompact]}>
        {/* Vector Checklist Card with Warm Sparkle Rays */}
        <View
          style={styles.illustrationContainer}
          accessible={false}
          importantForAccessibility="no-hide-descendants">
          {/* Left Warm Sparkle Rays */}
          <View style={styles.raysLeft}>
            <View style={[styles.ray, styles.rayTopLeft]} />
            <View style={[styles.ray, styles.rayMidLeft]} />
            <View style={[styles.ray, styles.rayBotLeft]} />
          </View>

          {/* Tilted Mint Checklist Sheet */}
          <View style={styles.checklistPad}>
            {[0, 1, 2].map((idx) => (
              <View key={idx} style={styles.checkRow}>
                <View style={styles.checkDot} />
                <View style={styles.checkLine} />
              </View>
            ))}
          </View>

          {/* Right Warm Sparkle Rays */}
          <View style={styles.raysRight}>
            <View style={[styles.ray, styles.rayTopRight]} />
            <View style={[styles.ray, styles.rayMidRight]} />
            <View style={[styles.ray, styles.rayBotRight]} />
          </View>
        </View>

        {/* Text Details */}
        <View style={styles.textGroup}>
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
            No recent activity yet.
          </Text>
          <Text style={styles.emptyDescription} maxFontSizeMultiplier={1.3}>
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
    gap: Spacing.twoHalf,
  },
  emptyCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    ...Shadows.xs,
  },
  emptyCardCompact: {
    paddingVertical: Spacing.twoHalf,
    paddingHorizontal: Spacing.twoHalf,
    gap: Spacing.twoHalf,
  },
  illustrationContainer: {
    width: 72,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistPad: {
    width: 42,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#99D5C3',
    paddingVertical: 9,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    transform: [{ rotate: '-5deg' }],
    ...Shadows.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  checkDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: Colors.surface,
  },
  checkLine: {
    flex: 1,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: Colors.surface,
  },
  raysLeft: {
    height: 36,
    justifyContent: 'space-between',
    marginRight: 5,
  },
  raysRight: {
    height: 36,
    justifyContent: 'space-between',
    marginLeft: 5,
  },
  ray: {
    width: 6,
    height: 2.2,
    borderRadius: 1.2,
    backgroundColor: Colors.accentWarm,
  },
  rayTopLeft: {
    transform: [{ rotate: '28deg' }],
  },
  rayMidLeft: {
    width: 7,
  },
  rayBotLeft: {
    transform: [{ rotate: '-28deg' }],
  },
  rayTopRight: {
    transform: [{ rotate: '-28deg' }],
  },
  rayMidRight: {
    width: 7,
  },
  rayBotRight: {
    transform: [{ rotate: '28deg' }],
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  emptyTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  emptyDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.tight,
  },
  boldWord: {
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
});

