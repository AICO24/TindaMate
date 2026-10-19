import React from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  BorderRadius,
  BottomTabInset,
  Colors,
  MaxContentWidth,
  Spacing,
  Typography,
} from '@/constants/theme';

import { router } from 'expo-router';

export default function HomeScreen() {
  const handleGetStarted = (): void => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentContainer}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏪 Tindahan Companion</Text>
          </View>
          <Text style={styles.appName}>
            <Text style={{ color: Colors.primary }}>Tinda</Text>
            <Text style={{ color: Colors.accent }}>Mate</Text>
          </Text>
          <Text style={styles.tagline}>"Your Digital Tindahan Assistant"</Text>
        </View>

        {/* Supporting Message Card */}
        <View style={styles.card}>
          <Text style={styles.description}>
            TindaMate is built to help sari-sari store owners manage their daily
            store operations with ease. Simplify sales recording, keep inventory
            in check, and manage customer credit (lista ng utang) — all from
            your mobile phone.
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>
              📦 <Text style={styles.featureBold}>Inventory:</Text> Track your fast-moving items
            </Text>
            <Text style={styles.featureItem}>
              💵 <Text style={styles.featureBold}>Daily Sales:</Text> Record daily benta accurately
            </Text>
            <Text style={styles.featureItem}>
              📝 <Text style={styles.featureBold}>Utang Tracker:</Text> Keep credit lists clear & updated
            </Text>
          </View>
        </View>

        {/* Interactive Action Element */}
        <View style={styles.actionContainer}>
          <TindaMateButton
            title="Get Started"
            onPress={handleGetStarted}
          />
          <Text style={styles.actionHint}>
            Tap to begin exploring your digital tindahan
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    color: Colors.primaryPressed,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
  },
  appName: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sizes.base,
    fontStyle: 'italic',
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.three,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.relaxed,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featureList: {
    marginTop: Spacing.one,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.three,
  },
  featureItem: {
    fontSize: Typography.sizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.normal,
  },
  featureBold: {
    fontWeight: Typography.weights.semiBold,
    color: Colors.textPrimary,
  },
  actionContainer: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});

