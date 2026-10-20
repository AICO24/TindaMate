import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BorderRadius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// High-resolution reference artwork
const WELCOME_REFERENCE_IMAGE = require('@/assets/images/welcome-hero.png');

/**
 * TindaMate Welcome Screen
 *
 * 100% Pixel-faithful reproduction of the official reference design:
 * - Authentic brand logo extracted cleanly (no status bar, no duplication)
 * - Complete 3D community market illustration (full green store badge, full bottom oval, zero text bleed)
 * - Pure white background (#FFFFFF) for seamless integration with artwork
 * - Exact 3-line balanced value proposition
 * - Clean pill buttons matching reference proportions
 */
export default function WelcomeScreen() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Responsive layout dimensions based on device width
  const { width: windowWidth } = Dimensions.get('window');
  const contentWidth = Math.min(windowWidth - 32, 375);

  // Proportional scale factor matching standard mobile canvas (1 : 2.16)
  const fullImageWidth = contentWidth;
  const fullImageHeight = contentWidth * 2.16;

  // 1. Logo Slice: Slices precisely between 6.8% and 19.2%
  // - Starts at 6.8% (strictly below status bar, time, wifi, battery)
  // - Height 12.4% (fully captures cart wheels and complete tagline with no cut-off)
  const logoBoxHeight = fullImageHeight * 0.124;
  const logoTopOffset = -fullImageHeight * 0.068;

  // 2. Illustration Slice: Slices precisely between 19.2% and 52.8%
  // - Starts at 19.2% (keeps 100% of the top green store badge with no flat top cut)
  // - Ends at 52.8% (keeps 100% of the bottom rounded cream oval with no flat bottom cut,
  //   and safely stops above the "Shop Local" text at 55.5% with zero black marks)
  const illustrationBoxHeight = fullImageHeight * 0.336;
  const illustrationTopOffset = -fullImageHeight * 0.192;

  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && isMounted) {
          router.replace('/home');
          return;
        }
      } catch (err) {
        console.warn('[Welcome Screen] Session check failed:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleGuest = () => {
    router.push('/home');
  };

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#105B48" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentWidth + 20 }]}
        showsVerticalScrollIndicator={false}>
        {/* Authentic Top Brand Logo (Exact artwork, zero status bar artifacts) */}
        <View style={[styles.logoSection, { width: contentWidth, height: logoBoxHeight }]}>
          <Image
            source={WELCOME_REFERENCE_IMAGE}
            style={{
              width: fullImageWidth,
              height: fullImageHeight,
              marginTop: logoTopOffset,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Authentic 3D Marketplace Illustration (Full badge, full bottom oval, zero text bleed) */}
        <View
          style={[
            styles.illustrationSection,
            { width: contentWidth, height: illustrationBoxHeight },
          ]}>
          <Image
            source={WELCOME_REFERENCE_IMAGE}
            style={{
              width: fullImageWidth,
              height: fullImageHeight,
              marginTop: illustrationTopOffset,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Core Value Proposition Section */}
        <View style={styles.textSection}>
          <Text style={styles.headline}>Shop Local,{'\n'}Support Small</Text>
          <Text style={styles.subheadline}>
            Discover amazing products from local{'\n'}
            vendors in your community. Fresh, unique,{'\n'}
            and just a tap away.
          </Text>
        </View>

        {/* Interactive Action Buttons */}
        <View style={styles.actionsSection}>
          {/* Primary Action: Log In Pill */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log in to your TindaMate account"
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}>
            <Text style={styles.primaryButtonText}>Log In  →</Text>
          </Pressable>

          {/* Secondary Action: Create Account Outlined Pill */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a new TindaMate account"
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}>
            <Text style={styles.secondaryButtonText}>Create Account  →</Text>
          </Pressable>

          {/* Tertiary Action: Continue as Guest */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
            onPress={handleGuest}
            style={({ pressed }) => [
              styles.guestButton,
              pressed && styles.guestButtonPressed,
            ]}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  logoSection: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  illustrationSection: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginVertical: Spacing.one,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#105B48',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: Spacing.two,
  },
  subheadline: {
    fontSize: 15,
    color: '#5B6770',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actionsSection: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#13654E',
    paddingVertical: 15,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: '#0F4D3C',
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'transparent',
    borderWidth: 1.8,
    borderColor: '#13654E',
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: '#E8F5E9',
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: '#13654E',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  guestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 2,
  },
  guestButtonPressed: {
    opacity: 0.6,
  },
  guestButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
