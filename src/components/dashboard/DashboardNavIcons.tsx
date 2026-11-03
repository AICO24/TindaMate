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
/**
 * Customers / People Silhouette Vector Icon (Design 2.0)
 */
export function NavCustomersIcon({ color = Colors.textMuted, size = IconSizes.nav }: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Secondary Person (Behind on Left) */}
      <View style={{ position: 'absolute', left: 1, top: 2, alignItems: 'center', opacity: 0.75 }}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            borderWidth: 1.5,
            borderColor: color,
            marginBottom: 1,
          }}
        />
        <View
          style={{
            width: 11,
            height: 6,
            borderTopLeftRadius: 5.5,
            borderTopRightRadius: 5.5,
            borderWidth: 1.5,
            borderBottomWidth: 0,
            borderColor: color,
          }}
        />
      </View>
      {/* Primary Person (Foreground on Right) */}
      <View style={{ position: 'absolute', right: 1, top: 4, alignItems: 'center' }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            borderWidth: 1.8,
            borderColor: color,
            backgroundColor: Colors.surface,
            marginBottom: 1,
          }}
        />
        <View
          style={{
            width: 14,
            height: 7,
            borderTopLeftRadius: 7,
            borderTopRightRadius: 7,
            borderWidth: 1.8,
            borderBottomWidth: 0,
            borderColor: color,
            backgroundColor: Colors.surface,
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
  size = 26,
}: IconProps) {
  const cornerSize = Math.round(size * 0.28);
  const stroke = 2.4;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={{ width: size * 0.82, height: size * 0.78, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* Top-Left Bracket */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: cornerSize,
            height: cornerSize,
            borderTopWidth: stroke,
            borderLeftWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: 3.5,
          }}
        />
        {/* Top-Right Bracket */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: cornerSize,
            height: cornerSize,
            borderTopWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            borderTopRightRadius: 3.5,
          }}
        />
        {/* Bottom-Left Bracket */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: cornerSize,
            height: cornerSize,
            borderBottomWidth: stroke,
            borderLeftWidth: stroke,
            borderColor: color,
            borderBottomLeftRadius: 3.5,
          }}
        />
        {/* Bottom-Right Bracket */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: cornerSize,
            height: cornerSize,
            borderBottomWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            borderBottomRightRadius: 3.5,
          }}
        />
        {/* Center Horizontal Scan Line + Barcode Ticks */}
        <View style={{ width: '74%', height: 2.2, backgroundColor: color, borderRadius: 1.1 }} />
        <View style={{ flexDirection: 'row', gap: 2.5, marginTop: 2.5 }}>
          <View style={{ width: 2, height: 3.5, backgroundColor: color, borderRadius: 1, opacity: 0.85 }} />
          <View style={{ width: 3, height: 3.5, backgroundColor: color, borderRadius: 1, opacity: 0.85 }} />
          <View style={{ width: 2, height: 3.5, backgroundColor: color, borderRadius: 1, opacity: 0.85 }} />
        </View>
      </View>
    </View>
  );
}

/**
 * Rounded Warning Triangle Icon for Operational Low-Stock Banner
 */
export function WarningTriangleIcon({
  bgColor = '#EA580C',
  fgColor = '#FFFFFF',
  size = 30,
}: {
  bgColor?: string;
  fgColor?: string;
  size?: number;
}) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Triangle Body */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.48,
          borderRightWidth: size * 0.48,
          borderBottomWidth: size * 0.84,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: bgColor,
          borderRadius: 3,
        }}
      />
      {/* Rounded Base Cap for smooth triangle corners */}
      <View
        style={{
          position: 'absolute',
          bottom: 2,
          width: size * 0.86,
          height: 5,
          borderRadius: 3,
          backgroundColor: bgColor,
        }}
      />
      {/* Exclamation Mark inside Triangle */}
      <View
        style={{
          position: 'absolute',
          bottom: 5,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
        <View
          style={{
            width: 2.6,
            height: size * 0.28,
            borderRadius: 1.3,
            backgroundColor: fgColor,
          }}
        />
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: fgColor,
          }}
        />
      </View>
    </View>
  );
}

/**
 * KPI Solid Emerald Shopping Cart Icon (Matches Target Reference "Total Sales" KPI Icon)
 */
export function KpiCartCheckIcon({ size = 26 }: { size?: number }) {
  return (
    <View style={[styles.center, { width: size + 2, height: size }]}>
      <CartVectorIcon size={size} color="#15803D" />
    </View>
  );
}

/**
 * KPI Stacked Golden Coins Icon (Matches Target Reference "Profit" KPI Icon)
 */
