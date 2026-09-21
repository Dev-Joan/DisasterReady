import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

// Drop-in replacement for React Native's Text. Scales font size and line
// height by the accessibility engine's graded `textScale` multiplier
// (1.0 / 1.15 / 1.3 — see utils/accessibilityEngine.js), so every screen
// using this component gets the right scale for real, without each screen
// needing its own conditional styling.
export default function Text({ style, ...rest }) {
  const { settings } = useAccessibility();
  const scale = settings.textScale;

  if (scale === 1) {
    return <RNText style={style} {...rest} />;
  }

  const flat = StyleSheet.flatten(style) || {};
  const scaledStyle = { ...flat };
  if (typeof flat.fontSize === 'number') {
    scaledStyle.fontSize = Math.round(flat.fontSize * scale);
  }
  if (typeof flat.lineHeight === 'number') {
    scaledStyle.lineHeight = Math.round(flat.lineHeight * scale);
  }

  return <RNText style={scaledStyle} {...rest} />;
}
