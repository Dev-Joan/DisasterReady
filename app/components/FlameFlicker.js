import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';
export default function FlameFlicker({
  children,
  style
}) {
  const {
    settings
  } = useAccessibility();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (settings.reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(withSequence(withTiming(1.18, {
      duration: 260
    }), withTiming(0.95, {
      duration: 260
    })), -1, true);
  }, [settings.reducedMotion]);
  const flickerStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: scale.value
    }]
  }));
  return <Animated.Text style={[style, flickerStyle]}>{children}</Animated.Text>;
}
