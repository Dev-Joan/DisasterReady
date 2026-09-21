/**
 * ============================================================================
 *  ACCESSIBILITY ENGINE (server mirror)
 * ============================================================================
 * CommonJS mirror of app/utils/accessibilityEngine.js, kept byte-for-byte
 * identical in RULE CONTENT (FLAG_RULES, axis levels, resolution algorithm)
 * so the accessibility profile persisted on signup/onboarding is exactly
 * what the client's engine would compute from the same flags — no drift
 * between two independently-hand-written mappings, which is what the old
 * `authService.js` and `onboardingService.js` each had (and had already
 * drifted: onboardingService's version was missing largerText and
 * captionsPreferred entirely).
 *
 * Full rationale/documentation for WHY each flag maps to each axis lives in
 * the client copy (app/utils/accessibilityEngine.js) — read that file for
 * the design writeup. This file exists only because the app (Metro/Babel,
 * ES modules) and the server (plain Node, CommonJS) can't literally share
 * one file without a build step; if you change the rules, change both.
 * ============================================================================
 */

const TEXT_SCALE = { STANDARD: 0, LARGE: 1, XLARGE: 2 };
const TEXT_SCALE_MULTIPLIER = { 0: 1.0, 1: 1.15, 2: 1.3 };
const TEXT_SCALE_NAME = { 0: 'standard', 1: 'large', 2: 'xlarge' };

const TOUCH_TARGET = { STANDARD: 0, LARGE: 1, XLARGE: 2 };
const TOUCH_TARGET_PX = { 0: 44, 1: 52, 2: 60 };
const TOUCH_TARGET_NAME = { 0: 'standard', 1: 'large', 2: 'xlarge' };

const NAV_DEPTH = { FULL: 0, SIMPLIFIED: 1, MINIMAL: 2 };
const NAV_DEPTH_NAME = { 0: 'full', 1: 'simplified', 2: 'minimal' };

const CONTRAST = { STANDARD: 0, HIGH: 1 };
const CONTRAST_NAME = { 0: 'standard', 1: 'high' };

const REDUCED_MOTION = { OFF: 0, ON: 1 };

const SCREEN_READER = { OFF: 0, OPTIMISED: 1, VERBOSE: 2 };
const SCREEN_READER_NAME = { 0: 'off', 1: 'optimised', 2: 'verbose' };

const CAPTIONS = { OFF: 0, ON: 1 };

const FLAG_RULES = {
  visual: {
    textScale: TEXT_SCALE.LARGE,
    touchTarget: TOUCH_TARGET.STANDARD,
    navigationDepth: NAV_DEPTH.FULL,
    contrast: CONTRAST.HIGH,
    reducedMotion: REDUCED_MOTION.OFF,
    screenReader: SCREEN_READER.VERBOSE,
    captions: CAPTIONS.OFF
  },
  hearing: {
    textScale: TEXT_SCALE.STANDARD,
    touchTarget: TOUCH_TARGET.STANDARD,
    navigationDepth: NAV_DEPTH.FULL,
    contrast: CONTRAST.STANDARD,
    reducedMotion: REDUCED_MOTION.OFF,
    screenReader: SCREEN_READER.OFF,
    captions: CAPTIONS.ON
  },
  motor: {
    textScale: TEXT_SCALE.STANDARD,
    touchTarget: TOUCH_TARGET.XLARGE,
    navigationDepth: NAV_DEPTH.FULL,
    contrast: CONTRAST.STANDARD,
    reducedMotion: REDUCED_MOTION.OFF,
    screenReader: SCREEN_READER.OFF,
    captions: CAPTIONS.OFF
  },
  cognitive: {
    textScale: TEXT_SCALE.STANDARD,
    touchTarget: TOUCH_TARGET.STANDARD,
    navigationDepth: NAV_DEPTH.SIMPLIFIED,
    contrast: CONTRAST.STANDARD,
    reducedMotion: REDUCED_MOTION.ON,
    screenReader: SCREEN_READER.OFF,
    captions: CAPTIONS.OFF
  },
  motion: {
    textScale: TEXT_SCALE.STANDARD,
    touchTarget: TOUCH_TARGET.STANDARD,
    navigationDepth: NAV_DEPTH.FULL,
    contrast: CONTRAST.STANDARD,
    reducedMotion: REDUCED_MOTION.ON,
    screenReader: SCREEN_READER.OFF,
    captions: CAPTIONS.OFF
  }
};

const VALID_FLAGS = Object.keys(FLAG_RULES);
const AXES = ['textScale', 'touchTarget', 'navigationDepth', 'contrast', 'reducedMotion', 'screenReader', 'captions'];

function resolveAxis(axis, activeFlags) {
  let level = 0;
  let winners = [];
  for (const flag of activeFlags) {
    const contribution = (FLAG_RULES[flag] && FLAG_RULES[flag][axis]) || 0;
    if (contribution > level) {
      level = contribution;
      winners = [flag];
    } else if (contribution === level && contribution > 0) {
      winners.push(flag);
    }
  }
  return { level, winners };
}

function computeAccessibilityProfile(flags = []) {
  const activeFlags = (flags || []).filter((f) => VALID_FLAGS.includes(f));

  const resolved = {};
  const appliedRules = [];
  for (const axis of AXES) {
    const { level, winners } = resolveAxis(axis, activeFlags);
    resolved[axis] = level;
    appliedRules.push({ axis, resolvedLevel: level, requestedBy: winners });
  }

  const screenReaderLevel = resolved.screenReader;

  return {
    flags: activeFlags,

    textScale: TEXT_SCALE_MULTIPLIER[resolved.textScale],
    textScaleLevel: TEXT_SCALE_NAME[resolved.textScale],

    touchTargetMinSize: TOUCH_TARGET_PX[resolved.touchTarget],
    touchTargetLevel: TOUCH_TARGET_NAME[resolved.touchTarget],

    navigationDepth: NAV_DEPTH_NAME[resolved.navigationDepth],

    contrastMode: CONTRAST_NAME[resolved.contrast],

    reducedMotion: resolved.reducedMotion === REDUCED_MOTION.ON,

    screenReader: {
      level: SCREEN_READER_NAME[screenReaderLevel],
      optimised: screenReaderLevel >= SCREEN_READER.OPTIMISED,
      verboseHints: screenReaderLevel >= SCREEN_READER.VERBOSE
    },

    captionsPreferred: resolved.captions === CAPTIONS.ON,

    largerText: TEXT_SCALE_NAME[resolved.textScale] !== 'standard',
    largerTouchTargets: TOUCH_TARGET_NAME[resolved.touchTarget] !== 'standard',
    simplifiedNavigation: NAV_DEPTH_NAME[resolved.navigationDepth] !== 'full',
    screenReaderOptimised: screenReaderLevel >= SCREEN_READER.OPTIMISED,

    appliedRules
  };
}

module.exports = { VALID_FLAGS, AXES, FLAG_RULES, computeAccessibilityProfile };
