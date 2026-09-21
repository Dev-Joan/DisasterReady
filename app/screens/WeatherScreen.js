import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
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
        entering={FadeInDown.duration(280)}
        style={[styles.currentCard, { backgroundColor: theme.card }, getElevation(experienceMode, palette.primary, theme.border)]}
        accessible
        accessibilityLabel={`Currently ${Math.round(current.temperature)} degrees, ${current.description}, feels like ${Math.round(current.apparentTemperature)} degrees, humidity ${current.humidity} percent, wind ${Math.round(current.windSpeed)} kilometers per hour`}
      >
        <Text style={styles.currentIcon}>{current.icon}</Text>
        <Text style={[type.display, { color: theme.text }]}>{Math.round(current.temperature)}°C</Text>
        <Text style={[type.body, { color: theme.textSub }]}>{current.description}</Text>
        <View style={styles.currentMetaRow}>
          <Text style={[type.caption, styles.currentMeta, { color: theme.textSub }]}>Feels like {Math.round(current.apparentTemperature)}°C</Text>
          <Text style={[type.caption, styles.currentMeta, { color: theme.textSub }]}>{'💧'} {current.humidity}%</Text>
          <Text style={[type.caption, styles.currentMeta, { color: theme.textSub }]}>{'💨'} {Math.round(current.windSpeed)} km/h</Text>
        </View>
        {!isStale && (
          <Text style={[type.caption, styles.updatedText, { color: theme.textSub }]}>Updated {formatUpdatedAt(weather.fetchedAt)}</Text>
        )}
      </Animated.View>

      <Text style={[type.title, styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">{forecast.length}-Day Forecast</Text>

      {forecast.map((day, i) => (
        <Animated.View
          key={day.date}
          entering={FadeInDown.delay(i * 50).duration(280)}
          style={[styles.forecastRow, { backgroundColor: theme.card, borderColor: theme.border }]}
          accessible
          accessibilityLabel={`${dayLabel(day.date, i)}: ${day.description}, high ${Math.round(day.tempMax)} degrees, low ${Math.round(day.tempMin)} degrees${day.precipitationProbability ? `, ${day.precipitationProbability} percent chance of precipitation` : ''}`}
        >
          <Text style={[type.body, styles.forecastDay, { color: theme.text }]}>{dayLabel(day.date, i)}</Text>
          <Text style={styles.forecastIcon}>{day.icon}</Text>
          <Text style={[type.caption, styles.forecastDesc, { color: theme.textSub }]} numberOfLines={1}>{day.description}</Text>
          <View style={styles.forecastTemps}>
            <Text style={[type.body, { color: theme.text, fontWeight: 'bold' }]}>{Math.round(day.tempMax)}°</Text>
            <Text style={[type.body, { color: theme.textSub }]}>{Math.round(day.tempMin)}°</Text>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  refreshBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, justifyContent: 'center', alignItems: 'center' },

  staleBanner: { borderWidth: 1, borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md },

  currentCard: { borderRadius: 16, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl },
  currentIcon: { fontSize: 56, marginBottom: SPACING.xs },
  currentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: SPACING.md },
  currentMeta: { marginHorizontal: SPACING.sm, marginTop: SPACING.xs },
  updatedText: { marginTop: SPACING.md, fontStyle: 'italic' },

  sectionTitle: { marginBottom: SPACING.md },
  forecastRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12,
    padding: SPACING.md, marginBottom: SPACING.sm
  },
  forecastDay: { width: 56 },
  forecastIcon: { fontSize: 24, marginHorizontal: SPACING.md },
  forecastDesc: { flex: 1 },
  forecastTemps: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }
});
