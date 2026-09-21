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
      <Text style={[styles.title, { color: theme.text, fontSize: type.display.fontSize - 2 }]} accessibilityRole="header">First Aid</Text>
      <Text style={[styles.sub, { color: theme.textSub, fontSize: type.body.fontSize - 1 }]}>Quick, calm step-by-step guidance for emergencies.</Text>

      <View style={styles.disclaimerBox} accessibilityLabel={`Disclaimer: ${EMERGENCY_DISCLAIMER}`}>
        <MaterialCommunityIcons name="alert" size={isSenior ? 22 : 18} color="#92400E" />
        <Text style={[styles.disclaimerText, { fontSize: type.caption.fontSize }]}>{EMERGENCY_DISCLAIMER}</Text>
      </View>

      {FIRST_AID_CATEGORIES.map((cat) => (
        <View key={cat.key}>
          <View style={styles.catHeader} accessibilityRole="header">
            <MaterialCommunityIcons name={cat.icon.name} size={isSenior ? 26 : 22} color={theme.text} />
            <Text style={[styles.catTitle, { color: theme.text, fontSize: type.title.fontSize - 2 }]}>{cat.label}</Text>
          </View>
          {/* Adult: compact 2-column grid for quick scanning. Senior: one
              full-width card at a time, larger target, slower entrance. */}
          <View style={isSenior ? undefined : styles.grid}>
            {FIRST_AID_GUIDES.filter(g => g.category === cat.key).map((guide) => {
              const delay = cardIndex++ * (isSenior ? 130 : 50);
              return (
                <Animated.View
                  key={guide.id}
                  entering={isSenior ? FadeInDown.delay(delay).duration(480) : FadeIn.delay(delay).duration(220)}
                  style={isSenior ? undefined : styles.gridItem}
                >
                  <TouchableOpacity
                    style={[
                      isSenior ? styles.cardSenior : styles.card,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      touchTargetStyle(a11y, isSenior ? 68 : 56)
                    ]}
                    onPress={() => navigation.navigate('FirstAidGuide', { guideId: guide.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`${guide.title}. ${guide.summary}`}
                    {...touchTargetProps(a11y)}
                  >
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
  title: { fontWeight: 'bold' },
  sub: { marginBottom: SPACING.lg },
  disclaimerBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', borderRadius: RADII.adult.card, borderWidth: 1, borderColor: '#F59E0B', padding: SPACING.md, marginBottom: SPACING.xl, alignItems: 'flex-start' },
  disclaimerText: { color: '#92400E', lineHeight: 18, marginLeft: SPACING.sm, flex: 1 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.sm + 2 },
  catTitle: { fontWeight: 'bold', marginLeft: SPACING.sm },

  // Adult — dense 2-column grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs },
  gridItem: { width: '50%', paddingHorizontal: SPACING.xs },
  card: { alignItems: 'flex-start', borderRadius: RADII.adult.card + 2, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm + 2, minHeight: 108, ...getElevation('adult') },

  // Senior — single column, larger row, all details visible
  cardSenior: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.elderly.card, padding: SPACING.lg + 2, marginBottom: SPACING.lg, ...getElevation('elderly') },

  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  iconCircleSenior: { width: 52, height: 52, borderRadius: 26, marginBottom: 0, marginRight: SPACING.md + 2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: 'bold' },
  cardSummary: { marginTop: 3, lineHeight: 17 }
});