export function KpiProfitCoinIcon({ size = 26 }: { size?: number }) {
  return (
    <View style={[styles.center, { width: size + 6, height: size }]}>
      {/* Main Stack of 3 Golden Coins on Left */}
      <View style={{ position: 'absolute', left: 2, bottom: 2, alignItems: 'center' }}>
        {/* Bottom Coin */}
        <View
          style={{
            width: 17,
            height: 6.5,
            borderRadius: 4,
            backgroundColor: '#D97706',
            borderWidth: 1,
            borderColor: '#B45309',
            marginTop: -2,
          }}
        />
        {/* Middle Coin */}
        <View
          style={{
            position: 'absolute',
            bottom: 4.5,
            width: 17,
            height: 6.5,
            borderRadius: 4,
            backgroundColor: '#F59E0B',
            borderWidth: 1,
            borderColor: '#D97706',
          }}
        />
        {/* Top Coin with Golden Face */}
        <View
          style={{
            position: 'absolute',
            bottom: 9,
            width: 17,
            height: 8.5,
            borderRadius: 5,
            backgroundColor: '#FBBF24',
            borderWidth: 1.2,
            borderColor: '#D97706',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: 9,
              height: 3.5,
              borderRadius: 2,
              backgroundColor: '#FDE68A',
            }}
          />
        </View>
      </View>

      {/* Secondary Smaller Coin on Right */}
      <View
        style={{
          position: 'absolute',
          right: 1,
          bottom: 1.5,
          width: 12,
          height: 8,
          borderRadius: 4.5,
          backgroundColor: '#F59E0B',
          borderWidth: 1.2,
          borderColor: '#B45309',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <View
          style={{
            width: 6,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#FDE68A',
          }}
        />
      </View>
    </View>
  );
}

/**
 * KPI 3D Isometric Orange Box Icon (Matches Target Reference "Low Stock" KPI Icon & Banner Box)
 */
export function KpiLowStockBoxIcon({ size = 26 }: { size?: number }) {
  const s = size / 26;
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Top Isometric Diamond Face */}
      <View
        style={{
          position: 'absolute',
          top: 2 * s,
          width: 15 * s,
          height: 15 * s,
          backgroundColor: '#FB923C',
          borderRadius: 2 * s,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scaleY: 0.52 }, { rotate: '45deg' }],
          zIndex: 3,
        }}>
        {/* Center White Tape Line across Top Flap */}
        <View
          style={{
            width: '100%',
            height: 2 * s,
            backgroundColor: '#FFF7ED',
            opacity: 0.9,
          }}
        />
      </View>

      {/* Bottom Left & Right Isometric Cube Faces */}
      <View
        style={{
          flexDirection: 'row',
          marginTop: 7 * s,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Left Cube Face */}
        <View
          style={{
            width: 10.5 * s,
            height: 12 * s,
            backgroundColor: '#F97316',
            borderBottomLeftRadius: 2.5 * s,
            borderTopWidth: 1.4 * s,
            borderRightWidth: 0.8 * s,
            borderColor: '#FFFFFF',
            transform: [{ skewY: '25deg' }],
          }}
        />
        {/* Right Shaded Cube Face */}
        <View
          style={{
            width: 10.5 * s,
            height: 12 * s,
            backgroundColor: '#EA580C',
            borderBottomRightRadius: 2.5 * s,
            borderTopWidth: 1.4 * s,
            borderLeftWidth: 0.8 * s,
            borderColor: '#FFFFFF',
            transform: [{ skewY: '-25deg' }],
          }}
        />
      </View>
    </View>
  );
}

/**
 * Sales Overview 3-Bar Chart Header Icon (Matches Target Reference "Sales Overview" Title Icon)
 */
export function SalesOverviewChartHeaderIcon({
  color = '#0D7A4D',
  size = 18,
}: IconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 1,
        paddingBottom: 1,
      }}>
      <View
        style={{
          width: 4,
          height: size * 0.46,
          borderRadius: 1.5,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 4,
          height: size * 0.72,
          borderRadius: 1.5,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: 4,
          height: size * 0.96,
          borderRadius: 1.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/**
 * Recent Activity Circular Clock-Arrow History Icon (Matches Target Reference "Recent Activity" Title Icon)
 */
export function RecentActivityClockIcon({
  color = '#0A5234',
  size = 20,
}: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Circular Clock Rim */}
      <View
        style={{
          width: size - 2,
          height: size - 2,
          borderRadius: (size - 2) / 2,
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Clock Hands (Vertical + Angled) */}
        <View
          style={{
            width: 2,
            height: 5,
            backgroundColor: color,
            borderRadius: 1,
            marginTop: -2,
          }}
        />
        <View
          style={{
            width: 4.5,
            height: 2,
            backgroundColor: color,
            borderRadius: 1,
            marginLeft: 2.5,
            marginTop: -1,
          }}
        />
      </View>
      {/* Counter-Clockwise Arrow Tick on Left */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 3,
          width: 5,
          height: 5,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: '15deg' }],
        }}
      />
    </View>
  );
}

