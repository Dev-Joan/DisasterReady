import React, { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/Text';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { KIT_CATEGORIES, KIT_ITEMS, recommendedQty, computeReadiness } from '../constants/kitPlanItems';
import { SPACING, TYPE, TYPE_SENIOR, RADII, SEMANTIC } from '../constants/tokens';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AnimatedProgressBar from '../components/AnimatedProgressBar';

// The adult/senior household emergency kit planner. Deliberately NOT a
// reskin of the kids' Kit Builder minigame: no mascot, no timer, no drag
// gesture, no stars — a practical checklist against real recommended
// quantities (FEMA/Ready.gov-style), scaled by household size and days of
// supply, with a readiness score derived from what the user actually has
// versus what's recommended. `isSenior` (same pattern as FirstAidScreen)
// swaps in larger type, bigger tap targets, and always-expanded categories
// instead of a denser collapsible accordion.
const ACCENT = SEMANTIC.success;

function KitItemRow({ item, haveQty, recommended, onChange, isSenior, theme, type }) {
  const met = recommended > 0 && haveQty >= recommended;
  const step = Math.max(1, Math.round(recommended / 10));
  return (
    <View style={[styles.itemRow, isSenior && styles.itemRowSenior, { borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, { fontSize: type.body.fontSize, color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.itemTarget, { fontSize: type.caption.fontSize, color: theme.textSub }]}>
          Target: {recommended} {item.unit}{recommended === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => onChange(item.id, -step)}
          style={[styles.stepBtn, isSenior && styles.stepBtnSenior, { borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${item.name}`}
        >
          <Text style={[styles.stepBtnText, isSenior && styles.stepBtnTextSenior, { color: theme.text }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { fontSize: type.body.fontSize, color: theme.text }]}>{haveQty}</Text>
        <TouchableOpacity
          onPress={() => onChange(item.id, step)}
          style={[styles.stepBtn, isSenior && styles.stepBtnSenior, { borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${item.name}`}
        >
          <Text style={[styles.stepBtnText, isSenior && styles.stepBtnTextSenior, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.itemCheck}>{met ? '✅' : '⬜'}</Text>
    </View>
  );
}

export default function HouseholdKitPlannerScreen({ navigation }) {
  const { userId } = useUser();
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();

  const [profile, setProfile] = useState(null);
  const [householdSize, setHouseholdSize] = useState(1);
  const [daysTarget, setDaysTarget] = useState(3);
  const [have, setHave] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(null);
  const [expandedCats, setExpandedCats] = useState(() => new Set());

  const load = useCallback(async () => {
    setError(false);
    try {
      const [profileRes, planRes] = await Promise.all([
        apiRequest(`/onboarding/profile?userId=${userId}`, 'GET'),
        apiRequest(`/kit-plan?userId=${userId}`, 'GET')
      ]);
      setProfile(profileRes);
      setHouseholdSize(planRes.householdSize || 1);
      setDaysTarget(planRes.daysTarget || 3);
      setHave(planRes.items || {});
    } catch (err) {
      console.log('Kit planner load error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <LoadingState message="Loading your kit plan..." />;
  if (error) return <ErrorState onRetry={load} />;

  const isSenior = profile.experienceMode === 'elderly';
  const type = isSenior ? TYPE_SENIOR : TYPE;
  const radius = isSenior ? RADII.elderly : RADII.adult;
  const readiness = computeReadiness(KIT_ITEMS, have, householdSize, daysTarget);

  const setQty = (itemId, delta) => {
    setHave((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
    setSavedNote(null);
  };

  const toggleCat = (catId) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest('/kit-plan', 'POST', { userId, householdSize, daysTarget, items: have });
      setSavedNote('Saved');
    } catch (err) {
      console.log('Kit planner save error:', err.message);
      setSavedNote('Could not save — check your connection');
    } finally {
      setSaving(false);
    }
  };

  const shareSummary = async () => {
    const lines = [
      `HOUSEHOLD EMERGENCY KIT — ${readiness}% ready`,
      `Household size: ${householdSize} · Supply target: ${daysTarget} days`,
      ''
    ];
    KIT_CATEGORIES.forEach((cat) => {
      const items = KIT_ITEMS.filter((i) => i.category === cat.id);
      lines.push(`${cat.icon} ${cat.label}`);
      items.forEach((item) => {
        const rec = recommendedQty(item, householdSize, daysTarget);
        const haveQty = have[item.id] || 0;
        lines.push(`  ${haveQty >= rec ? '[x]' : '[ ]'} ${item.name}: ${haveQty}/${rec} ${item.unit}${rec === 1 ? '' : 's'}`);
      });
      lines.push('');
    });
    try {
      await Share.share({ message: lines.join('\n'), title: 'Household Emergency Kit Summary' });
    } catch (err) {
      console.log('Kit planner share error:', err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={[styles.container, isSenior && styles.containerSenior]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ alignSelf: 'flex-start', marginBottom: SPACING.sm }}
        accessibilityRole="button"
        accessibilityLabel="Back"
        {...touchTargetProps(a11y)}
      >
        <Text style={[styles.backBtn, { color: theme.textSub }]}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { fontSize: type.display.fontSize - (isSenior ? 0 : 4), color: theme.text }]}>Household Emergency Kit</Text>
      <Text style={[styles.sub, { fontSize: type.body.fontSize, color: theme.textSub }]}>
        Track what you actually have against real recommended quantities — not just a shopping list.
      </Text>

      <View style={[styles.readinessCard, { backgroundColor: ACCENT + '14', borderColor: ACCENT, borderRadius: radius.card }]}>
        <Text style={[styles.readinessScore, { fontSize: isSenior ? 56 : 44, color: ACCENT }]}>{readiness}%</Text>
        <Text style={[styles.readinessLabel, { fontSize: type.body.fontSize, color: theme.text }]}>Ready</Text>
        <AnimatedProgressBar progress={readiness} trackColor={theme.border} fillColor={ACCENT} height={isSenior ? 16 : 10} />
      </View>

      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border, borderRadius: radius.card }]}>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: type.body.fontSize, color: theme.text }]}>Household size</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={() => { setHouseholdSize((s) => Math.max(1, s - 1)); setSavedNote(null); }}
              style={[styles.stepBtn, isSenior && styles.stepBtnSenior, { borderColor: theme.border }]}
              accessibilityRole="button"
              accessibilityLabel="Decrease household size"
            >
              <Text style={[styles.stepBtnText, isSenior && styles.stepBtnTextSenior, { color: theme.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepperValue, { fontSize: type.body.fontSize, color: theme.text }]}>{householdSize}</Text>
            <TouchableOpacity
              onPress={() => { setHouseholdSize((s) => Math.min(12, s + 1)); setSavedNote(null); }}
              style={[styles.stepBtn, isSenior && styles.stepBtnSenior, { borderColor: theme.border }]}
              accessibilityRole="button"
              accessibilityLabel="Increase household size"
            >
              <Text style={[styles.stepBtnText, isSenior && styles.stepBtnTextSenior, { color: theme.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { fontSize: type.body.fontSize, color: theme.text }]}>Supply target</Text>
          <View style={{ flexDirection: 'row' }}>
            {[3, 7, 14].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => { setDaysTarget(d); setSavedNote(null); }}
                style={[styles.dayPill, { borderColor: theme.border, borderRadius: radius.chip }, daysTarget === d && { backgroundColor: ACCENT, borderColor: ACCENT }, touchTargetStyle(a11y, isSenior ? 52 : 40)]}
                accessibilityRole="button"
                accessibilityLabel={`${d} day supply target`}
                accessibilityState={{ selected: daysTarget === d }}
                {...touchTargetProps(a11y)}
              >
                <Text style={[styles.dayPillText, { fontSize: type.caption.fontSize + 1, color: daysTarget === d ? '#fff' : theme.text }]}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {KIT_CATEGORIES.map((cat) => {
        const items = KIT_ITEMS.filter((i) => i.category === cat.id);
        const catReadiness = computeReadiness(items, have, householdSize, daysTarget);
        const expanded = isSenior || expandedCats.has(cat.id);
        const HeaderComponent = isSenior ? View : TouchableOpacity;
        return (
          <View key={cat.id} style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border, borderRadius: radius.card }]}>
            <HeaderComponent
              onPress={isSenior ? undefined : () => toggleCat(cat.id)}
              style={styles.categoryHeader}
              accessibilityRole={isSenior ? undefined : 'button'}
              accessibilityLabel={isSenior ? undefined : `${cat.label}, ${catReadiness} percent ready`}
              {...(isSenior ? {} : touchTargetProps(a11y))}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, { fontSize: type.title.fontSize - (isSenior ? 2 : 4), color: theme.text }]}>{cat.label}</Text>
              <Text style={[styles.categoryPct, { fontSize: type.caption.fontSize + 1, color: catReadiness >= 100 ? ACCENT : theme.textSub }]}>{catReadiness}%</Text>
              {!isSenior && <Text style={[styles.chevron, { color: theme.textSub }]}>{expanded ? '▲' : '▼'}</Text>}
            </HeaderComponent>
            {expanded && items.map((item) => (
              <KitItemRow
                key={item.id}
                item={item}
                haveQty={have[item.id] || 0}
                recommended={recommendedQty(item, householdSize, daysTarget)}
                onChange={setQty}
                isSenior={isSenior}
                theme={theme}
                type={type}
              />
            ))}
          </View>
        );
      })}

      <View style={[styles.actionsRow, isSenior && styles.actionsColSenior]}>
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          style={[styles.saveBtn, isSenior && styles.actionBtnSenior, { backgroundColor: ACCENT, borderRadius: radius.button }, touchTargetStyle(a11y, isSenior ? 60 : 48)]}
          accessibilityRole="button"
          accessibilityLabel="Save progress"
          {...touchTargetProps(a11y)}
        >
          <Text style={[styles.saveBtnText, { fontSize: type.body.fontSize }]}>{saving ? 'Saving…' : '💾 Save Progress'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={shareSummary}
          style={[styles.shareBtn, isSenior && styles.actionBtnSenior, { borderColor: ACCENT, borderRadius: radius.button }, touchTargetStyle(a11y, isSenior ? 60 : 48)]}
          accessibilityRole="button"
          accessibilityLabel="Share summary"
          {...touchTargetProps(a11y)}
        >
          <Text style={[styles.shareBtnText, { fontSize: type.body.fontSize, color: ACCENT }]}>📤 Share Summary</Text>
        </TouchableOpacity>
      </View>
      {savedNote && <Text style={[styles.savedNote, { color: theme.textSub }]}>{savedNote}</Text>}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  containerSenior: { padding: SPACING.xl + 4 },
  backBtn: { fontSize: 15, fontWeight: 'bold' },
  title: { fontWeight: 'bold', marginBottom: SPACING.xs },
  sub: { marginBottom: SPACING.lg, lineHeight: 20 },

  readinessCard: { borderRadius: RADII.adult.card, borderWidth: 1, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
  readinessScore: { fontWeight: 'bold' },
  readinessLabel: { fontWeight: 'bold', marginBottom: SPACING.sm, marginTop: -4 },

  settingsCard: { borderRadius: RADII.adult.card, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.lg },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  settingLabel: { fontWeight: '600' },
  dayPill: { borderWidth: 1, borderRadius: RADII.adult.chip, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginLeft: SPACING.xs, alignItems: 'center', justifyContent: 'center' },
  dayPillText: { fontWeight: 'bold' },

  categoryCard: { borderRadius: RADII.adult.card, borderWidth: 1, marginBottom: SPACING.md, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md + 2 },
  categoryIcon: { fontSize: 20, marginRight: SPACING.sm },
  categoryLabel: { flex: 1, fontWeight: 'bold' },
  categoryPct: { fontWeight: 'bold', marginRight: SPACING.sm },
  chevron: { fontSize: 12 },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md + 2, paddingVertical: SPACING.sm + 2, borderTopWidth: 1 },
  itemRowSenior: { paddingVertical: SPACING.md + 2 },
  itemName: { fontWeight: '600' },
  itemTarget: { marginTop: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.sm },
  stepBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepBtnSenior: { width: 40, height: 40, borderRadius: 20 },
  stepBtnText: { fontWeight: 'bold', fontSize: 16 },
  stepBtnTextSenior: { fontSize: 20 },
  stepperValue: { minWidth: 30, textAlign: 'center', fontWeight: 'bold' },
  itemCheck: { fontSize: 16, marginLeft: SPACING.xs },

  actionsRow: { flexDirection: 'row', marginTop: SPACING.md },
  actionsColSenior: { flexDirection: 'column' },
  actionBtnSenior: { marginBottom: SPACING.sm },
  saveBtn: { flex: 1, borderRadius: RADII.adult.button, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, marginRight: SPACING.sm },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  shareBtn: { flex: 1, borderRadius: RADII.adult.button, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md },
  shareBtnText: { fontWeight: 'bold' },
  savedNote: { textAlign: 'center', marginTop: SPACING.sm, fontSize: 12, fontStyle: 'italic' }
});
