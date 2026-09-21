import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Text from '../components/Text';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeIn, LinearTransition } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { STEP_SORTER_ROUNDS } from '../constants/stepSorter';
import DraggableChip from '../components/DraggableChip';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StepSorterScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [phase, setPhase] = useState('intro'); // intro | sorting | checked | roundDone | finished
  const [roundIndex, setRoundIndex] = useState(0);
  const [pool, setPool] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [feedback, setFeedback] = useState(null); // { correctMask, explainText, allCorrect }
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const slotNodes = useRef([]);
  const slotRects = useRef([]);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const round = STEP_SORTER_ROUNDS[roundIndex];

  const setupRound = (idx) => {
    setPool(shuffle(STEP_SORTER_ROUNDS[idx].steps));
    setPlaced(new Array(STEP_SORTER_ROUNDS[idx].steps.length).fill(null));
    setFeedback(null);
  };

  const startGame = () => {
    setRoundIndex(0);
    setTotalMistakes(0);
    setupRound(0);
    setPhase('sorting');
  };

  const measureSlotOnLayout = (index) => () => {
    const node = slotNodes.current[index];
    if (node) node.measureInWindow((x, y, width, height) => { slotRects.current[index] = { x, y, width, height }; });
  };

  const dropCard = (card, absX, absY) => {
    const targetIndex = slotRects.current.findIndex((r, i) => (
      r && placed[i] === null && absX >= r.x && absX <= r.x + r.width && absY >= r.y && absY <= r.y + r.height
    ));
    if (targetIndex === -1) return;
    const nextPlaced = [...placed];
    nextPlaced[targetIndex] = card;
    setPlaced(nextPlaced);
    setPool((p) => p.filter((c) => c.id !== card.id));
    packPlayer.seekTo(0); packPlayer.play();
  };

  const removeFromSlot = (index) => {
    const card = placed[index];
    if (!card) return;
    const nextPlaced = [...placed];
    nextPlaced[index] = null;
    setPlaced(nextPlaced);
    setPool((p) => [...p, card]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const checkOrder = () => {
    const correctMask = placed.map((card, i) => card && card.id === round.steps[i].id);
    const allCorrect = correctMask.every(Boolean);

    if (allCorrect) {
      packPlayer.seekTo(0); packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedback({ correctMask, explainText: null, allCorrect: true });
      setPhase('checked');
    } else {
      wrongPlayer.seekTo(0); wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const firstWrongIndex = correctMask.findIndex((ok) => !ok);
      const wrongCard = placed[firstWrongIndex];
      const explainText = wrongCard ? round.wrongOrderWhy[wrongCard.id] : 'That order isn\'t quite right yet.';
      setTotalMistakes((m) => m + 1);
      setFeedback({ correctMask, explainText, allCorrect: false });
      setPhase('checked');
    }
  };

  const retryRound = () => {
    setupRound(roundIndex);
    setPhase('sorting');
  };

  const nextRound = () => {
    if (roundIndex < STEP_SORTER_ROUNDS.length - 1) {
      const next = roundIndex + 1;
      setRoundIndex(next);
      setupRound(next);
      setPhase('sorting');
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    winPlayer.seekTo(0); winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const stars = totalMistakes === 0 ? 3 : totalMistakes <= 2 ? 2 : 1;
    setFinalStars(stars);
    setPhase('finished');
    try { await apiRequest('/gamification/minigame-complete', 'POST', { userId, gameId: 'earthquake_sequence', xp: 25 + stars * 5 }); }
    catch (err) { console.log('Step Sorter completion error:', err.message); }
  };

  if (phase === 'intro') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <BouncyMascot size={56} emoji="🦊📋" />
        <Text style={styles.title}>Step Sorter</Text>
        <Text style={styles.introText}>
          When the ground shakes, doing things in the right order keeps you safe!{'\n\n'}
          👉 Drag each card into the slot where you think it belongs.{'\n'}
          Tap a placed card to take it back if you change your mind.{'\n\n'}
          There are {STEP_SORTER_ROUNDS.length} rounds — let's go!
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
        <Celebration colors={['#F59E0B', '#FBBF24', '#34D399', '#38BDF8']} />
        <BouncyMascot size={56} emoji="🦊🏆" />
        <Text style={styles.title}>Sequence Master!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>You sorted every earthquake safety sequence correctly. Knowing the right order means you'll react fast and safe when it really matters!</Text>
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

  const allPlaced = placed.every((p) => p !== null);

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.roundTag}>ROUND {roundIndex + 1} / {STEP_SORTER_ROUNDS.length}</Text>
        <Text style={styles.roundTitle}>{round.emoji} {round.title}</Text>
      </View>

      <View style={styles.slots}>
        {placed.map((card, i) => {
          const showFeedback = phase === 'checked' && feedback;
          const isCorrect = showFeedback && feedback.correctMask[i];
          const isWrong = showFeedback && !feedback.correctMask[i];
          return (
            <TouchableOpacity
              key={i}
              ref={(el) => { slotNodes.current[i] = el; }}
              onLayout={measureSlotOnLayout(i)}
              disabled={phase === 'checked' || !card}
              onPress={() => removeFromSlot(i)}
              style={[
                styles.slot,
                card ? styles.slotFilled : styles.slotEmpty,
                isCorrect && styles.slotCorrect,
                isWrong && styles.slotWrong
              ]}
              accessibilityRole="button"
              accessibilityLabel={card ? `Step ${i + 1}: ${card.text}` : `Step ${i + 1}: empty`}
              accessibilityHint={card && phase !== 'checked' ? 'Removes this card back to the pool' : undefined}
              accessibilityState={{ disabled: phase === 'checked' || !card }}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.slotNumber}>{i + 1}</Text>
              {card ? (
                <>
                  <Text style={styles.slotEmoji}>{card.emoji}</Text>
                  <Text style={styles.slotText}>{card.text}</Text>
                  {isCorrect && <Text style={styles.slotMark}>✅</Text>}
                  {isWrong && <Text style={styles.slotMark}>❌</Text>}
                </>
              ) : (
                <Text style={styles.slotPlaceholder}>Drag a card here</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Known accessibility gap: placement here is drag-and-drop only
          (DraggableChip has no tap-to-place fallback or accessibilityActions),
          so this step isn't currently operable via screen reader. Flagged
          rather than guessed at — needs on-device screen reader testing to
          design a workable tap-based alternative. */}
      {phase === 'sorting' && (
        <ScrollView contentContainerStyle={styles.pool}>
          {pool.map((card) => (
            <Animated.View key={card.id} layout={LinearTransition.duration(220)} entering={FadeIn.duration(200)}>
              <DraggableChip style={styles.poolCard} onDrop={(x, y) => dropCard(card, x, y)}>
                <Text style={styles.poolEmoji}>{card.emoji}</Text>
                <Text style={styles.poolText}>{card.text}</Text>
              </DraggableChip>
            </Animated.View>
          ))}
        </ScrollView>
      )}

      {phase === 'sorting' && (
        <BouncyPress
          style={[styles.checkButton, !allPlaced && styles.checkButtonDisabled]}
          disabled={!allPlaced}
          onPress={checkOrder}
          accessibilityRole="button"
          accessibilityLabel="Check order"
          accessibilityState={{ disabled: !allPlaced }}
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.checkButtonText}>Check Order!</Text>
        </BouncyPress>
      )}

      {phase === 'checked' && feedback && (
        <Animated.View entering={FadeInDown.springify().damping(14).duration(320)} style={[styles.feedbackBox, feedback.allCorrect ? styles.feedbackGood : styles.feedbackBad]}>
          <Text style={styles.feedbackTitle}>{feedback.allCorrect ? '✅ Perfect order!' : '💡 Not quite the right order'}</Text>
          {!feedback.allCorrect && <Text style={styles.feedbackText}>{feedback.explainText}</Text>}
          <BouncyPress
            style={styles.continueButton}
            onPress={feedback.allCorrect ? nextRound : retryRound}
            accessibilityRole="button"
            accessibilityLabel={feedback.allCorrect ? (roundIndex < STEP_SORTER_ROUNDS.length - 1 ? 'Next round' : 'Finish') : 'Try this round again'}
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.continueButtonText}>
              {feedback.allCorrect ? (roundIndex < STEP_SORTER_ROUNDS.length - 1 ? 'Next Round ▶' : 'Finish 🎉') : '🔁 Try This Round Again'}
            </Text>
          </BouncyPress>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FEF3C7' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 15, color: '#78350F', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  stars: { fontSize: 34, marginBottom: 10 },
  startButton: { backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginBottom: 10 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#78350F', fontWeight: 'bold' },

  header: { padding: 16, paddingBottom: 6 },
  roundTag: { fontSize: 12, fontWeight: 'bold', color: '#B45309', letterSpacing: 1 },
  roundTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },

  slots: { paddingHorizontal: 16, marginBottom: 8 },
  slot: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 2, padding: 12, marginBottom: 8, minHeight: 56 },
  slotEmpty: { borderColor: '#FDE68A', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.5)' },
  slotFilled: { borderColor: '#F59E0B', backgroundColor: '#fff' },
  slotCorrect: { borderColor: '#34D399', backgroundColor: '#ECFDF5' },
  slotWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  slotNumber: { fontSize: 16, fontWeight: 'bold', color: '#B45309', width: 22 },
  slotEmoji: { fontSize: 22, marginRight: 8 },
  slotText: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  slotPlaceholder: { flex: 1, fontSize: 13, color: '#B45309', fontStyle: 'italic' },
  slotMark: { fontSize: 18, marginLeft: 6 },

  pool: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  poolCard: { width: 150, backgroundColor: '#fff', borderRadius: 14, padding: 12, margin: 6, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  poolEmoji: { fontSize: 26, marginBottom: 4 },
  poolText: { fontSize: 12, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },

  checkButton: { backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 16, marginHorizontal: 16, marginBottom: 20, alignItems: 'center' },
  checkButtonDisabled: { backgroundColor: '#FDE68A' },
  checkButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  feedbackBox: { margin: 16, borderRadius: 16, padding: 18 },
  feedbackGood: { backgroundColor: '#D9F7EC', borderWidth: 2, borderColor: '#34D399' },
  feedbackBad: { backgroundColor: '#FEE2E2', borderWidth: 2, borderColor: '#F87171' },
  feedbackTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 6 },
  feedbackText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },
  continueButton: { backgroundColor: '#1E293B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
