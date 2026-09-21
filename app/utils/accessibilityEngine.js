/**
 * ============================================================================
 *  ACCESSIBILITY ENGINE
 * ============================================================================
 * Turns a set of self-reported accessibility flags (visual, hearing, motor,
 * cognitive, motion) into a single, coherent ACCESSIBILITY PROFILE — a full
 * set of concrete adaptations (text scale, touch target size, navigation
 * depth, contrast mode, reduced motion, screen-reader behaviour, captions)
 * that every screen reads from one place instead of each screen inventing
 * its own flag -> tweak mapping.
 *
 * DESIGN: RULE TABLE + MAX AGGREGATION (not nested if/else)
 * ----------------------------------------------------------------------------
 * The old approach was a chain of `if (flags.includes('visual')) settings.x =
 * true` statements. That doesn't compose: it can't express "how much" of an
 * adaptation is needed, and combining two flags meant writing a new branch
 * for every pair you cared about (an O(2^n) problem as flags grow).
 *
 * Instead, every flag is defined ONCE as a row in FLAG_RULES, declaring how
 * strongly it pushes each of seven independent adaptation AXES (textScale,
 * touchTarget, navigationDepth, contrast, reducedMotion, screenReader,
 * captions). Each axis has ordinal LEVELS (0 = no adaptation, higher =
 * stronger). To resolve a profile for a set of active flags, each axis is
 * independently resolved as:
 *
 *     resolvedLevel(axis) = MAX over all active flags of FLAG_RULES[flag][axis]
 *
 * Why max, not sum: needs don't stack additively — someone who is both
 * visually impaired AND motor-impaired doesn't need "double" text size, they
 * need whichever single adaptation is strongest for each axis. Max also
 * makes the system safe against redundant/overlapping flags (e.g. both
 * `cognitive` and `motion` requesting reduced motion doesn't overshoot a
 * binary axis) and keeps every rule fully independent — adding a new flag
 * is one new row, adding a new axis is one new column, and nothing else
 * needs to change. That's what makes this "composable": axes and flags can
 * be combined in any subset without special-casing the combination itself.
 *
 * This keeps the whole system a lookup table + a max — genuinely rule-based
 * and inspectable (see `appliedRules` in the returned profile, which records
 * exactly which flag "won" each axis and why), as opposed to a black-box
 * heuristic.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. AXES: the independent dimensions of adaptation, and their ordinal levels.
// ---------------------------------------------------------------------------
// Every axis is modelled the same way, including the "binary" ones
// (contrast, reducedMotion, captions) — that consistency is deliberate: it
// means the resolution algorithm below never needs to special-case a binary
// axis vs a graded one; a binary axis is just a graded axis with 2 levels.

const TEXT_SCALE = { STANDARD: 0, LARGE: 1, XLARGE: 2 };
const TEXT_SCALE_MULTIPLIER = { 0: 1.0, 1: 1.15, 2: 1.3 };
const TEXT_SCALE_NAME = { 0: 'standard', 1: 'large', 2: 'xlarge' };

const TOUCH_TARGET = { STANDARD: 0, LARGE: 1, XLARGE: 2 };
// Values in px. 44px is the Apple HIG / Material baseline minimum tappable
// size — that's the floor, not an adaptation, so STANDARD keeps it as-is.
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

// ---------------------------------------------------------------------------
// 2. FLAG RULES: what each self-reported flag requests on each axis.
// ---------------------------------------------------------------------------
// A flag that doesn't care about an axis contributes 0 (no pull on that
// axis at all) — it is simply absent from the max, not "cancelling" other
// flags' requests.
//
// Rationale per flag (kept here so the mapping is defensible on inspection,
// not just in a commit message):
//
//   visual    -> larger text (LARGE) + high contrast + verbose screen-reader
//                behaviour. A visual impairment is the textbook case for
//                all three: bigger/legible text, stronger colour separation,
//                and richer non-visual descriptions when a screen reader is
//                in use.
//   hearing   -> captions only. A hearing impairment has no bearing on text
//                size, touch targets, navigation, contrast, or motion, so
//                every other axis is 0 — the engine doesn't invent a
//                "healthy default" push where none is warranted.
//   motor     -> largest touch target level (XLARGE). Motor/dexterity
//                difficulty is specifically about hitting a target
//                reliably, so it maxes that one axis rather than a smaller
//                bump — undershooting here directly causes missed taps.
//   cognitive -> simplified navigation (SIMPLIFIED, not the deeper MINIMAL)
//                AND reduced motion. SIMPLIFIED collapses secondary options
//                behind a "show more" toggle the user controls; MINIMAL
//                would hide them permanently with no way back, which is a
//                stronger intervention than a single self-reported flag
//                should impose on its own. MINIMAL is reserved for a future
//                flag/combination that indicates a stronger need — the axis
//                supports it today (see NAV_DEPTH below), nothing currently
//                requests it alone. Reduced motion is requested because
//                unexpected animation is a well-documented source of
//                distraction and disorientation under cognitive load — see
//                WCAG 2.2 "Animation from Interactions" guidance.
//   motion    -> reduced motion only. Kept as its OWN flag rather than
//                folded into `cognitive`, because motion/vestibular
//                sensitivity (WCAG 2.3.3, motion sickness, vestibular
//                disorders) is a distinct, real accessibility need from
//                cognitive load — someone can need one without the other,
//                and collapsing them would misrepresent why the adaptation
//                is being applied.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 3. RESOLUTION: max-aggregate each axis across all active flags, and record
//    which flag(s) produced the winning (highest) level for that axis, so
//    the result is traceable back to a specific, named reason.
// ---------------------------------------------------------------------------

function resolveAxis(axis, activeFlags) {
  let level = 0;
  let winners = [];

  for (const flag of activeFlags) {
    const contribution = FLAG_RULES[flag]?.[axis] ?? 0;
    if (contribution > level) {
      level = contribution;
      winners = [flag];
    } else if (contribution === level && contribution > 0) {
      winners.push(flag);
    }
  }

  return { level, winners };
}

/**
 * Computes the full accessibility profile for a set of self-reported flags.
 *
 * @param {string[]} flags - subset of VALID_FLAGS (unknown flags are ignored)
 * @returns {object} the resolved profile — see module doc for shape
 */
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
    // Raw input, echoed back for traceability.
    flags: activeFlags,

    // TEXT SCALING
    textScale: TEXT_SCALE_MULTIPLIER[resolved.textScale],
    textScaleLevel: TEXT_SCALE_NAME[resolved.textScale],

    // TOUCH TARGETS
    touchTargetMinSize: TOUCH_TARGET_PX[resolved.touchTarget],
    touchTargetLevel: TOUCH_TARGET_NAME[resolved.touchTarget],

    // NAVIGATION
    navigationDepth: NAV_DEPTH_NAME[resolved.navigationDepth],

    // CONTRAST
    contrastMode: CONTRAST_NAME[resolved.contrast],

    // MOTION
    reducedMotion: resolved.reducedMotion === REDUCED_MOTION.ON,

    // SCREEN READER
    screenReader: {
      level: SCREEN_READER_NAME[screenReaderLevel],
      optimised: screenReaderLevel >= SCREEN_READER.OPTIMISED,
      verboseHints: screenReaderLevel >= SCREEN_READER.VERBOSE
    },

    // CAPTIONS
    captionsPreferred: resolved.captions === CAPTIONS.ON,

    // ---- Legacy flat booleans, kept so existing call sites (`settings.
    // largerText`, `settings.largerTouchTargets`, etc.) keep working
    // unchanged while reading a richer profile underneath. ----
    largerText: TEXT_SCALE_NAME[resolved.textScale] !== 'standard',
    largerTouchTargets: TOUCH_TARGET_NAME[resolved.touchTarget] !== 'standard',
    simplifiedNavigation: NAV_DEPTH_NAME[resolved.navigationDepth] !== 'full',
    screenReaderOptimised: screenReaderLevel >= SCREEN_READER.OPTIMISED,

    // ---- Explainability trace: which flag(s) drove each axis to its
    // resolved level. Print this to demonstrate/inspect the engine's
    // reasoning for a given combination of flags. ----
    appliedRules
  };
}

/**
 * Formats a profile's `appliedRules` trace as a human-readable multi-line
 * string — useful for a viva/report demonstration of the rule engine.
 */
function explainProfile(profile) {
  const lines = [`Flags: [${profile.flags.join(', ') || 'none'}]`];
  profile.appliedRules.forEach((r) => {
    const who = r.requestedBy.length ? r.requestedBy.join(' + ') : '(baseline, no flag requests this)';
    lines.push(`  ${r.axis.padEnd(16)} -> level ${r.resolvedLevel}  (${who})`);
  });
  return lines.join('\n');
}

export {
  VALID_FLAGS,
  AXES,
  FLAG_RULES,
  TEXT_SCALE_MULTIPLIER,
  TOUCH_TARGET_PX,
  computeAccessibilityProfile,
  explainProfile
};
