import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { TindaMateLoadingView } from '@/components/animated-icon';
import { StorefrontLogo } from '@/components/ui/StorefrontLogo';
import { TindaMateButton } from '@/components/ui/TindaMateButton';
import {
  AuthMaxContentWidth,
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { parseAndApplyOAuthTokens } from '@/lib/oauth';
import { supabase } from '@/lib/supabase';

interface OnboardingSlide {
  id: string;
  headlineFirst: string;
  headlineHighlight: string;
  bullets: [string, string, string];
  image: any;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'storefront',
    headlineFirst: 'Your Digital',
    headlineHighlight: 'Tindahan Assistant',
    bullets: [
      'Manage your store.',
      'Track your sales.',
      'Know your business.',
    ],
    image: require('@/assets/images/sari-sari-store-art.png'),
  },
  {
    id: 'inventory',
    headlineFirst: 'Smart Inventory &',
    headlineHighlight: 'Fast Checkout',
    bullets: [
      'Organize your daily store items.',
      'Record customer sales in seconds.',
      'Never run out of bestsellers.',
    ],
    image: require('@/assets/images/onboarding-inventory.jpg'),
  },
  {
    id: 'ledger',
    headlineFirst: 'Track Customer',
    headlineHighlight: 'Credit with Ease',
    bullets: [
      'Replace messy paper notebooks.',
      'Monitor pending balances clearly.',
      'Keep every transaction transparent.',
    ],
    image: require('@/assets/images/onboarding-ledger.jpg'),
  },
  {
    id: 'growth',
    headlineFirst: 'See Your Store',
    headlineHighlight: 'Grow Every Day',
    bullets: [
      'View daily sales and profit reports.',
      'Spot your top-performing products.',
      'Make smarter business decisions.',
    ],
    image: require('@/assets/images/onboarding-growth.jpg'),
  },
];

