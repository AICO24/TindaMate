import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const handleGetStarted = (): void => {
    const message =
      'Welcome to TindaMate! Store setup and features will be connected in upcoming batches.';

    if (Platform.OS === 'web') {
      window.alert(`Mabuhay!\n\n${message}`);
    } else {
      Alert.alert('Mabuhay!', message, [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentContainer}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏪 Tindahan Companion</Text>
          </View>
          <Text style={styles.appName}>TindaMate</Text>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get Started with TindaMate"
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#DBEAFE',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  badgeText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '600',
  },
  appName: {
    fontSize: 38,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '500',
    color: '#2563EB',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
  },
  featureList: {
    marginTop: Spacing.one,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.three,
  },
  featureItem: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  featureBold: {
    fontWeight: '600',
    color: '#0F172A',
  },
  actionContainer: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: '#1D4ED8',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

