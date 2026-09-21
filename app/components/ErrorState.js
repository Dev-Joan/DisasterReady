import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';

export default function ErrorState({ message = "Something went wrong. Please check your connection.", onRetry }) {
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();

  return (
    <View style={[styles.center, { backgroundColor: theme.bg }]} accessibilityLiveRegion="assertive">
      <MaterialCommunityIcons name="wifi-off" size={44} color="#DC2626" />
      <Text style={[styles.title, { color: theme.text }]}>Couldn't load this</Text>
      <Text style={[styles.message, { color: theme.textSub }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryBtn, touchTargetStyle(a11y, 48)]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { fontSize: 18, fontWeight: 'bold', marginTop: 14 },
  message: { fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  retryBtn: { backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 20 },
  retryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});
