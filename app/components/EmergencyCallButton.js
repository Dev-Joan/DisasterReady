import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Text from './Text';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { getEmergencyNumbers } from '../constants/emergencyNumbers';
import { EMERGENCY_COLORS } from '../constants/colors';
import { SPACING, getType, getElevation, AGE_PALETTES } from '../constants/tokens';
const TEEN = AGE_PALETTES.teen;
function callNumber(number) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  Linking.openURL(`tel:${number}`).catch(() => {
    Alert.alert('Could not open dialer', `Please dial ${number} directly.`);
  });
}
function ServiceButton({
  icon,
  label,
  number,
  color,
  textColor,
  a11y,
  compact
}) {
  return <TouchableOpacity style={[styles.serviceButton, {
    backgroundColor: color
  }, touchTargetStyle(a11y, compact ? 52 : 60)]} onPress={() => callNumber(number)} accessibilityRole="button" accessibilityLabel={`Call ${label}, ${number}`} {...touchTargetProps(a11y)}>
      <MaterialCommunityIcons name={icon} size={compact ? 20 : 24} color={textColor} />
      <Text style={[styles.serviceLabel, {
      color: textColor,
      fontSize: compact ? 11 : 13
    }]}>{label}</Text>
      <Text style={[styles.serviceNumber, {
      color: textColor,
      fontSize: compact ? 13 : 16
    }]}>{number}</Text>
    </TouchableOpacity>;
}
export default function EmergencyCallButton({
  country,
  mode,
  theme
}) {
  const {
    settings: a11y
  } = useAccessibility();
  const type = getType(mode);
  const isSenior = mode === 'elderly';
  const isTeen = mode === 'teen';
  const numbers = getEmergencyNumbers(country);
  const cardBg = isTeen ? TEEN.base : theme.card;
  const cardBorder = isTeen ? TEEN.border : theme.border;
  return <Animated.View entering={FadeInDown.duration(280)} style={{
    marginBottom: SPACING.md
  }}>
      <View style={[styles.card, isSenior && styles.cardSenior, {
      backgroundColor: cardBg,
      borderColor: EMERGENCY_COLORS.critical + '55'
    }, getElevation(mode, EMERGENCY_COLORS.critical, cardBorder)]}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="phone-alert" size={isSenior ? 24 : 20} color={EMERGENCY_COLORS.critical} />
          <Text style={[styles.headerText, {
          color: EMERGENCY_COLORS.critical,
          fontSize: (isSenior ? type.title : type.body).fontSize
        }]}>
            Emergency Call
          </Text>
        </View>

        {numbers.mode === 'unified' ? <TouchableOpacity style={[styles.unifiedButton, {
        backgroundColor: EMERGENCY_COLORS.critical
      }, touchTargetStyle(a11y, isSenior ? 64 : 52)]} onPress={() => callNumber(numbers.unified)} accessibilityRole="button" accessibilityLabel={`Call emergency services, ${numbers.unified}`} {...touchTargetProps(a11y)}>
            <MaterialCommunityIcons name="phone-in-talk" size={isSenior ? 26 : 22} color="#fff" />
            <Text style={[styles.unifiedText, {
          fontSize: isSenior ? 20 : 17
        }]}>Call {numbers.unified}</Text>
          </TouchableOpacity> : <View style={styles.serviceRow}>
            <ServiceButton icon="police-badge" label="Police" number={numbers.police} color={EMERGENCY_COLORS.neutralDark} textColor="#fff" a11y={a11y} compact={!isSenior} />
            <ServiceButton icon="fire-truck" label="Fire" number={numbers.fire} color={EMERGENCY_COLORS.warning} textColor="#fff" a11y={a11y} compact={!isSenior} />
            <ServiceButton icon="ambulance" label="Ambulance" number={numbers.ambulance} color={EMERGENCY_COLORS.critical} textColor="#fff" a11y={a11y} compact={!isSenior} />
          </View>}
      </View>
    </Animated.View>;
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: SPACING.md + 2
  },
  cardSenior: {
    borderRadius: 22,
    padding: SPACING.lg,
    borderWidth: 2
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2
  },
  headerText: {
    fontWeight: 'bold',
    marginLeft: SPACING.xs + 2
  },
  unifiedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14
  },
  unifiedText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: SPACING.sm
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  serviceButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: SPACING.sm + 2,
    marginHorizontal: 3
  },
  serviceLabel: {
    fontWeight: '600',
    marginTop: 2
  },
  serviceNumber: {
    fontWeight: 'bold',
    marginTop: 1
  }
});
