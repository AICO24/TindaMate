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
 * More / Bento 2x2 Grid Vector Icon (Design 2.0)
 */
export function NavMoreIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={{ width: 17, height: 17, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 2.2,
              borderWidth: 1.8,
              borderColor: color,
            }}
          />
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 2.2,
              borderWidth: 1.8,
              borderColor: color,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 2.2,
              borderWidth: 1.8,
              borderColor: color,
            }}
          />
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 2.2,
              borderWidth: 1.8,
              borderColor: color,
            }}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * POS Register / Cashier Terminal Vector Icon
 */
export function NavPosIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Cashier Bag / POS Terminal Frame */}
      <View
        style={{
          width: 17,
          height: 15,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 3.5,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 3,
        }}>
        {/* Handle Arch */}
        <View
          style={{
            position: 'absolute',
            top: -5.5,
            width: 8,
            height: 5.5,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderWidth: 1.8,
            borderBottomWidth: 0,
            borderColor: color,
          }}
        />
        {/* Plus / Scan Cross inside POS icon */}
        <View style={{ width: 7, height: 1.8, backgroundColor: color, borderRadius: 1 }} />
        <View
          style={{
            position: 'absolute',
            width: 1.8,
            height: 7,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Floating Center POS / Scan Action Vector Icon (Viewfinder brackets + center scan line)
 */
export function NavFloatingCenterIcon({
  color = Colors.textInverse,
  size = 28,
}: IconProps) {
  const corner = 7.5;
  const stroke = 2.2;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={{ width: 26, height: 26, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* Top-Left Corner */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: corner,
            height: corner,
            borderTopWidth: stroke,
            borderLeftWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: 3,
          }}
        />
        {/* Top-Right Corner */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: corner,
            height: corner,
            borderTopWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            borderTopRightRadius: 3,
          }}
        />
        {/* Bottom-Left Corner */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: corner,
            height: corner,
            borderBottomWidth: stroke,
            borderLeftWidth: stroke,
            borderColor: color,
            borderBottomLeftRadius: 3,
          }}
        />
        {/* Bottom-Right Corner */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: corner,
            height: corner,
            borderBottomWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            borderBottomRightRadius: 3,
          }}
        />
        {/* Center Dotted Pattern matching reference floating button */}
        <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.8, height: 2.8, borderRadius: 1.4, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
            <View style={{ width: 2.2, height: 2.2, borderRadius: 1.1, backgroundColor: color }} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Search Magnifying Glass Vector Icon
 */
export function SearchVectorIcon({ color = Colors.textMuted, size = 18 }: IconProps) {
  const circleSize = size * 0.72;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          borderWidth: 1.8,
          borderColor: color,
          marginTop: -2,
          marginLeft: -2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: size * 0.34,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/**
 * Notification Bell Vector Icon
 */
export function BellNotificationIcon({ color = Colors.textInverse, size = 20 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Bell Dome */}
      <View
        style={{
          width: size * 0.68,
          height: size * 0.62,
          borderTopLeftRadius: size * 0.34,
          borderTopRightRadius: size * 0.34,
          backgroundColor: color,
        }}
      />
      {/* Bell Rim */}
      <View
        style={{
          width: size * 0.84,
          height: 2.5,
          borderRadius: 1.5,
          backgroundColor: color,
          marginTop: -1,
        }}
      />
      {/* Bell Clapper */}
      <View
        style={{
          width: 4.5,
          height: 3,
          borderBottomLeftRadius: 2.5,
          borderBottomRightRadius: 2.5,
          backgroundColor: color,
          marginTop: 1.5,
        }}
      />
    </View>
  );
}

/**
 * Trend / Analytics Bar Chart Vector Icon
 */
