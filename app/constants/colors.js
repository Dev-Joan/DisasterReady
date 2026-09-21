export const EMERGENCY_COLORS = {
  critical: '#D32F2F',
  warning: '#F57C00',
  advisory: '#FBC02D',
  safe: '#2E7D32',
  neutralDark: '#1E293B'
};

// Age-identity palettes (kid/teen/adult/elderly) live in constants/tokens.js
// as part of the design system, alongside spacing, type, and radii tokens.

// Universal emergency override: when a severe (critical) simulated alert is
// active, key surfaces switch to this palette instead of the age-based theme,
// so alerts read the same regardless of age mode.
export const EMERGENCY_OVERRIDE = {
  background: EMERGENCY_COLORS.neutralDark, // charcoal slate
  primary: EMERGENCY_COLORS.critical,       // emergency red
  secondary: EMERGENCY_COLORS.warning,      // signal orange
  highlight: EMERGENCY_COLORS.advisory,     // safety yellow
  text: '#F8FAFC',
  textSub: '#E2E8F0'
};

export function isSevereAlert(alert) {
  return !!alert && alert.severity === 'critical';
}