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

import { TindaMateCartLogo } from '@/components/ui/TindaMateCartLogo';
import { BorderRadius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Reference image containing the authentic 3D vendor artwork
const WELCOME_REFERENCE_IMAGE = require('@/assets/images/welcome-hero.png');

/**
 * TindaMate Welcome Screen
 *
 * Pixel-perfect Welcome screen matching the official reference design:
 * - Single Brand Emblem at top (Clean vector: Cart + "TindaMate" + Tagline)
 * - Central 3D Marketplace Illustration:
 *   - Zero logo duplication (starts well below the tagline)
 *   - Complete rounded illustration (no flat cut-off)
 *   - Zero black text marks (stops well above the text in the source image)
 * - Value proposition: "Shop Local, Support Small"
 * - Primary "Log In →" pill button
 * - Secondary "Create Account →" outlined pill button
 * - Tertiary "Continue as Guest" link
 * - Automatic session detection for returning authenticated users
 */
export default function WelcomeScreen() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Screen dimension calculations for responsive proportional rendering
  const { width: windowWidth } = Dimensions.get('window');
  const contentWidth = Math.min(windowWidth - 32, 380);

  // Full screenshot aspect ratio (~1 : 2.16 standard mobile proportion)
  const fullImageWidth = contentWidth;
  const fullImageHeight = contentWidth * 2.16;

  // Exact vertical boundaries for the 3D illustration:
  // - Starts at 23.2% depth: Safely below the tagline (17.5%) so NO logo leaks,
  //   while keeping 100% of the top green store badge (starts at 23.5%).
  // - Height 28.4% (ends at 51.6%): Keeps 100% of the rounded cream oval and chalkboard (51.5%),
  //   while stopping safely above the "Shop Local" text (54.5%) to eliminate any stray black marks.
  const illustrationBoxHeight = fullImageHeight * 0.284;
  const illustrationTopOffset = -fullImageHeight * 0.232;

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
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentWidth + 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* Top Brand Header: Single crisp TindaMate logo */}
        <View style={styles.logoSection}>
          <TindaMateCartLogo scale={1.05} showTagline={true} />
        </View>

        {/* Central 3D Marketplace Illustration: Cleanly isolated, no stray marks or flat cut */}
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
            Discover amazing products from local vendors in your community. Fresh,
            unique, and just a tap away.
          </Text>
        </View>

        {/* Action Buttons Section */}
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
    backgroundColor: '#FAF9F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
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
    marginBottom: Spacing.three,
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
    maxWidth: 320,
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
    shadowColor: '#13654E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
