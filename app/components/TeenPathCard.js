import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Text from './Text';
import AnimatedProgressBar from './AnimatedProgressBar';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { SPACING, TYPE, RADII, AGE_PALETTES } from '../constants/tokens';

const TEEN = AGE_PALETTES.teen;

// The compact node row echoes LearningPathScreen's winding trail (same
// done/current/locked states) but flattened into a single row so it reads
// at a glance from the home screen — a teaser for the full path, not a
// replacement for it.
function NodeDot({ emoji, done, isCurrent }) {
  const { settings: a11y } = useAccessibility();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCurrent && !a11y.reducedMotion) {
      scale.value = withRepeat(withSequence(withTiming(1.12, { duration: 550 }), withTiming(1, { duration: 550 })), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isCurrent, a11y.reducedMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        styles.node,
        { backgroundColor: TEEN.slate, borderColor: TEEN.border },
        done && { backgroundColor: TEEN.teal, borderColor: TEEN.tealDeep },
        isCurrent && { borderColor: TEEN.coral, borderWidth: 3 },
        style
      ]}
    >
      <Text style={styles.nodeEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

export default function TeenPathCard({ lessons, completed, onPress }) {
  const { settings: a11y } = useAccessibility();
  const currentIndex = lessons.findIndex((l) => !completed.includes(l.id));
  const total = lessons.length;
  const doneCount = completed.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = currentIndex === -1;
  const currentLesson = allDone ? null : lessons[currentIndex];

  return (
    <Animated.View entering={FadeInDown.duration(340).springify().damping(14)}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: TEEN.base, borderColor: TEEN.teal }]}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={allDone
          ? 'Preparedness Path. All lessons complete. View your path.'
          : `Preparedness Path. Lesson ${currentIndex + 1} of ${total}: ${currentLesson.title}. Tap to continue.`}
        {...touchTargetProps(a11y)}
      >
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>PREPAREDNESS PATH</Text>
          <Text style={styles.chevron}>›</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {allDone ? '🎉 Path complete — nice work!' : `${currentLesson.emoji} ${currentLesson.title}`}
        </Text>
        <Text style={styles.sub}>
          {allDone ? `All ${total} lessons done` : `Lesson ${currentIndex + 1} of ${total} — tap to continue`}
        </Text>

        <View style={styles.progressWrap}>
          <AnimatedProgressBar progress={pct} trackColor={TEEN.border} fillColor={TEEN.teal} height={9} />
        </View>

        <View style={styles.nodeRow}>
          {lessons.map((lesson, i) => {
            const done = completed.includes(lesson.id);
            const unlocked = i === 0 || completed.includes(lessons[i - 1].id);
            return (
              <NodeDot
                key={lesson.id}
                emoji={done ? '✅' : unlocked ? lesson.emoji : '🔒'}
                done={done}
                isCurrent={i === currentIndex}
              />
            );
          })}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADII.teen.card, borderWidth: 2, padding: SPACING.lg, marginBottom: SPACING.md + 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  kicker: { color: TEEN.teal, fontWeight: 'bold', fontSize: TYPE.caption.fontSize - 1, letterSpacing: 1.5 },
  chevron: { color: TEEN.textSub, fontSize: 20, fontWeight: 'bold' },
  title: { color: TEEN.text, fontSize: TYPE.body.fontSize + 3, fontWeight: 'bold', marginBottom: 2 },
  sub: { color: TEEN.textSub, fontSize: TYPE.caption.fontSize + 1, marginBottom: SPACING.md },
  progressWrap: { marginBottom: SPACING.md },
  nodeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  node: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nodeEmoji: { fontSize: 16 }
});
