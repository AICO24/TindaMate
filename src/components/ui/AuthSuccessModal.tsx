import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CheckIcon } from '@/components/ui/AuthIcons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

interface AuthSuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onAutoRedirect?: () => void;
}

export function AuthSuccessModal({
  visible,
  title = 'Login Successful!',
  message = 'Welcome to TindaMate! Directing you to your store dashboard...',
  onAutoRedirect,
}: AuthSuccessModalProps) {
  useEffect(() => {
    if (visible && onAutoRedirect) {
      // Direct transition after a brief, satisfying visual confirmation (700ms)
      const timer = setTimeout(() => {
        onAutoRedirect();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [visible, onAutoRedirect]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Success Checkmark Badge */}
          <View style={styles.iconCircle}>
            <CheckIcon size={28} color={Colors.surface} />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Subtle indicator */}
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.redirectText}>Opening Dashboard...</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.45)', // Forest green translucent scrim
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textBrand,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.full,
  },
  redirectText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.primaryDark,
  },
});
