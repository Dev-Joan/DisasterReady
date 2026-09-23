import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import Text from '../components/Text';
import Animated, {
  FadeInDown, FadeIn, ZoomIn, useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, withDelay, Easing
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { STORY_TITLE, STORY_PAGES, STORY_QUIZ } from '../constants/storyMode';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';
import HearButton from '../components/HearButton';
import useKidSpeech from '../hooks/useKidSpeech';

// Story Mode, redesigned as an illustrated storybook rather than a quiz
// gated behind every page. Each page is a small animated scene (built from
// Views + emoji, moved with Reanimated — no static single emoji standing
// in for "the picture") with short narration spoken aloud via expo-speech,
// and pages advance either by tapping the page or automatically after a
// pause. The comprehension check is one short, easy, picture-based quiz at
// the very end (constants/storyMode.js STORY_QUIZ), not per page.
const AUTO_ADVANCE_MS = 8000;
const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const QUIZ_COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3'];

function computeStars(mistakes) {
  if (mistakes === 0) return 3;
  if (mistakes <= 1) return 2;
  return 1;
}

// ---- Illustrated scene art -------------------------------------------
// A handful of small, self-contained animated pieces, mixed and matched
// per page below. Every manual (non entering/exiting) loop or one-shot
// motion checks reducedMotion directly, since the app-wide
// <ReducedMotionConfig> switch only covers Reanimated's entering/exiting/
// layout API, not useSharedValue-driven animations.
function Bob({ children, style }) {
  const { settings } = useAccessibility();
  const y = useSharedValue(0);
  useEffect(() => {
    if (settings.reducedMotion) { y.value = 0; return; }
    y.value = withRepeat(withSequence(withTiming(-6, { duration: 520 }), withTiming(0, { duration: 480 })), -1, true);
  }, [settings.reducedMotion]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

function RainDrop({ x, delay, duration }) {
  const { settings } = useAccessibility();
  const t = useSharedValue(0);
  useEffect(() => {
    if (settings.reducedMotion) { t.value = 0.5; return; }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, [settings.reducedMotion]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: t.value * 110 }],
    opacity: settings.reducedMotion ? 0.6 : (t.value < 0.15 ? t.value / 0.15 : t.value > 0.85 ? (1 - t.value) / 0.15 : 0.8)
  }));
  return <Animated.Text style={[styles.rainDrop, { left: `${x}%` }, style]}>💧</Animated.Text>;
}

function Twinkle({ x, y, delay }) {
  const { settings } = useAccessibility();
  const s = useSharedValue(settings.reducedMotion ? 1 : 0.4);
  useEffect(() => {
    if (settings.reducedMotion) return;
    s.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })), -1, true));
  }, [settings.reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: s.value, transform: [{ scale: 0.7 + s.value * 0.5 }] }));
  return <Animated.Text style={[styles.twinkle, { left: `${x}%`, top: `${y}%` }, style]}>✨</Animated.Text>;
}

function StormScene() {
  const drops = useRef(Array.from({ length: 7 }).map((_, i) => ({ x: 6 + i * 13, delay: i * 180, duration: 1100 + (i % 3) * 200 }))).current;
  return (
    <View style={styles.scene}>
      <View style={[styles.sceneLayer, styles.stormSky]} />
      <View style={styles.stormRiver} />
      {drops.map((d, i) => <RainDrop key={i} {...d} />)}
      <View style={styles.houseWrap}>
        <View style={styles.houseRoof} />
        <View style={styles.houseBody} />
      </View>
      <Bob style={styles.kidsRow}><Text style={styles.kidsEmoji}>🧒👧</Text></Bob>
    </View>
  );
}

