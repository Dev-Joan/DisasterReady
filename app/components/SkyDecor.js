import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing
} from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';

// A soft, slow-drifting sky behind the kid home header — sun bobbing gently,
// clouds sliding by. Purely decorative and non-interactive, kept subtle so
// it reads as "alive" rather than distracting from the content in front.
//
// Manually driven loops, not covered by the global <ReducedMotionConfig>
// switch (see BouncyMascot.js) — when reduced motion is on, the sun/clouds
// render in their resting position instead of drifting continuously.
export default function SkyDecor() {
  const { settings } = useAccessibility();
  const sunBob = useSharedValue(0);
  const cloud1 = useSharedValue(0);
  const cloud2 = useSharedValue(0);

  useEffect(() => {
    if (settings.reducedMotion) {
      sunBob.value = 0;
      cloud1.value = 0;
      cloud2.value = 0;
      return;
    }
    sunBob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ), -1, true
    );
    cloud1.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
    cloud2.value = withRepeat(withTiming(1, { duration: 19000, easing: Easing.linear }), -1, false);
  }, [settings.reducedMotion]);

  const sunStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sunBob.value }] }));
  const cloud1Style = useAnimatedStyle(() => ({ transform: [{ translateX: -40 + cloud1.value * 340 }] }));
  const cloud2Style = useAnimatedStyle(() => ({ transform: [{ translateX: 300 - cloud2.value * 380 }] }));

  return (
    <>
      <Animated.Text style={[styles.sun, sunStyle]} pointerEvents="none">☀️</Animated.Text>
      <Animated.Text style={[styles.cloud, styles.cloudTop, cloud1Style]} pointerEvents="none">☁️</Animated.Text>
      <Animated.Text style={[styles.cloud, styles.cloudBottom, cloud2Style]} pointerEvents="none">☁️</Animated.Text>
    </>
  );
}

const styles = StyleSheet.create({
  sun: { position: 'absolute', top: 4, right: 18, fontSize: 26, opacity: 0.5 },
  cloud: { position: 'absolute', fontSize: 22, opacity: 0.35 },
  cloudTop: { top: 10 },
  cloudBottom: { top: 46 }
});
