import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface AuthDividerProps {
  label?: string;
}

/**
 * AuthDivider
 *
 * Clean horizontal divider with centered text ("OR") matching the reference design.
 */
export function AuthDivider({ label = 'OR' }: AuthDividerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.four,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  text: {
    marginHorizontal: Spacing.three,
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    letterSpacing: 0.5,
  },
});

