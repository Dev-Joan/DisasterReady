import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
export default function HearButton({
  onPress,
  label = 'Hear it',
  size = 44
}) {
  return <TouchableOpacity style={[styles.button, {
    width: size,
    height: size,
    borderRadius: size / 2
  }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.text, {
      fontSize: size * 0.45
    }]}>🔊</Text>
    </TouchableOpacity>;
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {}
});
