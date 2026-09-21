import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { ACCESSIBILITY_OPTIONS } from '../constants/accessibility';
import { SPACING, TYPE, RADII, getElevation } from '../constants/tokens';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function SettingsScreen() {
  const { userId } = useUser();
  const { theme, themeName, toggleTheme } = useTheme();
  const { settings: a11y, setFlags: setA11yFlags } = useAccessibility();
  const [accessibilityFlags, setAccessibilityFlags] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    return apiRequest(`/onboarding/profile?userId=${userId}`, 'GET')
      .then((profile) => {
        setAccessibilityFlags(profile.accessibilityFlags || []);
        setA11yFlags(profile.accessibilityFlags || []);
        setLoaded(true);
      })
      .catch((err) => {
        console.log('Settings load error:', err.message);
        setError(true);
      });
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleThemeToggle = async () => {
    const newTheme = themeName === 'light' ? 'dark' : 'light';
    toggleTheme();
    try {
      await apiRequest('/onboarding/theme', 'POST', { userId, theme: newTheme });
    } catch (err) {
      console.log('Theme save error:', err.message);
    }
  };

  const toggleAccessibilityFlag = async (key) => {
    const nextFlags = accessibilityFlags.includes(key)
      ? accessibilityFlags.filter((f) => f !== key)
      : [...accessibilityFlags, key];
    setAccessibilityFlags(nextFlags);
    // Apply immediately, app-wide, via the local engine — no need to wait
    // on the network round trip for the UI to reflect the change. The
    // server call below just persists the same flags for next login.
    setA11yFlags(nextFlags);
    try {
      await apiRequest('/onboarding/accessibility', 'POST', { userId, accessibilityFlags: nextFlags });
    } catch (err) {
      console.log('Accessibility save error:', err.message);
    }
  };

  if (!loaded && error) return <ErrorState onRetry={load} />;
  if (!loaded) return <LoadingState message="Loading settings..." />;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">Settings</Text>

      <Animated.View entering={FadeInDown.duration(320)} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>
            {themeName === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Text>
          <Text style={[styles.rowSub, { color: theme.textSub }]}>
            Switch between light and dark appearance
          </Text>
        </View>
        <Switch
          value={themeName === 'dark'}
          onValueChange={handleThemeToggle}
          trackColor={{ false: '#CBD5E1', true: '#F57C00' }}
          thumbColor="#fff"
          accessibilityLabel="Dark mode"
          accessibilityRole="switch"
        />
      </Animated.View>

      <Text style={[styles.sectionLabel, { color: theme.text }]} accessibilityRole="header">Accessibility</Text>
      <Text style={[styles.sectionNote, { color: theme.textSub }]}>
        These adjustments apply throughout the app immediately.
      </Text>

      {ACCESSIBILITY_OPTIONS.map((opt, index) => {
        const enabled = accessibilityFlags.includes(opt.key);
        return (
          <Animated.View key={opt.key} entering={FadeInDown.delay(index * 60).duration(320)} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>{opt.label}</Text>
              <Text style={[styles.rowSub, { color: theme.textSub }]}>{opt.description}</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={() => toggleAccessibilityFlag(opt.key)}
              trackColor={{ false: '#CBD5E1', true: '#1E3A8A' }}
              thumbColor="#fff"
              accessibilityLabel={`${opt.label} accessibility support`}
              accessibilityRole="switch"
              accessibilityHint={opt.description}
              {...touchTargetProps(a11y)}
            />
          </Animated.View>
        );
      })}

      <Text style={[styles.note, { color: theme.textSub }]}>
        Your choices are saved to your account.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: SPACING.xxl },
  title: { fontSize: TYPE.display.fontSize, fontWeight: 'bold', marginBottom: SPACING.xxl },
  sectionLabel: { fontSize: TYPE.title.fontSize - 2, fontWeight: 'bold', marginTop: SPACING.xxl + 4, marginBottom: SPACING.sm - 2 },
  sectionNote: { fontSize: TYPE.caption.fontSize, marginBottom: SPACING.md + 2 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: RADII.adult.card, padding: SPACING.lg + 2, marginBottom: SPACING.md,
    ...getElevation('adult')
  },
  rowLabel: { fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold' },
  rowSub: { fontSize: TYPE.caption.fontSize, marginTop: SPACING.xs, maxWidth: 240 },
  note: { fontSize: TYPE.caption.fontSize, marginTop: SPACING.sm, textAlign: 'center' }
});
