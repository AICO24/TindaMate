import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface IconProps {
  size?: number;
  color?: string;
}

const ICONS = {
  google: require('@/assets/images/auth/google.png'),
  facebook: require('@/assets/images/auth/facebook.png'),
};

/**
 * Back Arrow (←) Icon matching primary visual reference
 */
export function ArrowLeftIcon({ size = 22, color = '#064E3B' }: IconProps) {
  const stemWidth = size * 0.72;
  const headSize = size * 0.36;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Horizontal stem */}
      <View
        style={{
          position: 'absolute',
          width: stemWidth,
          height: 2.2,
          backgroundColor: color,
          borderRadius: 1.1,
          left: (size - stemWidth) / 2 + 1,
        }}
      />
      {/* Arrow head */}
      <View
        style={{
          position: 'absolute',
          width: headSize,
          height: headSize,
          borderLeftWidth: 2.2,
          borderTopWidth: 2.2,
          borderColor: color,
          borderRadius: 1,
          transform: [{ rotate: '-45deg' }],
          left: (size - stemWidth) / 2 + 1,
        }}
      />
    </View>
  );
}

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
 * Professional Vector Mail / Email Icon
 */
export function MailIcon({ size = 19, color = '#64748B' }: IconProps) {
  const width = size;
  const height = size * 0.76;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width,
          height,
          borderRadius: 4,
          borderWidth: 1.6,
          borderColor: color,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
        {/* Envelope flap V-line */}
        <View
          style={{
            width: width * 0.68,
            height: width * 0.68,
            borderBottomWidth: 1.5,
            borderRightWidth: 1.5,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateY: -width * 0.3 }],
          }}
        />
      </View>
    </View>
  );
}

/**
 * Professional Vector Lock / Password Icon
 */
export function LockIcon({
  size = 19,
  color = '#64748B',
  variant = 'default',
}: IconProps & { variant?: 'default' | 'green' }) {
  const lockColor = variant === 'green' ? Colors.primary : color;
  const bodyWidth = size * 0.82;
  const bodyHeight = size * 0.58;
  const shackleWidth = size * 0.52;
  const shackleHeight = size * 0.48;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Curved Shackle */}
      <View
        style={{
          width: shackleWidth,
          height: shackleHeight,
          borderTopLeftRadius: shackleWidth / 2,
          borderTopRightRadius: shackleWidth / 2,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: lockColor,
          marginBottom: -2,
        }}
      />
      {/* Solid/Outlined Lock Body */}
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderRadius: 3.5,
          borderWidth: 1.6,
          borderColor: lockColor,
          backgroundColor: variant === 'green' ? Colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Keyhole dot */}
        <View
          style={{
            width: 2.8,
            height: 4.2,
            borderRadius: 1.4,
            backgroundColor: variant === 'green' ? '#FFFFFF' : lockColor,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Professional Vector User / Full Name Icon
 */
export function UserIcon({ size = 19, color = '#64748B' }: IconProps) {
  const headSize = size * 0.4;
  const shoulderWidth = size * 0.78;
  const shoulderHeight = size * 0.36;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Head */}
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          borderWidth: 1.6,
          borderColor: color,
          marginBottom: 1.5,
        }}
      />
      {/* Shoulders */}
      <View
        style={{
          width: shoulderWidth,
          height: shoulderHeight,
          borderTopLeftRadius: shoulderWidth / 2,
          borderTopRightRadius: shoulderWidth / 2,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}

/**
 * Professional Vector Eye (Show Password) Icon
 * Apple/Feather style almond-shaped vector with centered iris
 */
export function EyeIcon({ size = 20, color = '#64748B' }: IconProps) {
  const width = size;
  const height = size * 0.65;
  const irisSize = size * 0.32;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width,
          height,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: height / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: irisSize,
            height: irisSize,
            borderRadius: irisSize / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Professional Vector EyeOff (Hide Password) Icon
 * Almond-shaped vector with centered iris and 45-degree diagonal slash
 */
export function EyeOffIcon({ size = 20, color = '#64748B' }: IconProps) {
  const width = size;
  const height = size * 0.65;
  const irisSize = size * 0.32;
  const slashLength = size * 1.15;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Almond eye contour */}
      <View
        style={{
          width,
          height,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: height / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.75,
        }}>
        <View
          style={{
            width: irisSize,
            height: irisSize,
            borderRadius: irisSize / 2,
            backgroundColor: color,
          }}
        />
      </View>
      {/* Clean diagonal slash */}
      <View
        style={{
          position: 'absolute',
          width: slashLength,
          height: 2,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

/**
 * Checkmark Icon
 */
export function CheckIcon({ size = 12, color = '#FFFFFF' }: IconProps) {
  const width = size * 0.4;
  const height = size * 0.7;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width,
          height,
          borderBottomWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateY: -1 }],
        }}
      />
    </View>
  );
}

/**
 * Alert Circle Icon
 */
export function AlertCircleIcon({ size = 14, color = Colors.error }: IconProps) {
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
          width: 1.5,
          height: size * 0.35,
          backgroundColor: color,
          marginBottom: 1.5,
          borderRadius: 0.75,
        }}
      />
      <View
        style={{
          width: 1.5,
          height: 1.5,
          backgroundColor: color,
          borderRadius: 0.75,
        }}
      />
    </View>
  );
}

/**
 * Official Google 'G' 4-color Logo
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

/**
 * Official Facebook Logo
 */
export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Image
        source={ICONS.facebook}
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
