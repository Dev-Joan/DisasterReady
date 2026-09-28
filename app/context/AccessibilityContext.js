import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { computeAccessibilityProfile } from '../utils/accessibilityEngine';
const DEFAULT_ACCESSIBILITY_SETTINGS = computeAccessibilityProfile([]);
export const accessibilityStore = {
  current: DEFAULT_ACCESSIBILITY_SETTINGS
};
const AccessibilityContext = createContext({
  flags: [],
  settings: DEFAULT_ACCESSIBILITY_SETTINGS,
  setFlags: () => {}
});
export function AccessibilityProvider({
  children
}) {
  const [flags, setFlagsState] = useState([]);
  const settings = useMemo(() => computeAccessibilityProfile(flags), [flags]);
  useEffect(() => {
    accessibilityStore.current = settings;
  }, [settings]);
  const setFlags = nextFlags => {
    setFlagsState(Array.isArray(nextFlags) ? nextFlags : []);
  };
  return <AccessibilityContext.Provider value={{
    flags,
    settings,
    setFlags
  }}>
      <ReducedMotionConfig mode={settings.reducedMotion ? ReduceMotion.Always : ReduceMotion.Never} />
      {children}
    </AccessibilityContext.Provider>;
}
export function useAccessibility() {
  return useContext(AccessibilityContext);
}
const BASE_TOUCH_TARGET = 44;
export function touchTargetProps(settings, extra = {}) {
  if (!settings || settings.touchTargetMinSize <= BASE_TOUCH_TARGET) return extra;
  const bump = Math.round((settings.touchTargetMinSize - BASE_TOUCH_TARGET) / 2);
  return {
    ...extra,
    hitSlop: {
      top: bump,
      bottom: bump,
      left: bump,
      right: bump,
      ...(extra.hitSlop || {})
    }
  };
}
export function touchTargetStyle(settings, baseMinHeight = BASE_TOUCH_TARGET) {
  if (!settings || settings.touchTargetMinSize <= BASE_TOUCH_TARGET) return {};
  const extra = settings.touchTargetMinSize - BASE_TOUCH_TARGET;
  return {
    minHeight: baseMinHeight + extra,
    paddingVertical: 4
  };
}
export function a11yProps(settings, {
  label,
  hint,
  important = false,
  role
} = {}) {
  const props = {};
  if (role) props.accessibilityRole = role;
  if (label) props.accessibilityLabel = label;
  if (hint && settings && (settings.screenReader.verboseHints || important)) {
    props.accessibilityHint = hint;
  }
  return props;
}
