import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, Easing, ZoomIn, FadeInDown } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { SPACING, TYPE, RADII, AGE_PALETTES } from '../constants/tokens';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import Celebration from '../components/Celebration';
import FlameFlicker from '../components/FlameFlicker';
import BouncyPress from '../components/BouncyPress';
const TEEN = AGE_PALETTES.teen;
const TIME_PER_SCENARIO = 12;
const SCENARIOS = [{
  id: 'wildfire-warning',
  hazardIcon: '🔥',
  hazardColor: 'coral',
  prompt: "A wildfire warning hits your phone: \"Be ready to leave.\" What's the smartest first move?",
  options: [{
    text: 'Start packing your go-bag and check evacuation routes',
    correct: true
  }, {
    text: 'Wait until you can smell smoke to decide',
    correct: false
  }, {
    text: 'Post about it on social media first',
    correct: false
  }],
  why: 'Acting on "be ready" immediately buys you time - don\'t wait for visible danger to start preparing.'
}, {
  id: 'flood-road',
  hazardIcon: '🌊',
  hazardColor: 'teal',
  prompt: "You're driving with a friend and floodwater is crossing the road ahead. What do you do?",
  options: [{
    text: 'Turn around and find another route',
    correct: true
  }, {
    text: "Drive through slowly, it's probably fine",
    correct: false
  }, {
    text: 'Speed through before it gets deeper',
    correct: false
  }],
  why: "You can't see what's under floodwater, and just 30cm can sweep a car away. Turn around, don't drown."
}, {
  id: 'earthquake-cafeteria',
  hazardIcon: '🏚️',
  hazardColor: 'indigo',
  prompt: 'The ground starts shaking while you\'re in the school cafeteria. What\'s the right move?',
  options: [{
    text: 'Drop, cover under a table, and hold on',
    correct: true
  }, {
    text: 'Run for the nearest exit immediately',
    correct: false
  }, {
    text: 'Stand in a doorway',
    correct: false
  }],
  why: 'Most earthquake injuries come from falling objects - Drop, Cover, Hold On is safer than running during shaking.'
}, {
  id: 'storm-pool',
  hazardIcon: '⛈️',
  hazardColor: 'teal',
  prompt: "You're at a friend's pool party and a severe thunderstorm warning comes in. What should you do?",
  options: [{
    text: 'Get everyone out of the water and indoors right away',
    correct: true
  }, {
    text: 'Keep swimming until you hear thunder up close',
    correct: false
  }, {
    text: 'Check the radar again in 20 minutes',
    correct: false
  }],
  why: 'Water conducts electricity - get out and get indoors the moment a warning is issued, not when thunder is already overhead.'
}, {
  id: 'tornado-sibling',
  hazardIcon: '🌪️',
  hazardColor: 'indigo',
  prompt: "Your younger sibling is home alone and a tornado siren goes off. They call you scared. What's your first instruction?",
  options: [{
    text: 'Get to the safest interior room, away from windows',
    correct: true
  }, {
    text: 'Tell them to go outside and look for the funnel',
    correct: false
  }, {
    text: 'Tell them to call some friends first',
    correct: false
  }],
  why: 'An interior room on the lowest floor, away from windows, is the safest place during a tornado warning.'
}, {
  id: 'gas-smell',
  hazardIcon: '💨',
  hazardColor: 'coral',
  prompt: 'You smell gas in the house after an earthquake. What\'s the right call?',
  options: [{
    text: 'Leave immediately and call the gas company from outside',
    correct: true
  }, {
    text: 'Light a candle to see better',
    correct: false
  }, {
    text: 'Check every room first before leaving',
    correct: false
  }],
  why: 'A gas leak can ignite from any spark or flame - get out first, then call for help from a safe distance.'
}, {
  id: 'evac-now',
  hazardIcon: '🚨',
  hazardColor: 'coral',
  prompt: "A wildfire evacuation order just changed from \"be ready\" to \"leave now\" for your zone. What matters most?",
  options: [{
    text: 'Leave immediately with your go-bag and essential documents',
    correct: true
  }, {
    text: 'Finish packing everything you own first',
    correct: false
  }, {
    text: 'Wait for a follow-up text to be sure',
    correct: false
  }],
  why: '"Leave now" means exactly that - grab what\'s essential and go. Waiting to pack more can cost you your exit window.'
}, {
  id: 'choking-classmate',
  hazardIcon: '🫁',
  hazardColor: 'teal',
  prompt: "You're the first to notice a classmate is choking at lunch. What's the right first step?",
  options: [{
    text: 'Ask if they can cough or speak, then act fast if not',
    correct: true
  }, {
    text: 'Assume it will pass and keep eating',
    correct: false
  }, {
    text: 'Give them water to swallow it down',
    correct: false
  }],
  why: 'Checking if they can cough or speak tells you how serious it is - a silent, struggling person needs immediate help.'
}];
const celebrationStarSource = require('../assets/lottie/celebration-star.json');
const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const tickSound = require('../assets/sounds/tick.wav');
const answerFeedbackEntering = undefined;
function getMultiplier(streak) {
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}
function gradeFor(correctCount, total) {
  const pct = correctCount / total;
  if (pct >= 0.9) return {
    grade: 'S',
    xp: 60,
    label: 'Elite response'
  };
  if (pct >= 0.75) return {
    grade: 'A',
    xp: 45,
    label: 'Strong judgment'
  };
  if (pct >= 0.5) return {
    grade: 'B',
    xp: 30,
    label: 'Solid instincts'
  };
  return {
    grade: 'C',
    xp: 20,
    label: 'Keep practicing'
  };
}
const HAZARD_COLOR = {
  coral: TEEN.coral,
  teal: TEEN.teal,
  indigo: TEEN.indigo
};
const GRADE_COLOR = {
  S: '#FBBF24',
  A: TEEN.teal,
  B: TEEN.indigo,
  C: TEEN.textSub
};
function HazardBadge({
  icon,
  color,
  size = 64
}) {
  const {
    settings: a11y
  } = useAccessibility();
  const rotate = useSharedValue(0);
  useEffect(() => {
    if (a11y.reducedMotion) {
      rotate.value = 0;
      return;
    }
    rotate.value = withRepeat(withSequence(withTiming(1, {
      duration: 900
    }), withTiming(-1, {
      duration: 1800
    }), withTiming(0, {
      duration: 900
    })), -1, false);
  }, [a11y.reducedMotion]);
  const style = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${rotate.value * 8}deg`
    }]
  }));
  return <Animated.View style={[styles.hazardBadge, {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color + '22',
    borderColor: color
  }, style]}>
      <Text style={[styles.hazardBadgeIcon, {
      fontSize: size * 0.5
    }]}>{icon}</Text>
    </Animated.View>;
}
function ScoreFlyup({
  amount,
  onDone
}) {
  const translateY = useSharedValue(8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withSequence(withTiming(1, {
      duration: 100
    }), withTiming(0, {
      duration: 260
    }));
    translateY.value = withTiming(-36, {
      duration: 560,
      easing: Easing.out(Easing.quad)
    });
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{
      translateY: translateY.value
    }]
  }));
  return <Animated.Text style={[styles.scoreFly, style]}>+{amount}</Animated.Text>;
}
export default function TeenScenarioChallengeScreen({
  navigation
}) {
  const {
    userId
  } = useUser();
  const {
    settings: a11y
  } = useAccessibility();
  const [phase, setPhase] = useState('intro');
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_SCENARIO);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [scoreFly, setScoreFly] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const timerRef = useRef(null);
  const streakPulse = useSharedValue(0);
  const dangerPulse = useSharedValue(0);
  const isLowTime = phase === 'playing' && !answered && timeLeft <= 4;
  useEffect(() => {
    if (isLowTime && !a11y.reducedMotion) {
      dangerPulse.value = withRepeat(withSequence(withTiming(1, {
        duration: 260
      }), withTiming(0, {
        duration: 260
      })), -1, true);
    } else {
      dangerPulse.value = withTiming(isLowTime ? 1 : 0, {
        duration: 150
      });
    }
  }, [isLowTime, a11y.reducedMotion]);
  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);
  const tickPlayer = useAudioPlayer(tickSound);
  const scenario = SCENARIOS[index];
  useEffect(() => {
    if (phase !== 'playing' || answered) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 4 && t > 1) {
          tickPlayer.seekTo(0);
          tickPlayer.play();
        }
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, answered, index]);
  const startChallenge = () => {
    setIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(TIME_PER_SCENARIO);
    setAnswered(false);
    setSelectedIdx(null);
    setFeedback(null);
    setPhase('playing');
  };
  const finishChallenge = async (finalCorrect, finalScore) => {
    clearInterval(timerRef.current);
    const result = gradeFor(finalCorrect, SCENARIOS.length);
    winPlayer.seekTo(0);
    winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFinalResult({
      ...result,
      score: finalScore,
      correct: finalCorrect
    });
    setPhase('done');
    try {
      await apiRequest('/gamification/minigame-complete', 'POST', {
        userId,
        gameId: 'teen_scenario_challenge',
        xp: result.xp
      });
    } catch (err) {
      console.log('Scenario Challenge completion error:', err.message);
    }
  };
  const advance = (finalCorrect, finalScore) => {
    setTimeout(() => {
      if (index + 1 >= SCENARIOS.length) {
        finishChallenge(finalCorrect, finalScore);
      } else {
        setIndex(i => i + 1);
        setTimeLeft(TIME_PER_SCENARIO);
        setAnswered(false);
        setSelectedIdx(null);
        setFeedback(null);
      }
    }, 1400);
  };
  const handleTimeout = () => {
    if (answered) return;
    wrongPlayer.seekTo(0);
    wrongPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setAnswered(true);
    setSelectedIdx(null);
    setStreak(0);
    setFeedback({
      correct: false,
      timedOut: true
    });
    advance(correctCount, score);
  };
  const chooseOption = (opt, i) => {
    if (answered) return;
    setAnswered(true);
    setSelectedIdx(i);
    clearInterval(timerRef.current);
    if (opt.correct) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
      streakPulse.value = withSequence(withTiming(1, {
        duration: 120
      }), withTiming(0, {
        duration: 240
      }));
      const basePoints = Math.round(60 + timeLeft / TIME_PER_SCENARIO * 40);
      const awarded = Math.round(basePoints * getMultiplier(newStreak));
      const newScore = score + awarded;
      const newCorrect = correctCount + 1;
      setScore(newScore);
      setCorrectCount(newCorrect);
      setScoreFly({
        id: Date.now(),
        amount: awarded
      });
      setFeedback({
        correct: true,
        why: scenario.why
      });
      advance(newCorrect, newScore);
    } else {
      wrongPlayer.seekTo(0);
      wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
      setFeedback({
        correct: false,
        why: scenario.why
      });
      advance(correctCount, score);
    }
  };
  const timerPct = Math.round(timeLeft / TIME_PER_SCENARIO * 100);
  const streakBadgeStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: 1 + streakPulse.value * 0.25
    }]
  }));
  const dangerStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(239, 68, 68, ${dangerPulse.value * 0.16})`,
    borderColor: `rgba(239, 68, 68, ${dangerPulse.value * 0.8})`
  }));
  if (phase === 'intro') {
    return <SafeAreaView style={{
      flex: 1,
      backgroundColor: TEEN.slate
    }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.introBody}>
        <View style={styles.introHazardRow}>
          {SCENARIOS.slice(0, 5).map((s, i) => <Animated.View key={s.id} entering={ZoomIn.delay(i * 90).duration(320).springify().damping(20)}>
              <HazardBadge icon={s.hazardIcon} color={HAZARD_COLOR[s.hazardColor]} size={44} />
            </Animated.View>)}
        </View>
        <Text style={styles.introKicker}>TEEN CHALLENGE</Text>
        <Text style={styles.introTitle}>Scenario Challenge</Text>
        <Text style={styles.introText}>
          Eight real emergency scenarios. You have {TIME_PER_SCENARIO} seconds each to make the right call.
          Faster, correct answers score more - and a streak of correct calls multiplies your score.
        </Text>
        <View style={styles.introStatsRow}>
          <View style={styles.introStatBox}>
            <Text style={styles.introStatNum}>{SCENARIOS.length}</Text>
            <Text style={styles.introStatLabel}>Scenarios</Text>
          </View>
          <View style={styles.introStatBox}>
            <Text style={styles.introStatNum}>{TIME_PER_SCENARIO}s</Text>
            <Text style={styles.introStatLabel}>Per call</Text>
          </View>
          <View style={styles.introStatBox}>
            <Text style={styles.introStatNum}>2x</Text>
            <Text style={styles.introStatLabel}>Max multiplier</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={startChallenge} accessibilityRole="button" accessibilityLabel="Start the scenario challenge" {...touchTargetProps(a11y)}>
          <Text style={styles.primaryBtnText}>START CHALLENGE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryBtnText}>Back Home</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>;
  }
  if (phase === 'done') {
    const isTopGrade = finalResult.grade === 'S' || finalResult.grade === 'A';
    return <SafeAreaView style={[styles.screen, styles.center, {
      backgroundColor: TEEN.slate
    }]} edges={['top', 'bottom']}>
        {isTopGrade && <Celebration colors={[TEEN.teal, TEEN.indigo, TEEN.coral, '#FBBF24']} />}
        {isTopGrade && <LottieView source={celebrationStarSource} autoPlay={!a11y.reducedMotion} loop={!a11y.reducedMotion} style={styles.doneLottie} />}
        <Text style={[styles.gradeLetter, {
        color: GRADE_COLOR[finalResult.grade]
      }]}>{finalResult.grade}</Text>
        <Text style={styles.doneTitle}>{finalResult.label}</Text>
        <View style={styles.doneStatsRow}>
          <View style={styles.doneStatBox}>
            <CountUpNumber value={finalResult.score} style={[styles.doneStatNum, {
            color: TEEN.coral
          }]} />
            <Text style={styles.doneStatLabel}>Score</Text>
          </View>
          <View style={styles.doneStatBox}>
            <CountUpNumber value={finalResult.correct} suffix={`/${SCENARIOS.length}`} style={[styles.doneStatNum, {
            color: TEEN.teal
          }]} />
            <Text style={styles.doneStatLabel}>Correct calls</Text>
          </View>
          <View style={styles.doneStatBox}>
            <CountUpNumber value={bestStreak} style={[styles.doneStatNum, {
            color: TEEN.indigo
          }]} />
            <Text style={styles.doneStatLabel}>Best streak</Text>
          </View>
        </View>
        <Text style={styles.doneSub}>+{finalResult.xp} XP earned</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={startChallenge} accessibilityRole="button" accessibilityLabel="Try again" {...touchTargetProps(a11y)}>
          <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryBtnText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>;
  }
  return <View style={[styles.screen, {
    backgroundColor: TEEN.slate
  }]}>
      <Animated.View style={[styles.header, {
      paddingTop: insets.top + 14,
      borderBottomWidth: 2
    }, dangerStyle]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Exit challenge" {...touchTargetProps(a11y)}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <View style={styles.timeChip}>
            <Text style={[styles.timeChipText, isLowTime && {
            color: '#EF4444'
          }]}>⏱ {timeLeft}s</Text>
          </View>
          <Text style={styles.headerProgress}>{index + 1} / {SCENARIOS.length}</Text>
          <View style={styles.scorePillWrap}>
            <View style={styles.scorePill}>
              <Text style={styles.scorePillIcon}>🎯</Text>
              <CountUpNumber value={score} duration={400} style={styles.scorePillText} />
            </View>
            {scoreFly && <ScoreFlyup key={scoreFly.id} amount={scoreFly.amount} onDone={() => setScoreFly(null)} />}
          </View>
        </View>
        <AnimatedProgressBar progress={timerPct} trackColor={TEEN.border} fillColor={timeLeft <= 4 ? '#EF4444' : TEEN.teal} height={10} />
        {streak >= 2 && <Animated.View key={streak} entering={ZoomIn.duration(160).springify().damping(20)} style={[styles.streakBadge, streakBadgeStyle, {
        flexDirection: 'row',
        alignItems: 'center'
      }]}>
            <FlameFlicker style={styles.streakBadgeText}>🔥</FlameFlicker>
            <Text style={styles.streakBadgeText}> {streak}x · {getMultiplier(streak)}x score</Text>
          </Animated.View>}
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.body, {
      paddingBottom: 60 + insets.bottom
    }]}>
        <View style={styles.hazardRow}>
          <HazardBadge key={scenario.id} icon={scenario.hazardIcon} color={HAZARD_COLOR[scenario.hazardColor]} />
        </View>
        <Animated.Text key={`prompt-${index}`} entering={FadeInDown.duration(260)} style={styles.prompt}>
          {scenario.prompt}
        </Animated.Text>

        {scenario.options.map((opt, i) => {
        const isCorrectOpt = answered && opt.correct;
        const isWrongOpt = answered && i === selectedIdx && !opt.correct;
        const optStyle = [styles.option];
        if (isCorrectOpt) optStyle.push(styles.optionCorrect);else if (isWrongOpt) optStyle.push(styles.optionWrong);
        return <Animated.View key={`${i}-${answered}`} entering={isCorrectOpt || isWrongOpt ? answerFeedbackEntering : undefined}>
              <BouncyPress style={optStyle} disabled={answered} onPress={() => chooseOption(opt, i)} accessibilityRole="button" accessibilityLabel={opt.text} accessibilityState={{
            disabled: answered
          }} {...touchTargetProps(a11y)}>
                <Text style={styles.optionText}>{opt.text}</Text>
              </BouncyPress>
            </Animated.View>;
      })}

        {feedback && <Animated.View entering={FadeInDown.duration(220)} style={[styles.feedbackBox, feedback.correct ? styles.feedbackGood : styles.feedbackBad]}>
            <Text style={styles.feedbackTitle}>
              {feedback.timedOut ? '⏱️ Too slow!' : feedback.correct ? '✅ Right call' : '❌ Not the safest choice'}
            </Text>
            {feedback.why && <Text style={styles.feedbackText}>{feedback.why}</Text>}
          </Animated.View>}
      </ScrollView>
    </View>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl
  },
  introBody: {
    padding: SPACING.xxl,
    paddingTop: 20,
    alignItems: 'center'
  },
  introHazardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg
  },
  introKicker: {
    color: TEEN.coral,
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize,
    letterSpacing: 2,
    marginBottom: SPACING.sm
  },
  introTitle: {
    color: TEEN.text,
    fontSize: TYPE.display.fontSize,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center'
  },
  introText: {
    color: TEEN.textSub,
    fontSize: TYPE.body.fontSize,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: SPACING.xxl
  },
  introStatsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xxl + 4
  },
  introStatBox: {
    alignItems: 'center',
    marginHorizontal: SPACING.lg
  },
  introStatNum: {
    color: TEEN.teal,
    fontSize: TYPE.title.fontSize,
    fontWeight: 'bold'
  },
  introStatLabel: {
    color: TEEN.textSub,
    fontSize: TYPE.caption.fontSize,
    marginTop: 2
  },
  primaryBtn: {
    backgroundColor: TEEN.coral,
    borderRadius: RADII.teen.card,
    borderBottomWidth: 4,
    borderColor: '#C2453A',
    paddingVertical: SPACING.lg,
    paddingHorizontal: 48,
    marginBottom: SPACING.md
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize + 1,
    letterSpacing: 1
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm
  },
  secondaryBtnText: {
    color: TEEN.textSub,
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderColor: 'transparent'
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm
  },
  closeBtn: {
    color: TEEN.textSub,
    fontSize: 22,
    fontWeight: 'bold'
  },
  timeChip: {
    backgroundColor: TEEN.base,
    borderRadius: RADII.teen.chip,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm
  },
  timeChipText: {
    color: TEEN.teal,
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize
  },
  headerProgress: {
    color: TEEN.textSub,
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize + 1
  },
  scorePillWrap: {
    position: 'relative'
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEEN.base,
    borderRadius: RADII.teen.chip,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2
  },
  scorePillIcon: {
    fontSize: 14,
    marginRight: 4
  },
  scorePillText: {
    color: TEEN.coral,
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize
  },
  scoreFly: {
    position: 'absolute',
    top: -18,
    right: 0,
    color: TEEN.coral,
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize
  },
  streakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: TEEN.coral,
    borderRadius: RADII.teen.chip,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    marginTop: SPACING.sm
  },
  streakBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize - 1
  },
  body: {
    padding: SPACING.xxl,
    paddingBottom: 60
  },
  hazardRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  hazardBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hazardBadgeIcon: {
    fontSize: 32
  },
  prompt: {
    color: TEEN.text,
    fontSize: TYPE.title.fontSize,
    fontWeight: 'bold',
    lineHeight: 28,
    marginBottom: SPACING.xxl
  },
  option: {
    backgroundColor: TEEN.base,
    borderRadius: RADII.teen.card,
    borderWidth: 2,
    borderColor: TEEN.border,
    borderBottomWidth: 5,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  optionCorrect: {
    borderColor: TEEN.teal,
    backgroundColor: '#0F4A42'
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#4a1616'
  },
  optionText: {
    color: TEEN.text,
    fontSize: TYPE.body.fontSize + 1,
    fontWeight: '600'
  },
  feedbackBox: {
    borderRadius: RADII.teen.card,
    padding: SPACING.lg,
    marginTop: SPACING.sm
  },
  feedbackGood: {
    backgroundColor: '#0F4A42'
  },
  feedbackBad: {
    backgroundColor: '#4a1616'
  },
  feedbackTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize,
    marginBottom: SPACING.xs
  },
  feedbackText: {
    color: '#E2E8F0',
    fontSize: TYPE.caption.fontSize + 1,
    lineHeight: 19
  },
  doneLottie: {
    width: 120,
    height: 120,
    marginBottom: -10
  },
  gradeLetter: {
    color: TEEN.teal,
    fontSize: 88,
    fontWeight: 'bold'
  },
  doneTitle: {
    color: TEEN.text,
    fontSize: TYPE.title.fontSize,
    fontWeight: 'bold',
    marginBottom: SPACING.xxl
  },
  doneStatsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg
  },
  doneStatBox: {
    alignItems: 'center',
    marginHorizontal: SPACING.lg
  },
  doneStatNum: {
    fontSize: TYPE.title.fontSize,
    fontWeight: 'bold'
  },
  doneStatLabel: {
    color: TEEN.textSub,
    fontSize: TYPE.caption.fontSize,
    marginTop: 2
  },
  doneSub: {
    color: TEEN.textSub,
    fontWeight: 'bold',
    marginBottom: SPACING.xxl,
    fontSize: TYPE.body.fontSize
  }
});
