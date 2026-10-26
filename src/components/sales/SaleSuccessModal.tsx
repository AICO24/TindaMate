import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/ui/AuthIcons';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatPesoCurrency } from '@/lib/products';
import { formatSaleDate, formatSaleTime } from '@/lib/sales';
import { Sale, SaleItem } from '@/types/sale';

export interface SaleSuccessModalProps {
  /** Whether the success modal is visible */
  visible: boolean;
  /** Authoritative sale transaction header returned by the server */
  sale: Sale | null;
  /** Line items recorded under this transaction */
  items?: SaleItem[];
  /** Cash amount tendered by customer */
  amountTendered: number | null;
  /** Actual change calculated against server-authoritative total */
  change: number;
  /** Whether this was an idempotent retry */
  isRetry?: boolean;
  /** Optional notice if server price differed from client estimate */
  priceDifferenceNotice?: string | null;
  /** Callback to start a new sale */
  onDismiss: () => void;
  /** Callback to view transaction details in `/sales/[id]` */
  onViewDetails?: (saleId: string) => void;
}

/**
 * SaleSuccessModal
 *
 * Implements Batch 7C-1: Receipt / Sale Completion Experience
 * - Lightweight mobile receipt layout tailored for sari-sari store cashiers
 * - Complete itemized product breakdown (name, quantity, unit, unit price, subtotal)
 * - Server-authoritative transaction total amount
 * - Prominent Amount Tendered and Change Due (Sukli) display
 * - Transaction reference number (#XXXXXXXX) and timestamp (Date • Time)
 * - Scrollable receipt body preserving sticky action buttons ("Record Another Sale" / "View Sale Details")
 * - Safe fallback handling for single-item and multi-item transactions
 */
