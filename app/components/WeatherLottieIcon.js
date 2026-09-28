import React from 'react';
import LottieView from 'lottie-react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { getWeatherLottieSource } from '../constants/weatherLottie';
export default function WeatherLottieIcon({
  weatherCode,
  size = 120,
  style
}) {
  const {
    settings: a11y
  } = useAccessibility();
  return <LottieView source={getWeatherLottieSource(weatherCode)} autoPlay={!a11y.reducedMotion} loop={!a11y.reducedMotion} progress={a11y.reducedMotion ? 0.5 : undefined} style={[{
    width: size,
    height: size
  }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}