function PackScene() {
  return (
    <View style={styles.scene}>
      <View style={[styles.sceneLayer, styles.packRoom]} />
      <Bob style={styles.bagWrap}><Text style={styles.bagEmoji}>🎒</Text></Bob>
      <Animated.Text entering={ZoomIn.delay(200).duration(300).springify().damping(11)} style={[styles.packItem, { left: '20%', top: '18%' }]}>💧</Animated.Text>
      <Animated.Text entering={ZoomIn.delay(450).duration(300).springify().damping(11)} style={[styles.packItem, { left: '68%', top: '22%' }]}>🔦</Animated.Text>
      <Animated.Text entering={ZoomIn.delay(700).duration(300).springify().damping(11)} style={[styles.packItem, { left: '44%', top: '10%' }]}>🥫</Animated.Text>
      <Text style={styles.roomKidsEmoji}>🧒👧</Text>
    </View>
  );
}

function DarkScene() {
  const { settings } = useAccessibility();
  const glow = useSharedValue(settings.reducedMotion ? 0.8 : 0.5);
  useEffect(() => {
    if (settings.reducedMotion) return;
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1, true);
  }, [settings.reducedMotion]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <View style={styles.scene}>
      <View style={[styles.sceneLayer, styles.darkRoom]} />
      <Animated.View style={[styles.flashlightGlow, glowStyle]} />
      <Text style={styles.darkKidsEmoji}>🧒</Text>
      <Text style={styles.flashlightEmoji}>🔦</Text>
    </View>
  );
}

function RiseScene() {
  const { settings } = useAccessibility();
  const waterH = useSharedValue(settings.reducedMotion ? 46 : 4);
  const arrowY = useSharedValue(0);
  useEffect(() => {
    if (!settings.reducedMotion) waterH.value = withTiming(46, { duration: 1400, easing: Easing.out(Easing.quad) });
    if (!settings.reducedMotion) {
      arrowY.value = withDelay(1200, withRepeat(withSequence(withTiming(-8, { duration: 420 }), withTiming(0, { duration: 420 })), -1, true));
    }
  }, [settings.reducedMotion]);
  const waterStyle = useAnimatedStyle(() => ({ height: waterH.value }));
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateY: arrowY.value }] }));
  return (
    <View style={styles.scene}>
      <View style={[styles.sceneLayer, styles.riseSky]} />
      <View style={styles.riseUpperFloor}><Text style={styles.riseUpperKids}>🧒👧</Text></View>
      <View style={styles.riseGroundFloor} />
      <Animated.View style={[styles.riseWater, waterStyle]} />
      <Animated.Text style={[styles.riseArrow, arrowStyle]}>⬆️</Animated.Text>
    </View>
  );
}

function RescueScene() {
  const { settings } = useAccessibility();
  const heliY = useSharedValue(settings.reducedMotion ? 0 : -70);
  const hover = useSharedValue(0);
  useEffect(() => {
    if (settings.reducedMotion) return;
    heliY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) hover.value = withRepeat(withSequence(withTiming(-6, { duration: 500 }), withTiming(0, { duration: 500 })), -1, true);
    });
  }, [settings.reducedMotion]);
  const heliStyle = useAnimatedStyle(() => ({ transform: [{ translateY: heliY.value + hover.value }] }));
  const stars = useRef([{ x: 15, y: 15 }, { x: 80, y: 25 }, { x: 50, y: 8 }, { x: 25, y: 45 }, { x: 75, y: 50 }]).current;
  return (
    <View style={styles.scene}>
      <View style={[styles.sceneLayer, styles.rescueSky]} />
      {stars.map((s, i) => <Twinkle key={i} x={s.x} y={s.y} delay={i * 150} />)}
      <Animated.Text style={[styles.heliEmoji, heliStyle]}>🚁</Animated.Text>
      <Bob style={styles.rescueKidsWrap}><Text style={styles.rescueKidsEmoji}>🙋🧒</Text></Bob>
    </View>
  );
}

const SCENES = { storm: StormScene, pack: PackScene, dark: DarkScene, rise: RiseScene, rescue: RescueScene };