/**
 * User / Customer Payment Silhouette Vector Icon (Matches Target Reference Orange User Circle)
 */
export function UserPaymentVectorIcon({
  color = '#D97706',
  size = 16,
}: IconProps) {
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Head Circle */}
      <View
        style={{
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: size * 0.22,
          borderWidth: 1.8,
          borderColor: color,
          marginBottom: 1.5,
        }}
      />
      {/* Shoulders Arch */}
      <View
        style={{
          width: size * 0.78,
          height: size * 0.36,
          borderTopLeftRadius: size * 0.39,
          borderTopRightRadius: size * 0.39,
          borderWidth: 1.8,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
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
 * Trend / Analytics Bar Chart Vector Icon with Upward Growth Arrow (Matches Reference Today's Sales Icon)
 */
export function TrendChartVectorIcon({ color = Colors.textInverse, size = 28 }: IconProps) {
  const barWidth = Math.max(4.5, Math.round(size * 0.17));
  return (
    <View style={[styles.center, { width: size, height: size }]}>
      {/* Diagonal Upward Trend Line + Arrowhead above bars */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.14,
          left: size * 0.08,
          width: size * 0.76,
          height: 3,
          backgroundColor: color,
          borderRadius: 1.5,
          transform: [{ rotate: '-28deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.03,
          right: size * 0.08,
          width: size * 0.26,
          height: size * 0.26,
          borderTopWidth: 3,
          borderRightWidth: 3,
          borderColor: color,
          borderTopRightRadius: 1.5,
        }}
      />
      {/* 3 Bold Rising Vertical Bars */}
      <View
        style={{
          width: size * 0.84,
          height: size * 0.62,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: size * 0.28,
          paddingHorizontal: 2,
        }}>
        <View style={{ width: barWidth, height: '42%', backgroundColor: color, borderRadius: 2 }} />
        <View style={{ width: barWidth, height: '70%', backgroundColor: color, borderRadius: 2 }} />
        <View style={{ width: barWidth, height: '100%', backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

/**
 * Solid Filled Shopping Cart Vector Icon (Matches Target Reference Cart Icon)
 */
export function CartVectorIcon({ color = Colors.textInverse, size = 20 }: IconProps) {
  const s = size / 22;
  return (
    <View style={[styles.center, { width: size + 2, height: size }]}>
      {/* Top-Left Push Handle */}
      <View
        style={{
          position: 'absolute',
          top: 1.5 * s,
          left: 0.5 * s,
          width: 5.5 * s,
          height: 2.4 * s,
          borderRadius: 1.2 * s,
          backgroundColor: color,
        }}
      />
      {/* Angled Neck Stem */}
      <View
        style={{
          position: 'absolute',
          top: 2.5 * s,
          left: 4.2 * s,
          width: 2.4 * s,
          height: 9 * s,
          borderRadius: 1.2 * s,
          backgroundColor: color,
          transform: [{ rotate: '-14deg' }],
        }}
      />
      {/* Solid Filled Tapered Basket Body */}
      <View
        style={{
          width: 14.5 * s,
          height: 8.5 * s,
          backgroundColor: color,
          borderTopLeftRadius: 1.5 * s,
          borderTopRightRadius: 2.5 * s,
          borderBottomLeftRadius: 3 * s,
          borderBottomRightRadius: 3.5 * s,
          marginLeft: 3.5 * s,
          marginTop: 2.5 * s,
          transform: [{ skewX: '-10deg' }],
        }}
      />
      {/* Bottom Undercarriage Rail */}
      <View
        style={{
          width: 12.5 * s,
          height: 2 * s,
          backgroundColor: color,
          borderRadius: 1 * s,
          marginLeft: 3 * s,
          marginTop: 1.2 * s,
        }}
      />
      {/* Two Cart Wheels */}
      <View
        style={{
          flexDirection: 'row',
          width: 12 * s,
          justifyContent: 'space-between',
          marginLeft: 3 * s,
          marginTop: 1 * s,
        }}>
        <View
          style={{
            width: 3.8 * s,
            height: 3.8 * s,
            borderRadius: 2 * s,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            width: 3.8 * s,
            height: 3.8 * s,
            borderRadius: 2 * s,
            backgroundColor: color,
          }}
        />
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


