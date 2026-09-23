import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import apiRequest from '../services/api';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { FIRST_AID_CATEGORIES, FIRST_AID_GUIDES, EMERGENCY_DISCLAIMER } from '../constants/firstAid';
import { SPACING, TYPE, TYPE_SENIOR, RADII, getElevation } from '../constants/tokens';

export default function FirstAidScreen({ navigation }) {
  const { theme } = useTheme();
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [isSenior, setIsSenior] = useState(false);
  let cardIndex = 0;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiRequest(`/onboarding/profile?userId=${userId}`, 'GET')
        .then((profile) => { if (active) setIsSenior(profile.experienceMode === 'elderly'); })
        .catch(() => {});
      return () => { active = false; };
    }, [userId])
  );

  const type = isSenior ? TYPE_SENIOR : TYPE;

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInDown.duration(320)} style={styles.heroBand}>
        <MaterialCommunityIcons name="medical-bag" size={110} color="#fff" style={styles.heroWatermark} />
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="shield-cross" size={26} color="#B91C1C" />
        </View>
        <Text style={[styles.title, { fontSize: type.display.fontSize - 2 }]} accessibilityRole="header">First Aid</Text>
        <Text style={[styles.sub, { fontSize: type.body.fontSize - 1 }]}>Quick, calm step-by-step guidance for emergencies.</Text>
      </Animated.View>

      <View style={styles.disclaimerBox} accessibilityLabel={`Disclaimer: ${EMERGENCY_DISCLAIMER}`}>
        <MaterialCommunityIcons name="alert-decagram" size={isSenior ? 24 : 20} color="#92400E" />
        <Text style={[styles.disclaimerText, { fontSize: type.caption.fontSize }]}>{EMERGENCY_DISCLAIMER}</Text>
      </View>

      {FIRST_AID_CATEGORIES.map((cat) => (
        <View key={cat.key}>
          <View style={[styles.catHeader, { backgroundColor: cat.color + '14', borderColor: cat.color + '33' }]} accessibilityRole="header">
            <View style={[styles.catIconBadge, { backgroundColor: cat.color }]}>
              <MaterialCommunityIcons name={cat.icon.name} size={isSenior ? 24 : 20} color="#fff" />
            </View>
            <Text style={[styles.catTitle, { color: cat.color, fontSize: type.title.fontSize - 2 }]}>{cat.label}</Text>
          </View>
          {/* Adult: compact 2-column grid for quick scanning. Senior: one
              full-width card at a time, larger target, slower entrance. */}
          <View style={isSenior ? undefined : styles.grid}>
            {FIRST_AID_GUIDES.filter(g => g.category === cat.key).map((guide) => {
              const delay = cardIndex++ * (isSenior ? 130 : 55);
              return (
                <Animated.View
                  key={guide.id}
                  entering={
                    isSenior
                      ? FadeInDown.delay(delay).duration(480)
                      : FadeInDown.delay(delay).duration(320).springify().damping(17)
                  }
                  style={isSenior ? undefined : styles.gridItem}
                >
                  <TouchableOpacity
                    style={[
                      isSenior ? styles.cardSenior : styles.card,
                      { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: guide.color },
                      touchTargetStyle(a11y, isSenior ? 68 : 56)
                    ]}
                    onPress={() => navigation.navigate('FirstAidGuide', { guideId: guide.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`${guide.title}. ${guide.summary}. ${guide.callFirst}`}
                    {...touchTargetProps(a11y)}
                  >
                    <View style={isSenior ? styles.cardTopRowSenior : styles.cardTopRow}>
                      <View style={[styles.iconCircle, isSenior && styles.iconCircleSenior, { backgroundColor: guide.color + '1A' }]}>
                        <MaterialCommunityIcons name={guide.icon.name} size={isSenior ? 30 : 26} color={guide.color} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: theme.text, fontSize: type.body.fontSize + 1 }]}>{guide.title}</Text>
                        <Text
                          style={[styles.cardSummary, { color: theme.textSub, fontSize: isSenior ? type.caption.fontSize + 2 : type.caption.fontSize }]}
                          numberOfLines={isSenior ? undefined : 2}
                        >
                          {guide.summary}
                        </Text>
                      </View>
                      {isSenior && <MaterialCommunityIcons name="chevron-right" size={26} color="#94A3B8" />}
                    </View>
                    {!isSenior && (
                      <View style={[styles.callFirstStrip, { backgroundColor: guide.color + '12' }]}>
                        <MaterialCommunityIcons name="phone-alert" size={13} color={guide.color} />
                        <Text style={[styles.callFirstText, { color: guide.color }]} numberOfLines={1}>{guide.callFirst}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl, paddingBottom: SPACING.huge },

  heroBand: {
    backgroundColor: '#B91C1C', borderRadius: RADII.adult.card + 8, padding: SPACING.xl,
    marginBottom: SPACING.lg, overflow: 'hidden'
  },
  heroWatermark: { position: 'absolute', right: -20, bottom: -24, opacity: 0.14 },
  heroBadge: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3
  },
  title: { fontWeight: 'bold', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  disclaimerBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', borderRadius: RADII.adult.card, borderWidth: 1, borderColor: '#F59E0B', padding: SPACING.md, marginBottom: SPACING.xl, alignItems: 'flex-start' },
  disclaimerText: { color: '#92400E', lineHeight: 18, marginLeft: SPACING.sm, flex: 1 },

  catHeader: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: RADII.adult.chip + 6, paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.md },
  catIconBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm + 2 },
  catTitle: { fontWeight: 'bold' },

  // Adult — dense 2-column grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs },
  gridItem: { width: '50%', paddingHorizontal: SPACING.xs },
  card: {
    borderRadius: RADII.adult.card + 4, borderWidth: 1, borderLeftWidth: 4, padding: SPACING.md, marginBottom: SPACING.sm + 2,
    minHeight: 150, justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2
  },
  cardTopRow: { alignItems: 'flex-start' },

  // Senior — single column, larger row, all details visible
  cardSenior: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.elderly.card, borderLeftWidth: 6, padding: SPACING.lg + 2, marginBottom: SPACING.lg, ...getElevation('elderly') },
  cardTopRowSenior: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  iconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  iconCircleSenior: { width: 52, height: 52, borderRadius: 26, marginBottom: 0, marginRight: SPACING.md + 2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: 'bold' },
  cardSummary: { marginTop: 3, lineHeight: 17 },

  callFirstStrip: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 7, marginTop: SPACING.sm },
  callFirstText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4, flex: 1 }
});
