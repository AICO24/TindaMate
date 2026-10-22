import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import classes from './animated-icon.module.css';

const TINDAMATE_LOGO = require('@/assets/images/tindamate-logo.png');

/** Official TindaMate warm cream brand background matching the logo asset and native splash */
const BRAND_CREAM_BACKGROUND = '#FDF7EB';

/** Timing constants (ms) — 1.65s total visual launch experience */
const ENTRANCE_DURATION_MS = 650;
const HOLD_DURATION_MS = 600;
const EXIT_DURATION_MS = 400;
const TOTAL_DURATION_MS = ENTRANCE_DURATION_MS + HOLD_DURATION_MS + EXIT_DURATION_MS;
const FAILSAFE_TIMEOUT_MS = 2300;

let hasShownInitialLaunchSplash = false;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(() => !hasShownInitialLaunchSplash);
  const [isExiting, setIsExiting] = useState(false);
  const hasStartedRef = useRef(false);

  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width || 360, height || 640);
  const logoSize = Math.round(Math.min(Math.max(shortestSide * 0.58, 184), 256));

  const overlayOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.86);
  const logoTranslateY = useSharedValue(12);

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
        duration: 500,
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
        withTiming(1.015, {
          duration: HOLD_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1.035, {
          duration: EXIT_DURATION_MS,
          easing: Easing.inOut(Easing.quad),
        })
      )
    );

    overlayOpacity.set(
      withDelay(
        ENTRANCE_DURATION_MS + HOLD_DURATION_MS,
        withTiming(0, {
          duration: EXIT_DURATION_MS,
          easing: Easing.inOut(Easing.cubic),
        })
      )
    );
  }, [logoOpacity, logoScale, logoTranslateY, overlayOpacity]);

  useEffect(() => {
    if (!visible) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }

    const exitPointerTimer = setTimeout(() => {
      setIsExiting(true);
    }, ENTRANCE_DURATION_MS + HOLD_DURATION_MS);

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

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={isExiting ? 'none' : 'auto'}
      onLayout={startLaunchSequence}
      style={[styles.splashOverlay, overlayAnimatedStyle]}>
      <Animated.View
        style={[
          styles.logoContainer,
          { width: logoSize, height: logoSize },
          logoAnimatedStyle,
        ]}>
        <Image
          source={TINDAMATE_LOGO}
          style={styles.logoImage}
          contentFit="contain"
          priority="high"
          onLoad={startLaunchSequence}
          accessibilityLabel="TindaMate official logo"
        />
      </Animated.View>
    </Animated.View>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
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
