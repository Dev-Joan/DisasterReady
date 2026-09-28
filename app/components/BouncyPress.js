import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAccessibility } from '../context/AccessibilityContext';
import { SPRING_PRESS_IN, SPRING_PRESS_OUT } from '../constants/motion';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export default function BouncyPress({
  children,
  onPress,
  style,
  scaleTo = 0.94,
  disabled,
  ...rest
}) {
  const {
    settings
  } = useAccessibility();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: scale.value
    }]
  }));
  const handlePressIn = () => {
    if (settings.reducedMotion) return;
    scale.value = withSpring(scaleTo, SPRING_PRESS_IN);
  };
  const handlePressOut = () => {
    if (settings.reducedMotion) return;
    scale.value = withSpring(1, SPRING_PRESS_OUT);
  };
  return <AnimatedPressable onPress={onPress} disabled={disabled} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[style, animatedStyle]} {...rest}>
      {children}
    </AnimatedPressable>;
}
