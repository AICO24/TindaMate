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

const TINDAMATE_LOGO = require('@/assets/images/tindamate-logo.png');

const BRAND_CREAM_BACKGROUND = '#FDF7EB';
const BRAND_GREEN = '#0D7A4D';
const BRAND_ORANGE = '#EA580C';
const TRACK_BACKGROUND = '#E6DEC8';
const CAPTION_COLOR = '#475569';

const ENTRANCE_DURATION_MS = 500;
const FILL_STAGE_1_MS = 420;
const FILL_STAGE_2_MS = 520;
const FILL_STAGE_3_MS = 380;
const HOLD_FULL_MS = 150;
const EXIT_DURATION_MS = 360;

const TOTAL_FILL_AND_HOLD_MS =
  120 + FILL_STAGE_1_MS + FILL_STAGE_2_MS + FILL_STAGE_3_MS + HOLD_FULL_MS;
const TOTAL_DURATION_MS = TOTAL_FILL_AND_HOLD_MS + EXIT_DURATION_MS;
const FAILSAFE_TIMEOUT_MS = 2600;

let hasShownInitialLaunchSplash = false;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(() => !hasShownInitialLaunchSplash);
  const [isExiting, setIsExiting] = useState(false);
  const hasStartedRef = useRef(false);

  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width || 360, height || 640);
  const logoSize = Math.round(Math.min(Math.max(shortestSide * 0.56, 180), 248));
  const barWidth = Math.round(Math.min(Math.max(logoSize * 0.76, 148), 192));

  const overlayOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const logoTranslateY = useSharedValue(10);
  const progressRatio = useSharedValue(0);

  const finishSplash = useCallback(() => {
    hasShownInitialLaunchSplash = true;
    setVisible(false);
  }, []);

  const startLaunchSequence = useCallback(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    SplashScreen.hideAsync().catch(() => {});

    logoOpacity.set(
      withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      })
    );

    logoTranslateY.set(
      withTiming(0, {
        duration: ENTRANCE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      })
    );

    logoScale.set(
      withSequence(
        withTiming(1, {
          duration: ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(1.012, {
          duration: TOTAL_FILL_AND_HOLD_MS - ENTRANCE_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1.03, {
          duration: EXIT_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        })
      )
    );

    progressRatio.set(
      withDelay(
        120,
        withSequence(
          withTiming(0.46, {
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
  }, [logoOpacity, logoScale, logoTranslateY, overlayOpacity, progressRatio]);

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

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.get(),
    transform: [
      { translateY: logoTranslateY.get() },
      { scale: logoScale.get() },
    ],
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
      <Animated.View style={[styles.brandCluster, logoAnimatedStyle]}>
        <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
          <Image
            source={TINDAMATE_LOGO}
            style={styles.logoImage}
            contentFit="contain"
            priority="high"
            onLoad={startLaunchSequence}
            accessibilityLabel="TindaMate official logo"
          />
        </View>

        <View style={styles.progressSection}>
          <View style={[styles.progressTrack, { width: barWidth }]}>
            <Animated.View style={[styles.progressFill, progressFillAnimatedStyle]}>
              <View style={styles.progressTipAccent} />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

interface TindaMateLoadingViewProps {
  message?: string;
}

export function TindaMateLoadingView({ message }: TindaMateLoadingViewProps) {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width || 360, height || 640);
  const logoSize = Math.round(Math.min(Math.max(shortestSide * 0.48, 156), 210));
  const barWidth = Math.round(Math.min(Math.max(logoSize * 0.78, 140), 180));

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
          withTiming(1.02, {
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
    width: Math.max(10, Math.round(fillProgress.get() * barWidth)),
  }));

  return (
    <View style={styles.inAppLoadingContainer} accessibilityRole="progressbar">
      <Animated.View style={[styles.logoContainer, { width: logoSize, height: logoSize }, logoStyle]}>
        <Image
          source={TINDAMATE_LOGO}
          style={styles.logoImage}
          contentFit="contain"
          priority="high"
          accessibilityLabel="TindaMate official logo"
        />
      </Animated.View>

      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { width: barWidth }]}>
          <Animated.View style={[styles.progressFill, barFillStyle]}>
            <View style={styles.progressTipAccent} />
          </Animated.View>
        </View>
        {message ? <Text style={styles.loadingCaption}>{message}</Text> : null}
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
          source={TINDAMATE_LOGO}
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
  brandCluster: {
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 14,
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
    backgroundColor: BRAND_ORANGE,
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
