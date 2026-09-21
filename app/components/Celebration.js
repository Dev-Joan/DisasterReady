import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_COLORS = ['#FBBF24', '#38BDF8', '#34D399', '#F472B6', '#A78BFA'];

function ConfettiPiece({ x, delay, duration, spin, color, w, h }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * 760 - 20 },
      { rotate: `${progress.value * spin}deg` }
    ],
    opacity: progress.value > 0.85 ? Math.max(0, (1 - progress.value) / 0.15) : 1
  }));

  return <Animated.View style={[styles.piece, { left: x, width: w, height: h, backgroundColor: color }, style]} />;
}

// A warm, reusable confetti burst for reward moments across the kids
// section — one celebratory feel everywhere a mission is completed,
// instead of every screen reinventing its own.
//
// Many simultaneously moving pieces is exactly the kind of motion that
// tends to bother users with vestibular sensitivity, and it's driven
// manually (not through the entering/exiting API), so the global
// <ReducedMotionConfig> switch doesn't reach it — checked directly here.
// When reduced motion is on, this renders nothing rather than a static
// substitute: the achievement it marks (e.g. "MASTERED") is always also
// conveyed elsewhere as text/a badge, so removing the confetti loses only
// decorative flair, not information.
export default function Celebration({ pieceCount = 26, colors = DEFAULT_COLORS }) {
  const { settings } = useAccessibility();

  const pieces = useRef(
    Array.from({ length: pieceCount }).map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 300,
      duration: 1600 + Math.random() * 900,
      spin: 180 + Math.random() * 540,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8
    }))
  ).current;

  if (settings.reducedMotion) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, borderRadius: 2 }
});
