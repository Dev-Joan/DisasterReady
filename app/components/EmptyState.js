import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({ icon = 'tray-outline', title = 'Nothing here yet', message }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center}>
      <MaterialCommunityIcons name={icon} size={40} color={theme.textSub} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: theme.textSub }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  message: { fontSize: 13, marginTop: 4, textAlign: 'center', lineHeight: 18 }
});
