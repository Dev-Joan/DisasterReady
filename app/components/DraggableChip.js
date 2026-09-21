import React from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from '../context/AccessibilityContext';

// A chip that follows the finger 1:1 on the UI thread while dragging, then
// springs back to its resting spot. `onDrop` fires with the release point
// in screen coordinates — the caller hit-tests that against its own
// measured drop zones and decides what happens (place it, reject it, etc).
//
// The 1:1 drag-follow itself isn't treated as "motion to reduce" — it's the
// direct, necessary result of the user's own finger movement, not an
// autoplaying effect. The spring PHYSICS (the bounce/overshoot on grab and
// release) is what's reduced: with reduced motion on, grab/release snap
// instantly to their target value instead of springing, so the chip still
// ends up in the right place with zero added overshoot motion.
export default function DraggableChip({ children, style, disabled, onDrop }) {
  const { settings } = useAccessibility();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const settle = (sharedValue, target) => {
    'worklet';
    sharedValue.value = settings.reducedMotion ? target : withSpring(target);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      settle(scale, 1.1);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      settle(scale, 1);
      settle(translateX, 0);
      settle(translateY, 0);
      runOnJS(onDrop)(e.absoluteX, e.absoluteY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    zIndex: scale.value > 1 ? 50 : 1,
    elevation: scale.value > 1 ? 12 : 1
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
