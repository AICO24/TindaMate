import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { TindaMateCartLogo } from '@/components/ui/TindaMateCartLogo';
import { WelcomeHeroIllustration } from '@/components/ui/WelcomeHeroIllustration';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

/**
 * TindaMate Welcome Screen
 *
 * Restores the authentic TindaMate Welcome & Onboarding experience:
 * - Official brand header (Cart with leaf + TindaMate wordmark + tagline)
 * - Community marketplace hero illustration with local vendor and produce stall
 * - Clear value proposition: "Shop Local, Support Small"
 * - Primary "Log In →" pill button
 * - Secondary "Create Account →" outlined pill button
 * - Tertiary "Continue as Guest" link
 * - Automatic session redirection to authenticated app shell (/home) if already logged in
 */
export default function WelcomeScreen() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Check if an authenticated user session already exists
    const checkExistingSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session && isMounted) {
          // If already authenticated, redirect straight to the authenticated shell
          router.replace('/home');
          return;
        }
      } catch (err) {
        // If error checking session, fallback to welcome screen
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
    // Navigate to authenticated shell in preview/guest mode
    router.push('/home');
  };

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D7A4D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Branding Section */}
        <View style={styles.topBrandSection}>
          <TindaMateCartLogo scale={1.05} showTagline={true} />
        </View>

        {/* Hero Illustration Graphic */}
        <View style={styles.heroSection}>
          <WelcomeHeroIllustration />
        </View>

        {/* Value Proposition Typography */}
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  topBrandSection: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D7A4D',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: Spacing.two,
  },
  subheadline: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
  },
  actionsSection: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0D7A4D',
    paddingVertical: 15,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7A4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    backgroundColor: '#0A5C3A',
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
    maxWidth: 360,
    backgroundColor: 'transparent',
    borderWidth: 1.8,
    borderColor: '#0D7A4D',
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
    color: '#0D7A4D',
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

