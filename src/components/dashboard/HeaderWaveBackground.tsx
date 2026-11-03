import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

interface HeaderWaveBackgroundProps {
  height?: number;
}

/**
 * HeaderWaveBackground (Target Reference 1:1 Tangent Biarc S-Wave Canopy)
 *
 * Uses exact C1 tangent biarc circle geometry where:
 * - `leftForestCanopyFill` spans from `x = 0` to the exact inflection point
 *   `xInf = (x1 + x2) / 2` with `top: 0, bottom: 0`.
 * - At `x = xInf`, Circle 1 (#E4F2EA) covers `(-∞, yInf]` and Circle 2 (#084B30)
 *   covers `[yInf, +∞)`, completely hiding the vertical edge of `leftForestCanopyFill`
 *   so zero horizontal or vertical rectangle edges can ever be seen!
 */
export function HeaderWaveBackground(_props: HeaderWaveBackgroundProps) {
  const { width: screenWidth } = useWindowDimensions();
  const W = Math.max(screenWidth || 390, 320);

  // Exact C1 Tangent Biarc Parameters scaled to screen width:
  // Peak of Left #E4F2EA Crest at x1 = 18.5% of W, bottomPeak = 48px
  // Trough of Right Green Valley at x2 = 68% of W, bottomTrough = 2px
  const x1 = Math.round(W * 0.185);
  const x2 = Math.round(W * 0.68);
  const xInf = Math.round((x1 + x2) / 2);
  const bottomPeak = 48;
  const bottomTrough = 2;

  const dx = x2 - x1;
  const H = bottomPeak - bottomTrough; // 46px vertical wave drop
  // Exact biarc radius R = ((dx/2)^2 + (H/2)^2) / H
  const R = Math.round(((dx / 2) * (dx / 2) + (H / 2) * (H / 2)) / H);
  const D = R * 2;

  // Circle 2 (Right Green Valley) left offset in screen coordinates
  const valleyLeft = x2 - R;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. Left Forest Canopy Fill (#084B30) ending at exact xInf where Circle 1 & Circle 2 kiss */}
      <View
        style={[
          styles.leftForestCanopyFill,
          { width: xInf },
        ]}
      />

      {/* 2. Equal-Radius Left Mint-Sage Crescent (#86C7A1) - naturally tapers under Circle 1 at x ≈ 68px */}
      <View
        style={[
          styles.sageCrescentCircle,
          {
            width: D,
            height: D,
            borderRadius: R,
            left: x1 - R - 26,
            bottom: bottomPeak - D + 2,
          },
        ]}
      />

      {/* 3. Circle 1: Left Rising #E4F2EA Canvas Crest (Peaks under "Tinda") */}
      <View
        style={[
          styles.leftCanvasCrestCircle,
          {
            width: D,
            height: D,
            borderRadius: R,
            left: x1 - R,
            bottom: bottomPeak - D,
          },
        ]}
      />

      {/* 4. Circle 2: Right Tangential Green Valley Circle (Dips behind Store House & curves up at right edge) */}
      <View
        style={[
          styles.rightGreenValleyCircle,
          {
            width: D,
            height: D,
            borderRadius: R,
            left: valleyLeft,
            bottom: bottomTrough,
          },
        ]}>
        {/* 4A. Sweeping Medium Emerald Circular Wave (#116E3B) curving behind "Mate" */}
        <View
          style={[
            styles.midEmeraldInnerCircle,
            {
              left: Math.round(W * 0.42) - valleyLeft,
            },
          ]}
        />

        {/* 4B. Vibrant Leaf-Green Circular Wave (#1E8744) on Upper-Right behind Bell */}
        <View
          style={[
            styles.brightLeafInnerCircle,
            {
              left: Math.round(W * 0.61) - valleyLeft,
            },
          ]}
        />
      </View>

      {/* 5. Soft Botanical Canopy Leaves anchored cleanly to top-right */}
      <View style={styles.canopyLeafLeft} />
      <View style={styles.canopyLeafRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E4F2EA',
    overflow: 'hidden',
    zIndex: 0,
  },
  // Solid Deep Forest Green fill from x = 0 to x = xInf (completely masked below by Circle 1)
  leftForestCanopyFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#084B30',
  },
  // Equal-radius circle forming the soft mint-sage crescent on the far left
  sageCrescentCircle: {
    position: 'absolute',
    backgroundColor: '#86C7A1',
  },
  // Circle 1: True circle forming the rising #E4F2EA hill on the left half
  leftCanvasCrestCircle: {
    position: 'absolute',
    backgroundColor: '#E4F2EA',
  },
  // Circle 2: True circle forming the downward green valley trough on the right half
  rightGreenValleyCircle: {
    position: 'absolute',
    backgroundColor: '#084B30',
    overflow: 'hidden',
  },
  // Medium Emerald wave inside Circle 2 (extends below bottom: 0 so Circle 2 clips it cleanly)
  midEmeraldInnerCircle: {
    position: 'absolute',
    bottom: -24,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#116E3B',
  },
  // Bright Leaf-Green wave inside Circle 2 (extends below bottom: 0 so Circle 2 clips it cleanly)
  brightLeafInnerCircle: {
    position: 'absolute',
    bottom: -10,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#1E8744',
  },
  // Soft botanical leaf silhouettes anchored cleanly to top-right
  canopyLeafLeft: {
    position: 'absolute',
    top: -10,
    right: 112,
    width: 44,
    height: 68,
    borderTopLeftRadius: 38,
    borderBottomRightRadius: 38,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: '#25914E',
    opacity: 0.68,
    transform: [{ rotate: '32deg' }],
  },
  canopyLeafRight: {
    position: 'absolute',
    top: 2,
    right: 74,
    width: 38,
    height: 58,
    borderTopLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 7,
    backgroundColor: '#2FA05A',
    opacity: 0.58,
    transform: [{ rotate: '52deg' }],
  },
});
