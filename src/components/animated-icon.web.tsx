import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import classes from './animated-icon.module.css';

const TINDAMATE_EMBLEM = require('@/assets/images/tindamate-emblem-clean.png');

const BRAND_CREAM_BACKGROUND = '#FDF7EB';
const BRAND_DARK_GREEN = '#064E3B';
const BRAND_GREEN = '#0D7A4D';
const BRAND_ORANGE = '#F97316';
const BRAND_ORANGE_DEEP = '#EA580C';
const TRACK_BACKGROUND = '#E6DEC8';
const CAPTION_COLOR = '#475569';

const ICON_POP_DURATION_MS = 850;
const ICON_HOLD_BEFORE_UNFOLD_MS = 500;
const UNFOLD_DELAY_MS = ICON_POP_DURATION_MS + ICON_HOLD_BEFORE_UNFOLD_MS;
const UNFOLD_DURATION_MS = 1300;
const FILL_STAGE_1_MS = 1100;
const FILL_STAGE_2_MS = 1350;
const FILL_STAGE_3_MS = 950;
const HOLD_FULL_MS = 650;
const EXIT_DURATION_MS = 600;

const TOTAL_FILL_AND_HOLD_MS =
  160 + FILL_STAGE_1_MS + FILL_STAGE_2_MS + FILL_STAGE_3_MS + HOLD_FULL_MS;
const TOTAL_DURATION_MS = TOTAL_FILL_AND_HOLD_MS + EXIT_DURATION_MS;
const FAILSAFE_TIMEOUT_MS = 5600;

/** Ensures the launch animation runs only once per cold application start */
let hasShownInitialLaunchSplash = false;
let isLaunchSplashActive = true;
const splashCompletionListeners = new Set<(active: boolean) => void>();

/** Returns whether the root cold launch animated splash overlay is currently active */
export function isAppSplashActive(): boolean {
  return isLaunchSplashActive;
}

/** Returns whether the initial launch splash has ever finished during this app session */
export function hasAppSplashCompleted(): boolean {
  return hasShownInitialLaunchSplash;
}

