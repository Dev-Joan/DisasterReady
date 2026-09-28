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
export const TYPE = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 'bold'
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400'
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.3
  }
};
export const TYPE_SENIOR = {
  display: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: 'bold'
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400'
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.3
  }
};
export function getType(mode) {
  return mode === 'elderly' ? TYPE_SENIOR : TYPE;
}
export const RADII = {
  child: {
    card: 24,
    chip: 20,
    button: 18
  },
  teen: {
    card: 14,
    chip: 12,
    button: 14
  },
  adult: {
    card: 10,
    chip: 8,
    button: 10
  },
  elderly: {
    card: 22,
    chip: 18,
    button: 20
  }
};
export function getElevation(mode, accentColor, borderColor) {
  if (mode === 'child') {
    return {
      borderWidth: 2,
      borderColor: accentColor || '#F5A623'
    };
  }
  if (mode === 'teen') {
    return {
      borderWidth: 1,
      borderColor: borderColor || '#334155'
    };
  }
  if (mode === 'elderly') {
    return {
      borderWidth: 2,
      borderColor: borderColor || '#94A3B8'
    };
  }
  return {
    borderWidth: 1,
    borderColor: borderColor || '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2
  };
}
export const SEMANTIC = {
  critical: '#D32F2F',
  signal: '#F57C00',
  caution: '#FBC02D',
  success: '#16A34A',
  charcoal: '#1E293B'
};
export const AGE_PALETTES = {
  child: {
    gold: '#F5A623',
    skyBlue: '#38BDF8',
    mint: '#2DD4A7',
    cream: '#FFF8ED',
    text: '#1E293B',
    primary: '#F5A623',
    secondary: '#38BDF8',
    accent: '#2DD4A7',
    background: '#FFF8ED'
  },
  teen: {
    slate: '#0F172A',
    base: '#1E293B',
    baseAlt: '#293548',
    border: '#334155',
    teal: '#2DD4BF',
    tealDeep: '#0F9488',
    indigo: '#4338CA',
    coral: '#FF6B57',
    text: '#F8FAFC',
    textSub: '#94A3B8',
    primary: '#2DD4BF',
    secondary: '#4338CA',
    accent: '#FF6B57',
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
