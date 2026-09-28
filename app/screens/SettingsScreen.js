import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
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
import { syncLocalReminders, sendTestNotification } from '../services/notifications';
export default function SettingsScreen() {
  const {
    userId
  } = useUser();
  const {
    theme,
    themeName,
    toggleTheme
  } = useTheme();
  const {
    settings: a11y,
    setFlags: setA11yFlags
  } = useAccessibility();
  const [accessibilityFlags, setAccessibilityFlags] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionNote, setPermissionNote] = useState(null);
  const [testSent, setTestSent] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setError(false);
    return apiRequest(`/onboarding/profile?userId=${userId}`, 'GET').then(profile => {
      setAccessibilityFlags(profile.accessibilityFlags || []);
      setA11yFlags(profile.accessibilityFlags || []);
      setNotificationsEnabled(!!profile.notificationsEnabled);
      setLoaded(true);
    }).catch(err => {
      console.log('Settings load error:', err.message);
      setError(true);
    });
  }, [userId]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const handleThemeToggle = async () => {
    const newTheme = themeName === 'light' ? 'dark' : 'light';
    toggleTheme();
    try {
      await apiRequest('/onboarding/theme', 'POST', {
        userId,
        theme: newTheme
      });
    } catch (err) {
      console.log('Theme save error:', err.message);
    }
  };
  const toggleNotifications = async nextValue => {
    setPermissionNote(null);
    const actuallyEnabled = await syncLocalReminders(nextValue);
    setNotificationsEnabled(actuallyEnabled);
    if (nextValue && !actuallyEnabled) {
      setPermissionNote('Notifications are blocked for this app in your device settings - enable them there first.');
    }
    try {
      await apiRequest('/onboarding/notifications', 'POST', {
        userId,
        enabled: actuallyEnabled
      });
    } catch (err) {
      console.log('Notifications preference save error:', err.message);
    }
  };
  const handleSendTest = async () => {
    setTestSent(false);
    try {
      await sendTestNotification(5);
      setTestSent(true);
    } catch (err) {
      console.log('Test notification error:', err.message);
      setPermissionNote('Could not schedule a test notification - check your device notification permission.');
    }
  };
  const toggleAccessibilityFlag = async key => {
    const nextFlags = accessibilityFlags.includes(key) ? accessibilityFlags.filter(f => f !== key) : [...accessibilityFlags, key];
    setAccessibilityFlags(nextFlags);
    setA11yFlags(nextFlags);
    try {
      await apiRequest('/onboarding/accessibility', 'POST', {
        userId,
        accessibilityFlags: nextFlags
      });
    } catch (err) {
      console.log('Accessibility save error:', err.message);
    }
  };
  if (!loaded && error) return <ErrorState onRetry={load} />;
  if (!loaded) return <LoadingState message="Loading settings..." />;
  return <ScrollView style={[styles.screen, {
    backgroundColor: theme.bg
  }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.title, {
      color: theme.text
    }]} accessibilityRole="header">Settings</Text>

      <Animated.View entering={FadeInDown.duration(320)} style={[styles.row, {
      backgroundColor: theme.card,
      borderColor: theme.border
    }]}>
        <View style={{
        flex: 1
      }}>
          <Text style={[styles.rowLabel, {
          color: theme.text
        }]}>
            {themeName === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Text style={[styles.rowSub, {
          color: theme.textSub
        }]}>
            Switch between light and dark appearance
          </Text>
        </View>
        <Switch value={themeName === 'dark'} onValueChange={handleThemeToggle} trackColor={{
        false: '#CBD5E1',
        true: '#1E3A8A'
      }} thumbColor="#fff" accessibilityLabel="Dark mode" accessibilityRole="switch" />
      </Animated.View>

      <Text style={[styles.sectionLabel, {
      color: theme.text
    }]} accessibilityRole="header">Reminders</Text>
      <Text style={[styles.sectionNote, {
      color: theme.textSub
    }]}>
        Scheduled on this device only - a daily task nudge and a "come back and learn" reminder. These are separate from Alerts, which are live warnings fetched from the server.
      </Text>

      <Animated.View entering={FadeInDown.delay(40).duration(320)} style={[styles.row, {
      backgroundColor: theme.card,
      borderColor: theme.border
    }]}>
        <View style={{
        flex: 1
      }}>
          <Text style={[styles.rowLabel, {
          color: theme.text
        }]}> Daily Reminders</Text>
          <Text style={[styles.rowSub, {
          color: theme.textSub
        }]}>
            A daily task reminder and a learning nudge, scheduled locally on this device
          </Text>
        </View>
        <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{
        false: '#CBD5E1',
        true: '#1E3A8A'
      }} thumbColor="#fff" accessibilityLabel="Daily reminders" accessibilityRole="switch" {...touchTargetProps(a11y)} />
      </Animated.View>

      {permissionNote && <Text style={[styles.warningNote, {
      color: '#B45309'
    }]}>{permissionNote}</Text>}

      {notificationsEnabled && <TouchableOpacity style={[styles.testBtn, {
      borderColor: theme.border
    }]} onPress={handleSendTest} accessibilityRole="button" accessibilityLabel="Send a test notification in 5 seconds" {...touchTargetProps(a11y)}>
          <Text style={[styles.testBtnText, {
        color: theme.text
      }]}>
            {testSent ? 'Test scheduled - check in 5 seconds' : 'Send test notification (5s)'}
          </Text>
        </TouchableOpacity>}

      <Text style={[styles.sectionLabel, {
      color: theme.text
    }]} accessibilityRole="header">Accessibility</Text>
      <Text style={[styles.sectionNote, {
      color: theme.textSub
    }]}>
        These adjustments apply throughout the app immediately.
      </Text>

      {ACCESSIBILITY_OPTIONS.map((opt, index) => {
      const enabled = accessibilityFlags.includes(opt.key);
      return <Animated.View key={opt.key} entering={FadeInDown.delay(index * 60).duration(320)} style={[styles.row, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <View style={{
          flex: 1
        }}>
              <Text style={[styles.rowLabel, {
            color: theme.text
          }]}>{opt.label}</Text>
              <Text style={[styles.rowSub, {
            color: theme.textSub
          }]}>{opt.description}</Text>
            </View>
            <Switch value={enabled} onValueChange={() => toggleAccessibilityFlag(opt.key)} trackColor={{
          false: '#CBD5E1',
          true: '#1E3A8A'
        }} thumbColor="#fff" accessibilityLabel={`${opt.label} accessibility support`} accessibilityRole="switch" accessibilityHint={opt.description} {...touchTargetProps(a11y)} />
          </Animated.View>;
    })}

      <Text style={[styles.note, {
      color: theme.textSub
    }]}>
        Your choices are saved to your account.
      </Text>
    </ScrollView>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  scrollContent: {
    padding: SPACING.xxl,
    paddingBottom: SPACING.huge
  },
  title: {
    fontSize: TYPE.display.fontSize,
    fontWeight: 'bold',
    marginBottom: SPACING.xxl
  },
  sectionLabel: {
    fontSize: TYPE.title.fontSize - 2,
    fontWeight: 'bold',
    marginTop: SPACING.xxl + 4,
    marginBottom: SPACING.sm - 2
  },
  sectionNote: {
    fontSize: TYPE.caption.fontSize,
    marginBottom: SPACING.md + 2
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADII.adult.card,
    padding: SPACING.lg + 2,
    marginBottom: SPACING.md,
    ...getElevation('adult')
  },
  rowLabel: {
    fontSize: TYPE.body.fontSize + 1,
    fontWeight: 'bold'
  },
  rowSub: {
    fontSize: TYPE.caption.fontSize,
    marginTop: SPACING.xs,
    maxWidth: 240
  },
  note: {
    fontSize: TYPE.caption.fontSize,
    marginTop: SPACING.sm,
    textAlign: 'center'
  },
  warningNote: {
    fontSize: TYPE.caption.fontSize,
    marginBottom: SPACING.md,
    lineHeight: 17
  },
  testBtn: {
    borderWidth: 1,
    borderRadius: RADII.adult.card,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  testBtnText: {
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize + 1
  }
});
