import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Shadows, Spacing, Typography } from '@/constants/theme';

export interface WeeklySalesBar {
  label: string;
  amount: number;
  isToday: boolean;
}

interface SalesOverviewCardProps {
  weeklyBars: WeeklySalesBar[];
  maxWeeklyAmount: number;
  topYAxisValue: string;
  midYAxisValue: string;
  onPeriodPress?: () => void;
}

/**
 * SalesOverviewCard (Interactive Real-Data Weekly Sales Bar Chart)
 *
 * Renders real sales distribution across 7 rolling days:
 * - Clean title row with "Sales Overview" and "This Week ▾" period trigger
 * - Faint Y-axis reference numbers (e.g. 10k, 5k, 0)
 * - Horizontal baseline and midline grid guides
 * - True React Native vertical bars with rounded caps
 * - Active day emphasis with floating tooltip pill (e.g. ₱8.4k) and pointer arrow
 * - Day labels (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
 */
export function SalesOverviewCard({
  weeklyBars,
  maxWeeklyAmount,
  topYAxisValue,
  midYAxisValue,
  onPeriodPress,
}: SalesOverviewCardProps) {
  return (
    <View style={styles.sectionContainer}>
      {/* Header Row: Title + Period Selector */}
      <View style={styles.headerRow}>
        <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.2}>
          Sales Overview
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter sales overview by period"
          onPress={onPeriodPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.filterTrigger,
            pressed && styles.filterTriggerPressed,
          ]}>
          <Text style={styles.filterText} maxFontSizeMultiplier={1.2}>
            This Week
          </Text>
          <Text style={styles.filterChevron} importantForAccessibility="no">
            ⌄
          </Text>
        </Pressable>
      </View>

      {/* Plot Area */}
      <View style={styles.plotRow}>
        {/* Faint Y-Axis Scale Numbers */}
        <View style={styles.yAxisColumn} pointerEvents="none">
          <Text style={styles.yAxisLabel}>{topYAxisValue}</Text>
          <Text style={styles.yAxisLabel}>{midYAxisValue}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Bars Container */}
        <View style={styles.barsArea}>
          {/* Subtle Horizontal Grid Guides */}
          <View style={styles.gridLinesOverlay} pointerEvents="none">
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          <View style={styles.barsRow}>
            {weeklyBars.map((bar, idx) => {
              const heightPct =
                bar.amount > 0
                  ? Math.max(18, Math.round((bar.amount / maxWeeklyAmount) * 100))
                  : 12;

              return (
                <View key={`${bar.label}-${idx}`} style={styles.barColumn}>
                  {/* Floating Tooltip Callout on Today's Bar */}
                  {bar.isToday ? (
                    <View style={styles.calloutWrapper}>
                      <View style={styles.calloutPill}>
                        <Text style={styles.calloutText} numberOfLines={1}>
                          {bar.amount >= 1000
                            ? `₱${(bar.amount / 1000).toFixed(1)}k`
                            : `₱${Math.round(bar.amount)}`}
                        </Text>
                      </View>
                      <View style={styles.calloutPointer} />
                    </View>
                  ) : (
                    <View style={styles.calloutSpacer} />
                  )}

                  {/* Vertical Bar Fill Track */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%` },
                        bar.isToday && styles.barFillToday,
                        bar.amount === 0 && styles.barFillZero,
                      ]}>
                      {bar.amount > 0 && <View style={styles.barGradientBottom} />}
                    </View>
                  </View>

                  {/* Day Label */}
                  <Text
                    style={[
                      styles.dayLabel,
                      bar.isToday && styles.dayLabelToday,
                    ]}
                    maxFontSizeMultiplier={1.15}>
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 16.5,
    fontWeight: Typography.weights.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: '#EFE9DE',
  },
  filterTriggerPressed: {
    opacity: 0.8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: Typography.weights.semiBold,
    color: '#475569',
  },
  filterChevron: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -2,
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 142,
    gap: 8,
  },
  yAxisColumn: {
    width: 26,
    height: 104,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 22,
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.medium,
    color: '#94A3B8',
  },
  barsArea: {
    flex: 1,
    height: 142,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLinesOverlay: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    opacity: 0.7,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 142,
    zIndex: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 142,
  },
  calloutWrapper: {
    alignItems: 'center',
    marginBottom: 3,
    zIndex: 5,
  },
  calloutPill: {
    backgroundColor: '#0F172A',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderRadius: 6,
    ...Shadows.sm,
  },
  calloutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  calloutPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
  },
  calloutSpacer: {
    height: 19,
  },
  barTrack: {
    width: 22,
    height: 94,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#047857',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  barFillToday: {
    backgroundColor: '#059669',
  },
  barFillZero: {
    backgroundColor: '#E2E8F0',
    opacity: 0.5,
  },
  barGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#34D399',
    opacity: 0.35,
  },
  dayLabel: {
    marginTop: 6,
    fontSize: 10.5,
    fontWeight: Typography.weights.medium,
    color: '#64748B',
  },
  dayLabelToday: {
    color: '#064E3B',
    fontWeight: Typography.weights.bold,
  },
});

