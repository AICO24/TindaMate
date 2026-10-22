import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { TindaMateButton } from '@/components/ui/TindaMateButton';
import { TindaMateCartLogo } from '@/components/ui/TindaMateCartLogo';
import {
  AuthMaxContentWidth,
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/constants/theme';
import { parseAndApplyOAuthTokens } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';

// High-resolution reference artwork
const WELCOME_REFERENCE_IMAGE = require('@/assets/images/welcome-hero.png');

/**
 * TindaMate Welcome Screen
 *
 * Establishes the core TindaMate visual identity:
 * - Official TindaMate Cart & Sprouting Leaves brand header
 * - Community market 3D hero illustration framed cleanly for all mobile widths
 * - High-contrast brand typography ("Shop Local, Support Small")
 * - Unified TindaMateButton hierarchy (Primary pill, Secondary outline pill, Ghost guest action)
 */
export default function WelcomeScreen() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Reactive layout dimensions across small, normal, and large phones
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth - Spacing.four * 2, 360);

  // Proportional scale factor matching standard mobile artwork canvas (1 : 2.16)
  const fullImageWidth = contentWidth;
  const fullImageHeight = contentWidth * 2.16;

  // Illustration Slice: Slices precisely between 19.2% and 52.8% of the reference artwork
  // - Captures the complete 3D vendor & market stall scene with zero status bar or text bleed
  const illustrationBoxHeight = fullImageHeight * 0.336;
  const illustrationTopOffset = -fullImageHeight * 0.192;

  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        // If arrived with OAuth tokens in URL, process them immediately
        const initialUrl = await Linking.getInitialURL();
        if (
          initialUrl &&
          (initialUrl.includes('access_token=') || initialUrl.includes('code='))
        ) {
          console.log('[Welcome Screen] Detected OAuth callback tokens, applying...');
          await parseAndApplyOAuthTokens(initialUrl);
        }

        const { data } = await supabase.auth.getSession();
        if (data?.session && isMounted) {
          console.log('[Welcome Screen] Active session verified, routing to /home...');
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

    // Listen for any auth session established while on welcome screen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && isMounted) {
        console.log('[Welcome Screen] Auth state changed to active, routing to /home...');
        router.replace('/home');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleGuest = () => {
    router.push({ pathname: '/home', params: { guest: '1' } });
  };

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBrand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          {/* 1. Unified TindaMate Brand Emblem & Tagline */}
          <View style={styles.logoSection}>
            <TindaMateCartLogo scale={1.08} showTagline={true} />
          </View>

          {/* 2. 3D Community Marketplace Illustration */}
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
              accessibilityLabel="Local sari-sari store vendor welcoming customers"
            />
          </View>

          {/* 3. Core Value Proposition Section */}
          <View style={styles.textSection}>
            <Text style={styles.headline} accessibilityRole="header">
              Shop Local,{'\n'}Support Small
            </Text>
            <Text style={styles.subheadline}>
              Discover amazing products from local vendors in your community.
              Fresh, unique, and just a tap away.
            </Text>
          </View>

          {/* 4. Interactive Action Buttons using TindaMate Design System */}
          <View style={styles.actionsSection}>
            {/* Primary Action: Log In Pill */}
            <TindaMateButton
              title="Log In"
              variant="primary"
              showArrow
              onPress={handleLogin}
              accessibilityLabel="Log in to your TindaMate account"
              style={styles.actionButton}
            />

            {/* Secondary Action: Create Account Outlined Pill */}
            <TindaMateButton
              title="Create Account"
              variant="secondary"
              showArrow
              onPress={handleRegister}
              accessibilityLabel="Create a new TindaMate account"
              style={styles.actionButton}
            />

            {/* Tertiary Action: Continue as Guest */}
            <TindaMateButton
              title="Continue as Guest"
              variant="ghost"
              onPress={handleGuest}
              accessibilityLabel="Continue as guest"
              style={styles.guestButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    justifyContent: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: AuthMaxContentWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.one,
  },
  illustrationSection: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: BorderRadius.xl,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  headline: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryBrand,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.display,
    letterSpacing: -0.5,
    marginBottom: Spacing.two,
  },
  subheadline: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
    maxWidth: 310,
  },
  actionsSection: {
    width: '100%',
    gap: Spacing.twoHalf,
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  actionButton: {
    maxWidth: 350,
  },
  guestButton: {
    marginTop: Spacing.xxs,
  },
});

