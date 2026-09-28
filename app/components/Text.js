import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
export default function Text({
  style,
  ...rest
}) {
  const {
    settings
  } = useAccessibility();
  const scale = settings.textScale;
  if (scale === 1) {
    return <RNText style={style} {...rest} />;
  }
  const flat = StyleSheet.flatten(style) || {};
  const scaledStyle = {
    ...flat
  };
  if (typeof flat.fontSize === 'number') {
    scaledStyle.fontSize = Math.round(flat.fontSize * scale);
  }
  if (typeof flat.lineHeight === 'number') {
    scaledStyle.lineHeight = Math.round(flat.lineHeight * scale);
  }
  return <RNText style={scaledStyle} {...rest} />;
}
