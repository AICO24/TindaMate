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
 * - Circular monogram avatar (deep forest green for active accounts, warm amber for settled/paid)
 * - Customer name
 * - Prominent outstanding balance (₱1,250.00) OR green "PAID" status pill
 * - Last activity / payment date & phone metadata
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
    customer.credit_summary?.last_transaction_at ?? customer.updated_at
  );

  const accessibilityLabel = `${customer.name}, ${
    customer.phone ? `Phone: ${customer.phone}, ` : ''
  }${
    hasUtang
      ? `Outstanding credit: ${formattedBalance}`
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
      <View style={styles.contentRow}>
        {/* Left: Circular Avatar Monogram */}
        <View
          style={[
            styles.avatarCircle,
            !hasUtang && styles.avatarCircleSettled,
            !customer.is_active && styles.avatarCircleInactive,
          ]}>
          <Text
            style={[
              styles.avatarText,
              !hasUtang && styles.avatarTextSettled,
              !customer.is_active && styles.avatarTextInactive,
            ]}>
            {initials}
          </Text>
        </View>

        {/* Center: Name, Balance / PAID Pill, and Last Activity */}
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

          {hasUtang ? (
            <Text
              style={styles.balanceAmountText}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}>
              {formattedBalance}
            </Text>
          ) : (
            <View style={styles.paidPill}>
              <Text style={styles.paidPillText}>PAID</Text>
            </View>
          )}

          <Text
            style={styles.activityMetaText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}>
            {lastActivityDate
              ? `Last payment: ${lastActivityDate}`
              : customer.phone
              ? `Phone: ${customer.phone}`
              : 'Last payment: Oct 30'}
          </Text>
        </View>

        {/* Right: Chevron */}
        <View style={styles.rightCol}>
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
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D7A4D',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  avatarCircleSettled: {
    backgroundColor: '#EA580C',
    borderWidth: 0,
  },
  avatarCircleInactive: {
    backgroundColor: '#64748B',
    borderWidth: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
  avatarTextSettled: {
    color: Colors.textInverse,
  },
  avatarTextInactive: {
    color: Colors.textInverse,
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  customerName: {
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
  balanceAmountText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
  },
  paidPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginVertical: 1,
  },
  paidPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  activityMetaText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  rightCol: {
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 22,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
  },
});
