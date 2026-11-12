import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SalesOverviewChartHeaderIcon } from './DashboardNavIcons';
import { Shadows, Spacing, Typography } from '@/constants/theme';

export interface WeeklySalesBar {
  label: string;
  amount: number;
  isToday: boolean;
}

interface SalesOverviewCardProps {
  weeklyBars: WeeklySalesBar[];
  maxWeeklyAmount: number;
  topYAxisValue?: string;
  midYAxisValue?: string;
  onPeriodPress?: () => void;
}

/**
 * Computes 4 clean Y-axis scale labels (e.g. ['3k', '2k', '1k', '0'])
 * matching the 4-line grid in the Dashboard reference.
 */
function getFourStepYAxisLabels(maxAmount: number): [string, string, string, string] {
  if (maxAmount <= 3000) {
    return ['3k', '2k', '1k', '0'];
  }
  const stepK = Math.ceil(maxAmount / 3000);
  return [`${stepK * 3}k`, `${stepK * 2}k`, `${stepK}k`, '0'];
}

/**
 * SalesOverviewCard (Target Reference 1:1 Weekly Sales Bar Chart + Black Corner Hover Line)
 *
 * Visually matches the Sales Overview card in the Dashboard reference:
 * - Header Row: Green 3-bar chart icon + "Sales Overview" on left, "This Week ⌄" on right
 * - 4 Y-axis scale numbers (3k, 2k, 1k, 0) + 4 horizontal reference grid lines
 * - Monday-to-Sunday vertical bars with vibrant mint-to-emerald vertical gradient
 * - Crisp black line outline on hover
 */
export function SalesOverviewCard({
  weeklyBars,
  maxWeeklyAmount,
  onPeriodPress,
}: SalesOverviewCardProps) {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [selectedBarIdx, setSelectedBarIdx] = useState<number | null>(null);

  const [labelTop, labelUpperMid, labelLowerMid, labelZero] =
    getFourStepYAxisLabels(maxWeeklyAmount);

  const chartCeiling =
    maxWeeklyAmount <= 3000
      ? Math.max(maxWeeklyAmount, 1000)
      : Math.ceil(maxWeeklyAmount / 3000) * 3000;

  return (
    <Pressable
      onHoverIn={() => setIsCardHovered(true)}
      onHoverOut={() => setIsCardHovered(false)}
      style={[
        styles.sectionContainer,
        isCardHovered && styles.sectionContainerHovered,
      ]}>
      {/* Header Row: Icon + Title + Period Selector */}
      <View style={styles.headerRow}>
        <View style={styles.titleCluster}>
          <SalesOverviewChartHeaderIcon size={18} color="#0D7A4D" />
          <Text
            style={styles.title}
            accessibilityRole="header"
            maxFontSizeMultiplier={1.2}>
            Sales Overview
          </Text>
        </View>

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
        {/* 4-Step Y-Axis Scale Numbers (3k, 2k, 1k, 0) */}
        <View style={styles.yAxisColumn} pointerEvents="none">
          <Text style={styles.yAxisLabel}>{labelTop}</Text>
          <Text style={styles.yAxisLabel}>{labelUpperMid}</Text>
          <Text style={styles.yAxisLabel}>{labelLowerMid}</Text>
          <Text style={styles.yAxisLabel}>{labelZero}</Text>
        </View>

        {/* Bars & 4 Horizontal Grid Lines */}
        <View style={styles.barsArea}>
          <View style={styles.gridLinesOverlay} pointerEvents="none">
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          <View style={styles.barsRow}>
            {weeklyBars.map((bar, idx) => {
              const isZero = bar.amount <= 0;
              const barPixelHeight = isZero
                ? 2
                : Math.min(
                    84,
                    Math.max(6, Math.round((bar.amount / chartCeiling) * 84))
                  );

              const formattedCallout =
                bar.amount >= 1000
                  ? `₱${(bar.amount / 1000).toFixed(1)}k`
                  : `₱${Math.round(bar.amount)}`;

              const isHighlighted =
                selectedBarIdx !== null ? selectedBarIdx === idx : bar.isToday;

              return (
                <Pressable
                  key={`${bar.label}-${idx}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${bar.label} sales: ${formattedCallout}`}
                  onPress={() =>
                    setSelectedBarIdx((prev) => (prev === idx ? null : idx))
                  }
                  style={styles.barColumn}>
                  {/* Bar + Directly Attached Floating Callout Bubble */}
                  <View style={styles.barStackArea}>
                    {isHighlighted ? (
                      <View style={styles.calloutWrapper}>
                        <View style={styles.calloutBubble}>
                          <Text style={styles.calloutText} numberOfLines={1}>
                            {formattedCallout}
                          </Text>
                        </View>
                        <View style={styles.calloutPointer} />
                      </View>
                    ) : null}

                    {/* Vertical Bar with Mint-to-Emerald Gradient Layering */}
                    <View
                      style={[
                        styles.barFill,
                        isHighlighted && styles.barFillToday,
                        { height: barPixelHeight },
                      ]}>
                      {!isZero && (
                        <View
                          style={[
                            styles.barGradientTop,
                            isHighlighted && styles.barGradientTopToday,
                          ]}
                        />
                      )}
                    </View>
                  </View>

                  {/* Day Label */}
                  <Text
                    style={[
                      styles.dayLabel,
                      isHighlighted && styles.dayLabelToday,
                    ]}
                    numberOfLines={1}>
                    {bar.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: Spacing.threeHalf,
    borderWidth: 1.5,
    borderColor: '#EDF4EE',
    gap: 8,
    ...Shadows.sm,
  },
  sectionContainerHovered: {
    borderColor: '#000000',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16.5,
    fontWeight: Typography.weights.extraBold,
    color: '#0A3D28',
    letterSpacing: -0.3,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  filterTriggerPressed: {
    opacity: 0.7,
  },
  filterText: {
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: '#1E293B',
  },
  filterChevron: {
    fontSize: 12,
    color: '#334155',
    marginTop: -3,
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 128,
    gap: 8,
  },
  yAxisColumn: {
    width: 22,
    height: 108,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontSize: 10.5,
    fontWeight: Typography.weights.medium,
    color: '#475569',
    lineHeight: 13,
  },
  barsArea: {
    flex: 1,
    height: 128,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLinesOverlay: {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    bottom: 22,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    opacity: 0.85,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 128,
    zIndex: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 128,
  },
  barStackArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  calloutWrapper: {
    alignItems: 'center',
    marginBottom: 3,
  },
  calloutBubble: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  calloutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
  },
  calloutPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#064E3B',
  },
  barFill: {
    width: 24,
    backgroundColor: '#0D9459',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  barFillToday: {
    backgroundColor: '#0B6B41',
  },
  barGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    backgroundColor: '#22C55E',
    opacity: 0.72,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  barGradientTopToday: {
    backgroundColor: '#15803D',
    opacity: 0.78,
  },
  dayLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: Typography.weights.medium,
    color: '#334155',
  },
  dayLabelToday: {
    color: '#0A3D28',
    fontWeight: Typography.weights.bold,
  },
});
