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

/**
 * CustomerCard
 *
 * Scannable, mobile-first customer row card for sari-sari store owners:
 * - Customer Avatar with 2-letter monogram
 * - Full customer name with wrap support
 * - Phone number snippet
 * - Outstanding Utang balance pill badge
 * - Inactive badge if customer has been deactivated
 * - Right chevron for details tap-through
 */
export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const initials = getCustomerInitials(customer.name);
  const balance = customer.credit_summary?.current_balance ?? 0;
  const hasUtang = balance > 0;
  const formattedBalance = formatPesoCurrency(balance);

  const accessibilityLabel = `${customer.name}, ${
    customer.phone ? `Phone: ${customer.phone}, ` : ''
  }${
    hasUtang
      ? `Outstanding credit: ${formattedBalance}`
      : 'No outstanding balance'
  }${!customer.is_active ? ', Inactive' : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens complete details for this customer"
      onPress={() => onPress(customer)}
      style={({ pressed }) => [
        styles.card,
        isCompactPhone && styles.cardCompact,
        !customer.is_active && styles.cardInactive,
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.contentRow}>
        {/* Left: Avatar Monogram */}
        <View
          style={[
            styles.avatarCircle,
            !customer.is_active && styles.avatarCircleInactive,
            hasUtang && styles.avatarCircleUtang,
          ]}>
          <Text
            style={[
              styles.avatarText,
              !customer.is_active && styles.avatarTextInactive,
              hasUtang && styles.avatarTextUtang,
            ]}>
            {initials}
          </Text>
        </View>

        {/* Center: Info Block */}
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

            {!customer.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {customer.phone ? (
              <Text
                style={styles.phoneText}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}>
                📞 {customer.phone}
              </Text>
            ) : (
              <Text
                style={styles.noPhoneText}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}>
                No phone saved
              </Text>
            )}
          </View>
        </View>

        {/* Right: Credit Balance Badge & Chevron */}
        <View style={styles.rightCol}>
          {hasUtang ? (
            <View style={styles.utangBadge}>
              <Text style={styles.utangBadgeAmount}>{formattedBalance}</Text>
              <Text style={styles.utangBadgeLabel}>Utang</Text>
            </View>
          ) : (
            <View style={styles.clearBadge}>
              <Text style={styles.clearBadgeText}>No Utang</Text>
            </View>
          )}

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
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.threeHalf,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  cardCompact: {
    paddingVertical: Spacing.twoHalf,
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
    opacity: 0.95,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.pastel.green.bg,
    borderWidth: 1.5,
    borderColor: Colors.pastel.green.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleUtang: {
    backgroundColor: Colors.pastel.orange.bg,
    borderColor: Colors.pastel.orange.border,
  },
  avatarCircleInactive: {
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.green.accent,
  },
  avatarTextUtang: {
    color: Colors.pastel.orange.accent,
  },
  avatarTextInactive: {
    color: Colors.textMuted,
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
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  customerNameInactive: {
    color: Colors.textSecondary,
  },
  inactiveBadge: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  noPhoneText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  utangBadge: {
    backgroundColor: Colors.pastel.orange.bg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.pastel.orange.border,
    alignItems: 'flex-end',
  },
  utangBadgeAmount: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.extraBold,
    color: Colors.pastel.orange.accent,
  },
  utangBadgeLabel: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.orange.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearBadge: {
    backgroundColor: Colors.pastel.green.bg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
  },
  clearBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.pastel.green.accent,
  },
  chevron: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
});

