import React, { createContext, useState, useContext, useMemo } from 'react';
import { useAccessibility } from './AccessibilityContext';

export const THEMES = {
  light: {
    name: 'light',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSub: '#64748B',
    border: '#E2E8F0',
    inputBg: '#FFFFFF',
    headerBg: '#FFFFFF'
  },
  dark: {
    name: 'dark',
    bg: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSub: '#94A3B8',
    border: '#334155',
    inputBg: '#0F172A',
    headerBg: '#1E293B'
  }
};

// Applied on top of the base theme when the accessibility engine resolves
// `contrastMode: 'high'` (currently: the `visual` flag — see
// utils/accessibilityEngine.js). Pushed to near-maximum black/white
// contrast rather than a subtler bump, since the point of this mode is to
// be unambiguous for low-vision users, not to stay close to the brand
// palette.
const HIGH_CONTRAST_OVERRIDES = {
  light: { bg: '#FFFFFF', card: '#FFFFFF', text: '#000000', textSub: '#2B2B2B', border: '#000000', inputBg: '#FFFFFF', headerBg: '#FFFFFF' },
  dark: { bg: '#000000', card: '#000000', text: '#FFFFFF', textSub: '#E5E5E5', border: '#FFFFFF', inputBg: '#000000', headerBg: '#000000' }
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('light');
  const { settings } = useAccessibility();

  // The accessibility engine's contrast axis is applied here so every
  // screen reading `theme` from context gets high-contrast colours
  // automatically — no screen needs to check `settings.contrastMode`
  // itself.
  const theme = useMemo(() => {
    const base = THEMES[themeName];
    if (settings.contrastMode !== 'high') return base;
    return { ...base, ...HIGH_CONTRAST_OVERRIDES[themeName] };
  }, [themeName, settings.contrastMode]);

  const toggleTheme = () => setThemeName((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
