import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { EMERGENCY_COLORS } from '../constants/colors';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { SPACING, TYPE, TYPE_SENIOR, RADII, getElevation } from '../constants/tokens';

const SEVERITY_STYLE = {
  critical: { color: EMERGENCY_COLORS.critical, label: 'CRITICAL ALERT' },
  warning: { color: EMERGENCY_COLORS.warning, label: 'WARNING' },
  advisory: { color: EMERGENCY_COLORS.advisory, label: 'ADVISORY' },
  safe: { color: EMERGENCY_COLORS.safe, label: 'ALL CLEAR' }
};

function formatCheckedAt(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export default function AlertsScreen() {
  const { userId } = useUser();
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();
  const [alerts, setAlerts] = useState([]);
  const [country, setCountry] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [experienceMode, setExperienceMode] = useState('adult');
  const [isSenior, setIsSenior] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggleExpanded = (alertId) => {
    setExpandedIds((prev) => ({ ...prev, [alertId]: !prev[alertId] }));
  };

  const load = useCallback(async () => {
    setError(false);
    try {
      const profile = await apiRequest(`/onboarding/profile?userId=${userId}`, 'GET');
      setIsSenior(profile.experienceMode === 'elderly');
      // Country is resolved server-side from userId (routes/alerts.js) —
      // no need to pass region/country here at all.
      const result = await apiRequest(`/alerts/active?userId=${userId}`, 'GET');
      setCountry(result.country);
      setLastCheckedAt(result.lastCheckedAt);
      setExperienceMode(result.experienceMode || 'adult');
      setAlerts(result.alerts || []);
    } catch (err) {
      console.log('Alerts error:', err.message);
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

  if (loading) return <LoadingState message="Checking for alerts..." />;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
    >
      <Text style={[styles.title, { color: theme.text, fontSize: (isSenior ? TYPE_SENIOR : TYPE).display.fontSize - 2 }]} accessibilityRole="header">🚨 Alerts Near You</Text>
      <Text style={[styles.subtitle, { color: theme.textSub, fontSize: (isSenior ? TYPE_SENIOR : TYPE).caption.fontSize + 1 }]}>
        {country || 'Your area'}{lastCheckedAt ? ` · Checked ${formatCheckedAt(lastCheckedAt)}` : ''}
      </Text>

      {alerts.map((alert, index) => {
        const sev = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.advisory;
        const type = isSenior ? TYPE_SENIOR : TYPE;
        const hazardLabel = alert.hazard.replace(/_/g, ' ').toUpperCase();
        const sourceLabel = alert.source === 'official' ? 'Official government warning' : 'Estimated from forecast data';
        const isExpanded = !!expandedIds[alert.alertId];
        // adaptedMessage is always safe to show as the primary text — it's
        // either a validated, profile-adapted rewrite or (on any rewrite
        // error or validation failure) exactly the original text. The
        // toggle below is what makes this feature inspectable: it lets you
        // show the original and adapted wording side by side on demand.
        return (
          <Animated.View
            key={alert.alertId}
            entering={isSenior ? FadeInDown.delay(index * 160).duration(520) : FadeIn.delay(index * 50).duration(240)}
            style={[styles.alertCard, isSenior && styles.alertCardSenior, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: sev.color }, isSenior && getElevation('elderly', null, sev.color)]}
            accessible
            accessibilityLabel={`${sev.label}: ${hazardLabel}. ${alert.adaptedMessage} Source: ${sourceLabel}.`}
          >
            <View style={styles.alertHeaderRow}>
              <Text style={[styles.alertSeverity, { color: sev.color, fontSize: type.caption.fontSize + 1 }]}>{sev.label}</Text>
              <View style={[styles.sourceBadge, { borderColor: theme.border, backgroundColor: alert.source === 'official' ? sev.color + '22' : theme.bg }]}>
                <Text style={[styles.sourceBadgeText, { color: alert.source === 'official' ? sev.color : theme.textSub, fontSize: type.caption.fontSize - 1 }]}>
                  {alert.source === 'official' ? '🏛️ Official' : '📈 Derived'}
                </Text>
              </View>
            </View>
            <Text style={[styles.alertHazard, { color: theme.textSub, fontSize: type.caption.fontSize }]}>{hazardLabel}</Text>
            <Text style={[styles.alertMessage, { color: theme.text, fontSize: type.body.fontSize + 1, lineHeight: type.body.lineHeight + 4 }]}>{alert.adaptedMessage}</Text>

            {!alert.wasAdapted && (
              <Text style={[styles.fallbackNote, { color: theme.textSub, fontSize: type.caption.fontSize - 1 }]}>
                ⓘ Showing original wording — the {experienceMode}-adapted rewrite {alert.fallbackReason ? `wasn't used (${alert.fallbackReason})` : "wasn't used"}.
              </Text>
            )}

            <TouchableOpacity
              onPress={() => toggleExpanded(alert.alertId)}
              style={[styles.compareToggle, touchTargetStyle(a11y, 32)]}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? 'Hide original wording' : 'Compare with original wording'}
              accessibilityHint={`Shows how this advisory reads before it was adapted for ${experienceMode}`}
              {...touchTargetProps(a11y)}
            >
              <Text style={[styles.compareToggleText, { color: theme.textSub }]}>
                {isExpanded ? '▲ Hide original' : `▼ Compare with original (${experienceMode}-adapted: ${alert.wasAdapted ? 'yes' : 'no, fell back'})`}
              </Text>
            </TouchableOpacity>

            {isExpanded && (
              <Animated.View entering={FadeIn.duration(180)} style={[styles.originalBox, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                <Text style={[styles.originalLabel, { color: theme.textSub, fontSize: type.caption.fontSize - 1 }]}>ORIGINAL ADVISORY TEXT</Text>
                <Text style={[styles.originalText, { color: theme.text, fontSize: type.caption.fontSize + 1 }]}>{alert.message}</Text>
              </Animated.View>
            )}

            <Text style={[styles.alertAdvice, { color: theme.textSub, fontSize: type.caption.fontSize }]}>
              {alert.source === 'official'
                ? 'Issued by official meteorological services. Always follow instructions from local emergency services.'
                : 'Estimated from forecast conditions, not an official warning. In a real emergency, always follow instructions from official emergency services.'}
            </Text>
          </Animated.View>
        );
      })}

      {alerts.length === 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.alertCard, isSenior && styles.alertCardSenior, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: EMERGENCY_COLORS.safe }]}
          accessible
          accessibilityLabel={`All clear. No active alerts in ${country || 'your area'} right now, checked against official warnings and current forecast conditions.`}
        >
          <Text style={[styles.alertSeverity, { color: EMERGENCY_COLORS.safe, fontSize: (isSenior ? TYPE_SENIOR : TYPE).caption.fontSize + 1 }]}>ALL CLEAR</Text>
          <Text style={[styles.alertMessage, { color: theme.text, fontSize: (isSenior ? TYPE_SENIOR : TYPE).body.fontSize + 1 }]}>No active alerts in your area right now.</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl },
  title: { fontWeight: 'bold' },
  subtitle: { marginBottom: SPACING.xl },
  alertCard: {
    borderRadius: RADII.adult.card, borderLeftWidth: 6, padding: SPACING.lg, marginBottom: SPACING.lg - 2,
    ...getElevation('adult')
  },
  alertCardSenior: { borderRadius: RADII.elderly.card, padding: SPACING.xl, marginBottom: SPACING.lg + 6, borderLeftWidth: 8 },
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  sourceBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  sourceBadgeText: { fontWeight: '600' },
  alertSeverity: { fontWeight: 'bold', letterSpacing: 1 },
  alertHazard: { marginBottom: SPACING.sm },
  alertMessage: { marginBottom: SPACING.sm },
  fallbackNote: { fontStyle: 'italic', marginBottom: SPACING.sm },
  compareToggle: { alignSelf: 'flex-start', paddingVertical: SPACING.xs, marginBottom: SPACING.xs },
  compareToggleText: { fontWeight: '600', fontSize: TYPE.caption.fontSize },
  originalBox: { borderWidth: 1, borderRadius: 8, padding: SPACING.md, marginBottom: SPACING.sm },
  originalLabel: { fontWeight: 'bold', letterSpacing: 0.5, marginBottom: SPACING.xs },
  originalText: { fontStyle: 'italic' },
  alertAdvice: { fontSize: TYPE.caption.fontSize, fontStyle: 'italic' }
});
