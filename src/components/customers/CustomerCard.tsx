import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { CustomerWithCredit } from '@/types/customer';

interface CustomerCardProps {
  customer: CustomerWithCredit;
  onPress: (customer: CustomerWithCredit) => void;
}

/**
 * Extracts initials from customer name (e.g. "Juan Dela Cruz" -> "JD", "Maria" -> "M").
 */
function getCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatShortActivityDate(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/**
 * CustomerCard — TindaMate Design 2.0
 *
 * Financially professional customer ledger row:
 * - Circular monogram avatar (Orange for unpaid utang, Green for settled/paid, Slate for inactive)
 * - Customer name + optional INACTIVE badge
 * - Phone number and last activity date metadata
 * - Right-aligned financial status column: Orange utang balance + UTANG pill OR Green PAID pill
 * - Right chevron
 */
export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const initials = getCustomerInitials(customer.name);
  const balance = customer.credit_summary?.current_balance ?? 0;
  const hasUtang = balance > 0;
  const formattedBalance = formatPesoCurrency(balance);
  const lastActivityDate = formatShortActivityDate(
    customer.credit_summary?.last_transaction_at
  );

  const metaParts: string[] = [];
  if (customer.phone) {
    metaParts.push(customer.phone);
  }
  if (lastActivityDate) {
    metaParts.push(
      customer.phone
        ? `Active ${lastActivityDate}`
        : `Last activity: ${lastActivityDate}`
    );
  }
  const secondaryMeta = metaParts.join(' • ');

  const accessibilityLabel = `${customer.name}, ${
    customer.phone ? `Phone: ${customer.phone}, ` : ''
  }${
    hasUtang
      ? `Outstanding utang: ${formattedBalance}`
      : 'Paid, no outstanding balance'
  }${!customer.is_active ? ', Inactive' : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens complete credit ledger for this customer"
      onPress={() => onPress(customer)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        !customer.is_active && styles.cardInactive,
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.contentRow, isCompactPhone && styles.contentRowCompact]}>
        {/* Left: Circular Avatar Monogram */}
        <View
          style={[
            styles.avatarCircle,
            isCompactPhone && styles.avatarCircleCompact,
            hasUtang ? styles.avatarCircleUtang : styles.avatarCircleSettled,
            !customer.is_active && styles.avatarCircleInactive,
          ]}>
          <Text
            style={[
              styles.avatarText,
              isCompactPhone && styles.avatarTextCompact,
              !customer.is_active && styles.avatarTextInactive,
            ]}>
            {initials}
          </Text>
        </View>

        {/* Center: Name, Inactive Badge, Phone & Last Activity */}
        <View style={styles.infoCol}>
          <View style={styles.nameHeaderRow}>
            <Text
              style={[
                styles.customerName,
                !customer.is_active && styles.customerNameInactive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.3}>
              {customer.name}
            </Text>

            {!customer.is_active ? (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            ) : null}
          </View>

          {secondaryMeta ? (
            <Text
              style={styles.activityMetaText}
              numberOfLines={1}
              ellipsizeMode="tail"
              maxFontSizeMultiplier={1.2}>
              {secondaryMeta}
            </Text>
          ) : (
            <Text
              style={styles.activityMetaMuted}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              No transactions yet
            </Text>
          )}
        </View>

        {/* Right: Financial Balance / PAID Status + Chevron */}
        <View style={styles.rightCluster}>
          <View style={styles.statusCol}>
            {hasUtang ? (
              <>
                <Text
                  style={[
                    styles.balanceAmountText,
                    isCompactPhone && styles.balanceAmountTextCompact,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  maxFontSizeMultiplier={1.25}>
                  {formattedBalance}
                </Text>
                <View style={styles.utangPill}>
                  <Text style={styles.utangPillText}>UTANG</Text>
                </View>
              </>
            ) : (
              <View style={styles.paidPill}>
                <Text style={styles.paidPillText}>PAID</Text>
              </View>
            )}
          </View>

          <Text style={styles.chevron} importantForAccessibility="no">
            ›
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: Spacing.threeHalf,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.sm,
  },
  cardCompact: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  cardInactive: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.borderSubtle,
    opacity: 0.85,
  },
  cardPressed: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.primaryBorder,
    transform: [{ scale: 0.992 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contentRowCompact: {
    gap: 10,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  avatarCircleCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarCircleUtang: {
    backgroundColor: Colors.accentDark,
  },
  avatarCircleSettled: {
    backgroundColor: Colors.primary,
  },
  avatarCircleInactive: {
    backgroundColor: Colors.pastel.neutral.iconBg,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
  avatarTextCompact: {
    fontSize: 14,
  },
  avatarTextInactive: {
    color: Colors.textInverse,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    flexShrink: 1,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  customerNameInactive: {
    color: Colors.textSecondary,
  },
  inactiveBadge: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  activityMetaText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  activityMetaMuted: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  balanceAmountText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.accentDark,
    fontVariant: ['tabular-nums'],
  },
  balanceAmountTextCompact: {
    fontSize: Typography.sizes.body,
  },
  utangPill: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  utangPillText: {
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
    color: Colors.accentDark,
    letterSpacing: 0.4,
  },
  paidPill: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  paidPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
});
