import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';
import { SPRING_SETTLE } from '../constants/motion';
export default function StackReveal({
  index = 0,
  staggerMs = 70,
  style,
  children,
  ...rest
}) {
  const {
    settings: a11y
  } = useAccessibility();
  const t = useSharedValue(a11y.reducedMotion ? 1 : 0);
  useEffect(() => {
    if (a11y.reducedMotion) {
      t.value = 1;
      return;
    }
    t.value = withDelay(index * staggerMs, withSpring(1, SPRING_SETTLE));
  }, [a11y.reducedMotion]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{
      translateY: (1 - t.value) * 26
    }, {
      scale: 0.86 + t.value * 0.14
    }, {
      rotateZ: `${(1 - t.value) * (index % 2 === 0 ? -6 : 6)}deg`
    }]
  }));
  return <Animated.View style={[style, animStyle]} {...rest}>{children}</Animated.View>;
}
