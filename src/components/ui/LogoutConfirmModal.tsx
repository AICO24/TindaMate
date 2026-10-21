import React from 'react';
import {
  Modal,
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
import { TindaMateButton } from '@/components/ui/TindaMateButton';

export interface LogoutConfirmModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback triggered when user confirms sign out */
  onConfirm: () => void;
  /** Callback triggered when user cancels or dismisses the modal */
  onCancel: () => void;
  /** Whether the sign out process is actively loading */
  isLoading?: boolean;
  /** Optional user / store name to display for context */
  accountName?: string;
}

/**
 * LogoutConfirmModal
 *
 * Polished, high-contrast confirmation modal replacing default plain native alerts.
 * Features:
 * - Branded soft-red destructive accent
 * - Clear, readable confirmation copy tailored for sari-sari store owners
 * - Immediate loading spinner on confirmation
 * - Cancel / Dismiss to keep user safely in the application
 */
export function LogoutConfirmModal({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
  accountName,
}: LogoutConfirmModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 360;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={isLoading ? undefined : onCancel}>
      <Pressable
        style={styles.backdrop}
        onPress={isLoading ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss logout modal">
        <Pressable
          style={[styles.modalCard, isNarrow && styles.modalCardNarrow]}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert">
          {/* Top Decorative Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji} importantForAccessibility="no">
                🚪
              </Text>
            </View>
          </View>

          {/* Heading & Explanation */}
          <View style={styles.contentBlock}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}>
              Log Out of TindaMate?
            </Text>

            <Text style={styles.description} maxFontSizeMultiplier={1.3}>
              Are you sure you want to sign out? You will need to log in again to
              manage your products, sales, and store records.
            </Text>

            {accountName ? (
              <View style={styles.accountBadge}>
                <Text style={styles.accountBadgeLabel}>Current Account:</Text>
                <Text
                  style={styles.accountBadgeName}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {accountName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TindaMateButton
              title={isLoading ? 'Signing Out...' : 'Yes, Log Out'}
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
              onPress={onConfirm}
              accessibilityLabel="Confirm log out of TindaMate"
              style={styles.confirmButton}
            />

            <TindaMateButton
              title="Cancel"
              variant="ghost"
              disabled={isLoading}
              onPress={onCancel}
              accessibilityLabel="Cancel and stay logged in"
              style={styles.cancelButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  modalCardNarrow: {
    paddingHorizontal: Spacing.three,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.errorLight,
    borderWidth: 1.5,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  contentBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.extraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    paddingHorizontal: Spacing.two,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: Spacing.one,
    marginTop: Spacing.one,
    maxWidth: '95%',
  },
  accountBadgeLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  accountBadgeName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  confirmButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

