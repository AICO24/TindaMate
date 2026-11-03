import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QuickActionItem, QuickActionTile } from './QuickActionTile';
import { Spacing, Typography } from '@/constants/theme';

interface QuickActionsSectionProps {
  actions: QuickActionItem[];
  isNarrow?: boolean;
}

/**
 * QuickActionsSection
 *
 * Compact operational quick action strip:
 * - 4 accessible store tiles: New Sale, Add Product, Utang, Expense
 * - Thumb-friendly, rounded corners, clean visual rhythm
 */
export function QuickActionsSection({
  actions,
  isNarrow = false,
}: QuickActionsSectionProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader} accessibilityRole="header" maxFontSizeMultiplier={1.2}>
        Quick Actions
      </Text>

      <View style={[styles.tilesRow, isNarrow && styles.tilesRowNarrow]}>
        {actions.map((action) => (
          <QuickActionTile key={action.id} item={action} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: Spacing.half,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: Spacing.two,
  },
  tilesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two,
    width: '100%',
  },
  tilesRowNarrow: {
    gap: 6,
  },
});
