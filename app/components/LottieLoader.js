import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { SPACING, AGE_PALETTES } from '../constants/tokens';
const loadingSource = require('../assets/lottie/loading.json');
const CHIP_COLOR = AGE_PALETTES.adult.navy;
const ASPECT_RATIO = 300 / 169;
export default function LottieLoader({
  width = 140,
  style
}) {
  const {
    settings: a11y
  } = useAccessibility();
  const height = width / ASPECT_RATIO;
  return (<View style={[styles.chip, {
      backgroundColor: CHIP_COLOR
    }, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <LottieView source={loadingSource} autoPlay={!a11y.reducedMotion} loop={!a11y.reducedMotion} progress={a11y.reducedMotion ? 0 : undefined} style={{
        width,
        height
      }} />
    </View>
  );
}
const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
