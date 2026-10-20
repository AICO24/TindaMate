import React from 'react';
import { StyleSheet, View } from 'react-native';

interface IconProps {
  color?: string;
  size?: number;
}

/**
 * Home Vector Icon
 * Exact silhouette matching the reference mockup:
 * Peaked roof + house body with rounded door cutout.
 */
export function NavHomeIcon({ color = '#064E3B' }: IconProps) {
  return (
    <View style={styles.center}>
      {/* Roof Triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      {/* House Body */}
      <View
        style={{
          width: 15,
          height: 10,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
        {/* Doorway Cutout */}
        <View
          style={{
            width: 5,
            height: 6.5,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 2.5,
            borderTopRightRadius: 2.5,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Products / Box Wireframe Vector Icon
 * Isometric cube matching the reference mockup.
 */
export function NavProductsIcon({ color = '#64748B' }: IconProps) {
  return (
    <View style={[styles.center, { width: 22, height: 22 }]}>
      {/* Box Top Flap */}
      <View
        style={{
          width: 14,
          height: 7,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 1.5,
          transform: [{ skewX: '-20deg' }],
        }}
      />
      {/* Box Lower Body with Center Fold Line */}
      <View
        style={{
          width: 16,
          height: 11,
          borderWidth: 1.8,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          marginTop: -1,
          alignItems: 'center',
        }}>
        <View style={{ width: 1.8, height: '100%', backgroundColor: color }} />
      </View>
    </View>
  );
}

/**
 * Sales / Receipt Vector Icon
 * Document sheet with content lines and folded edge matching reference.
 */
export function NavSalesIcon({ color = '#64748B' }: IconProps) {
  return (
    <View style={[styles.center, { width: 22, height: 22 }]}>
      <View
        style={{
          width: 16,
          height: 20,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 2.5,
          padding: 2.5,
          justifyContent: 'space-around',
        }}>
        <View style={{ width: '80%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: '100%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: '60%', height: 1.8, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

/**
 * Utang / Wallet Vector Icon
 * Modern slim wallet with snap closure matching reference.
 */
export function NavUtangIcon({ color = '#64748B' }: IconProps) {
  return (
    <View style={[styles.center, { width: 22, height: 22 }]}>
      <View
        style={{
          width: 20,
          height: 14,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 3.5,
          position: 'relative',
          justifyContent: 'center',
        }}>
        {/* Wallet Flap with Snap */}
        <View
          style={{
            position: 'absolute',
            right: -2,
            width: 7,
            height: 8,
            borderWidth: 1.8,
            borderColor: color,
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
        </View>
      </View>
    </View>
  );
}

/**
 * More / Hamburger Menu Vector Icon
 * Three parallel rounded bars matching reference.
 */
export function NavMoreIcon({ color = '#64748B' }: IconProps) {
  return (
    <View style={[styles.center, { width: 22, height: 22 }]}>
      <View style={{ width: 18, height: 13, justifyContent: 'space-between' }}>
        <View style={{ width: '100%', height: 2.2, backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: '100%', height: 2.2, backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: '100%', height: 2.2, backgroundColor: color, borderRadius: 1.5 }} />
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

