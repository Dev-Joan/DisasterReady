import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';

// A "messy stack fans into place" reveal for badge grids and leaderboard
// rows — each item starts slightly rotated (alternating left/right, like a
// dropped stack of cards), scaled down and offset, then springs flat into
// its real position, staggered by index. Meant to read as more deliberate
// than a plain fade-and-slide-up.
//
// Ambient/one-shot but still a real transform sequence rather than the
// entering/exiting API, so it checks reducedMotion directly: with it on,
// items render immediately at rest (opacity 1, no offset/rotation) instead
// of skipping the reveal's *information* — the list itself always renders,
// only the flourish is removed.
export default function StackReveal({ index = 0, staggerMs = 70, style, children, ...rest }) {
  const { settings: a11y } = useAccessibility();
  const t = useSharedValue(a11y.reducedMotion ? 1 : 0);

  useEffect(() => {
    if (a11y.reducedMotion) { t.value = 1; return; }
    t.value = withDelay(index * staggerMs, withSpring(1, { damping: 14, stiffness: 130 }));
  }, [a11y.reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [
      { translateY: (1 - t.value) * 26 },
      { scale: 0.86 + t.value * 0.14 },
      { rotateZ: `${(1 - t.value) * (index % 2 === 0 ? -6 : 6)}deg` }
    ]
  }));

  return <Animated.View style={[style, animStyle]} {...rest}>{children}</Animated.View>;
}
