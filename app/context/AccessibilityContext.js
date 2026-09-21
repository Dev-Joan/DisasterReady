import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { computeAccessibilityProfile } from '../utils/accessibilityEngine';

// The engine's baseline profile when no flags are active — used as the
// context's default value and to seed state before onboarding data loads.
const DEFAULT_ACCESSIBILITY_SETTINGS = computeAccessibilityProfile([]);

// Read outside React (by the global Text scaler) as well as inside it.
export const accessibilityStore = { current: DEFAULT_ACCESSIBILITY_SETTINGS };

const AccessibilityContext = createContext({
  flags: [],
  settings: DEFAULT_ACCESSIBILITY_SETTINGS,
  setFlags: () => {}
});

/**
 * Provides the app-wide accessibility profile, computed from raw flags via
 * the rule-based engine (utils/accessibilityEngine.js) — see that file for
 * the full mapping-logic documentation.
 *
 * `flags` is the single source of truth. The profile (`settings`) is
 * re-derived from it on every change via useMemo, so the whole app reacts
 * to a flag change instantly and consistently, without waiting on a server
 * round trip (the server independently persists the same computation via
 * services/accessibilityEngine.js — see that file's header for why it's a
 * mirror rather than a shared import).
 *
 * This component also mounts <ReducedMotionConfig>, which is what makes
 * `reducedMotion` in the profile actually take effect: it overrides
 * react-native-reanimated's global reduced-motion flag, which every
 * `entering`/`exiting`/layout animation in the app consults by default. No
 * per-screen changes are needed for that part — it's a single global
 * switch. Ambient/looping animations that DON'T go through that entering/
 * exiting API (e.g. BouncyMascot's continuous bob, FlameFlicker, SkyDecor's
 * drifting sun/clouds, Celebration's confetti) are not covered by that
 * global switch, since they're manually driven `withRepeat`/`withTiming`
 * loops — those components each check `useAccessibility().settings.
 * reducedMotion` directly and render a static equivalent instead.
 */
export function AccessibilityProvider({ children }) {
  const [flags, setFlagsState] = useState([]);

  const settings = useMemo(() => computeAccessibilityProfile(flags), [flags]);

  useEffect(() => {
    accessibilityStore.current = settings;
  }, [settings]);

  const setFlags = (nextFlags) => {
    setFlagsState(Array.isArray(nextFlags) ? nextFlags : []);
  };

  return (
    <AccessibilityContext.Provider value={{ flags, settings, setFlags }}>
      <ReducedMotionConfig mode={settings.reducedMotion ? ReduceMotion.Always : ReduceMotion.Never} />
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// ---------------------------------------------------------------------------
// Touch target helpers — read the engine's graded `touchTargetMinSize` (44 /
// 52 / 60px) instead of a single fixed bump, so a `motor` flag and a
// `visual`+`motor` combination don't necessarily produce the same result
// (they don't: `motor` alone already maxes this axis, see accessibilityEngine.js).
// ---------------------------------------------------------------------------

const BASE_TOUCH_TARGET = 44;

export function touchTargetProps(settings, extra = {}) {
  if (!settings || settings.touchTargetMinSize <= BASE_TOUCH_TARGET) return extra;
  const bump = Math.round((settings.touchTargetMinSize - BASE_TOUCH_TARGET) / 2);
  return {
    ...extra,
    hitSlop: { top: bump, bottom: bump, left: bump, right: bump, ...(extra.hitSlop || {}) }
  };
}

export function touchTargetStyle(settings, baseMinHeight = BASE_TOUCH_TARGET) {
  if (!settings || settings.touchTargetMinSize <= BASE_TOUCH_TARGET) return {};
  const extra = settings.touchTargetMinSize - BASE_TOUCH_TARGET;
  return { minHeight: baseMinHeight + extra, paddingVertical: 4 };
}

// ---------------------------------------------------------------------------
// Screen-reader label/hint helper — centralises the "how verbose should
// this be" decision so screens don't each reimplement it. When the engine's
// screenReader level is 'verbose' (currently: the `visual` flag), the hint
// is always included; at 'optimised' it's included only if explicitly
// marked important; when screen-reader support isn't flagged at all, the
// label is still always returned (labels are baseline accessibility, not
// an opt-in extra) but the hint is omitted to avoid noisy verbosity for
// users who didn't ask for it.
// ---------------------------------------------------------------------------

export function a11yProps(settings, { label, hint, important = false, role } = {}) {
  const props = {};
  if (role) props.accessibilityRole = role;
  if (label) props.accessibilityLabel = label;
  if (hint && settings && (settings.screenReader.verboseHints || important)) {
    props.accessibilityHint = hint;
  }
  return props;
}
