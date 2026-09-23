import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import WeatherLottieIcon from '../components/WeatherLottieIcon';
import { getWeatherLottieSource, getWeatherAccentColor } from '../constants/weatherLottie';
import { SPACING, SEMANTIC, getAgePalette, getType, getElevation } from '../constants/tokens';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

function formatUpdatedAt(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

function dayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}

// Forecast-card icons are deliberately STATIC (pinned frame, never
// animating) regardless of reducedMotion — the point of the big hero icon
// is that it's the one thing on this screen that moves; five more
// simultaneously-looping Lottie players in a row would be visual noise
// competing with it, not "clean forecast cards".
function ForecastIcon({ weatherCode, size = 44 }) {
  return (
    <LottieView
      source={getWeatherLottieSource(weatherCode)}
      autoPlay={false}
      loop={false}
      progress={0.5}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export default function WeatherScreen() {
  const { userId } = useUser();
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();
  const [experienceMode, setExperienceMode] = useState('adult');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const profile = await apiRequest(`/onboarding/profile?userId=${userId}`, 'GET');
      setExperienceMode(profile.experienceMode || 'adult');
      const result = await apiRequest(`/weather?userId=${userId}`, 'GET');
      setWeather(result);
    } catch (err) {
      console.log('Weather load error:', err.message);
      setErrorMessage(err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingState message="Checking the forecast..." />;
  if (error || !weather) {
    return <ErrorState message={errorMessage || "Couldn't load the weather. Please check your connection."} onRetry={load} />;
  }

  const palette = getAgePalette(experienceMode);
  const type = getType(experienceMode);
  const isStale = weather.source === 'cache-stale';
  const { current, forecast } = weather;
  const accent = getWeatherAccentColor(current.weatherCode);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[type.title, { color: theme.text }]} accessibilityRole="header">Weather</Text>
          <Text style={[type.caption, { color: theme.textSub }]}>{weather.country}</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { borderColor: theme.border }, touchTargetStyle(a11y, 40)]}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh weather"
          accessibilityHint="Checks for the latest conditions and forecast"
          {...touchTargetProps(a11y)}
        >
          <Text style={{ color: palette.primary, fontWeight: 'bold' }}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {isStale && (
        <View style={[styles.staleBanner, { backgroundColor: theme.card, borderColor: SEMANTIC.signal }]} accessibilityLiveRegion="polite">
          <Text style={[type.caption, { color: SEMANTIC.signal }]}>
            {'⚠️'} Showing the last saved forecast from {formatUpdatedAt(weather.fetchedAt)} — couldn't reach the weather service just now.
          </Text>
        </View>
      )}

      <Animated.View
        entering={FadeInDown.duration(320)}
        style={[styles.currentCard, { backgroundColor: theme.card, borderColor: accent + '33' }, getElevation(experienceMode, accent, theme.border)]}
        accessible
        accessibilityLabel={`Currently ${Math.round(current.temperature)} degrees, ${current.description}, feels like ${Math.round(current.apparentTemperature)} degrees, humidity ${current.humidity} percent, wind ${Math.round(current.windSpeed)} kilometers per hour`}
      >
        <View style={[styles.currentGlow, { backgroundColor: accent + '14' }]} />
        <WeatherLottieIcon weatherCode={current.weatherCode} size={140} />
        <Text style={[type.display, styles.currentTemp, { color: theme.text }]}>{Math.round(current.temperature)}°</Text>
        <Text style={[type.body, styles.currentDesc, { color: accent }]}>{current.description}</Text>
        <View style={styles.currentMetaRow}>
          <View style={[styles.metaPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[type.caption, { color: theme.textSub }]}>Feels like {Math.round(current.apparentTemperature)}°</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[type.caption, { color: theme.textSub }]}>{'💧'} {current.humidity}%</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[type.caption, { color: theme.textSub }]}>{'💨'} {Math.round(current.windSpeed)} km/h</Text>
          </View>
        </View>
        {!isStale && (
          <Text style={[type.caption, styles.updatedText, { color: theme.textSub }]}>Updated {formatUpdatedAt(weather.fetchedAt)}</Text>
        )}
      </Animated.View>

      <Text style={[type.title, styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">{forecast.length}-Day Forecast</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastRow}>
        {forecast.map((day, i) => (
          <Animated.View
            key={day.date}
            entering={FadeIn.delay(i * 60).duration(280)}
            style={[styles.forecastCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            accessible
            accessibilityLabel={`${dayLabel(day.date, i)}: ${day.description}, high ${Math.round(day.tempMax)} degrees, low ${Math.round(day.tempMin)} degrees${day.precipitationProbability ? `, ${day.precipitationProbability} percent chance of precipitation` : ''}`}
          >
            <Text style={[type.caption, styles.forecastDay, { color: theme.text }]}>{dayLabel(day.date, i)}</Text>
            <ForecastIcon weatherCode={day.weatherCode} />
            <Text style={[type.body, { color: theme.text, fontWeight: 'bold' }]}>{Math.round(day.tempMax)}°</Text>
            <Text style={[type.caption, { color: theme.textSub }]}>{Math.round(day.tempMin)}°</Text>
            {day.precipitationProbability > 0 && (
              <Text style={[styles.forecastRain, { color: '#0EA5E9' }]}>{'💧'} {day.precipitationProbability}%</Text>
            )}
          </Animated.View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  refreshBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, justifyContent: 'center', alignItems: 'center' },

  staleBanner: { borderWidth: 1, borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md },

  currentCard: { borderRadius: 24, borderWidth: 1.5, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl, overflow: 'hidden' },
  currentGlow: { position: 'absolute', top: -60, left: -60, right: -60, height: 220, borderRadius: 200 },
  currentTemp: { fontSize: 60, lineHeight: 68, fontWeight: 'bold', marginTop: SPACING.sm, letterSpacing: -1 },
  currentDesc: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  currentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: SPACING.lg },
  metaPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs, marginHorizontal: 4, marginTop: SPACING.xs },
  updatedText: { marginTop: SPACING.md, fontStyle: 'italic' },

  sectionTitle: { marginBottom: SPACING.md },
  forecastRow: { paddingBottom: SPACING.sm, paddingRight: SPACING.lg },
  forecastCard: {
    width: 92, alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingVertical: SPACING.md, marginRight: SPACING.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1
  },
  forecastDay: { fontWeight: 'bold', marginBottom: 2 },
  forecastRain: { fontSize: 11, fontWeight: 'bold', marginTop: 4 }
});
