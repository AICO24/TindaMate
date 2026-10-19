import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertCircleIcon } from './AuthIcons';
import { Colors, Spacing, Typography } from '@/constants/theme';

export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

interface PasswordStrengthMeterProps {
  password: string;
  showFeedbackText?: boolean;
}

/**
 * Calculates password strength based on simple, transparent criteria.
 */
export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0 to 4
  label: string;
  color: string;
} {
  if (!password || password.length === 0) {
    return { strength: 'empty', score: 0, label: '', color: Colors.border };
  }

  // Simple rules:
  // Length >= 6
  // Has letters and numbers
  // Has uppercase or special character
  const hasMinLength = password.length >= 6;
  const hasOptimalLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  if (!hasMinLength) {
    return {
      strength: 'weak',
      score: 1,
      label: 'Weak',
      color: Colors.error,
    };
  }

  // Score evaluation
  let varieties = 0;
  if (hasLetters && hasNumbers) varieties += 1;
  if (hasMixedCase) varieties += 1;
  if (hasSpecial) varieties += 1;
  if (hasOptimalLength) varieties += 1;

  if (varieties >= 3) {
    return {
      strength: 'strong',
      score: 4,
      label: 'Strong',
      color: Colors.success,
    };
  }

  return {
    strength: 'medium',
    score: 2,
    label: 'Medium',
    color: Colors.warning,
  };
}

/**
 * PasswordStrengthMeter
 *
 * A visual 4-segment strength bar matching the reference image.
 */
export function PasswordStrengthMeter({
  password,
  showFeedbackText = true,
}: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const { strength, score, label, color } = calculatePasswordStrength(password);

  const totalSegments = 4;

  return (
    <View style={styles.container}>
      {/* Segmented Strength Bar */}
      <View style={styles.barContainer}>
        {Array.from({ length: totalSegments }).map((_, index) => {
          const isFilled = index < score;
          let segmentColor = Colors.border;

          if (isFilled) {
            if (strength === 'weak') segmentColor = Colors.error;
            else if (strength === 'medium') segmentColor = index === 0 ? Colors.error : Colors.warning;
            else if (strength === 'strong') segmentColor = Colors.success;
          }

          return (
            <View
              key={index}
              style={[
                styles.segment,
                { backgroundColor: segmentColor },
              ]}
            />
          );
        })}
      </View>

      {/* Strength Label and Feedback Alert */}
      {showFeedbackText && (
        <View style={styles.feedbackRow}>
          {strength === 'weak' ? (
            <View style={styles.warningBox}>
              <AlertCircleIcon size={14} color={Colors.error} />
              <Text style={styles.warningText}>Password is too weak (min. 6 characters)</Text>
            </View>
          ) : (
            <Text style={[styles.strengthLabel, { color }]}>
              Strength: <Text style={{ fontWeight: Typography.weights.bold }}>{label}</Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: -Spacing.one,
    marginBottom: Spacing.three,
  },
  barContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  feedbackRow: {
    marginTop: 6,
    paddingHorizontal: Spacing.one,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  warningText: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
    fontWeight: Typography.weights.medium,
  },
  strengthLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});