export function TrendChartVectorIcon({ color = Colors.textInverse, size = 22 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.85,
          height: size * 0.78,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderBottomWidth: 1.8,
          borderBottomColor: color,
          paddingBottom: 2,
          paddingHorizontal: 1,
        }}>
        <View style={{ width: 3.5, height: '42%', backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: 3.5, height: '68%', backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: 3.5, height: '55%', backgroundColor: color, borderRadius: 1.5 }} />
        <View style={{ width: 3.5, height: '95%', backgroundColor: color, borderRadius: 1.5 }} />
      </View>
    </View>
  );
}

/**
 * Simple Shopping Cart Vector Icon
 */
export function CartVectorIcon({ color = Colors.textInverse, size = 20 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.72,
          height: size * 0.48,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 2.5,
          marginTop: 1,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          width: size * 0.56,
          justifyContent: 'space-between',
          marginTop: 2,
        }}>
        <View style={{ width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: color }} />
        <View style={{ width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: color }} />
      </View>
    </View>
  );
}

/**
 * Trash / Clear Vector Icon
 */
export function TrashVectorIcon({ color = Colors.textInverse, size = 18 }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Lid */}
      <View
        style={{
          width: size * 0.74,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          marginBottom: 1.5,
        }}
      />
      {/* Bin Body */}
      <View
        style={{
          width: size * 0.6,
          height: size * 0.64,
          borderWidth: 1.6,
          borderColor: color,
          borderBottomLeftRadius: 2.5,
          borderBottomRightRadius: 2.5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}>
        <View style={{ width: 1.2, height: '58%', backgroundColor: color }} />
        <View style={{ width: 1.2, height: '58%', backgroundColor: color }} />
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
    | 'utang_summary'
    | 'sales_history'
    | 'expenses'
    | 'add_product'
    | 'record_sale'
    | 'add_expense'
    | 'record_utang';
  color?: string;
}) {
  switch (type) {
    case 'sales':
    case 'sales_history':
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
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* Customer Credit Ledger / Notebook with Person Badge */}
          <View
            style={{
              width: 17,
              height: 20,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
            {/* Ledger Binding Ticks on Left */}
            <View
              style={{
                position: 'absolute',
                left: -3,
                top: 4,
                width: 4,
                height: 1.8,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: -3,
                bottom: 4,
                width: 4,
                height: 1.8,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            {/* Mini Person Silhouette Inside Ledger */}
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: color,
                marginBottom: 1.5,
              }}
            />
            <View
              style={{
                width: 9,
                height: 4.5,
                backgroundColor: color,
                borderTopLeftRadius: 4.5,
                borderTopRightRadius: 4.5,
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
              }}
            />
          </View>
        </View>
      );

    case 'record_sale':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* Transaction Receipt Slip + Plus Badge */}
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
          <View style={[styles.plusBadge, { backgroundColor: Colors.pastel.orange.iconBg }]}>
            <Text style={styles.plusBadgeText}>+</Text>
          </View>
        </View>
      );

    case 'expenses':
    case 'add_expense':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* Expense Payment-Out Card with Outflow Badge */}
          <View
            style={{
              width: 19,
              height: 14,
              borderWidth: 1.8,
              borderColor: color,
              borderRadius: 3,
              overflow: 'hidden',
              justifyContent: 'flex-start',
            }}>
            {/* Top Card Stripe */}
            <View
              style={{
                width: '100%',
                height: 3.5,
                backgroundColor: color,
                marginTop: 2,
              }}
            />
          </View>
          <View style={[styles.plusBadge, { backgroundColor: Colors.pastel.blue.iconBg }]}>
            <Text style={styles.plusBadgeText}>↑</Text>
          </View>
        </View>
      );

    case 'record_utang':
      return (
        <View style={[styles.center, { width: IconSizes.lg, height: IconSizes.lg }]}>
          {/* Dual Customer Silhouette + Plus Badge */}
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
          <View style={[styles.plusBadge, { backgroundColor: Colors.pastel.purple.iconBg }]}>
            <Text style={styles.plusBadgeText}>+</Text>
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


