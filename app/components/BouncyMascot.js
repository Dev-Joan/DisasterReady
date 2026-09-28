import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import Text from './Text';
import { useAccessibility } from '../context/AccessibilityContext';
export default function BouncyMascot({
  emoji = '🦊',
  size = 56,
  style
}) {
  const {
    settings
  } = useAccessibility();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (settings.reducedMotion) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(withSequence(withTiming(-10, {
      duration: 480,
      easing: Easing.out(Easing.quad)
    }), withTiming(0, {
      duration: 420,
      easing: Easing.bounce
    })), -1, false);
  }, [settings.reducedMotion]);
  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: bob.value
    }]
  }));
  return <Animated.View style={bounceStyle}>
      <Text style={[{
      fontSize: size,
      textAlign: 'center'
    }, style]}>{emoji}</Text>
    </Animated.View>;
}
