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
import { formatSaleDate, formatSaleTime } from '@/lib/sales';
import { CustomerCreditTransaction } from '@/types/customer';

interface CreditTransactionCardProps {
  transaction: CustomerCreditTransaction;
  onPressSale?: (saleId: string) => void;
}

/**
 * CreditTransactionCard
 *
 * Scannable, mobile-first card representing an immutable credit ledger entry.
 * Clearly displays:
 * - Transaction type badge ("Utang Sale" / "Utang Charge" / "Payment")
 * - Formatted date and time
 * - Product summary and item count (from associated POS sale, if present)
 * - Reference tag
 * - Transaction amount (prominently styled with +/- indicator)
 * - Tap-through to complete historical Sale Details when linked to a sale
 */
export function CreditTransactionCard({
  transaction,
  onPressSale,
}: CreditTransactionCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactPhone = windowWidth < 360;

  const isCharge = transaction.transaction_type === 'charge';
  const hasSale = Boolean(transaction.sale_id);
  const formattedAmount = formatPesoCurrency(transaction.amount);
  const formattedDate = formatSaleDate(transaction.created_at);
  const formattedTime = formatSaleTime(transaction.created_at);

  const displayTitle =
    transaction.sale?.product_name ||
    transaction.notes ||
    (isCharge ? 'Utang Transaction' : 'Payment Received');

  const saleInfo = transaction.sale;
  const isMultiItem = (saleInfo?.item_count ?? 1) > 1;

  let unitSummary = '';
  if (saleInfo) {
    if (isMultiItem) {
      unitSummary = `${saleInfo.item_count} items · ${saleInfo.quantity} total units`;
    } else {
      unitSummary = `${saleInfo.quantity} ${saleInfo.unit || 'units'}`;
    }
  }

  const referenceTag = transaction.sale_id
    ? `#${transaction.sale_id.slice(0, 8).toUpperCase()}`
    : `#${transaction.id.slice(0, 8).toUpperCase()}`;

  const accessibilityLabel = `${
    isCharge ? 'Utang credit charge' : 'Credit payment'
  }: ${displayTitle}, ${
    isCharge ? `added ${formattedAmount} to balance` : `paid ${formattedAmount}`
  }, on ${formattedDate} at ${formattedTime}${
    hasSale ? '. Tap to view full sale receipt.' : ''
  }`;

  const CardContent = (
    <View style={styles.contentWrap}>
      {/* Top Meta Row: Badge + Date/Time */}
      <View style={styles.topMetaRow}>
        <View style={styles.badgeGroup}>
          <View
            style={[
              styles.typeBadge,
              isCharge ? styles.typeBadgeCharge : styles.typeBadgePayment,
            ]}>
            <Text
              style={[
                styles.typeBadgeText,
                isCharge
                  ? styles.typeBadgeTextCharge
                  : styles.typeBadgeTextPayment,
              ]}>
              {isCharge
                ? hasSale
                  ? 'Utang Sale'
                  : 'Utang Charge'
                : 'Payment'}
            </Text>
          </View>
          <Text style={styles.referenceText}>{referenceTag}</Text>
        </View>

        <Text style={styles.dateTimeText}>
          {formattedDate} · {formattedTime}
        </Text>
      </View>

      {/* Main Body Row: Transaction Info & Amount */}
      <View style={styles.mainRow}>
        <View style={styles.infoCol}>
          <Text
            style={styles.itemTitle}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}>
            {displayTitle}
          </Text>

          {unitSummary ? (
            <Text
              style={styles.itemSubtitle}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {unitSummary}
            </Text>
          ) : transaction.notes && transaction.notes !== displayTitle ? (
            <Text
              style={styles.itemSubtitle}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}>
              {transaction.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amountText,
              isCharge ? styles.amountTextCharge : styles.amountTextPayment,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            maxFontSizeMultiplier={1.3}>
            {isCharge ? `+ ${formattedAmount}` : `- ${formattedAmount}`}
          </Text>
          <Text style={styles.amountCaption}>
            {isCharge ? 'Added to utang' : 'Payment credit'}
          </Text>
        </View>
      </View>

      {/* Bottom Hint Row if linked to sale */}
      {hasSale ? (
        <View style={styles.footerRow}>
          <Text style={styles.viewSaleHint}>View Sale Receipt</Text>
          <Text style={styles.chevronIcon} importantForAccessibility="no">
            ›
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (hasSale && onPressSale) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens complete details and receipt for this sale"
        onPress={() => onPressSale(transaction.sale_id!)}
        style={({ pressed }) => [
          styles.card,
          isCompactPhone && styles.cardCompact,
          pressed && styles.cardPressed,
        ]}>
        {CardContent}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, isCompactPhone && styles.cardCompact]}>
      {CardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.threeHalf,
    ...Shadows.xs,
  },
  cardCompact: {
    padding: Spacing.three,
  },
  cardPressed: {
    opacity: 0.88,
    backgroundColor: Colors.backgroundAlt,
    borderColor: Colors.borderFocused,
  },
  contentWrap: {
    gap: Spacing.twoHalf,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  typeBadge: {
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  typeBadgeCharge: {
    backgroundColor: Colors.pastel.orange.bg,
    borderColor: Colors.pastel.orange.border,
  },
  typeBadgePayment: {
    backgroundColor: Colors.pastel.green.bg,
    borderColor: Colors.pastel.green.border,
  },
  typeBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extraBold,
  },
  typeBadgeTextCharge: {
    color: Colors.pastel.orange.accent,
  },
  typeBadgeTextPayment: {
    color: Colors.pastel.green.accent,
  },
  referenceText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  dateTimeText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
    fontWeight: Typography.weights.regular,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeights.heading,
  },
  itemSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
  },
  amountTextCharge: {
    color: Colors.accent,
  },
  amountTextPayment: {
    color: Colors.primaryDark,
  },
  amountCaption: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  viewSaleHint: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  chevronIcon: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginTop: -2,
  },
});

