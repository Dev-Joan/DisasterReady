import React from 'react';
import LottieView from 'lottie-react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { getWeatherLottieSource } from '../constants/weatherLottie';

/**
 * Animated weather icon matching the current WMO condition code. These are
 * ambient/continuous loops (rain falling, sun rays pulsing, clouds
 * drifting), not one-shot reveal animations, so — like BouncyMascot,
 * FlameFlicker, and SkyDecor — they're explicitly gated on reducedMotion
 * rather than relying on the app-wide <ReducedMotionConfig> switch (which
 * only covers reanimated's entering/exiting/layout API, not a Lottie
 * player's own internal loop).
 */
export default function WeatherLottieIcon({ weatherCode, size = 120, style }) {
  const { settings: a11y } = useAccessibility();

  return (
    <LottieView
      source={getWeatherLottieSource(weatherCode)}
      autoPlay={!a11y.reducedMotion}
      loop={!a11y.reducedMotion}
      progress={a11y.reducedMotion ? 0.5 : undefined}
      style={[{ width: size, height: size }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
