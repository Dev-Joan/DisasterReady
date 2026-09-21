import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A shared "squish and spring back" press feel for the kids section — every
// tappable surface reacts the same tactile way instead of some cards
// bouncing and others snapping flat.
//
// This is interaction-triggered rather than an ambient/looping animation
// (see BouncyMascot.js), so it's a smaller motion-sickness risk than an
// autoplaying loop, but a "reduce motion" request is treated as meaning
// exactly that: when set, the scale change is skipped entirely rather than
// softened, so no parallax/scale motion plays at all on press.
export default function BouncyPress({ children, onPress, style, scaleTo = 0.94, disabled, ...rest }) {
  const { settings } = useAccessibility();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    if (settings.reducedMotion) return;
    scale.value = withSpring(scaleTo, { damping: 12, stiffness: 300 });
  };
  const handlePressOut = () => {
    if (settings.reducedMotion) return;
    scale.value = withSpring(1, { damping: 9, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