// ---- Quiz picture choice ------------------------------------------------
function QuizChoice({ emoji, label, color, onPress, result, disabled }) {
  const { settings: a11y } = useAccessibility();
  const shakeX = useSharedValue(0);
  useEffect(() => {
    if (result === 'wrong' && !a11y.reducedMotion) {
      shakeX.value = withSequence(withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }), withTiming(-6, { duration: 60 }), withTiming(0, { duration: 60 }));
    }
  }, [result]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  return (
    <Animated.View style={[styles.quizChoiceWrap, shakeStyle]}>
      <BouncyPress
        style={[styles.quizChoice, { backgroundColor: color }, result === 'correct' && styles.quizChoiceCorrect, result === 'wrong' && styles.quizChoiceWrong]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.quizChoiceEmoji}>{emoji}</Text>
        <Text style={styles.quizChoiceLabel} numberOfLines={2}>{label}</Text>
        {result === 'correct' && <Animated.Text entering={ZoomIn.duration(200).springify().damping(11)} style={styles.quizCheck}>✅</Animated.Text>}
      </BouncyPress>
    </Animated.View>
  );
}

export default function StoryScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const { speak, stop } = useKidSpeech();

  const [phase, setPhase] = useState('cover'); // cover | reading | quiz | done
  const [pageIndex, setPageIndex] = useState(0);
  const [narrationOn, setNarrationOn] = useState(true);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizMistakes, setQuizMistakes] = useState(0);
  const [pickedId, setPickedId] = useState(null);
  const [pickedResult, setPickedResult] = useState(null);
  const [finalStars, setFinalStars] = useState(0);

  const autoTimerRef = useRef(null);
  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const page = STORY_PAGES[pageIndex];
  const question = STORY_QUIZ[quizIndex];

  // Narrate the current page and arm the auto-advance timer. Tapping the
  // page (or the Next button) advances immediately and clears the timer,
  // so both "auto-advancing" and "tap-to-continue" always work together
  // rather than one blocking the other.
  useEffect(() => {
    if (phase !== 'reading') return;
    if (narrationOn) speak(page.text); else stop();
    autoTimerRef.current = setTimeout(() => advancePage(), AUTO_ADVANCE_MS);
    return () => clearTimeout(autoTimerRef.current);
  }, [phase, pageIndex, narrationOn]);

  useEffect(() => {
    if (phase === 'quiz') speak(question.speak);
  }, [phase, quizIndex]);

  useEffect(() => {
    if (phase === 'done') speak('Story complete! Great job, you helped Max and Mia stay safe!');
  }, [phase]);

  const startStory = () => {
    setPageIndex(0);
    setPhase('reading');
  };

  const advancePage = () => {
    clearTimeout(autoTimerRef.current);
    stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pageIndex + 1 < STORY_PAGES.length) {
      setPageIndex((i) => i + 1);
    } else {
      setQuizIndex(0); setQuizMistakes(0); setPickedId(null); setPickedResult(null);
      setPhase('quiz');
    }
  };

  const finishStory = async (mistakes) => {
    winPlayer.seekTo(0); winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFinalStars(computeStars(mistakes));
    setPhase('done');
    try { await apiRequest('/gamification/story-complete', 'POST', { userId, storyId: 'flood_max_mia' }); }
    catch (err) { console.log('Story completion error:', err.message); }
  };

  const answerQuiz = (opt) => {
    if (pickedId) return;
    setPickedId(opt.id);
    if (opt.correct) {
      packPlayer.seekTo(0); packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPickedResult('correct');
      setTimeout(() => {
        setPickedId(null); setPickedResult(null);
        if (quizIndex + 1 < STORY_QUIZ.length) setQuizIndex((i) => i + 1);
        else finishStory(quizMistakes);
      }, 700);
    } else {
      wrongPlayer.seekTo(0); wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPickedResult('wrong');
      setQuizMistakes((m) => m + 1);
      setTimeout(() => { setPickedId(null); setPickedResult(null); }, 500);
    }
  };

  if (phase === 'cover') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <Animated.View entering={ZoomIn.duration(420).springify().damping(12)} style={styles.coverCard}>
          <Text style={styles.coverEmoji}>📖🌧️</Text>
          <Text style={styles.coverTitle}>{STORY_TITLE}</Text>
          <BouncyMascot size={48} />
        </Animated.View>
        <BouncyPress style={styles.startButton} onPress={startStory} accessibilityRole="button" accessibilityLabel="Read the story">
          <Text style={styles.startButtonText}>📖 Read the Story</Text>
        </BouncyPress>
        <TouchableOpacity
          style={styles.narrationToggle}
          onPress={() => setNarrationOn((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={narrationOn ? 'Turn off narration' : 'Turn on narration'}
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.narrationToggleText}>{narrationOn ? '🔊 Narration On' : '🔇 Narration Off'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (phase === 'done') {
    return (
      <View style={[styles.screen, styles.center]}>
        <Celebration colors={['#6D5BD0', '#FBBF24', '#34D399', '#38BDF8']} />
        <View style={styles.bigEmojiRow}>
          <Text style={styles.bigEmojiStar}>🌟</Text>
          <BouncyMascot size={56} />
          <Text style={styles.bigEmojiStar}>🌟</Text>
        </View>
        <Text style={styles.title}>Story Complete!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>You helped Max & Mia stay safe from the flood! +30 XP 🎉</Text>
        <BouncyPress style={styles.button} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.buttonText}>Back Home</Text>
        </BouncyPress>
      </View>
    );
  }

  if (phase === 'quiz') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.progressRow}>
          {STORY_QUIZ.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= quizIndex && styles.progressDotActive]} />
          ))}
        </View>
        <BouncyMascot size={48} />
        <View style={styles.quizTitleRow}>
          <Text style={styles.question}>{question.question}</Text>
          <HearButton onPress={() => speak(question.speak)} />
        </View>
        <View style={styles.quizGrid}>
          {question.options.map((opt, i) => (
            <QuizChoice
              key={opt.id}
              emoji={opt.emoji}
              label={opt.label}
              color={QUIZ_COLORS[i % QUIZ_COLORS.length]}
              onPress={() => answerQuiz(opt)}
              disabled={pickedId !== null}
              result={pickedId === opt.id ? pickedResult : null}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  // reading
  const Scene = SCENES[page.scene];
  return (
    <View style={styles.screen}>
      <View style={styles.readingHeader}>
        <View style={styles.progressRow}>
          {STORY_PAGES.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= pageIndex && styles.progressDotActive]} />
          ))}
        </View>
        <TouchableOpacity
          onPress={() => setNarrationOn((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={narrationOn ? 'Turn off narration' : 'Turn on narration'}
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.narrationIcon}>{narrationOn ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
      </View>

      <Pressable style={styles.pageWrap} onPress={advancePage} accessibilityRole="button" accessibilityLabel="Tap to continue the story">
        <Animated.View key={`page-${pageIndex}`} entering={FadeIn.duration(260)} style={styles.sceneCard}>
          <Scene />
        </Animated.View>
        <Animated.View key={`text-${pageIndex}`} entering={FadeInDown.delay(120).duration(320)} style={styles.textCard}>
          <Text style={styles.sceneText}>{page.text}</Text>
        </Animated.View>
        <Text style={styles.tapHint}>👉 Tap anywhere to continue</Text>
      </Pressable>

      <BouncyPress style={styles.nextButton} onPress={advancePage} accessibilityRole="button" accessibilityLabel="Next page">
        <Text style={styles.nextButtonText}>{pageIndex + 1 < STORY_PAGES.length ? 'Next ▶' : 'Quiz Time! ▶'}</Text>
      </BouncyPress>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F0FB' },
  container: { padding: 20, paddingBottom: 40 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },

  coverCard: { backgroundColor: '#6D5BD0', borderRadius: 28, padding: 32, alignItems: 'center', marginBottom: 24, width: '100%' },
  coverEmoji: { fontSize: 56, marginBottom: 12 },
  coverTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 14 },
  startButton: { backgroundColor: '#6D5BD0', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 14 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  narrationToggle: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#EDE9FE', marginBottom: 14 },
  narrationToggleText: { fontSize: 14, fontWeight: 'bold', color: '#4C1D95' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#64748B', fontWeight: 'bold' },

  bigEmojiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bigEmojiStar: { fontSize: 44, marginHorizontal: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4C1D95', textAlign: 'center', marginBottom: 8 },
  stars: { fontSize: 36, marginBottom: 10 },
  introText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: { backgroundColor: '#6D5BD0', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  progressRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },
  progressDot: { width: 24, height: 6, borderRadius: 3, backgroundColor: '#DDD6FE', marginHorizontal: 3 },
  progressDotActive: { backgroundColor: '#6D5BD0' },

  readingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  narrationIcon: { fontSize: 24 },
  pageWrap: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },

  sceneCard: { width: '100%', height: 220, borderRadius: 24, overflow: 'hidden', marginBottom: 16, backgroundColor: '#fff' },
  scene: { flex: 1, position: 'relative' },
  sceneLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  textCard: { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 2, borderColor: '#E9E4F8' },
  sceneText: { fontSize: 16, color: '#1E293B', textAlign: 'center', lineHeight: 24, fontWeight: '600' },
  tapHint: { marginTop: 14, fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },

  nextButton: { backgroundColor: '#6D5BD0', borderRadius: 16, paddingVertical: 14, marginHorizontal: 20, marginVertical: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // storm scene
  stormSky: { backgroundColor: '#475569' },
  stormRiver: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', backgroundColor: '#3B82F6' },
  rainDrop: { position: 'absolute', top: -10, fontSize: 16 },
  houseWrap: { position: 'absolute', right: '12%', bottom: '32%', alignItems: 'center' },
  houseRoof: { width: 0, height: 0, borderLeftWidth: 24, borderRightWidth: 24, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#B45309' },
  houseBody: { width: 48, height: 38, backgroundColor: '#FDE68A', borderRadius: 4 },
  kidsRow: { position: 'absolute', left: '14%', bottom: '32%' },
  kidsEmoji: { fontSize: 34 },

  // pack scene
  packRoom: { backgroundColor: '#FFF7ED' },
  bagWrap: { position: 'absolute', left: '50%', bottom: '18%', marginLeft: -32 },
  bagEmoji: { fontSize: 64 },
  packItem: { position: 'absolute', fontSize: 26 },
  roomKidsEmoji: { position: 'absolute', right: '10%', bottom: '10%', fontSize: 34 },

  // dark scene
  darkRoom: { backgroundColor: '#111827' },
  flashlightGlow: { position: 'absolute', left: '32%', top: '28%', width: 90, height: 90, borderRadius: 45, backgroundColor: '#FDE68A' },
  darkKidsEmoji: { position: 'absolute', left: '38%', top: '38%', fontSize: 40 },
  flashlightEmoji: { position: 'absolute', left: '55%', top: '55%', fontSize: 30 },

  // rise scene
  riseSky: { backgroundColor: '#93C5FD' },
  riseUpperFloor: { position: 'absolute', top: '10%', left: '10%', right: '10%', height: '30%', backgroundColor: '#FDE68A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  riseUpperKids: { fontSize: 30 },
  riseGroundFloor: { position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '46%', backgroundColor: '#F5D0A9', borderRadius: 10 },
  riseWater: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#2563EB', opacity: 0.85 },
  riseArrow: { position: 'absolute', right: '6%', top: '38%', fontSize: 30 },

  // rescue scene
  rescueSky: { backgroundColor: '#7DD3FC' },
  twinkle: { position: 'absolute', fontSize: 16 },
  heliEmoji: { position: 'absolute', left: '38%', top: '18%', fontSize: 44 },
  rescueKidsWrap: { position: 'absolute', left: '30%', bottom: '14%' },
  rescueKidsEmoji: { fontSize: 34 },

  // quiz
  quizTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18, marginTop: 8 },
  question: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginRight: 8 },
  quizGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  quizChoiceWrap: { width: '44%', margin: '3%' },
  quizChoice: { aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent', padding: 10 },
  quizChoiceCorrect: { borderColor: '#34D399' },
  quizChoiceWrong: { borderColor: '#EF4444' },
  quizChoiceEmoji: { fontSize: 44, marginBottom: 8 },
  quizChoiceLabel: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  quizCheck: { position: 'absolute', top: 6, right: 10, fontSize: 24 }
});
