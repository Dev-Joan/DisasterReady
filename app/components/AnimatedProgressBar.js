import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
export default function AnimatedProgressBar({
  progress,
  trackColor,
  fillColor,
  height = 10
}) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(100, progress)), {
      duration: 500,
      easing: Easing.out(Easing.cubic)
    });
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    width: `${width.value}%`
  }));
  return <View style={[styles.track, {
    backgroundColor: trackColor,
    height,
    borderRadius: height / 2
  }]}>
      <Animated.View style={[styles.fill, {
      backgroundColor: fillColor,
      borderRadius: height / 2
    }, style]} />
    </View>;
}
const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden'
  },
  fill: {
    height: '100%'
  }
});
