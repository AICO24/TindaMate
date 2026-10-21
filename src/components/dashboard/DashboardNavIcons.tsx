import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, IconSizes, Typography } from '@/constants/theme';

interface IconProps {
  color?: string;
  size?: number;
}

/**
 * Home Vector Icon
 * Peaked roof + house body with rounded door cutout.
 */
export function NavHomeIcon({ color = Colors.primaryDark, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
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
            backgroundColor: Colors.surface,
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
 */
export function NavProductsIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
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
 */
export function NavSalesIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
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
 */
export function NavUtangIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
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
            backgroundColor: Colors.surface,
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
 */
export function NavMoreIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={{ width: 18, height: 13, justifyContent: 'space-between' }}>
        <View style={{ width: '100%', height: 2.2, backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: '100%', height: 2.2, backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: '100%', height: 2.2, backgroundColor: color, borderRadius: 1.5 }} />
      </View>
    </View>
  );
}

/**
 * Profile Person Silhouette Vector Icon (Dashboard Header Avatar)
 */
export function ProfileAvatarIcon({ color = Colors.primaryDark, size = IconSizes.md }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Head Circle */}
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          backgroundColor: color,
          marginBottom: 2,
        }}
      />
      {/* Shoulders Dome */}
      <View
        style={{
          width: size * 0.78,
          height: size * 0.36,
          backgroundColor: color,
          borderTopLeftRadius: size * 0.38,
          borderTopRightRadius: size * 0.38,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
    </View>
  );
}

/**
 * Mini Storefront Vector Icon (Store Context Pill)
 */
export function StorePillIcon({ color = Colors.textInverse, size = IconSizes.xs }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Awning Roof */}
      <View
        style={{
          width: size * 0.9,
          height: size * 0.34,
          borderWidth: 1.4,
          borderColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />
      {/* Shop Base */}
      <View
        style={{
          width: size * 0.76,
          height: size * 0.48,
          borderWidth: 1.4,
          borderTopWidth: 0,
          borderColor: color,
          borderBottomLeftRadius: 1.5,
          borderBottomRightRadius: 1.5,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderWidth: 1.1,
            borderBottomWidth: 0,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Calendar Filter Vector Icon ("Today" pill)
 */
export function CalendarFilterIcon({ color = Colors.primaryDark, size = IconSizes.xs }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.88,
          height: size * 0.82,
          borderWidth: 1.4,
          borderColor: color,
          borderRadius: 2.5,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: '100%',
            height: 3,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Overview / Action Vector Icon Renderer
 * Renders crisp white vector icons inside circular badges matching dashboard-reference.png
 */
export function DashboardBadgeVectorIcon({
  type,
  color = Colors.textInverse,
}: {
  type:
    | 'sales'
    | 'products'
    | 'low_stock'
    | 'utang'
    | 'add_product'
    | 'record_sale'
    | 'add_expense'
    | 'record_utang';
  color?: string;
}) {
  switch (type) {
    case 'sales':
      return (
        <Text
          style={{
            color,
            fontSize: 20,
            fontWeight: Typography.weights.extraBold,
            lineHeight: 23,
          }}>
          ₱
        </Text>
      );

    case 'products':
    case 'add_product':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* 3D Isometric Cube */}
          <View
            style={{
              width: 15,
              height: 7,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 1.5,
              transform: [{ skewX: '-20deg' }],
            }}
          />
          <View
            style={{
              width: 17,
              height: 11,
              borderWidth: 1.8,
              borderColor: color,
              borderTopWidth: 0,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              marginTop: -1,
              alignItems: 'center',
            }}>
            <View style={{ width: 1.6, height: '100%', backgroundColor: color }} />
          </View>
          {type === 'add_product' && (
            <View style={[styles.plusBadge, { backgroundColor: Colors.pastel.green.iconBg }]}>
              <Text style={styles.plusBadgeText}>+</Text>
            </View>
          )}
        </View>
      );

    case 'low_stock':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* Warning Triangle Outline */}
          <View
            style={{
              width: 20,
              height: 18,
              borderWidth: 2,
              borderColor: color,
              borderRadius: 3,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: 2.2,
                height: 7,
                backgroundColor: color,
                borderRadius: 1,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: 2.4,
                height: 2.4,
                borderRadius: 1.2,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'utang':
    case 'record_sale':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
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
          {type === 'record_sale' && (
            <View style={[styles.plusBadge, { backgroundColor: Colors.pastel.orange.iconBg }]}>
              <Text style={styles.plusBadgeText}>+</Text>
            </View>
          )}
        </View>
      );

    case 'add_expense':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          <View
            style={{
              width: 19,
              height: 14,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3,
              position: 'relative',
              justifyContent: 'center',
            }}>
            <View
              style={{
                position: 'absolute',
                right: -1,
                width: 6,
                height: 6,
                borderWidth: 1.5,
                borderColor: color,
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      );

    case 'record_utang':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* Dual Customer Silhouette */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  borderWidth: 1.6,
                  borderColor: color,
                  marginBottom: 1,
                }}
              />
              <View
                style={{
                  width: 13,
                  height: 7,
                  borderWidth: 1.6,
                  borderColor: color,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                }}
              />
            </View>
            <View style={{ alignItems: 'center', marginLeft: -3 }}>
              <View
                style={{
                  width: 5.5,
                  height: 5.5,
                  borderRadius: 3,
                  borderWidth: 1.4,
                  borderColor: color,
                  marginBottom: 1,
                }}
              />
              <View
                style={{
                  width: 9,
                  height: 5.5,
                  borderWidth: 1.4,
                  borderColor: color,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
            </View>
          </View>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: Typography.weights.extraBold,
    lineHeight: 10,
  },
});


