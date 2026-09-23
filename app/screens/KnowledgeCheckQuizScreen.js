import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Text';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeInDown, SlideInDown, SlideOutDown, ZoomIn,
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import apiRequest from '../services/api';
import { getChapterById, KNOWLEDGE_CHECK_CHAPTERS } from '../constants/knowledgeCheck';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

const NAVY = AGE_PALETTES.adult.navy;
const SUCCESS = SEMANTIC.success;
const ERROR = SEMANTIC.critical;
const GOLD = AGE_PALETTES.adult.amber;

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OptionButton({ label, onPress, disabled, state, a11y }) {
  // state: 'idle' | 'selected' | 'correct' | 'wrong'
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const palette = {
    idle: { bg: 'transparent', border: '#CBD5E1' },
    selected: { bg: NAVY + '14', border: NAVY },
    correct: { bg: SUCCESS + '1A', border: SUCCESS },
    wrong: { bg: ERROR + '1A', border: ERROR }
  }[state];

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { if (!disabled) scale.value = withTiming(0.98, { duration: 90 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.option, { borderColor: palette.border, backgroundColor: palette.bg }, touchTargetStyle(a11y, 44), aStyle]}
      {...touchTargetProps(a11y)}
    >
      <Text style={styles.optionText}>{label}</Text>
      {state === 'correct' && <MaterialCommunityIcons name="check-circle" size={20} color={SUCCESS} />}
      {state === 'wrong' && <MaterialCommunityIcons name="close-circle" size={20} color={ERROR} />}
    </AnimatedPressable>
  );
}

export default function KnowledgeCheckQuizScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const insets = useSafeAreaInsets();
  const { chapterId } = route.params;
  const chapter = getChapterById(chapterId) || KNOWLEDGE_CHECK_CHAPTERS[0];
  const questions = chapter.questions;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState('playing'); // playing | done
  const [completion, setCompletion] = useState(null);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const q = questions[index];
  const progress = Math.round((index / questions.length) * 100);

  const check = () => {
    const correct = selected === q.correct;
    setWasCorrect(correct);
    setChecked(true);
    if (correct) {
      packPlayer.seekTo(0); packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectCount((c) => c + 1);
    } else {
      wrongPlayer.seekTo(0); wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const next = async () => {
    setChecked(false);
    setSelected(null);
    if (index < questions.length - 1) {
      setIndex(index + 1);
      return;
    }

    winPlayer.seekTo(0); winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const xp = questions.length * 2;

    try {
      const result = await apiRequest('/gamification/knowledge-chapter-complete', 'POST', {
        userId, chapterId, xp, totalChapters: KNOWLEDGE_CHECK_CHAPTERS.length
      });
      setCompletion(result);
    } catch (err) {
      console.log('Knowledge check complete error:', err.message);
      setCompletion({ alreadyDone: false });
    }
    setPhase('done');
  };

  if (phase === 'done') {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    const xpEarned = questions.length * 2;
    const alreadyDone = completion?.alreadyDone;
    const justCompletedAll = completion?.justCompletedAll;

    return (
      <SafeAreaView style={[styles.doneScreen, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <Animated.View entering={ZoomIn.springify().damping(9).delay(100)} style={styles.trophyCircle}>
          <MaterialCommunityIcons name="trophy" size={56} color="#fff" />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300).duration(400)}>
          <CountUpNumber value={accuracy} suffix="%" duration={900} style={[styles.accuracyText, { color: theme.text }]} />
          <Text style={[styles.accuracyLabel, { color: theme.textSub }]}>Accuracy on "{chapter.title}"</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(400)} style={[styles.statRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="check-decagram" size={20} color={SUCCESS} />
          <Text style={[styles.statText, { color: theme.text }]}>{correctCount} / {questions.length} correct</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={[styles.statRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="star-four-points" size={20} color={GOLD} />
          <Text style={[styles.statText, { color: theme.text }]}>
            {alreadyDone ? 'Already completed — no extra XP' : `+${xpEarned} XP earned`}
          </Text>
        </Animated.View>

        {justCompletedAll && (
          <Animated.View entering={ZoomIn.springify().delay(700)} style={styles.masterBanner}>
            <MaterialCommunityIcons name="crown" size={22} color="#fff" />
            <Text style={styles.masterBannerText}>Knowledge Check Master — all chapters complete!</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(750).duration(400)} style={{ width: '100%' }}>
          <AnimatedPressable
            style={[styles.continueBtn, touchTargetStyle(a11y, 44)]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to chapters"
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.continueBtnText}>BACK TO CHAPTERS</Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={touchTargetStyle(a11y, 24)}
          accessibilityRole="button"
          accessibilityLabel="Close knowledge check"
          {...touchTargetProps(a11y)}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.textSub} />
        </Pressable>
        <View style={styles.progressTrack}>
          <AnimatedProgressBar progress={progress} trackColor={theme.border} fillColor={NAVY} height={10} />
        </View>
        <Text style={[styles.progressText, { color: theme.textSub }]}>{index + 1}/{questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.chapterTag, { color: NAVY }]}>{chapter.title.toUpperCase()}</Text>
        <Text style={[styles.prompt, { color: theme.text }]}>{q.prompt}</Text>

        {q.options.map((opt, i) => {
          let state = 'idle';
          if (checked && i === q.correct) state = 'correct';
          else if (checked && i === selected) state = 'wrong';
          else if (selected === i) state = 'selected';
          return (
            <OptionButton
              key={i}
              label={opt}
              disabled={checked}
              state={state}
              a11y={a11y}
              onPress={() => { setSelected(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            />
          );
        })}
      </ScrollView>

      {checked && (
        <Animated.View entering={SlideInDown.springify().damping(16)} exiting={SlideOutDown} style={[styles.feedbackBar, { backgroundColor: wasCorrect ? SUCCESS : ERROR, paddingBottom: SPACING.xxl + 4 + insets.bottom }]}>
          <Text style={styles.feedbackTitle}>{wasCorrect ? '✅ Correct!' : '❌ Not quite'}</Text>
          <Text style={styles.feedbackText}>{q.explain}</Text>
          <Pressable
            style={[styles.continueSmallBtn, touchTargetStyle(a11y, 44)]}
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.continueSmallBtnText}>CONTINUE</Text>
          </Pressable>
        </Animated.View>
      )}

      {!checked && (
        <View style={[styles.checkBar, { paddingBottom: SPACING.lg + insets.bottom }]}>
          <Pressable
            style={[styles.checkBtn, selected === null && styles.checkBtnDisabled, touchTargetStyle(a11y, 44)]}
            disabled={selected === null}
            onPress={check}
            accessibilityRole="button"
            accessibilityLabel="Check answer"
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.checkBtnText}>CHECK</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  progressTrack: { flex: 1, marginHorizontal: SPACING.md },
  progressText: { fontSize: TYPE.caption.fontSize + 1, fontWeight: 'bold' },

  body: { padding: SPACING.xxl, paddingBottom: 160 },
  chapterTag: { fontSize: TYPE.caption.fontSize, fontWeight: 'bold', letterSpacing: 1, marginBottom: SPACING.sm + 2 },
  prompt: { fontSize: TYPE.title.fontSize, fontWeight: 'bold', marginBottom: SPACING.xl + 2, lineHeight: 28 },

  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADII.adult.card + 2, borderWidth: 2, padding: SPACING.lg, marginBottom: SPACING.md },
  optionText: { fontSize: TYPE.body.fontSize, fontWeight: '600', color: '#1E293B', flex: 1, marginRight: SPACING.sm },

  checkBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg },
  checkBtn: { backgroundColor: NAVY, borderRadius: RADII.adult.card + 2, padding: SPACING.lg, alignItems: 'center' },
  checkBtnDisabled: { backgroundColor: '#94A3B8' },
  checkBtnText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize + 1, letterSpacing: 1 },

  // Bottom sheet — a distinct surface type from cards, kept at its own larger radius.
  feedbackBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.xl, paddingBottom: SPACING.xxl + 4, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  feedbackTitle: { color: '#fff', fontSize: TYPE.title.fontSize - 2, fontWeight: 'bold', marginBottom: SPACING.sm - 2 },
  feedbackText: { color: 'rgba(255,255,255,0.9)', fontSize: TYPE.body.fontSize - 1, marginBottom: SPACING.md + 2, lineHeight: 20 },
  continueSmallBtn: { backgroundColor: '#fff', borderRadius: RADII.adult.card + 2, padding: SPACING.md + 2, alignItems: 'center' },
  continueSmallBtnText: { color: '#1E293B', fontWeight: 'bold', fontSize: TYPE.body.fontSize + 1, letterSpacing: 1 },

  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl + 4 },
  trophyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  // Deliberately bigger than the standard display role — the one celebratory
  // hero moment on this screen, per "spend your boldness in one place."
  accuracyText: { fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
  accuracyLabel: { fontSize: TYPE.body.fontSize - 1, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.xxl },
  statRow: { flexDirection: 'row', alignItems: 'center', width: '100%', borderRadius: RADII.adult.card + 2, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.md },
  statText: { fontSize: TYPE.body.fontSize, fontWeight: '600', marginLeft: SPACING.md - 2 },
  masterBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD, borderRadius: RADII.adult.card + 2, padding: SPACING.md + 2, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  masterBannerText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.caption.fontSize + 1, marginLeft: SPACING.sm, flex: 1, flexWrap: 'wrap' },
  continueBtn: { backgroundColor: NAVY, borderRadius: RADII.adult.card + 2, padding: SPACING.lg + 2, alignItems: 'center', marginTop: SPACING.md, width: '100%' },
  continueBtnText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize + 1, letterSpacing: 1 }
});
