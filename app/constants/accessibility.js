// Keys here must match the flag keys in app/utils/accessibilityEngine.js
// (FLAG_RULES) and server/services/accessibilityEngine.js exactly — these
// are the raw inputs the accessibility engine resolves into a full profile.
export const ACCESSIBILITY_OPTIONS = [
  { key: 'visual', label: 'Visual', description: 'Larger text, higher contrast, and richer screen reader descriptions' },
  { key: 'hearing', label: 'Hearing', description: 'Captions and text alternatives for audio' },
  { key: 'motor', label: 'Motor', description: 'Larger touch targets throughout the app' },
  { key: 'cognitive', label: 'Cognitive', description: 'Simplified navigation with fewer choices per screen, and reduced motion' },
  { key: 'motion', label: 'Motion sensitivity', description: 'Reduce animations and motion effects (for motion sickness or vestibular disorders)' }
];
