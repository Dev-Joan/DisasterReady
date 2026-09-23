import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Text from './Text';
import WeatherLottieIcon from './WeatherLottieIcon';
import { getWeatherAccentColor } from '../constants/weatherLottie';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { SPACING, getAgePalette, getType, getElevation } from '../constants/tokens';

// A quiet "at a glance" weather card for the adult/senior home screens —
// distinct from the full WeatherScreen (multi-day forecast, refresh
// button, detailed metrics): this is just today's condition, temperature,
// and any active advisory, tappable through to the full screen. Ambient
// glow behind the icon is the one bit of extra motion here (the Lottie
// icon itself already animates and already handles reducedMotion — see
// WeatherLottieIcon), so it's gated on reducedMotion the same way every
// other ambient effect in this app is.
export default function WeatherSummaryCard({ weather, mode, advisory, theme, onPress }) {
  const { settings: a11y } = useAccessibility();
  const glow = useSharedValue(a11y.reducedMotion ? 0.5 : 0);

  useEffect(() => {
    if (a11y.reducedMotion) { glow.value = 0.5; return; }
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0.4, { duration: 1400 })), -1, true);
  }, [a11y.reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.22,
    transform: [{ scale: 0.9 + glow.value * 0.25 }]
  }));

  if (!weather || !weather.current) return null;

  const { current } = weather;
  const accent = getWeatherAccentColor(current.weatherCode);
  const palette = getAgePalette(mode);
  const type = getType(mode);
  const isSenior = mode === 'elderly';

  return (
    <Animated.View entering={FadeInDown.duration(320)} style={{ marginBottom: SPACING.md }}>
      <TouchableOpacity
        style={[
          styles.card,
          isSenior && styles.cardSenior,
          { backgroundColor: theme.card, borderColor: accent + '33' },
          getElevation(mode, accent, theme.border)
        ]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Weather: ${Math.round(current.temperature)} degrees, ${current.description}${advisory ? `. Active advisory: ${advisory.message}` : ''}. Opens the full weather screen.`}
        {...touchTargetProps(a11y)}
      >
        <View style={styles.iconStage}>
          <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: accent }, glowStyle]} />
          <WeatherLottieIcon weatherCode={current.weatherCode} size={isSenior ? 76 : 64} />
        </View>

        <View style={styles.info}>
          <View style={styles.tempRow}>
            <Text style={[styles.temp, { color: theme.text, fontSize: isSenior ? 34 : 28 }]}>{Math.round(current.temperature)}°</Text>
            <Text style={[styles.desc, { color: accent, fontSize: type.body.fontSize }]}>{current.description}</Text>
          </View>
          <Text style={[styles.feelsLike, { color: theme.textSub, fontSize: type.caption.fontSize }]}>
            Feels like {Math.round(current.apparentTemperature)}°
          </Text>
          {advisory && (
            <View style={[styles.advisoryRow, { backgroundColor: palette.accent + '18' }]}>
              <Text style={[styles.advisoryText, { color: palette.accent, fontSize: type.caption.fontSize }]} numberOfLines={2}>
                ⚠️ {advisory.message}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.chevron, { color: theme.textSub }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1.5, padding: SPACING.md + 2, overflow: 'hidden' },
  cardSenior: { borderRadius: 22, padding: SPACING.lg, borderWidth: 2 },
  iconStage: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 76, height: 76, borderRadius: 38 },
  info: { flex: 1, marginLeft: SPACING.sm },
  tempRow: { flexDirection: 'row', alignItems: 'baseline' },
  temp: { fontWeight: 'bold', marginRight: SPACING.sm },
  desc: { fontWeight: '600' },
  feelsLike: { marginTop: 2 },
  advisoryRow: { borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 4, marginTop: SPACING.xs + 2, alignSelf: 'flex-start' },
  advisoryText: { fontWeight: 'bold' },
  chevron: { fontSize: 26, fontWeight: 'bold', marginLeft: SPACING.xs }
});