/**
 * TindaMate Welcome Screen
 *
 * Implements an interactive 4-slide onboarding experience with smooth swipe gestures:
 * 1. Storefront Logo safely below Dynamic Island / status bar
 * 2. Dynamic Headline, Category Badge & Value Proposition transitioning per slide
 * 3. Horizontal Paging Carousel of authentic 3D Sari-Sari Store visuals
 * 4. Animated 4-dot interactive indicator with direct tap-to-slide navigation
 * 5. Primary "Get Started →" CTA & "I already have an account" secondary action
 */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const carouselScrollRef = useRef<ScrollView>(null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const frameWidth = Math.min(windowWidth, AuthMaxContentWidth);
  const contentWidth = frameWidth - Spacing.four * 2;
  const isSmallHeight = windowHeight < 710;

  // Responsive illustration card dimensions with clean horizontal breathing room
  const illustrationWidth = contentWidth;
  const rawIllustrationHeight = Math.round(illustrationWidth * (232 / 266));
  const illustrationHeight = isSmallHeight
    ? Math.min(rawIllustrationHeight, Math.round(windowHeight * 0.34))
    : Math.min(rawIllustrationHeight, 292);

  // Clearance below Dynamic Island / status bar
  const safeTopPadding = Math.max(insets.top, 44) + (isSmallHeight ? 6 : 12);

  // Entrance animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(10)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (
          initialUrl &&
          (initialUrl.includes('access_token=') || initialUrl.includes('code='))
        ) {
          await parseAndApplyOAuthTokens(initialUrl);
        }

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
          Animated.stagger(70, [
            Animated.parallel([
              Animated.timing(headerFade, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(headerSlide, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(contentFade, {
              toValue: 1,
              duration: 320,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(ctaFade, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(ctaSlide, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }
      }
    };

    checkExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && isMounted) {
        router.replace('/home');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [contentFade, ctaFade, ctaSlide, headerFade, headerSlide]);

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / frameWidth);
    if (nextIndex >= 0 && nextIndex < ONBOARDING_SLIDES.length && nextIndex !== activeSlideIndex) {
      setActiveSlideIndex(nextIndex);
    }
  };

  const scrollToSlide = (index: number) => {
    carouselScrollRef.current?.scrollTo({
      x: index * frameWidth,
      animated: true,
    });
    setActiveSlideIndex(index);
  };

  const handleGetStarted = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <TindaMateLoadingView />
      </SafeAreaView>
    );
  }

  const currentSlide = ONBOARDING_SLIDES[activeSlideIndex] || ONBOARDING_SLIDES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      {/* Subtle decorative warm mint halo on upper right matching reference */}
      <View style={styles.topRightHalo} pointerEvents="none" />

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={[
          styles.mainScrollContent,
          { paddingTop: safeTopPadding },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={[styles.innerContainer, { maxWidth: frameWidth }]}>
          {/* ========================================================
              [STEP 1] Top Brand Header (Storefront Logo & Tagline)
             ======================================================== */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                width: contentWidth,
                opacity: headerFade,
                transform: [{ translateY: headerSlide }],
              },
            ]}>
            <StorefrontLogo scale={1.06} layout="horizontal" align="left" />
          </Animated.View>

          {/* ========================================================
              [STEP 2] Slide Headline & Value Propositions
             ======================================================== */}
          <Animated.View
            style={[
              styles.heroTextSection,
              {
                width: contentWidth,
                opacity: contentFade,
              },
            ]}>
            <Text
              style={[
                styles.headline,
                isSmallHeight && styles.headlineCompact,
              ]}
              accessibilityRole="header">
              {currentSlide.headlineFirst}{'\n'}
              <Text style={styles.headlineHighlight}>{currentSlide.headlineHighlight}</Text>
            </Text>

            <View style={styles.bulletGroup}>
              {currentSlide.bullets.map((bullet, idx) => (
                <Text key={idx} style={styles.bulletText}>
                  {bullet}
                </Text>
              ))}
            </View>
          </Animated.View>

          {/* ========================================================
              [STEP 3] Interactive Swipeable Illustration Carousel
             ======================================================== */}
          <Animated.View
            style={[
              styles.carouselSection,
              { opacity: contentFade },
            ]}>
            <ScrollView
              ref={carouselScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleCarouselScroll}
              scrollEventThrottle={16}
              bounces={false}
              decelerationRate="fast"
              style={{ width: frameWidth, height: illustrationHeight }}>
              {ONBOARDING_SLIDES.map((slide) => (
                <View
                  key={slide.id}
                  style={[
                    styles.slideItem,
                    { width: frameWidth, height: illustrationHeight },
                  ]}>
                  <View
                    style={[
                      styles.illustrationCard,
                      {
                        width: illustrationWidth,
                        height: illustrationHeight,
                      },
                    ]}>
                    <Image
                      source={slide.image}
                      style={{
                        width: illustrationWidth,
                        height: illustrationHeight,
                      }}
                      resizeMode="cover"
                      accessibilityLabel={slide.headlineFirst}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Interactive Carousel Indicator Dots with tap-to-navigate */}
            <View style={styles.indicatorRow} accessibilityLabel="Carousel indicator">
              {ONBOARDING_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <Pressable
                    key={slide.id}
                    onPress={() => scrollToSlide(idx)}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to slide ${idx + 1}`}
                    style={[
                      styles.dot,
                      isActive && styles.dotActive,
                    ]}
                  />
                );
              })}
            </View>
          </Animated.View>

          {/* ========================================================
              [STEP 4] Primary CTA & Secondary Action
             ======================================================== */}
          <Animated.View
            style={[
              styles.actionsSection,
              {
                width: contentWidth,
                opacity: ctaFade,
                transform: [{ translateY: ctaSlide }],
              },
            ]}>
            <TindaMateButton
              title="Get Started"
              variant="primary"
              showArrow
              onPress={handleGetStarted}
              accessibilityLabel="Get Started with TindaMate"
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />

            <Pressable
              onPress={handleLogin}
              accessibilityRole="button"
              accessibilityLabel="I already have an account, log in"
              hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
              style={({ pressed }) => [
                styles.secondaryLink,
                pressed && styles.secondaryLinkPressed,
              ]}>
              <Text style={styles.secondaryLinkText}>
                I already have an account
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWarm,
  },
  topRightHalo: {
    position: 'absolute',
    top: 72,
    right: -52,
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: '#EAF3EC',
    opacity: 0.75,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
  innerContainer: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // 1. Brand Header
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  // 2. Hero Headline & Bullets
  heroTextSection: {
    alignItems: 'flex-start',
    marginBottom: 8,
    zIndex: 2,
  },
  headline: {
    fontSize: 33,
    lineHeight: 39,
    fontWeight: Typography.weights.extraBold,
    color: Colors.primaryDark,
    letterSpacing: -0.7,
    marginBottom: 10,
  },
  headlineCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  headlineHighlight: {
    color: Colors.accent,
  },
  bulletGroup: {
    gap: 3,
  },
  bulletText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    lineHeight: 23,
  },

  // 3. Carousel Section
  carouselSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  slideItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundWarm,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD8C7',
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },

  // 4. Primary CTA & Secondary Link
  actionsSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  primaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    ...Shadows.primaryButton,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.2,
  },
  secondaryLink: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLinkPressed: {
    opacity: 0.65,
  },
  secondaryLinkText: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryDark,
    letterSpacing: 0.1,
  },
});
