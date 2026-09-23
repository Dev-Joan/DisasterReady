import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { getArticleById, HAZARD_CATEGORIES } from '../constants/articles';
import { SPACING, TYPE_SENIOR, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NAVY = AGE_PALETTES.elderly.navy;

const SECTIONS = [
  { key: 'whatItIs', label: 'What It Is', color: '#64748B' },
  { key: 'before', label: 'Before: How to Prepare', color: '#059669' },
  { key: 'during', label: 'During: What to Do', color: SEMANTIC.critical },
  { key: 'after', label: 'After: What to Do', color: AGE_PALETTES.elderly.amber }
];

export default function SeniorArticleReaderScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();
  const { articleId } = route.params;
  const article = getArticleById(articleId);
  const category = HAZARD_CATEGORIES.find(c => c.key === article?.hazard);

  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const OFFSET = SCREEN_WIDTH * 0.3;

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }]
  }));

  // direction: 1 = advancing to next section, -1 = going back to previous section
  const enterFrom = (direction) => {
    translateX.value = direction * OFFSET;
    translateX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(1, { duration: 240 });
  };

  const transitionTo = (nextIndex, direction) => {
    opacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) });
    translateX.value = withTiming(-direction * OFFSET, { duration: 180, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) {
        runOnJS(setIndex)(nextIndex);
        runOnJS(enterFrom)(direction);
      }
    });
  };

  const goNext = () => {
    if (index < SECTIONS.length - 1) {
      transitionTo(index + 1, 1);
    } else {
      setFinished(true);
    }
  };

  const goPrev = () => {
    if (index > 0) transitionTo(index - 1, -1);
  };

  if (!article) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={[styles.notFoundText, { color: theme.text }]}>Article not found.</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg, padding: 28 }]}>
        <MaterialCommunityIcons name="check-circle" size={72} color={SEMANTIC.success} />
        <Text style={[styles.finishedTitle, { color: theme.text }]}>Article Complete</Text>
        <Text style={[styles.finishedSub, { color: theme.textSub }]}>You've read all four parts of "{article.title}".</Text>
        <TouchableOpacity style={styles.bigButton} onPress={() => navigation.goBack()}>
          <Text style={styles.bigButtonText}>BACK TO ARTICLES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const section = SECTIONS[index];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, touchTargetStyle(a11y, 44)]}
          accessibilityRole="button"
          accessibilityLabel="Close article"
          {...touchTargetProps(a11y)}
        >
          <MaterialCommunityIcons name="close" size={28} color={theme.textSub} />
        </TouchableOpacity>
        <Text style={[styles.hazardLabel, { color: category?.color || NAVY }]}>{category?.label?.toUpperCase() || 'PREPAREDNESS'}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>

        <View style={styles.dotsRow}>
          {SECTIONS.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                { backgroundColor: i <= index ? (category?.color || NAVY) : theme.border }
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepLabel, { color: theme.textSub }]}>Step {index + 1} of {SECTIONS.length}</Text>
      </View>

      <View style={styles.bodyWrap}>
        <Animated.View style={[styles.card, { backgroundColor: theme.card, borderColor: section.color }, contentStyle]}>
          <Text style={[styles.sectionLabel, { color: section.color }]}>{section.label.toUpperCase()}</Text>
          <Text style={[styles.sectionText, { color: theme.text }]}>{article.sections[section.key]}</Text>
        </Animated.View>
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonSecondary, { borderColor: theme.border }, index === 0 && styles.navButtonDisabled]}
          disabled={index === 0}
          onPress={goPrev}
          accessibilityRole="button"
          accessibilityLabel="Previous section"
          {...touchTargetProps(a11y)}
        >
          <Text style={[styles.navButtonSecondaryText, { color: index === 0 ? theme.textSub : theme.text }]}>◀ BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: category?.color || NAVY }]}
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={index === SECTIONS.length - 1 ? 'Finish article' : 'Next section'}
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.navButtonPrimaryText}>{index === SECTIONS.length - 1 ? 'FINISH' : 'NEXT ▶'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: TYPE_SENIOR.title.fontSize },

  header: { paddingTop: SPACING.xl, paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.md },
  closeBtn: { alignSelf: 'flex-end', marginBottom: SPACING.sm, padding: SPACING.xs },
  hazardLabel: { fontSize: TYPE_SENIOR.body.fontSize - 2, fontWeight: 'bold', letterSpacing: 1, marginBottom: SPACING.sm - 2 },
  title: { fontSize: TYPE_SENIOR.display.fontSize - 2, fontWeight: 'bold', lineHeight: 38, marginBottom: SPACING.lg + 2 },
  dotsRow: { flexDirection: 'row', marginBottom: SPACING.sm + 2 },
  dot: { width: 44, height: 10, borderRadius: 5, marginRight: SPACING.sm },
  stepLabel: { fontSize: TYPE_SENIOR.body.fontSize - 1, fontWeight: '600' },

  bodyWrap: { flex: 1, paddingHorizontal: SPACING.xxl, justifyContent: 'center' },
  card: { borderRadius: RADII.elderly.card + 6, borderWidth: 2, padding: SPACING.xxl },
  sectionLabel: { fontSize: TYPE_SENIOR.title.fontSize - 4, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: SPACING.lg },
  // Deliberately bigger than the standard senior body role — this is the
  // screen's whole purpose (long-form reading), so it earns the extra size.
  sectionText: { fontSize: TYPE_SENIOR.body.fontSize + 5, lineHeight: 34 },

  navRow: { flexDirection: 'row', padding: SPACING.xxl, paddingTop: SPACING.md },
  navButton: { flex: 1, borderRadius: RADII.elderly.button + 2, paddingVertical: SPACING.xl, alignItems: 'center', justifyContent: 'center' },
  navButtonSecondary: { borderWidth: 2, marginRight: SPACING.md },
  navButtonSecondaryText: { fontSize: TYPE_SENIOR.title.fontSize - 4, fontWeight: 'bold' },
  navButtonDisabled: { opacity: 0.4 },
  navButtonPrimary: { flex: 1.4 },
  navButtonPrimaryText: { fontSize: TYPE_SENIOR.title.fontSize - 4, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },

  bigButton: { backgroundColor: NAVY, borderRadius: RADII.elderly.button + 2, paddingVertical: SPACING.xl, paddingHorizontal: 40, marginTop: SPACING.xxl + 4 },
  bigButtonText: { color: '#fff', fontSize: TYPE_SENIOR.title.fontSize - 4, fontWeight: 'bold', letterSpacing: 0.5 },
  finishedTitle: { fontSize: TYPE_SENIOR.display.fontSize - 6, fontWeight: 'bold', marginTop: SPACING.xl, textAlign: 'center' },
  finishedSub: { fontSize: TYPE_SENIOR.body.fontSize, textAlign: 'center', marginTop: SPACING.md, lineHeight: 24 }
});
