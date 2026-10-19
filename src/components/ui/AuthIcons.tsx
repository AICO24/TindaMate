import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Back Chevron (<) Icon
 * Pure React Native vector view - 100% visible on Android, iOS, and Web.
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
 * Mail / Email Icon matching reference image
 * Pure React Native vector view.
 */
export function MailIcon({ size = 18, color = '#6B7280' }: IconProps) {
  const w = size * 1.05;
  const h = size * 0.75;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 3.5,
          borderWidth: 1.6,
          borderColor: color,
          overflow: 'hidden',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
        }}>
        {/* Envelope Top V flap */}
        <View
          style={{
            width: w * 0.68,
            height: w * 0.68,
            borderBottomWidth: 1.6,
            borderRightWidth: 1.6,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateY: -w * 0.36 }],
            backgroundColor: 'transparent',
          }}
        />
      </View>
    </View>
  );
}

/**
 * Lock / Password Icon
 * Features the solid green padlock as seen in reference Login screen,
 * or clean outline padlock for other fields.
 */
export function LockIcon({
  size = 18,
  color = '#6B7280',
  variant = 'default',
}: IconProps & { variant?: 'default' | 'green' }) {
  const isGreen = variant === 'green';
  const lockColor = isGreen ? '#0D7A4D' : color;
  const bodyColor = isGreen ? '#0D7A4D' : '#FFFFFF';
  const keyholeColor = isGreen ? '#FFFFFF' : lockColor;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Top Shackle */}
      <View
        style={{
          width: size * 0.52,
          height: size * 0.44,
          borderTopLeftRadius: size * 0.26,
          borderTopRightRadius: size * 0.26,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: lockColor,
          marginBottom: -1,
        }}
      />
      {/* Padlock Body */}
      <View
        style={{
          width: size * 0.82,
          height: size * 0.58,
          borderRadius: 3.5,
          borderWidth: isGreen ? 0 : 1.6,
          borderColor: lockColor,
          backgroundColor: bodyColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Keyhole */}
        <View
          style={{
            width: 2.4,
            height: 2.4,
            borderRadius: 1.2,
            backgroundColor: keyholeColor,
          }}
        />
        <View
          style={{
            width: 1.5,
            height: 3,
            backgroundColor: keyholeColor,
            marginTop: 0.5,
          }}
        />
      </View>
    </View>
  );
}

/**
 * User / Full Name Icon matching reference image
 */
export function UserIcon({ size = 18, color = '#6B7280' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Head */}
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          borderWidth: 1.6,
          borderColor: color,
          marginBottom: 1.5,
        }}
      />
      {/* Shoulders */}
      <View
        style={{
          width: size * 0.8,
          height: size * 0.36,
          borderTopLeftRadius: size * 0.4,
          borderTopRightRadius: size * 0.4,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}

/**
 * Eye (Show Password) Icon
 */
export function EyeIcon({ size = 20, color = '#6B7280' }: IconProps) {
  const w = size;
  const h = size * 0.58;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          borderWidth: 1.6,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: (size * 0.28) / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/**
 * EyeOff (Hide Password) Icon
 */
export function EyeOffIcon({ size = 20, color = '#6B7280' }: IconProps) {
  const w = size;
  const h = size * 0.58;

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          borderWidth: 1.6,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: size * 0.24,
            height: size * 0.24,
            borderRadius: (size * 0.24) / 2,
            backgroundColor: color,
          }}
        />
      </View>
      {/* Slash */}
      <View
        style={{
          position: 'absolute',
          width: size * 1.05,
          height: 1.8,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
          borderRadius: 1,
        }}
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
 * Authentic Google 'G' 4-color Logo
 * Implemented using pure React Native primitives - 100% visible on Android, iOS, and Web.
 */
export function GoogleGIcon({ size = 20 }: { size?: number }) {
  const borderWidth = size * 0.17;
  const centerSize = size - borderWidth * 2;

  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        },
      ]}>
      {/* Outer Circle with 4 Google Brand Colors */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderWidth,
          borderTopColor: '#EA4335',    // Red
          borderRightColor: '#4285F4',  // Blue
          borderBottomColor: '#34A853', // Green
          borderLeftColor: '#FBBC05',   // Yellow
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* White Center Hole */}
        <View
          style={{
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            backgroundColor: '#FFFFFF',
          }}
        />
      </View>

      {/* Top-Right Opening Cutout */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: size * 0.44,
          height: size * 0.44,
          backgroundColor: '#FFFFFF',
        }}
      />

      {/* Horizontal Blue Bar of the 'G' */}
      <View
        style={{
          position: 'absolute',
          top: (size - borderWidth) / 2,
          right: 0,
          width: size * 0.52,
          height: borderWidth,
          backgroundColor: '#4285F4',
          borderRadius: 1,
        }}
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
