import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Back Chevron (<) Icon
 */
export function ChevronLeftIcon({ size = 20, color = '#111827', strokeWidth = 2.5 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.45,
          height: size * 0.45,
          borderLeftWidth: strokeWidth,
          borderBottomWidth: strokeWidth,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateX: size * 0.08 }],
        }}
      />
    </View>
  );
}

/**
 * Mail / Email Icon
 */
export function MailIcon({ size = 18, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.9,
          height: size * 0.65,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 3,
          overflow: 'hidden',
          alignItems: 'center',
        }}>
        {/* Envelope Top V Flap */}
        <View
          style={{
            width: size * 0.62,
            height: size * 0.62,
            borderBottomWidth: 1.5,
            borderRightWidth: 1.5,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateY: -size * 0.32 }],
          }}
        />
      </View>
    </View>
  );
}

/**
 * Lock / Password Icon
 */
export function LockIcon({ size = 18, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Top Shackle */}
      <View
        style={{
          width: size * 0.5,
          height: size * 0.42,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: size * 0.25,
          borderTopRightRadius: size * 0.25,
          marginBottom: -1,
        }}
      />
      {/* Lock Body */}
      <View
        style={{
          width: size * 0.75,
          height: size * 0.52,
          borderWidth: 1.5,
          borderColor: color,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Keyhole */}
        <View
          style={{
            width: 2.5,
            height: 4,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
}

/**
 * User / Profile Icon
 */
export function UserIcon({ size = 18, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Head */}
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          borderWidth: 1.5,
          borderColor: color,
          marginBottom: 1,
        }}
      />
      {/* Shoulders */}
      <View
        style={{
          width: size * 0.75,
          height: size * 0.35,
          borderTopLeftRadius: size * 0.35,
          borderTopRightRadius: size * 0.35,
          borderWidth: 1.5,
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
export function EyeIcon({ size = 20, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.85,
          height: size * 0.52,
          borderRadius: size * 0.42,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
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
export function EyeOffIcon({ size = 20, color = '#9CA3AF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.85,
          height: size * 0.52,
          borderRadius: size * 0.42,
          borderWidth: 1.5,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: size * 0.13,
            backgroundColor: color,
          }}
        />
      </View>
      {/* Slash */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.9,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/**
 * Checkmark Icon
 */
export function CheckIcon({ size = 12, color = '#FFFFFF' }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.4,
          height: size * 0.7,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
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
      {/* Exclamation Bar */}
      <View
        style={{
          width: 1.8,
          height: size * 0.38,
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 1.5,
        }}
      />
      {/* Exclamation Dot */}
      <View
        style={{
          width: 2,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

/**
 * Google 'G' Multi-colored Icon
 */
export function GoogleGIcon({ size = 20 }: { size?: number }) {
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
      {/* Circular segments mimicking Google's 4 brand colors */}
      <View
        style={{
          width: size * 0.9,
          height: size * 0.9,
          borderRadius: (size * 0.9) / 2,
          borderWidth: 2.5,
          borderColor: '#4285F4', // Blue
          borderTopColor: '#EA4335', // Red
          borderRightColor: '#4285F4',
          borderBottomColor: '#34A853', // Green
          borderLeftColor: '#FBBC05', // Yellow
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Horizontal bar of the G */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            width: size * 0.4,
            height: 2.5,
            backgroundColor: '#4285F4',
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

