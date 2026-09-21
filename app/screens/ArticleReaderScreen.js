import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, useAnimatedReaction, runOnJS, FadeInDown
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { getArticleById, HAZARD_CATEGORIES } from '../constants/articles';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

const NAVY = AGE_PALETTES.adult.navy;
const SECTIONS = [
  { key: 'whatItIs', label: 'Overview', fullLabel: 'WHAT IT IS', color: '#64748B' },
  { key: 'before', label: 'Before', fullLabel: 'BEFORE: HOW TO PREPARE', color: '#059669' },
  { key: 'during', label: 'During', fullLabel: 'DURING: WHAT TO DO', color: SEMANTIC.critical },
  { key: 'after', label: 'After', fullLabel: 'AFTER: WHAT TO DO', color: AGE_PALETTES.adult.amber }
];

export default function ArticleReaderScreen({ route }) {
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();
  const { articleId } = route.params;
  const article = getArticleById(articleId);
  const category = HAZARD_CATEGORIES.find(c => c.key === article?.hazard);

  const scrollRef = useRef(null);
  const sectionOffsets = useRef([]);
  const scrollY = useSharedValue(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [viewportHeight, setViewportHeight] = useState(1);
  const [percentRead, setPercentRead] = useState(0);

  if (!article) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text }}>Article not found.</Text>
      </View>
    );
  }

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    }
  });

  const progressStyle = useAnimatedStyle(() => {
    const maxScroll = Math.max(1, contentHeight - viewportHeight);
    const pct = Math.min(1, Math.max(0, scrollY.value / maxScroll));
    return { width: `${pct * 100}%` };
  });

  // Bridges the UI-thread scroll value to a JS percentage label — the bar
  // itself stays driven by the shared value directly for buttery smoothness.
  useAnimatedReaction(
    () => scrollY.value,
    (currentY) => {
      const maxScroll = Math.max(1, contentHeight - viewportHeight);
      const pct = Math.round((Math.min(maxScroll, Math.max(0, currentY)) / maxScroll) * 100);
      runOnJS(setPercentRead)(pct);
    },
    [contentHeight, viewportHeight]
  );

  const scrollToSection = (index) => {
    const y = sectionOffsets.current[index];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: category?.color || NAVY }]} />
        </View>
        <Text style={[styles.progressPct, { color: theme.textSub }]}>{percentRead}%</Text>
      </View>

      {/* Quick nav — jump straight to a section instead of scrolling past it. */}
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        {SECTIONS.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.navChip, touchTargetStyle(a11y, 32)]}
            onPress={() => scrollToSection(i)}
            accessibilityRole="button"
            accessibilityLabel={`Jump to ${s.label} section`}
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.navChipText, { color: s.color }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: (category?.color || NAVY) + '1A' }]}>
            <MaterialCommunityIcons name={category?.icon || 'book-open-page-variant'} size={26} color={category?.color || NAVY} />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md + 2 }}>
            <Text style={[styles.hazardLabel, { color: category?.color || NAVY }]}>{category?.label?.toUpperCase() || 'PREPAREDNESS'}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{article.title}</Text>
            <Text style={[styles.meta, { color: theme.textSub }]}>{article.mins} min read</Text>
          </View>
        </View>

        {SECTIONS.map((s, i) => (
          <Animated.View
            key={s.key}
            entering={FadeInDown.delay(i * 60).duration(260)}
            onLayout={(e) => { sectionOffsets.current[i] = e.nativeEvent.layout.y + 140; }}
            style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: s.color }]}
          >
            <Text style={[styles.sectionLabel, { color: s.color }]}>{s.fullLabel}</Text>
            <Text style={[styles.sectionText, { color: theme.text }]}>{article.sections[s.key]}</Text>
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressPct: { fontSize: TYPE.caption.fontSize - 1, fontWeight: 'bold', marginLeft: SPACING.sm, width: 32, textAlign: 'right' },

  navBar: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  navChip: { paddingVertical: 4, paddingHorizontal: SPACING.sm + 2 },
  navChipText: { fontSize: TYPE.caption.fontSize, fontWeight: 'bold' },

  container: { padding: SPACING.lg, paddingBottom: SPACING.huge },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.xl },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  hazardLabel: { fontSize: TYPE.caption.fontSize - 1, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: TYPE.title.fontSize + 2, fontWeight: 'bold', marginBottom: 2 },
  meta: { fontSize: TYPE.caption.fontSize },
  section: { borderRadius: RADII.adult.card + 2, borderWidth: 1, borderLeftWidth: 4, padding: SPACING.md + 2, marginBottom: SPACING.sm + 2 },
  sectionLabel: { fontSize: TYPE.caption.fontSize - 1, fontWeight: 'bold', letterSpacing: 1, marginBottom: SPACING.xs },
  sectionText: { fontSize: TYPE.body.fontSize - 1, lineHeight: 21 }
});