/** Subscribes to notification when the initial launch splash finishes fading out */
export function subscribeToSplashCompletion(listener: (active: boolean) => void): () => void {
  splashCompletionListeners.add(listener);
  return () => {
    splashCompletionListeners.delete(listener);
  };
}

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(() => !hasShownInitialLaunchSplash);
  const [isExiting, setIsExiting] = useState(false);
  const hasStartedRef = useRef(false);

  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width || 360, height || 640);
  const scaleFactor = Math.min(Math.max(shortestSide / 375, 0.88), 1.12);

  const emblemHeight = Math.round(78 * scaleFactor);
  const emblemWidth = Math.round(emblemHeight * 1.168);

  const wordmarkTargetWidth = Math.round(206 * scaleFactor);
  const wordmarkGap = Math.round(12 * scaleFactor);
  const titleFontSize = Math.round(33 * scaleFactor);
  const titleLineHeight = Math.round(37 * scaleFactor);
  const taglineFontSize = Math.max(11, Math.round(12.5 * scaleFactor));

  const barWidth = Math.round(Math.min(Math.max((emblemWidth + wordmarkTargetWidth) * 0.72, 168), 228));

  const overlayOpacity = useSharedValue(1);
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.76);
  const iconTranslateY = useSharedValue(10);

  const unfoldProgress = useSharedValue(0);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateX = useSharedValue(-20);

  const progressRatio = useSharedValue(0);

  const finishSplash = useCallback(() => {
    isLaunchSplashActive = false;
    hasShownInitialLaunchSplash = true;
    setVisible(false);
    splashCompletionListeners.forEach((listener) => {
      try {
        listener(false);
      } catch {
        // Safe guard against listener errors
      }
    });
  }, []);

  const startLaunchSequence = useCallback(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    SplashScreen.hideAsync().catch(() => {});

    iconOpacity.set(
      withTiming(1, {
        duration: 560,
        easing: Easing.out(Easing.cubic),
      })
    );

    iconTranslateY.set(
      withTiming(0, {
        duration: ICON_POP_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      })
    );

    iconScale.set(
      withSequence(
        withTiming(1.14, {
          duration: ICON_POP_DURATION_MS,
          easing: Easing.out(Easing.back(1.35)),
        }),
        withTiming(1.11, {
          duration: ICON_HOLD_BEFORE_UNFOLD_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, {
          duration: UNFOLD_DURATION_MS,
          easing: Easing.inOut(Easing.cubic),
        }),
        withDelay(
          Math.max(0, TOTAL_FILL_AND_HOLD_MS - UNFOLD_DELAY_MS - UNFOLD_DURATION_MS),
          withTiming(1.03, {
            duration: EXIT_DURATION_MS,
            easing: Easing.inOut(Easing.quad),
          })
        )
      )
    );

    unfoldProgress.set(
      withDelay(
        UNFOLD_DELAY_MS,
        withTiming(1, {
          duration: UNFOLD_DURATION_MS,
          easing: Easing.inOut(Easing.cubic),
        })
      )
    );

    wordmarkOpacity.set(
      withDelay(
        UNFOLD_DELAY_MS + 140,
        withTiming(1, {
          duration: UNFOLD_DURATION_MS - 140,
          easing: Easing.out(Easing.cubic),
        })
      )
    );

    wordmarkTranslateX.set(
      withDelay(
        UNFOLD_DELAY_MS + 80,
        withTiming(0, {
          duration: UNFOLD_DURATION_MS - 80,
          easing: Easing.out(Easing.cubic),
        })
      )
    );

    progressRatio.set(
      withDelay(
        160,
        withSequence(
          withTiming(0.38, {
            duration: FILL_STAGE_1_MS,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0.84, {
            duration: FILL_STAGE_2_MS,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(1, {
            duration: FILL_STAGE_3_MS,
            easing: Easing.out(Easing.cubic),
          })
        )
      )
    );

    overlayOpacity.set(
      withDelay(
        TOTAL_FILL_AND_HOLD_MS,
        withTiming(0, {
          duration: EXIT_DURATION_MS,
          easing: Easing.inOut(Easing.cubic),
        })
      )
    );
  }, [
    iconOpacity,
    iconScale,
    iconTranslateY,
    overlayOpacity,
    progressRatio,
    unfoldProgress,
    wordmarkOpacity,
    wordmarkTranslateX,
  ]);

  useEffect(() => {
    if (!visible) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }

    const exitPointerTimer = setTimeout(() => {
      setIsExiting(true);
    }, TOTAL_FILL_AND_HOLD_MS);

    const completionTimer = setTimeout(() => {
      finishSplash();
    }, TOTAL_DURATION_MS + 40);

    const failsafeTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      finishSplash();
    }, FAILSAFE_TIMEOUT_MS);

    return () => {
      clearTimeout(exitPointerTimer);
      clearTimeout(completionTimer);
      clearTimeout(failsafeTimer);
    };
  }, [finishSplash, visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.get(),
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.get(),
    transform: [
      { translateY: iconTranslateY.get() },
      { scale: iconScale.get() },
    ],
  }));

  const wordmarkClipAnimatedStyle = useAnimatedStyle(() => ({
    width: Math.round(unfoldProgress.get() * wordmarkTargetWidth),
    marginLeft: Math.round(unfoldProgress.get() * wordmarkGap),
    opacity: wordmarkOpacity.get(),
  }));

  const wordmarkInnerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: wordmarkTranslateX.get() }],
  }));

  const progressFillAnimatedStyle = useAnimatedStyle(() => ({
    width: Math.max(8, Math.round(progressRatio.get() * barWidth)),
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={isExiting ? 'none' : 'auto'}
      onLayout={startLaunchSequence}
      style={[styles.splashOverlay, overlayAnimatedStyle]}>
      <View style={styles.brandCluster}>
        <View style={styles.lockupRow}>
          <Animated.View
            style={[
              styles.emblemBox,
              { width: emblemWidth, height: emblemHeight },
              iconAnimatedStyle,
            ]}>
            <Image
              source={TINDAMATE_EMBLEM}
              style={styles.logoImage}
              contentFit="contain"
              priority="high"
              onLoad={startLaunchSequence}
              accessibilityLabel="TindaMate Storefront Emblem"
            />
          </Animated.View>

          <Animated.View style={[styles.wordmarkClipBox, wordmarkClipAnimatedStyle]}>
            <Animated.View
              style={[
                styles.wordmarkInnerBox,
                { width: wordmarkTargetWidth },
                wordmarkInnerAnimatedStyle,
              ]}>
              <Text
                numberOfLines={1}
                style={[
                  styles.wordmarkTitle,
                  { fontSize: titleFontSize, lineHeight: titleLineHeight },
                ]}>
                <Text style={styles.wordmarkGreen}>Tinda</Text>
                <Text style={styles.wordmarkOrange}>Mate</Text>
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.wordmarkTagline, { fontSize: taglineFontSize }]}>
                Your Digital Tindahan Assistant
              </Text>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { width: barWidth }]}>
            <Animated.View style={[styles.progressFill, progressFillAnimatedStyle]}>
              <View style={styles.progressTipAccent} />
            </Animated.View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export interface TindaMateLoadingViewProps {
  /** Optional helper message shown below the filling progress bar */
  message?: string;
  /** Compact mode for embedding inside cards or partial views without taking full screen */
  compact?: boolean;
  /** Custom background color */
  backgroundColor?: string;
}

