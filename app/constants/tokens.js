// Design system tokens — the single source of truth for spacing, type,
// radii, elevation, and the four age-identity palettes. Screens should
// consume these instead of hardcoding hex values or magic numbers.

// ---- SPACING ----
// One scale, used everywhere. Predictable multiples — a safety app
// shouldn't experiment with rhythm.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40
};

// ---- TYPOGRAPHY ----
// Four roles, each with a real job — not just a size step.
// display: the one big number/moment per screen (XP, accuracy, completion headlines)
// title: section and card headers
// body: the reading layer — disaster instructions live here
// caption: metadata only (timestamps, "4 questions", source attribution)
export const TYPE = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: 'bold' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: 'bold' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.3 }
};

// Senior shifts the whole scale up a step as identity, not an accessibility
// bolt-on — "larger type" is part of being the senior skin by default.
export const TYPE_SENIOR = {
  display: { fontSize: 32, lineHeight: 39, fontWeight: 'bold' },
  title: { fontSize: 22, lineHeight: 29, fontWeight: 'bold' },
  body: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.3 }
};

export function getType(mode) {
  return mode === 'elderly' ? TYPE_SENIOR : TYPE;
}

// ---- RADII ----
// Deliberately different per age rather than one radius for every card.
// Adult stays crisp/rectangular (dashboard, efficient); elderly is
// noticeably rounder and softer (calm, unhurried) — the two should never
// read as the same shape language at a glance.
export const RADII = {
  child: { card: 24, chip: 20, button: 18 },
  teen: { card: 14, chip: 12, button: 14 },
  adult: { card: 10, chip: 8, button: 10 },
  elderly: { card: 22, chip: 18, button: 20 }
};

// ---- ELEVATION ----
// Surface treatment is where each age's personality actually shows up.
// Kid: no shadow, a solid accent-colored border (toy-block feel).
// Teen: flat, bordered, no shadow (dark-mode-native).
// Adult: a soft shadow for dashboard-card depth — professional, information-dense.
// Elderly: no shadow at all (a soft shadow is an ambiguous mid-tone edge —
// bad for low vision); a bold, high-contrast border reads as "solid" instead.
export function getElevation(mode, accentColor, borderColor) {
  if (mode === 'child') {
    return { borderWidth: 2, borderColor: accentColor || '#F5A623' };
  }
  if (mode === 'teen') {
    return { borderWidth: 1, borderColor: borderColor || '#334155' };
  }
  if (mode === 'elderly') {
    return { borderWidth: 2, borderColor: borderColor || '#94A3B8' };
  }
  // adult
  return {
    borderWidth: 1,
    borderColor: borderColor || '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  };
}

// ---- SEMANTIC COLORS ----
// Age-independent, safety-critical. Never reinterpreted per age — critical
// always reads as critical.
export const SEMANTIC = {
  critical: '#D32F2F',
  signal: '#F57C00',
  caution: '#FBC02D',
  success: '#16A34A',
  charcoal: '#1E293B'
};

// ---- AGE IDENTITY PALETTES ----
export const AGE_PALETTES = {
  child: {
    gold: '#F5A623',
    skyBlue: '#38BDF8',
    mint: '#2DD4A7',
    cream: '#FFF8ED',
    text: '#1E293B',
    // semantic roles used by screens
    primary: '#F5A623',
    secondary: '#38BDF8',
    accent: '#2DD4A7',
    background: '#FFF8ED'
  },
  teen: {
    slate: '#0F172A',
    teal: '#0EA5E9',
    indigo: '#4F46E5',
    coral: '#FF6B6B',
    text: '#F8FAFC',
    primary: '#0EA5E9',
    secondary: '#4F46E5',
    accent: '#FF6B6B',
    background: '#0F172A'
  },
  adult: {
    navy: '#1E3A8A',
    sage: '#7C9885',
    amber: '#D97706',
    text: '#1E293B',
    primary: '#1E3A8A',
    secondary: '#7C9885',
    accent: '#D97706',
    background: '#F8FAFC'
  },
  elderly: {
    navy: '#1E3A8A',
    sage: '#7C9885',
    amber: '#D97706',
    // higher-contrast pairing than adult, same hues
    text: '#111827',
    primary: '#1E3A8A',
    secondary: '#7C9885',
    accent: '#D97706',
    background: '#FFFFFF'
  }
};

export function getAgePalette(mode) {
  return AGE_PALETTES[mode] || AGE_PALETTES.adult;
}