export function SaleSuccessModal({
  visible,
  sale,
  items = [],
  amountTendered,
  change,
  isRetry = false,
  priceDifferenceNotice,
  onDismiss,
  onViewDetails,
}: SaleSuccessModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isNarrow = windowWidth < 360;
  const isShortScreen = windowHeight < 680;

  if (!sale) {
    return null;
  }

  // Fallback to sale header if items array is empty
  const displayItems =
    items && items.length > 0
      ? items.map((i) => ({
          id: i.id || i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unit_price,
          subtotal: i.subtotal,
        }))
      : [
          {
            id: sale.id,
            productName: sale.product_name,
            quantity: sale.quantity,
            unit: sale.unit,
            unitPrice: sale.unit_price,
            subtotal: sale.total_amount,
          },
        ];

  const distinctCount = sale.item_count ?? displayItems.length;
  const totalUnits = sale.quantity;
  const formattedDate = formatSaleDate(sale.created_at);
  const formattedTime = formatSaleTime(sale.created_at);
  const isUtang = sale.payment_method === 'credit';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.modalCard,
              isNarrow && styles.modalCardNarrow,
              isShortScreen && styles.modalCardShort,
            ]}>
            {/* Header: Success Badge, Title, Timestamp & Reference */}
            <View style={styles.headerBlock}>
              <View style={styles.iconCircle}>
                <CheckIcon size={28} color={Colors.surface} />
              </View>

              <Text style={styles.title} accessibilityRole="header">
                {isUtang ? 'Utang Recorded!' : 'Sale Recorded!'}
              </Text>

              {/* Meta details: Reference & Timestamp */}
              <View style={styles.metaRow}>
                <Text style={styles.refText}>
                  Ref: #{sale.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.dateText}>
                  {formattedDate} • {formattedTime}
                </Text>
              </View>

              {/* Payment Method Badge */}
              {isUtang && (
                <View style={styles.utangHeaderBadge}>
                  <Text style={styles.utangHeaderBadgeText}>
                    📝 Charged to {sale.customer_name ?? 'Customer'}
                  </Text>
                </View>
              )}

              {/* Idempotency Retry Badge */}
              {isRetry && (
                <View style={styles.retryBadge}>
                  <Text style={styles.retryBadgeText}>
                    ✓ Restored from previous attempt (No double-deduction)
                  </Text>
                </View>
              )}

              {/* Price Difference Notice */}
              {priceDifferenceNotice ? (
                <View style={styles.priceNoticeBox}>
                  <Text style={styles.priceNoticeText}>
                    ℹ️ {priceDifferenceNotice}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Scrollable Receipt Body */}
            <ScrollView
              style={styles.receiptScrollView}
              contentContainerStyle={styles.receiptScrollContent}
              showsVerticalScrollIndicator={true}>
              <View style={styles.receiptPaper}>
                {/* Receipt Section Title */}
                <View style={styles.receiptSectionHeader}>
                  <Text style={styles.receiptSectionTitle}>
                    ITEMS SOLD ({distinctCount})
                  </Text>
                  <Text style={styles.receiptSectionSubtitle}>
                    {totalUnits} {totalUnits === 1 ? 'unit' : 'units'} total
                  </Text>
                </View>

                {/* Line Items List */}
                <View style={styles.itemsList}>
                  {displayItems.map((item, index) => (
                    <View
                      key={`${item.id}-${index}`}
                      style={[
                        styles.itemRow,
                        index < displayItems.length - 1 && styles.itemRowDivider,
                      ]}>
                      <View style={styles.itemInfoCol}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.productName}
                        </Text>
                        <Text style={styles.itemCalculation}>
                          {item.quantity} {item.unit} × {formatPesoCurrency(item.unitPrice)}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtotal}>
                        {formatPesoCurrency(item.subtotal)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Dashed Separator */}
                <View style={styles.dashedDivider} />

                {/* Authoritative Total */}
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                    <Text style={styles.totalSub}>
                      {distinctCount} {distinctCount === 1 ? 'product' : 'products'} · {totalUnits} {totalUnits === 1 ? 'unit' : 'units'}
                    </Text>
                  </View>
                  <Text
                    style={styles.totalAmount}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={1}>
                    {formatPesoCurrency(sale.total_amount)}
                  </Text>
                </View>

                {/* Payment Breakdown (Cash Tendered/Change OR Utang Credit Notice) */}
                <View style={styles.paymentSection}>
                  {isUtang ? (
                    <View style={styles.utangCard}>
                      <View style={styles.utangCardHeader}>
                        <View style={styles.utangBadge}>
                          <Text style={styles.utangBadgeText}>
                            UTANG (STORE CREDIT)
                          </Text>
                        </View>
                      </View>
                      <View style={styles.utangCustomerRow}>
                        <Text style={styles.utangCustomerLabel}>Customer:</Text>
                        <Text style={styles.utangCustomerName} numberOfLines={1}>
                          {sale.customer_name ?? 'Store Customer'}
                        </Text>
                      </View>
                      <View style={styles.utangNoticeBox}>
                        <Text style={styles.utangNoticeText}>
                          Charged to customer&apos;s credit account. No cash was received or change given.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {amountTendered !== null && (
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Amount Tendered:</Text>
                          <Text style={styles.paymentValue}>
                            {formatPesoCurrency(amountTendered)}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.changeContainer,
                          change === 0
                            ? styles.changeContainerExact
                            : styles.changeContainerOverpaid,
                        ]}>
                        <View style={styles.changeLabelCol}>
                          <Text
                            style={[
                              styles.changeLabel,
                              change === 0
                                ? styles.changeLabelExact
                                : styles.changeLabelOverpaid,
                            ]}>
                            Change / Sukli:
                          </Text>
                          {change === 0 && (
                            <Text style={styles.exactPaymentHint}>
                              Exact Payment (Sakto)
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.changeAmount,
                            change === 0
                              ? styles.changeAmountExact
                              : styles.changeAmountOverpaid,
                          ]}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                          numberOfLines={1}>
                          {formatPesoCurrency(change)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Sticky Bottom Actions Bar */}
            <View style={styles.actionsWrap}>
              <TindaMateButton
                title="Record Another Sale"
                variant="primary"
                onPress={onDismiss}
                accessibilityLabel="Record another sale and return to cashier"
                style={styles.actionBtn}
              />

              {onViewDetails && (
                <TindaMateButton
                  title="View Sale Details"
                  variant="secondary"
                  onPress={() => onViewDetails(sale.id)}
                  accessibilityLabel="View full sale details in history"
                  style={styles.actionBtn}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.65)', // High-contrast forest green scrim
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '94%',
    paddingHorizontal: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    maxHeight: '100%',
    flexDirection: 'column',
    ...Shadows.md,
  },
  modalCardNarrow: {
    padding: Spacing.sm,
  },
  modalCardShort: {
    padding: Spacing.xs,
  },
  headerBlock: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textBrand,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  refText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  dateText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  retryBadge: {
    backgroundColor: Colors.pastel.blue.bg,
    borderWidth: 1,
    borderColor: Colors.pastel.blue.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    width: '100%',
  },
  retryBadgeText: {
    fontSize: Typography.sizes.caption,
    color: Colors.pastel.blue.accent,
    textAlign: 'center',
    fontWeight: Typography.weights.semiBold,
  },
  utangHeaderBadge: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    width: '100%',
  },
  utangHeaderBadgeText: {
    fontSize: Typography.sizes.caption,
    color: Colors.accent,
    textAlign: 'center',
    fontWeight: Typography.weights.bold,
  },
  priceNoticeBox: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    width: '100%',
  },
  priceNoticeText: {
    fontSize: Typography.sizes.caption,
    color: Colors.warningText,
    textAlign: 'center',
  },
  receiptScrollView: {
    flexShrink: 1,
    marginVertical: Spacing.xs,
  },
  receiptScrollContent: {
    paddingVertical: Spacing.xs,
  },
  receiptPaper: {
    backgroundColor: Colors.backgroundWarm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  receiptSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  receiptSectionTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  receiptSectionSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  itemsList: {
    gap: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  itemInfoCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  itemName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  itemCalculation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.pastel.green.bg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.pastel.green.border,
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
  },
  paymentSection: {
    gap: Spacing.xs,
  },
  utangCard: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  utangCardHeader: {
    flexDirection: 'row',
  },
  utangBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  utangBadgeText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
    letterSpacing: 0.5,
  },
  utangCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  utangCustomerLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  utangCustomerName: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  utangNoticeBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  utangNoticeText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  paymentLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: 2,
  },
  changeContainerExact: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  changeContainerOverpaid: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  changeLabelCol: {
    flex: 1,
  },
  changeLabel: {
    fontSize: Typography.sizes.bodySm,
    fontWeight: Typography.weights.bold,
  },
  changeLabelExact: {
    color: Colors.textSecondary,
  },
  changeLabelOverpaid: {
    color: Colors.successText,
  },
  exactPaymentHint: {
    fontSize: Typography.sizes.caption,
    color: Colors.textMuted,
  },
  changeAmount: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.extraBold,
  },
  changeAmountExact: {
    color: Colors.textSecondary,
  },
  changeAmountOverpaid: {
    color: Colors.success,
  },
  actionsWrap: {
    width: '100%',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  actionBtn: {
    width: '100%',
  },
});
