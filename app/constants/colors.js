export const EMERGENCY_COLORS = {
  critical: '#D32F2F',
  warning: '#F57C00',
  advisory: '#FBC02D',
  safe: '#2E7D32',
  neutralDark: '#1E293B'
};
export const EMERGENCY_OVERRIDE = {
  background: EMERGENCY_COLORS.neutralDark,
  primary: EMERGENCY_COLORS.critical,
  secondary: EMERGENCY_COLORS.warning,
  highlight: EMERGENCY_COLORS.advisory,
  text: '#F8FAFC',
  textSub: '#E2E8F0'
};
export function isSevereAlert(alert) {
  return !!alert && alert.severity === 'critical';
}
