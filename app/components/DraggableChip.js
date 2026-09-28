import React from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from '../context/AccessibilityContext';
import { SPRING_SETTLE } from '../constants/motion';
export default function DraggableChip({
  children,
  style,
  disabled,
  onDrop,
  onGrab
}) {
  const {
    settings
  } = useAccessibility();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const settle = (sharedValue, target) => {
    'worklet';

    sharedValue.value = settings.reducedMotion ? target : withSpring(target, SPRING_SETTLE);
  };
  const pan = Gesture.Pan().enabled(!disabled).onBegin(() => {
    settle(scale, 1.1);
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    if (onGrab) runOnJS(onGrab)();
  }).onUpdate(e => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  }).onEnd(e => {
    settle(scale, 1);
    settle(translateX, 0);
    settle(translateY, 0);
    runOnJS(onDrop)(e.absoluteX, e.absoluteY);
  });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: translateX.value
    }, {
      translateY: translateY.value
    }, {
      scale: scale.value
    }],
    zIndex: scale.value > 1 ? 50 : 1,
    elevation: scale.value > 1 ? 12 : 1
  }));
  return <GestureDetector gesture={pan}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>;
}
