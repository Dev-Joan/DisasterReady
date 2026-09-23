import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { SPACING, AGE_PALETTES } from '../constants/tokens';

const loadingSource = require('../assets/lottie/loading.json');

// The source animation (see assets/lottie/SOURCES.md) is drawn in solid
// white, so it needs a backdrop with real contrast in BOTH light and dark
// theme — a plain screen background would make it invisible in light mode.
// A fixed navy chip (the app's existing dominant brand colour, already used
// for headers/buttons/badges everywhere) reads as an intentional design
// choice in either theme rather than an inconsistent per-theme patch.
const CHIP_COLOR = AGE_PALETTES.adult.navy;
const ASPECT_RATIO = 300 / 169;

/**
 * Drop-in animated replacement for a bare spinner/"Loading..." text.
 *
 * Respects reduced motion: when the accessibility engine's `reducedMotion`
 * is on, this renders a single static frame (no autoplay, no loop) instead
 * of a continuously looping animation — matching how the rest of the app's
 * motion (BouncyMascot, FlameFlicker, SkyDecor, Celebration) already
 * degrades for this setting.
 */
export default function LottieLoader({ width = 140, style }) {
  const { settings: a11y } = useAccessibility();
  const height = width / ASPECT_RATIO;

  return (
    // Decorative — the surrounding screen already provides a text message
    // (e.g. LoadingState's "Loading...") for screen readers to announce,
    // so this is hidden from the accessibility tree rather than announced
    // as an unlabeled image.
    <View style={[styles.chip, { backgroundColor: CHIP_COLOR }, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <LottieView
        source={loadingSource}
        autoPlay={!a11y.reducedMotion}
        loop={!a11y.reducedMotion}
        progress={a11y.reducedMotion ? 0 : undefined}
        style={{ width, height }}
      />
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
