import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withDelay, Easing, ZoomIn } from 'react-native-reanimated';
import Text from '../components/Text';
import LottieView from 'lottie-react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { TEEN_LESSONS } from '../constants/lessonSchema';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import Celebration from '../components/Celebration';
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay';
import useBadgeUnlock from '../hooks/useBadgeUnlock';
const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const celebrationStarSource = require('../assets/lottie/celebration-star.json');
const TEEN = AGE_PALETTES.teen;
const TEAL = TEEN.teal;
const INDIGO = TEEN.indigo;
const CORAL = TEEN.coral;
const ERROR = SEMANTIC.critical;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_HEARTS = 5;
function getMultiplier(streak) {
  if (streak >= 6) return 3;
  if (streak >= 4) return 2;
  if (streak >= 2) return 1.5;
  return 1;
}
const answerFeedbackEntering = undefined;
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function XpFlyup({
  amount,
  onDone
}) {
  const translateY = useSharedValue(10);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withSequence(withTiming(1, {
      duration: 120
    }), withDelay(420, withTiming(0, {
      duration: 260
    })));
    translateY.value = withTiming(-50, {
      duration: 780,
      easing: Easing.out(Easing.quad)
    });
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{
      translateY: translateY.value
    }]
  }));
  return <Animated.Text style={[styles.xpFly, style]}>+{amount} XP</Animated.Text>;
}
export default function LessonScreen({
  route,
  navigation
}) {
  const {
    userId
  } = useUser();
  const {
    settings: a11y
  } = useAccessibility();
  const insets = useSafeAreaInsets();
  const {
    lessonId
  } = route.params;
  const lesson = TEEN_LESSONS.find(l => l.id === lessonId) || TEEN_LESSONS[0];
  const exercises = lesson.exercises;
  const basePoints = Math.max(1, Math.round(lesson.xp / exercises.length));
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [selected, setSelected] = useState(null);
  const [bankSelected, setBankSelected] = useState([]);
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [xpFly, setXpFly] = useState(null);
  const [matchLeftId, setMatchLeftId] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [matchWrongFlash, setMatchWrongFlash] = useState(null);
  const [tapImageTried, setTapImageTried] = useState([]);
  const [orderSelected, setOrderSelected] = useState([]);
  const [gamBadges, setGamBadges] = useState(null);
  const {
    unlockedBadge,
    dismissBadgeUnlock
  } = useBadgeUnlock(gamBadges);
  const heartShakeX = useSharedValue(0);
  const feedbackY = useSharedValue(200);
  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);
  const ex = exercises[index];
  const progress = Math.round(index / exercises.length * 100);
  const shuffledMatchRight = useMemo(() => ex.type === 'match' ? shuffle(ex.pairs.map(p => ({
    id: p.id,
    text: p.right
  }))) : [], [index]);
  const shuffledOrderSteps = useMemo(() => ex.type === 'order' ? shuffle(ex.steps) : [], [index]);
  const shakeHearts = () => {};
  const heartRowStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: heartShakeX.value
    }]
  }));
  const showFeedback = () => {
    feedbackY.value = 0;
  };
  const feedbackStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: feedbackY.value
    }]
  }));
  const isAnswerReady = () => {
    if (ex.type === 'select' || ex.type === 'truefalse' || ex.type === 'fillblank') return selected !== null;
    if (ex.type === 'wordbank') return bankSelected.length > 0;
    if (ex.type === 'order') return orderSelected.length === ex.steps.length;
    return false;
  };
  const evaluate = () => {
    if (ex.type === 'select') return selected === ex.correct;
    if (ex.type === 'truefalse') return selected === ex.correct;
    if (ex.type === 'fillblank') return selected === ex.correct;
    if (ex.type === 'wordbank') {
      return bankSelected.length === ex.answer.length && bankSelected.every((w, i) => w === ex.answer[i]);
    }
    if (ex.type === 'order') {
      return orderSelected.length === ex.steps.length && orderSelected.every((s, i) => s === ex.steps[i]);
    }
    return false;
  };
  const awardCorrect = () => {
    packPlayer.seekTo(0);
    packPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCorrectCount(c => c + 1);
    const newStreak = streak + 1;
    setStreak(newStreak);
    setBestStreak(b => Math.max(b, newStreak));
    const awarded = Math.round(basePoints * getMultiplier(newStreak));
    setEarnedXp(xp => xp + awarded);
    setXpFly({
      id: Date.now(),
      amount: awarded
    });
  };
  const loseHeart = () => {
    wrongPlayer.seekTo(0);
    wrongPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setStreak(0);
    shakeHearts();
    const newHearts = hearts - 1;
    setHearts(newHearts);
    if (newHearts <= 0) {
      setTimeout(() => setPhase('failed'), 600);
    }
  };
  const check = () => {
    const correct = evaluate();
    setWasCorrect(correct);
    setChecked(true);
    showFeedback();
    if (correct) awardCorrect();else loseHeart();
  };
  const tapMatchLeft = id => {
    if (matchedIds.includes(id) || checked) return;
    setMatchLeftId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const tapMatchRight = id => {
    if (matchedIds.includes(id) || checked || matchLeftId === null) return;
    if (matchLeftId === id) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextMatched = [...matchedIds, id];
      setMatchedIds(nextMatched);
      setMatchLeftId(null);
      if (nextMatched.length === ex.pairs.length) {
        setWasCorrect(true);
        setChecked(true);
        showFeedback();
        awardCorrect();
      }
    } else {
      setMatchWrongFlash({
        left: matchLeftId,
        right: id
      });
      loseHeart();
      setTimeout(() => {
        setMatchWrongFlash(null);
        setMatchLeftId(null);
      }, 400);
    }
  };
  const tapImageItem = item => {
    if (checked || tapImageTried.includes(item.id)) return;
    const nextTried = [...tapImageTried, item.id];
    setTapImageTried(nextTried);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.hazard) {
      packPlayer.seekTo(0);
      packPlayer.play();
      const totalHazards = ex.items.filter(it => it.hazard).length;
      const foundCount = nextTried.filter(id => ex.items.find(it => it.id === id).hazard).length;
      if (foundCount === totalHazards) {
        setWasCorrect(true);
        setChecked(true);
        showFeedback();
        awardCorrect();
      }
    } else {
      loseHeart();
    }
  };
  const next = async () => {
    setChecked(false);
    setSelected(null);
    setBankSelected([]);
    setMatchLeftId(null);
    setMatchedIds([]);
    setMatchWrongFlash(null);
    setTapImageTried([]);
    setOrderSelected([]);
    if (index < exercises.length - 1) {
      setIndex(index + 1);
    } else {
      winPlayer.seekTo(0);
      winPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('done');
      try {
        const result = await apiRequest('/gamification/lesson-complete', 'POST', {
          userId,
          lessonId,
          xp: earnedXp || lesson.xp
        });
        setGamBadges(result.badges || []);
      } catch (err) {
        console.log('Lesson complete error:', err.message);
      }
    }
  };
  const retryLesson = () => {
    setIndex(0);
    setHearts(MAX_HEARTS);
    setCorrectCount(0);
    setChecked(false);
    setSelected(null);
    setBankSelected([]);
    setStreak(0);
    setBestStreak(0);
    setEarnedXp(0);
    setXpFly(null);
    setMatchLeftId(null);
    setMatchedIds([]);
    setMatchWrongFlash(null);
    setTapImageTried([]);
    setOrderSelected([]);
    setPhase('playing');
  };
  const tapBankWord = (word, fromSelected, i) => {
    if (checked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (fromSelected) {
      setBankSelected(prev => prev.filter((_, idx) => idx !== i));
    } else {
      setBankSelected(prev => [...prev, word]);
    }
  };
  const availableBank = () => {
    const used = [...bankSelected];
    return ex.bank.filter(w => {
      const i = used.indexOf(w);
      if (i >= 0) {
        used.splice(i, 1);
        return false;
      }
      return true;
    });
  };
  const tapOrderStep = (step, fromSelected, i) => {
    if (checked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (fromSelected) {
      setOrderSelected(prev => prev.filter((_, idx) => idx !== i));
    } else {
      setOrderSelected(prev => [...prev, step]);
    }
  };
  const availableOrderSteps = () => {
    const used = [...orderSelected];
    return shuffledOrderSteps.filter(s => {
      const i = used.indexOf(s);
      if (i >= 0) {
        used.splice(i, 1);
        return false;
      }
      return true;
    });
  };
  if (phase === 'intro') {
    return <SafeAreaView style={{
      flex: 1,
      backgroundColor: TEEN.slate
    }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.introBody}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{
          alignSelf: 'flex-start'
        }} accessibilityRole="button" accessibilityLabel="Close lesson" accessibilityHint="Exits without starting the lesson" {...touchTargetProps(a11y)}>
          <Text style={[styles.closeBtn, {
            color: TEEN.textSub
          }]}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.introEmoji}>{lesson.emoji}</Text>
        <Text style={[styles.introTitle, {
          color: TEEN.text
        }]}>{lesson.title}</Text>

        <View style={[styles.introSection, {
          backgroundColor: TEEN.base,
          borderLeftColor: TEEN.textSub
        }]}>
          <Text style={[styles.introLabel, {
            color: TEEN.textSub
          }]}>WHAT IT IS</Text>
          <Text style={[styles.introText, {
            color: TEEN.text
          }]}>{lesson.intro.what}</Text>
        </View>
        <View style={[styles.introSection, {
          backgroundColor: TEEN.base,
          borderLeftColor: TEAL
        }]}>
          <Text style={[styles.introLabel, {
            color: TEAL
          }]}>HOW TO PREPARE</Text>
          <Text style={[styles.introText, {
            color: TEEN.text
          }]}>{lesson.intro.prepare}</Text>
        </View>
        <View style={[styles.introSection, {
          backgroundColor: TEEN.base,
          borderLeftColor: INDIGO
        }]}>
          <Text style={[styles.introLabel, {
            color: INDIGO
          }]}>HOW TO REACT</Text>
          <Text style={[styles.introText, {
            color: TEEN.text
          }]}>{lesson.intro.react}</Text>
        </View>
        <View style={[styles.introSection, {
          backgroundColor: TEEN.base,
          borderLeftColor: CORAL
        }]}>
          <Text style={[styles.introLabel, {
            color: CORAL
          }]}>PROTECT YOURSELF</Text>
          <Text style={[styles.introText, {
            color: TEEN.text
          }]}>{lesson.intro.protect}</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('playing')} accessibilityRole="button" accessibilityLabel="Start lesson" {...touchTargetProps(a11y)}>
          <Text style={styles.primaryBtnText}>START LESSON ▶</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>;
  }
  if (phase === 'done') {
    const accuracy = Math.round(correctCount / exercises.length * 100);
    return <SafeAreaView style={[styles.completeScreen, {
      backgroundColor: TEEN.slate
    }]} edges={['top', 'bottom']}>
        <Celebration colors={[TEAL, INDIGO, CORAL, '#FBBF24']} />
        <LottieView source={celebrationStarSource} autoPlay={!a11y.reducedMotion} loop={!a11y.reducedMotion} style={styles.completeLottie} />
        <Text style={[styles.completeTitle, {
        color: TEEN.text
      }]}>Lesson Complete!</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={{
            flexDirection: 'row'
          }}>
              <Text style={[styles.statNum, {
              color: CORAL
            }]}>+</Text>
              <CountUpNumber value={earnedXp} style={[styles.statNum, {
              color: CORAL
            }]} />
            </View>
            <Text style={[styles.statLabel, {
            color: TEEN.textSub
          }]}>XP</Text>
          </View>
          <View style={styles.statBox}>
            <CountUpNumber value={accuracy} suffix="%" style={[styles.statNum, {
            color: TEAL
          }]} />
            <Text style={[styles.statLabel, {
            color: TEEN.textSub
          }]}>Accuracy</Text>
          </View>
          <View style={styles.statBox}>
            <CountUpNumber value={hearts} style={[styles.statNum, {
            color: CORAL
          }]} />
            <Text style={[styles.statLabel, {
            color: TEEN.textSub
          }]}>Hearts left</Text>
          </View>
          <View style={styles.statBox}>
            <CountUpNumber value={bestStreak} style={[styles.statNum, {
            color: INDIGO
          }]} />
            <Text style={[styles.statLabel, {
            color: TEEN.textSub
          }]}>Best streak</Text>
          </View>
        </View>
        <Text style={[styles.completeSub, {
        color: TEEN.textSub
      }]}>The next lesson is now unlocked.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Continue" accessibilityHint="Returns to the learning path" {...touchTargetProps(a11y)}>
          <Text style={styles.primaryBtnText}>CONTINUE</Text>
        </TouchableOpacity>
        <BadgeUnlockOverlay badgeId={unlockedBadge} accent={TEAL} onDismiss={dismissBadgeUnlock} />
      </SafeAreaView>;
  }
  if (phase === 'failed') {
    return <SafeAreaView style={[styles.completeScreen, {
      backgroundColor: TEEN.slate
    }]} edges={['top', 'bottom']}>
        <Text style={styles.completeEmoji}>💔</Text>
        <Text style={[styles.completeTitle, {
        color: TEEN.text
      }]}>Out of hearts!</Text>
        <Text style={[styles.completeSub, {
        color: TEEN.textSub
      }]}>No worries - review and try again. Repetition is how it sticks.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={retryLesson} accessibilityRole="button" accessibilityLabel="Try again" accessibilityHint="Restarts this lesson from the beginning" {...touchTargetProps(a11y)}>
          <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back to path" {...touchTargetProps(a11y)}>
          <Text style={[styles.secondaryBtnText, {
          color: TEEN.textSub
        }]}>Back to Path</Text>
        </TouchableOpacity>
      </SafeAreaView>;
  }
  return <View style={[styles.screen, {
    backgroundColor: TEEN.slate
  }]}>
      {}
      <View style={[styles.header, {
      paddingTop: insets.top + 12
    }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Close lesson" accessibilityHint="Exits the lesson without finishing it" {...touchTargetProps(a11y)}>
            <Text style={[styles.closeBtn, {
            color: TEEN.textSub
          }]}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <AnimatedProgressBar progress={progress} trackColor={TEEN.border} fillColor={TEAL} height={14} />
          </View>
          <Animated.View style={[styles.heartsBox, heartRowStyle]}>
            {Array.from({
            length: MAX_HEARTS
          }).map((_, i) => <Animated.Text key={`${i}-${i < hearts}`} entering={i < hearts ? undefined : answerFeedbackEntering} style={styles.heartIcon}>
                {i < hearts ? '❤️' : '🖤'}
              </Animated.Text>)}
          </Animated.View>
        </View>
        <View style={styles.headerBottomRow}>
          <View style={styles.xpPill}>
            <Text style={styles.xpPillIcon}>⚡</Text>
            <CountUpNumber value={earnedXp} suffix=" XP" duration={500} style={styles.xpPillText} />
          </View>
          {streak >= 2 && <Animated.View key={streak} entering={ZoomIn.duration(160).springify().damping(20)} style={styles.comboBadge}>
              <Text style={styles.comboText}>🔥 {streak}x STREAK</Text>
            </Animated.View>}
          {xpFly && <XpFlyup key={xpFly.id} amount={xpFly.amount} onDone={() => setXpFly(null)} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.prompt, {
        color: TEEN.text
      }]}>{ex.prompt}</Text>

        {}
        {ex.type === 'select' && ex.options.map((opt, i) => {
        const isCorrectOpt = checked && i === ex.correct;
        const isWrongOpt = checked && i === selected && i !== ex.correct;
        let optStyle = [styles.option, {
          backgroundColor: TEEN.base,
          borderColor: TEEN.border
        }];
        if (isCorrectOpt) optStyle.push(styles.optionCorrect);else if (isWrongOpt) optStyle.push(styles.optionWrong);else if (selected === i) optStyle.push(styles.optionSelected);
        return <Animated.View key={`${i}-${checked}`} entering={isCorrectOpt || isWrongOpt ? answerFeedbackEntering : undefined}>
              <TouchableOpacity style={optStyle} disabled={checked} onPress={() => {
            setSelected(i);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }} accessibilityRole="button" accessibilityLabel={opt} accessibilityState={{
            selected: selected === i,
            disabled: checked
          }} {...touchTargetProps(a11y)}>
                <Text style={[styles.optionText, {
              color: TEEN.text
            }]}>{opt}</Text>
              </TouchableOpacity>
            </Animated.View>;
      })}

        {}
        {ex.type === 'truefalse' && [true, false].map((val, i) => {
        const isSel = selected === val;
        const isCorrectOpt = checked && val === ex.correct;
        const isWrongOpt = checked && isSel && val !== ex.correct;
        let optStyle = [styles.option, {
          backgroundColor: TEEN.base,
          borderColor: TEEN.border
        }];
        if (isCorrectOpt) optStyle.push(styles.optionCorrect);else if (isWrongOpt) optStyle.push(styles.optionWrong);else if (isSel) optStyle.push(styles.optionSelected);
        return <Animated.View key={`${i}-${checked}`} entering={isCorrectOpt || isWrongOpt ? answerFeedbackEntering : undefined}>
              <TouchableOpacity style={optStyle} disabled={checked} onPress={() => {
            setSelected(val);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }} accessibilityRole="button" accessibilityLabel={val ? 'True' : 'False'} accessibilityState={{
            selected: isSel,
            disabled: checked
          }} {...touchTargetProps(a11y)}>
                <Text style={[styles.optionText, {
              color: TEEN.text
            }]}>{val ? '✅ True' : '❌ False'}</Text>
              </TouchableOpacity>
            </Animated.View>;
      })}

        {}
        {ex.type === 'wordbank' && <>
            <View style={[styles.answerLine, {
          borderColor: TEEN.border
        }]}>
              {bankSelected.length === 0 && <Text style={[styles.answerPlaceholder, {
            color: TEEN.textSub
          }]}>Tap words to build your answer...</Text>}
              {bankSelected.map((w, i) => <Animated.View key={`${w}-${i}`} entering={ZoomIn.duration(200).springify().damping(20)}>
                  <TouchableOpacity style={styles.chipSelected} onPress={() => tapBankWord(w, true, i)} accessibilityRole="button" accessibilityLabel={w} accessibilityHint="Removes this word from your answer" {...touchTargetProps(a11y)}>
                    <Text style={styles.chipTextSelected}>{w}</Text>
                  </TouchableOpacity>
                </Animated.View>)}
            </View>
            <View style={styles.bankPool}>
              {availableBank().map((w, i) => <TouchableOpacity key={i} style={[styles.chip, {
            backgroundColor: TEEN.base,
            borderColor: TEEN.border
          }]} onPress={() => tapBankWord(w, false, i)} accessibilityRole="button" accessibilityLabel={w} accessibilityHint="Adds this word to your answer" {...touchTargetProps(a11y)}>
                  <Text style={[styles.chipText, {
              color: TEEN.text
            }]}>{w}</Text>
                </TouchableOpacity>)}
            </View>
          </>}

        {}
        {ex.type === 'match' && <View style={styles.matchRow}>
            <View style={styles.matchCol}>
              {ex.pairs.map(p => {
            const isMatched = matchedIds.includes(p.id);
            const isSelected = matchLeftId === p.id;
            const isWrongFlash = matchWrongFlash && matchWrongFlash.left === p.id;
            return <TouchableOpacity key={p.id} disabled={isMatched} onPress={() => tapMatchLeft(p.id)} style={[styles.matchItem, {
              backgroundColor: TEEN.base,
              borderColor: TEEN.border
            }, isSelected && styles.matchItemSelected, isMatched && styles.matchItemMatched, isWrongFlash && styles.matchItemWrong]} accessibilityRole="button" accessibilityLabel={p.left} accessibilityHint="Then tap its match on the right" accessibilityState={{
              selected: isSelected,
              disabled: isMatched
            }} {...touchTargetProps(a11y)}>
                    <Text style={[styles.matchItemText, {
                color: TEEN.text
              }, isMatched && styles.matchItemTextMatched]}>{p.left}</Text>
                  </TouchableOpacity>;
          })}
            </View>
            <View style={styles.matchCol}>
              {shuffledMatchRight.map(r => {
            const isMatched = matchedIds.includes(r.id);
            const isWrongFlash = matchWrongFlash && matchWrongFlash.right === r.id;
            return <TouchableOpacity key={r.id} disabled={isMatched} onPress={() => tapMatchRight(r.id)} style={[styles.matchItem, {
              backgroundColor: TEEN.base,
              borderColor: TEEN.border
            }, isMatched && styles.matchItemMatched, isWrongFlash && styles.matchItemWrong]} accessibilityRole="button" accessibilityLabel={r.text} accessibilityHint="Matches this to the term you selected on the left" accessibilityState={{
              disabled: isMatched
            }} {...touchTargetProps(a11y)}>
                    <Text style={[styles.matchItemText, {
                color: TEEN.text
              }, isMatched && styles.matchItemTextMatched]}>{r.text}</Text>
                  </TouchableOpacity>;
          })}
            </View>
          </View>}

        {}
        {ex.type === 'tapimage' && <View style={[styles.tapScene, {
        backgroundColor: TEEN.base,
        borderColor: TEEN.border
      }]}>
            {ex.items.map(item => {
          const tried = tapImageTried.includes(item.id);
          const isFound = tried && item.hazard;
          const isMissed = tried && !item.hazard;
          const objectName = item.id.replace(/[-_]/g, ' ');
          return <TouchableOpacity key={item.id} disabled={tried} onPress={() => tapImageItem(item)} style={[styles.tapItem, {
            left: `${item.xPct}%`,
            top: `${item.yPct}%`
          }]} accessibilityRole="button" accessibilityLabel={tried ? `${objectName}, ${item.hazard ? 'correct, this was a hazard' : 'not a hazard'}` : objectName} accessibilityHint={tried ? undefined : 'Tap if this could fall or hurt someone when the shaking starts'} accessibilityState={{
            disabled: tried
          }} {...touchTargetProps(a11y)}>
                  <Animated.Text key={`${item.id}-${tried}`} entering={tried ? answerFeedbackEntering : undefined} style={[styles.tapItemEmoji, tried && {
              opacity: 0.45
            }]}>
                    {item.emoji}
                  </Animated.Text>
                  {isFound && <Text style={styles.tapItemMark}>✅</Text>}
                  {isMissed && <Text style={styles.tapItemMark}>❌</Text>}
                </TouchableOpacity>;
        })}
          </View>}

        {}
        {ex.type === 'order' && <>
            <View style={styles.orderSlots}>
              {orderSelected.length === 0 && <Text style={[styles.answerPlaceholder, {
            color: TEEN.textSub
          }]}>Tap steps below in the right order...</Text>}
              {orderSelected.map((s, i) => <Animated.View key={`${s}-${i}`} entering={ZoomIn.duration(200).springify().damping(20)}>
                  <TouchableOpacity style={[styles.orderSlotRow, {
              backgroundColor: TEEN.base,
              borderColor: TEAL
            }]} onPress={() => tapOrderStep(s, true, i)} accessibilityRole="button" accessibilityLabel={`Step ${i + 1}: ${s}`} accessibilityHint="Removes this step so you can reorder it" {...touchTargetProps(a11y)}>
                    <Text style={styles.orderSlotNumber}>{i + 1}</Text>
                    <Text style={[styles.orderSlotText, {
                color: TEEN.text
              }]}>{s}</Text>
                  </TouchableOpacity>
                </Animated.View>)}
            </View>
            <View style={styles.bankPool}>
              {availableOrderSteps().map((s, i) => <TouchableOpacity key={i} style={[styles.chip, {
            backgroundColor: TEEN.base,
            borderColor: TEEN.border
          }]} onPress={() => tapOrderStep(s, false, i)} accessibilityRole="button" accessibilityLabel={s} accessibilityHint="Adds this as the next step in your order" {...touchTargetProps(a11y)}>
                  <Text style={[styles.chipText, {
              color: TEEN.text
            }]}>{s}</Text>
                </TouchableOpacity>)}
            </View>
          </>}

        {}
        {ex.type === 'fillblank' && <>
            <View style={[styles.fillSentenceBox, {
          backgroundColor: TEEN.base,
          borderColor: TEEN.border
        }]}>
              <Text style={[styles.fillSentenceText, {
            color: TEEN.text
          }]}>
                {ex.template.split('{blank}')[0]}
                <Text style={[styles.fillBlankSlot, {
              color: selected !== null ? TEAL : TEEN.textSub,
              borderBottomColor: selected !== null ? TEAL : TEEN.textSub
            }]}>
                  {selected !== null ? ex.blankOptions[selected] : '_______'}
                </Text>
                {ex.template.split('{blank}')[1]}
              </Text>
            </View>
            {ex.blankOptions.map((opt, i) => {
          const isCorrectOpt = checked && i === ex.correct;
          const isWrongOpt = checked && i === selected && i !== ex.correct;
          let optStyle = [styles.option, {
            backgroundColor: TEEN.base,
            borderColor: TEEN.border
          }];
          if (isCorrectOpt) optStyle.push(styles.optionCorrect);else if (isWrongOpt) optStyle.push(styles.optionWrong);else if (selected === i) optStyle.push(styles.optionSelected);
          return <Animated.View key={`${i}-${checked}`} entering={isCorrectOpt || isWrongOpt ? answerFeedbackEntering : undefined}>
                  <TouchableOpacity style={optStyle} disabled={checked} onPress={() => {
              setSelected(i);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }} accessibilityRole="button" accessibilityLabel={opt} accessibilityState={{
              selected: selected === i,
              disabled: checked
            }} {...touchTargetProps(a11y)}>
                    <Text style={[styles.optionText, {
                color: TEEN.text
              }]}>{opt}</Text>
                  </TouchableOpacity>
                </Animated.View>;
        })}
          </>}
      </ScrollView>

      {}
      {checked && <Animated.View style={[styles.feedbackBar, wasCorrect ? styles.feedbackGood : styles.feedbackBad, {
      paddingBottom: SPACING.xxl + 4 + insets.bottom
    }, feedbackStyle]}>
          <Text style={styles.feedbackTitle}>{wasCorrect ? '✅ Correct!' : '❌ Not quite'}</Text>
          {!wasCorrect && ex.explain && <Text style={styles.feedbackText}>{ex.explain}</Text>}
          {!wasCorrect && ex.type === 'wordbank' && <Text style={styles.feedbackText}>Answer: {ex.answer.join(' ')}</Text>}
          {!wasCorrect && ex.type === 'select' && <Text style={styles.feedbackText}>Answer: {ex.options[ex.correct]}</Text>}
          {!wasCorrect && ex.type === 'order' && <Text style={styles.feedbackText}>Correct order: {ex.steps.join(' → ')}</Text>}
          {!wasCorrect && ex.type === 'fillblank' && <Text style={styles.feedbackText}>Answer: {ex.blankOptions[ex.correct]}</Text>}
          <TouchableOpacity style={styles.continueBtn} onPress={next} accessibilityRole="button" accessibilityLabel="Continue" {...touchTargetProps(a11y)}>
            <Text style={styles.continueBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </Animated.View>}

      {}
      {!checked && ex.type !== 'match' && ex.type !== 'tapimage' && <View style={[styles.checkBar, {
      backgroundColor: TEEN.slate,
      borderColor: TEEN.border,
      paddingBottom: SPACING.lg + insets.bottom
    }]}>
          <TouchableOpacity style={[styles.checkBtn, !isAnswerReady() && [styles.checkBtnDisabled, {
        backgroundColor: TEEN.border,
        borderColor: TEEN.border
      }]]} disabled={!isAnswerReady()} onPress={check} accessibilityRole="button" accessibilityLabel="Check answer" accessibilityState={{
        disabled: !isAnswerReady()
      }} {...touchTargetProps(a11y)}>
            <Text style={styles.checkBtnText}>CHECK</Text>
          </TouchableOpacity>
        </View>}
    </View>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  header: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    position: 'relative'
  },
  closeBtn: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: SPACING.md
  },
  progressTrack: {
    flex: 1
  },
  heartsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md
  },
  heartIcon: {
    fontSize: 16,
    marginLeft: 1
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: RADII.teen.chip,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2
  },
  xpPillIcon: {
    fontSize: 14,
    marginRight: 4
  },
  xpPillText: {
    color: '#FBBF24',
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize
  },
  comboBadge: {
    backgroundColor: CORAL,
    borderRadius: RADII.teen.chip,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2
  },
  comboText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize - 1
  },
  xpFly: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    color: '#FBBF24',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize
  },
  body: {
    padding: SPACING.xxl,
    paddingBottom: 140
  },
  prompt: {
    fontSize: TYPE.title.fontSize + 2,
    fontWeight: 'bold',
    marginBottom: SPACING.xxl,
    lineHeight: 30
  },
  introBody: {
    padding: SPACING.xxl,
    paddingBottom: SPACING.huge + 8,
    alignItems: 'center'
  },
  introEmoji: {
    fontSize: 56,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  introTitle: {
    fontSize: TYPE.display.fontSize - 2,
    fontWeight: 'bold',
    marginBottom: SPACING.xxl,
    textAlign: 'center'
  },
  introSection: {
    width: '100%',
    borderRadius: RADII.teen.card,
    borderLeftWidth: 4,
    padding: SPACING.lg,
    marginBottom: SPACING.md + 2
  },
  introLabel: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: SPACING.sm
  },
  introText: {
    fontSize: TYPE.body.fontSize,
    lineHeight: 22
  },
  option: {
    borderRadius: RADII.teen.card,
    borderWidth: 2,
    borderBottomWidth: 5,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  optionSelected: {
    borderColor: TEAL,
    backgroundColor: '#123F3A'
  },
  optionCorrect: {
    borderColor: TEAL,
    backgroundColor: '#0F4A42'
  },
  optionWrong: {
    borderColor: ERROR,
    backgroundColor: '#4a1616'
  },
  optionText: {
    fontSize: TYPE.body.fontSize + 1,
    fontWeight: '600'
  },
  answerLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 56,
    borderBottomWidth: 2,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.xxl
  },
  answerPlaceholder: {
    fontStyle: 'italic',
    alignSelf: 'center'
  },
  bankPool: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chip: {
    borderRadius: RADII.teen.chip,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md + 2,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm
  },
  chipSelected: {
    backgroundColor: '#123F3A',
    borderRadius: RADII.teen.chip,
    borderWidth: 2,
    borderColor: TEAL,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm - 2,
    marginBottom: SPACING.sm - 2
  },
  chipText: {
    fontSize: TYPE.body.fontSize,
    fontWeight: '600'
  },
  chipTextSelected: {
    color: '#F8FAFC',
    fontSize: TYPE.body.fontSize,
    fontWeight: '600'
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  matchCol: {
    flex: 1,
    marginHorizontal: SPACING.xs
  },
  matchItem: {
    borderRadius: RADII.teen.card - 2,
    borderWidth: 2,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    minHeight: 64,
    justifyContent: 'center'
  },
  matchItemSelected: {
    borderColor: TEAL,
    backgroundColor: '#123F3A'
  },
  matchItemMatched: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52,211,153,0.12)',
    opacity: 0.6
  },
  matchItemWrong: {
    borderColor: ERROR,
    backgroundColor: '#4a1616'
  },
  matchItemText: {
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: '600'
  },
  matchItemTextMatched: {
    textDecorationLine: 'line-through'
  },
  tapScene: {
    width: '100%',
    height: 300,
    borderRadius: RADII.teen.card,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden'
  },
  tapItem: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tapItemEmoji: {
    fontSize: 32
  },
  tapItemMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 16
  },
  orderSlots: {
    marginBottom: SPACING.xxl
  },
  orderSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.teen.card - 2,
    borderWidth: 2,
    padding: SPACING.md,
    marginBottom: SPACING.sm
  },
  orderSlotNumber: {
    color: TEAL,
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize,
    width: 24
  },
  orderSlotText: {
    flex: 1,
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: '600'
  },
  fillSentenceBox: {
    borderRadius: RADII.teen.card,
    borderWidth: 2,
    padding: SPACING.lg,
    marginBottom: SPACING.xl
  },
  fillSentenceText: {
    fontSize: TYPE.body.fontSize + 1,
    lineHeight: 26
  },
  fillBlankSlot: {
    fontWeight: 'bold',
    borderBottomWidth: 2,
    paddingHorizontal: 4
  },
  checkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1
  },
  checkBtn: {
    backgroundColor: TEAL,
    borderRadius: RADII.teen.card,
    borderBottomWidth: 4,
    borderColor: TEEN.tealDeep,
    padding: SPACING.lg,
    alignItems: 'center'
  },
  checkBtnDisabled: {},
  checkBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize + 1,
    letterSpacing: 1
  },
  feedbackBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl + 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  feedbackGood: {
    backgroundColor: '#0F4A42'
  },
  feedbackBad: {
    backgroundColor: '#4a1616'
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: TYPE.title.fontSize - 2,
    fontWeight: 'bold',
    marginBottom: SPACING.sm - 2
  },
  feedbackText: {
    color: '#E2E8F0',
    fontSize: TYPE.body.fontSize - 1,
    marginBottom: SPACING.md,
    lineHeight: 20
  },
  continueBtn: {
    backgroundColor: '#fff',
    borderRadius: RADII.teen.card,
    padding: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.xs + 2
  },
  continueBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize + 1,
    letterSpacing: 1
  },
  completeScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl + 4
  },
  completeEmoji: {
    fontSize: 60,
    marginBottom: SPACING.md
  },
  completeLottie: {
    width: 140,
    height: 140,
    marginBottom: SPACING.sm
  },
  completeTitle: {
    fontSize: TYPE.display.fontSize,
    fontWeight: 'bold',
    marginBottom: SPACING.xxl,
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SPACING.xxl
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    minWidth: 70
  },
  statNum: {
    fontSize: TYPE.display.fontSize - 4,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: TYPE.caption.fontSize,
    marginTop: SPACING.xs
  },
  completeSub: {
    fontSize: TYPE.body.fontSize,
    textAlign: 'center',
    marginBottom: SPACING.xxl + 4,
    lineHeight: 22
  },
  primaryBtn: {
    backgroundColor: TEAL,
    borderRadius: RADII.teen.card,
    borderBottomWidth: 4,
    borderColor: TEEN.tealDeep,
    paddingVertical: SPACING.lg,
    paddingHorizontal: 48
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize + 1,
    letterSpacing: 1
  },
  secondaryBtn: {
    marginTop: SPACING.md + 2
  },
  secondaryBtnText: {
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize
  }
});
