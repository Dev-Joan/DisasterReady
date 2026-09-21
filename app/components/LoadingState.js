import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Text from './Text';
import { useTheme } from '../context/ThemeContext';

export default function LoadingState({ message = 'Loading...' }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.bg }]} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color="#1E3A8A" />
      <Text style={[styles.message, { color: theme.textSub }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { fontSize: 14, marginTop: 12 }
});
