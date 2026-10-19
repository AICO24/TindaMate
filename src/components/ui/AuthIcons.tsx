import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

const ICONS = {
  mail: require('@/assets/images/auth/mail.png'),
  lockGreen: require('@/assets/images/auth/lock-green.png'),
  lock: require('@/assets/images/auth/lock.png'),
  user: require('@/assets/images/auth/user.png'),
  eye: require('@/assets/images/auth/eye.png'),
  eyeOff: require('@/assets/images/auth/eye-off.png'),
  google: require('@/assets/images/auth/google.png'),
};

/**
 * Back Chevron (<) Icon
 */
export function ChevronLeftIcon({ size = 22, color = '#111827' }: IconProps) {
  const armSize = size * 0.44;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: armSize,
          height: armSize,
          borderLeftWidth: 2.4,
          borderBottomWidth: 2.4,
          borderColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }, { translateX: armSize * 0.12 }],
        }}
      />
    </View>
  );
}

/**
 * Mail / Email Icon matching reference mockup
 */
export function MailIcon({ size = 19 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={ICONS.mail}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * Lock / Password Icon
 * Features the solid green padlock for Login screen or outline padlock for Register screen.
 */
export function LockIcon({
  size = 19,
  variant = 'default',
}: IconProps & { variant?: 'default' | 'green' }) {
  const source = variant === 'green' ? ICONS.lockGreen : ICONS.lock;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * User / Full Name Icon matching reference mockup
 */
export function UserIcon({ size = 19 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={ICONS.user}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * Eye (Show Password) Icon matching reference mockup
 */
export function EyeIcon({ size = 20 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={ICONS.eye}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * EyeOff (Hide Password) Icon matching reference mockup
 */
export function EyeOffIcon({ size = 20 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={ICONS.eyeOff}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * Checkmark Icon for Checkbox
 */
export function CheckIcon({ size = 12, color = '#FFFFFF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.72,
          borderRightWidth: 2.2,
          borderBottomWidth: 2.2,
          borderColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }, { translateY: -1 }],
        }}
      />
    </View>
  );
}

/**
 * Alert / Exclamation Circle Icon
 */
export function AlertCircleIcon({ size = 16, color = '#DC2626' }: IconProps) {
  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
      ]}>
      <View
        style={{
          width: 1.8,
          height: size * 0.4,
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 1.5,
        }}
      />
      <View
        style={{
          width: 2,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/**
 * Authentic Official Google 'G' 4-color Logo matching reference mockup
 */
export function GoogleGIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={ICONS.google}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
