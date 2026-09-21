import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Text from '../components/Text';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { DISPATCH_ROUNDS } from '../constants/dispatchHero';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

const SWIPE_THRESHOLD = 110;
const URGENT_CUTOFF = 4;

// Tinder-style swipe card: right = "urgent, handle now", left = "can wait".
// A genuinely different gesture from the drag-to-a-target games — this one
// is a fast binary decision made under the pressure of a moving card.
//
// Known accessibility gap: this is a raw pan gesture with no
// accessibilityRole/Label/Action, so it isn't operable via a screen
// reader's standard swipe navigation (VoiceOver/TalkBack intercept simple
// swipes for their own navigation, and a custom `accessibilityActions`
// pair ("markUrgent"/"markWait") would be needed to make this decision
// reachable non-visually). Not fixed here — flagged as a follow-up rather
// than guessed at, since it needs real device testing with a screen
// reader to get right.
function SwipeCard({ call, onDecide }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(600, { duration: 220 });
        runOnJS(onDecide)('urgent');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-600, { duration: 220 });
        runOnJS(onDecide)('wait');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 18}deg` }
    ]
  }));
  const urgentStampStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, translateX.value / 90)) }));
  const waitStampStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, -translateX.value / 90)) }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.swipeCard, cardStyle]}>
        <Animated.View style={[styles.stamp, styles.stampUrgent, urgentStampStyle]}><Text style={styles.stampText}>URGENT!</Text></Animated.View>
        <Animated.View style={[styles.stamp, styles.stampWait, waitStampStyle]}><Text style={styles.stampText}>CAN WAIT</Text></Animated.View>
        <Text style={styles.swipeEmoji}>{call.emoji}</Text>
        <Text style={styles.swipeText}>{call.text}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export default function DispatchHeroScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [phase, setPhase] = useState('intro'); // intro | triage | triageResult | message | messageResult | finished
  const [roundIndex, setRoundIndex] = useState(0);
  const [stackIndex, setStackIndex] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [lastDecision, setLastDecision] = useState(null);
  const [selections, setSelections] = useState({ who: null, what: null, where: null });
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);
  const [finalStars, setFinalStars] = useState(0);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const round = DISPATCH_ROUNDS[roundIndex];

  const setupRound = () => {
    setStackIndex(0);
    setDecisions([]);
    setLastDecision(null);
    setSelections({ who: null, what: null, where: null });
  };

  const startGame = () => {
    setRoundIndex(0);
    setTotalCorrect(0);
    setTotalPossible(0);
    setupRound();
    setPhase('triage');
  };

  const decideCard = (choice) => {
    const call = round.calls[stackIndex];
    const correctChoice = call.urgency >= URGENT_CUTOFF ? 'urgent' : 'wait';
    const correct = choice === correctChoice;

    if (correct) { packPlayer.seekTo(0); packPlayer.play(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    else { wrongPlayer.seekTo(0); wrongPlayer.play(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }

    const entry = { call, choice, correct, correctChoice };
    const nextDecisions = [...decisions, entry];
    setDecisions(nextDecisions);
    setLastDecision(entry);

    setTimeout(() => {
      setLastDecision(null);
      if (stackIndex + 1 >= round.calls.length) {
        const numCorrect = nextDecisions.filter((d) => d.correct).length;
        setTotalCorrect((t) => t + numCorrect);
        setTotalPossible((t) => t + round.calls.length);
        setPhase('triageResult');
      } else {
        setStackIndex((i) => i + 1);
      }
    }, 900);
  };

  const goToMessage = () => setPhase('message');

  const pickOption = (column, optionId) => {
    setSelections((s) => ({ ...s, [column]: optionId }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const sendMessage = () => {
    const numCorrect = ['who', 'what', 'where'].filter((col) => {
      const opt = round[col].find((o) => o.id === selections[col]);
      return opt && opt.correct;
    }).length;
    setTotalCorrect((t) => t + numCorrect);
    setTotalPossible((t) => t + 3);
    if (numCorrect === 3) { winPlayer.seekTo(0); winPlayer.play(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    else { wrongPlayer.seekTo(0); wrongPlayer.play(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
    setPhase('messageResult');
  };

  const nextRound = () => {
    if (roundIndex < DISPATCH_ROUNDS.length - 1) {
      const next = roundIndex + 1;
      setRoundIndex(next);
      setupRound();
      setPhase('triage');
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    const pct = totalPossible > 0 ? totalCorrect / totalPossible : 0;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    setFinalStars(stars);
    setPhase('finished');
    try { await apiRequest('/gamification/minigame-complete', 'POST', { userId, gameId: 'dispatch_hero', xp: 25 + stars * 5 }); }
    catch (err) { console.log('Dispatch Hero completion error:', err.message); }
  };

  if (phase === 'intro') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <BouncyMascot size={56} emoji="🦊📞" />
        <Text style={styles.title}>Dispatch Hero</Text>
        <Text style={styles.introText}>
          Several things are happening at once — you decide what matters most!{'\n\n'}
          👉 Swipe RIGHT if it's urgent — handle it now. Swipe LEFT if it can wait.{'\n'}
          📢 Then build a clear message: who you are, what's happening, and where you are.
        </Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Start"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>▶ Start</Text>
        </BouncyPress>
        <BouncyPress
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </BouncyPress>
      </ScrollView>
    );
  }

  if (phase === 'finished') {
    return (
      <View style={[styles.screen, styles.center]}>
        <Celebration colors={['#6D5BD0', '#FBBF24', '#34D399', '#F472B6']} />
        <BouncyMascot size={56} emoji="🦊🏆" />
        <Text style={styles.title}>Dispatch Hero!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>Knowing what to handle first — and how to explain it clearly — helps real rescuers help you faster.</Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Play again"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🔁 Play Again</Text>
        </BouncyPress>
        <BouncyPress
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to missions"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.secondaryButtonText}>Back to Missions</Text>
        </BouncyPress>
      </View>
    );
  }

  if (phase === 'triage') {
    const card = round.calls[stackIndex];
    const nextCard = round.calls[stackIndex + 1];
    return (
      <GestureHandlerRootView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.roundTag}>ROUND {roundIndex + 1} / {DISPATCH_ROUNDS.length} · STEP 1</Text>
          <Text style={styles.roundTitle}>🚨 Urgent, or can it wait?</Text>
          <Text style={styles.roundSub}>Swipe right for urgent, left if it can wait. Card {stackIndex + 1} of {round.calls.length}.</Text>
        </View>

        <View style={styles.swipeArea}>
          {nextCard && (
            <View style={[styles.swipeCard, styles.swipeCardBehind]}>
              <Text style={styles.swipeEmoji}>{nextCard.emoji}</Text>
              <Text style={styles.swipeText}>{nextCard.text}</Text>
            </View>
          )}
          <SwipeCard key={card.id} call={card} onDecide={decideCard} />
        </View>

        <View style={styles.swipeHints}>
          <Text style={styles.swipeHintLeft}>◀ CAN WAIT</Text>
          <Text style={styles.swipeHintRight}>URGENT ▶</Text>
        </View>

        {lastDecision && (
          <Animated.View entering={FadeInDown.duration(220)} style={[styles.feedbackBox, lastDecision.correct ? styles.feedbackGood : styles.feedbackBad]}>
            <Text style={styles.feedbackText}>
              {lastDecision.correct
                ? '✅ Good call!'
                : `💡 That one was actually ${lastDecision.correctChoice === 'urgent' ? 'urgent' : 'okay to wait on'}.`}
            </Text>
          </Animated.View>
        )}
      </GestureHandlerRootView>
    );
  }

  if (phase === 'triageResult') {
    const numCorrect = decisions.filter((d) => d.correct).length;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={styles.header}>
          <Text style={styles.roundTag}>ROUND {roundIndex + 1} / {DISPATCH_ROUNDS.length} · STEP 1 RESULTS</Text>
          <Text style={styles.roundTitle}>You got {numCorrect} / {decisions.length} right</Text>
        </View>

        {decisions.map((d, i) => (
          <Animated.View key={d.call.id} entering={FadeInDown.delay(i * 80).duration(280)} style={[styles.reviewRow, d.correct ? styles.slotCorrect : styles.slotWrong]}>
            <Text style={styles.slotEmoji}>{d.call.emoji}</Text>
            <Text style={styles.slotText}>{d.call.text}</Text>
            <Text style={styles.slotMark}>{d.correct ? '✅' : '❌'}</Text>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.duration(280)} style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>The most urgent things are ones that hurt someone right now or could spread fast — like fire or someone trapped. Small stuff can wait!</Text>
          <BouncyPress
            style={styles.continueButton}
            onPress={goToMessage}
            accessibilityRole="button"
            accessibilityLabel="Next: send a message"
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.continueButtonText}>Next: Send a Message ▶</Text>
          </BouncyPress>
        </Animated.View>
      </ScrollView>
    );
  }

  if (phase === 'message' || phase === 'messageResult') {
    const topCall = [...round.calls].sort((a, b) => b.urgency - a.urgency)[0];
    const preview = ['who', 'what', 'where'].map((col) => {
      const opt = round[col].find((o) => o.id === selections[col]);
      return opt ? opt.text : `[${col}]`;
    });
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.roundTag}>ROUND {roundIndex + 1} / {DISPATCH_ROUNDS.length} · STEP 2</Text>
        <Text style={styles.roundTitle}>{topCall.emoji} Tell them what's happening</Text>
        <Text style={styles.roundSub}>Build a message a rescuer can act on fast.</Text>

        <View style={styles.previewBox}>
          <Text style={styles.previewText}>"{preview[0]}. {preview[1]}. I'm at {preview[2]}."</Text>
        </View>

        {['who', 'what', 'where'].map((col) => (
          <View key={col} style={styles.columnBox}>
            <Text style={styles.columnLabel}>{col === 'who' ? '🙋 WHO' : col === 'what' ? '❗ WHAT' : '📍 WHERE'}</Text>
            {round[col].map((opt) => {
              const selected = selections[col] === opt.id;
              const showFeedback = phase === 'messageResult';
              return (
                <TouchableOpacity
                  key={opt.id}
                  disabled={phase === 'messageResult'}
                  onPress={() => pickOption(col, opt.id)}
                  style={[
                    styles.optionRow,
                    selected && styles.optionSelected,
                    showFeedback && selected && (opt.correct ? styles.optionCorrect : styles.optionWrong)
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.text}
                  accessibilityState={{ selected, disabled: phase === 'messageResult' }}
                  {...touchTargetProps(a11y)}
                >
                  <Text style={styles.optionText}>{opt.text}</Text>
                  {showFeedback && selected && <Text style={styles.slotMark}>{opt.correct ? '✅' : '❌'}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {phase === 'message' && (
          <BouncyPress
            style={[styles.checkButton, (!selections.who || !selections.what || !selections.where) && styles.checkButtonDisabled]}
            disabled={!selections.who || !selections.what || !selections.where}
            onPress={sendMessage}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !selections.who || !selections.what || !selections.where }}
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.checkButtonText}>📢 Send Message</Text>
          </BouncyPress>
        )}

        {phase === 'messageResult' && (
          <Animated.View entering={FadeInDown.springify().damping(14).duration(320)} style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>A great message always says who you are, what's happening, and exactly where you are — that's how rescuers find you fast.</Text>
            <BouncyPress
              style={styles.continueButton}
              onPress={nextRound}
              accessibilityRole="button"
              accessibilityLabel={roundIndex < DISPATCH_ROUNDS.length - 1 ? 'Next round' : 'Finish'}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.continueButtonText}>{roundIndex < DISPATCH_ROUNDS.length - 1 ? 'Next Round ▶' : 'Finish 🎉'}</Text>
            </BouncyPress>
          </Animated.View>
        )}
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDE9FE' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 15, color: '#4C1D95', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  stars: { fontSize: 34, marginBottom: 10 },
  startButton: { backgroundColor: '#6D5BD0', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginBottom: 10 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#4C1D95', fontWeight: 'bold' },

  header: { padding: 16, paddingBottom: 6 },
  roundTag: { fontSize: 12, fontWeight: 'bold', color: '#6D5BD0', letterSpacing: 1 },
  roundTitle: { fontSize: 19, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
  roundSub: { fontSize: 13, color: '#4C1D95', marginTop: 2 },

  slotCorrect: { borderColor: '#34D399', backgroundColor: '#ECFDF5' },
  slotWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  slotEmoji: { fontSize: 22, marginRight: 8 },
  slotText: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  slotMark: { fontSize: 18, marginLeft: 6 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 2, padding: 12, marginBottom: 8 },

  checkButton: { backgroundColor: '#6D5BD0', borderRadius: 16, paddingVertical: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 20, alignItems: 'center' },
  checkButtonDisabled: { backgroundColor: '#DDD6FE' },
  checkButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  swipeArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  swipeCard: {
    position: 'absolute', width: 260, minHeight: 180, backgroundColor: '#fff', borderRadius: 20,
    padding: 20, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6
  },
  swipeCardBehind: { transform: [{ scale: 0.94 }], opacity: 0.6 },
  swipeEmoji: { fontSize: 44, marginBottom: 10 },
  swipeText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  stamp: { position: 'absolute', top: 16, borderWidth: 3, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  stampUrgent: { right: 16, borderColor: '#EF4444', transform: [{ rotate: '12deg' }] },
  stampWait: { left: 16, borderColor: '#6D5BD0', transform: [{ rotate: '-12deg' }] },
  stampText: { fontWeight: 'bold', fontSize: 13, color: '#1E293B' },
  swipeHints: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, marginBottom: 8 },
  swipeHintLeft: { color: '#6D5BD0', fontWeight: 'bold', fontSize: 12 },
  swipeHintRight: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },

  feedbackBox: { margin: 16, borderRadius: 16, padding: 18, backgroundColor: '#fff', borderWidth: 2, borderColor: '#DDD6FE' },
  feedbackGood: { borderColor: '#34D399', backgroundColor: '#ECFDF5' },
  feedbackBad: { borderColor: '#F87171', backgroundColor: '#FEF2F2' },
  feedbackText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },
  continueButton: { backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  previewBox: { backgroundColor: '#6D5BD0', borderRadius: 14, padding: 14, marginTop: 14, marginBottom: 16 },
  previewText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 20 },
  columnBox: { marginBottom: 16 },
  columnLabel: { fontSize: 12, fontWeight: 'bold', color: '#6D5BD0', letterSpacing: 1, marginBottom: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#E9E4F8', padding: 12, marginBottom: 8 },
  optionSelected: { borderColor: '#6D5BD0' },
  optionCorrect: { borderColor: '#34D399', backgroundColor: '#ECFDF5' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  optionText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B', flex: 1 }
});