export function TindaMateLoadingView({
  message,
  compact = false,
  backgroundColor,
}: TindaMateLoadingViewProps) {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width || 360, height || 640);

  const logoHeight = compact
    ? 64
    : Math.round(Math.min(Math.max(shortestSide * 0.28, 96), 132));
  const logoWidth = Math.round(logoHeight * 1.168);
  const barWidth = compact
    ? 104
    : Math.round(Math.min(Math.max(logoWidth * 1.15, 136), 176));

  const fillProgress = useSharedValue(0.08);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    fillProgress.set(
      withRepeat(
        withSequence(
          withTiming(0.55, {
            duration: 500,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0.92, {
            duration: 550,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(1, {
            duration: 250,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0.08, {
            duration: 0,
          })
        ),
        -1,
        false
      )
    );

    pulseScale.set(
      withRepeat(
        withSequence(
          withTiming(1.03, {
            duration: 650,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(1, {
            duration: 650,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );
  }, [fillProgress, pulseScale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.get() }],
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    width: Math.max(8, Math.round(fillProgress.get() * barWidth)),
  }));

  return (
    <View
      style={[
        compact ? styles.compactLoadingContainer : styles.inAppLoadingContainer,
        backgroundColor ? { backgroundColor } : null,
      ]}
      accessibilityRole="progressbar">
      <Animated.View
        style={[
          styles.logoContainer,
          { width: logoWidth, height: logoHeight },
          logoStyle,
        ]}>
        <Image
          source={TINDAMATE_EMBLEM}
          style={styles.logoImage}
          contentFit="contain"
          priority="high"
          accessibilityLabel="TindaMate official logo"
        />
      </Animated.View>

      <View style={[styles.progressSection, compact ? { marginTop: 8, gap: 6 } : null]}>
        <View style={[styles.progressTrack, { width: barWidth, height: compact ? 5 : 6 }]}>
          <Animated.View style={[styles.progressFill, barFillStyle]}>
            <View style={[styles.progressTipAccent, { width: compact ? 12 : 18 }]} />
          </Animated.View>
        </View>
        {message ? (
          <Text style={[styles.loadingCaption, compact ? { fontSize: 12, marginTop: 2 } : null]}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.background}>
        <div className={classes.expoLogoBackground} />
      </View>

      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={TINDAMATE_EMBLEM}
          contentFit="contain"
          accessibilityLabel="TindaMate logo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BRAND_CREAM_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  inAppLoadingContainer: {
    flex: 1,
    backgroundColor: BRAND_CREAM_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  compactLoadingContainer: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  lockupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkClipBox: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  wordmarkInnerBox: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  wordmarkTitle: {
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  wordmarkGreen: {
    color: BRAND_DARK_GREEN,
  },
  wordmarkOrange: {
    color: BRAND_ORANGE,
  },
  wordmarkTagline: {
    fontWeight: '600',
    color: CAPTION_COLOR,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  progressSection: {
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: TRACK_BACKGROUND,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BRAND_GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  progressTipAccent: {
    width: 18,
    height: '100%',
    borderRadius: 999,
    backgroundColor: BRAND_ORANGE_DEEP,
  },
  loadingCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: CAPTION_COLOR,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 104,
    height: 104,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
