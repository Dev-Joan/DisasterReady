import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, runOnJS
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { HAZARD_DATA } from '../constants/hazardGames';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const SCREEN = Dimensions.get('window');
const LANE_COUNT = 3;
const LANE_WIDTH = SCREEN.width / LANE_COUNT;
const PLAYER_Y = SCREEN.height - 220;
const TICK_MS = 50;
const SPAWN_EVERY = 1400;
const GATE_EVERY = 6;
const WIN_DISTANCE = 2000;

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

// hazard obstacle emojis for the runner
const HAZARD_OBSTACLES = {
  flood: [
    { emoji: '⚡', name: 'Fallen wire', why: 'Never touch wires near water!' },
    { emoji: '🪵', name: 'Debris', why: 'Watch out for floating objects!' },
    { emoji: '🕳️', name: 'Open drain', why: 'Hidden holes hide under flood water!' }
  ],
  earthquake: [
    { emoji: '🧱', name: 'Falling bricks', why: 'Stay clear of walls that can crumble!' },
    { emoji: '🪑', name: 'Sliding furniture', why: 'Furniture slides during shaking — dodge it!' },
    { emoji: '💡', name: 'Falling light', why: 'Watch for things falling from above!' }
  ],
  fire: [
    { emoji: '🔥', name: 'Flames', why: 'Never run through fire — go around!' },
    { emoji: '💨', name: 'Thick smoke', why: 'Stay low under smoke to breathe clean air!' },
    { emoji: '🪟', name: 'Hot glass', why: 'Don\'t touch hot surfaces near a fire!' }
  ]
};

let nextId = 1;

export default function FloodRunnerScreen({ route, navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const hazardKey = (route.params && route.params.hazard) || 'flood';
  const HAZARD = HAZARD_DATA[hazardKey];

  const COLLECTIBLES = HAZARD.items.filter(i => i.correct).map(i => ({ emoji: i.emoji, name: i.name, why: i.why }));
  const HAZARDS = HAZARD_OBSTACLES[hazardKey] || HAZARD_OBSTACLES.flood;
  const GATES = HAZARD.gates;

  const [phase, setPhase] = useState('intro');
  const [lane, setLane] = useState(1);
  const [objects, setObjects] = useState([]);
  const [distance, setDistance] = useState(0);
  const [collected, setCollected] = useState(0);
  const [hits, setHits] = useState(0);
  const [lesson, setLesson] = useState(null);
  const [gate, setGate] = useState(null);
  const [gatesPassed, setGatesPassed] = useState(0);
  const [gatesCorrect, setGatesCorrect] = useState(0);

  const loopRef = useRef(null);
  const spawnRef = useRef(null);
  const spawnCount = useRef(0);
  const laneRef = useRef(1);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const playerX = useSharedValue(1 * LANE_WIDTH + LANE_WIDTH / 2 - 30);
  const runnerBob = useSharedValue(0);
  const waterY = useSharedValue(0);

  useEffect(() => {
    runnerBob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 220, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) })
      ), -1, true
    );
    waterY.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
      ), -1, true
    );
  }, []);

  useEffect(() => {
    laneRef.current = lane;
    playerX.value = withTiming(lane * LANE_WIDTH + LANE_WIDTH / 2 - 30, { duration: 150 });
  }, [lane]);

  const stopLoops = () => {
    clearInterval(loopRef.current);
    clearInterval(spawnRef.current);
  };

  const changeLane = (dir) => {
    setLane((l) => Math.max(0, Math.min(LANE_COUNT - 1, l + dir)));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startGame = () => {
    setLane(1); setObjects([]); setDistance(0); setCollected(0); setHits(0);
    setLesson(null); setGate(null); setGatesPassed(0); setGatesCorrect(0);
    spawnCount.current = 0;
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') { stopLoops(); return; }

    loopRef.current = setInterval(() => {
      setDistance((d) => {
        const nd = d + 2;
        if (nd >= WIN_DISTANCE) finishRun(true);
        return nd;
      });

      setObjects((prev) => {
        const moved = prev.map(o => ({ ...o, y: o.y + 7 }));
        const remaining = [];
        for (const o of moved) {
          const hitZone = o.y > PLAYER_Y - 45 && o.y < PLAYER_Y + 45;
          if (hitZone && o.lane === laneRef.current && !o.consumed) {
            if (o.type === 'collect') {
              packPlayer.seekTo(0); packPlayer.play();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCollected((c) => c + 1);
              setLesson({ good: true, text: `${o.emoji} ${o.data.name}: ${o.data.why}` });
              continue;
            } else {
              wrongPlayer.seekTo(0); wrongPlayer.play();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setHits((h) => h + 1);
              setLesson({ good: false, text: `${o.emoji} ${o.data.name}: ${o.data.why}` });
              continue;
            }
          }
          if (o.y < SCREEN.height + 60) remaining.push(o);
        }
        return remaining;
      });
    }, TICK_MS);

    spawnRef.current = setInterval(() => {
      spawnCount.current += 1;
      if (spawnCount.current % GATE_EVERY === 0) {
        const g = GATES[Math.floor(Math.random() * GATES.length)];
        setPhase('gate'); setGate(g); return;
      }
      const isCollect = Math.random() < 0.55;
      const pool = isCollect ? COLLECTIBLES : HAZARDS;
      const data = pool[Math.floor(Math.random() * pool.length)];
      setObjects((prev) => [...prev, {
        id: nextId++, type: isCollect ? 'collect' : 'hazard',
        emoji: data.emoji, data, lane: Math.floor(Math.random() * LANE_COUNT), y: -60, consumed: false
      }]);
    }, SPAWN_EVERY);

    return stopLoops;
  }, [phase]);

  const finishRun = async (won) => {
    stopLoops();
    if (won) {
      winPlayer.seekTo(0); winPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('won');
      try { await apiRequest('/gamification/kit-complete', 'POST', { userId, kitId: `${hazardKey}_kids` }); }
      catch (err) { console.log('Runner completion error:', err.message); }
    } else {
      setPhase('lost');
    }
  };

  useEffect(() => {
    if (hits >= 3 && phase === 'running') finishRun(false);
  }, [hits]);

  const answerGate = (index) => {
    const correct = index === gate.correct;
    setGatesPassed((g) => g + 1);
    if (correct) {
      packPlayer.seekTo(0); packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGatesCorrect((g) => g + 1);
      setLesson({ good: true, text: `✅ Right! ${gate.answers[gate.correct]} is the safe choice.` });
    } else {
      wrongPlayer.seekTo(0); wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setHits((h) => h + 1);
      setLesson({ good: false, text: `The safe answer was: ${gate.answers[gate.correct]}. Remember it, hero!` });
    }
    setGate(null); setPhase('running');
  };

  // Known accessibility gap: lane-changing is a raw swipe gesture with no
  // accessible equivalent (no on-screen buttons, no accessibilityActions),
  // so this runner isn't currently operable via screen reader. Flagged
  // rather than guessed at — a real fix needs on-device screen reader
  // testing to design a workable non-gesture alternative for a fast-paced
  // reflex game like this one.
  const swipe = Gesture.Pan()
    .enabled(phase === 'running')
    .onEnd((e) => {
      if (e.translationX > 40) runOnJS(changeLane)(1);
      else if (e.translationX < -40) runOnJS(changeLane)(-1);
    });

  const playerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: playerX.value }, { translateY: runnerBob.value }] }));
  const waterStyle = useAnimatedStyle(() => ({ transform: [{ translateY: waterY.value }] }));
  const progressPct = Math.min(100, Math.round((distance / WIN_DISTANCE) * 100));

  const chaser = hazardKey === 'fire' ? '🔥🔥🔥🔥🔥🔥🔥' : hazardKey === 'earthquake' ? '🪨🪨🪨🪨🪨🪨🪨' : '🌊🌊🌊🌊🌊🌊🌊';
  const chaserBg = hazardKey === 'fire' ? 'rgba(239,68,68,0.55)' : hazardKey === 'earthquake' ? 'rgba(180,120,60,0.55)' : 'rgba(56,189,248,0.55)';
  const bgColor = hazardKey === 'fire' ? '#FEE2E2' : hazardKey === 'earthquake' ? '#FEF3C7' : '#D6EDF7';

  if (phase === 'intro') {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: bgColor }]}>
        <BouncyMascot size={60} emoji="🦊🏃" />
        <Text style={styles.title}>{HAZARD.emoji} Escape Run!</Text>
        <Text style={styles.introText}>
          Escape the {HAZARD.label.toLowerCase()} — run to safety!{'\n\n'}
          👉 Swipe LEFT or RIGHT to change lanes{'\n'}
          {HAZARD.emoji} Grab kit items — each teaches you something{'\n'}
          ⚠️ Dodge dangers — 3 hits and it catches you{'\n'}
          🚧 At Safety Gates, pick the SAFE answer!
        </Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Run"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>▶ Run!</Text>
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
      </View>
    );
  }

  if (phase === 'won') {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: bgColor }]}>
        <Celebration colors={[HAZARD.color, '#FBBF24', '#34D399', '#F472B6']} />
        <BouncyMascot size={60} emoji="🦊🏆" />
        <Text style={styles.title}>You reached safety!</Text>
        <Text style={styles.introText}>
          You collected {collected} kit items and answered {gatesCorrect} of {gatesPassed} safety questions right!{'\n\n'}
          +30 points and a safety badge!{'\n\n'}Prepare today, protect tomorrow!
        </Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Run again"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🔁 Run Again</Text>
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

  if (phase === 'lost') {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: bgColor }]}>
        <BouncyMascot size={60} emoji="🦊💦" />
        <Text style={styles.title}>It caught up!</Text>
        <Text style={styles.introText}>
          You ran {distance}m and collected {collected} items.{'\n\n'}
          Dodge the dangers and pick safe answers. Try again, hero!
        </Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🔁 Try Again</Text>
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={swipe}>
        <View style={[styles.screen, { backgroundColor: bgColor }]}>
          <View style={styles.hud}>
            <Text style={styles.hudText}>🏃 {progressPct}%</Text>
            <View style={styles.hudBar}><View style={[styles.hudFill, { width: `${progressPct}%` }]} /></View>
            <Text style={styles.hudText}>{HAZARD.emoji} {collected}   ❤️ {3 - hits}</Text>
          </View>

          <View style={styles.lanes}>
            {[0, 1, 2].map((i) => (<View key={i} style={[styles.lane, i < 2 && styles.laneBorder]} />))}
          </View>

          {objects.map((o) => (
            <View key={o.id} style={[styles.object, { left: o.lane * LANE_WIDTH + LANE_WIDTH / 2 - 24, top: o.y }]}>
              <Text style={styles.objectEmoji}>{o.emoji}</Text>
            </View>
          ))}

          <Animated.View style={[styles.player, playerStyle]}><Text style={styles.playerEmoji}>🦊</Text></Animated.View>

          <Animated.View style={[styles.chaser, { backgroundColor: chaserBg }, waterStyle]}>
            <Text style={styles.chaserText}>{chaser}</Text>
          </Animated.View>

          {lesson && (
            <TouchableOpacity
              style={[styles.lessonBox, lesson.good ? styles.lessonGood : styles.lessonBad]}
              onPress={() => setLesson(null)}
              accessibilityRole="button"
              accessibilityLabel={lesson.text}
              accessibilityHint="Dismisses this tip"
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.lessonText}>{lesson.text}</Text>
            </TouchableOpacity>
          )}

          {phase === 'gate' && gate && (
            <View style={styles.gateOverlay}>
              <View style={styles.gateCard}>
                <Text style={styles.gateTitle}>🚧 Safety Gate!</Text>
                <Text style={styles.gateQuestion}>{gate.question}</Text>
                {gate.answers.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.gateAnswer}
                    onPress={() => answerGate(i)}
                    accessibilityRole="button"
                    accessibilityLabel={a}
                    {...touchTargetProps(a11y)}
                  >
                    <Text style={styles.gateAnswerText}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 28 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  startButton: { backgroundColor: '#38BDF8', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginBottom: 10 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#64748B', fontWeight: 'bold' },

  hud: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 16, zIndex: 5 },
  hudText: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginHorizontal: 6 },
  hudBar: { flex: 1, height: 10, backgroundColor: '#fff', borderRadius: 5, overflow: 'hidden' },
  hudFill: { height: '100%', backgroundColor: '#34D399' },

  lanes: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  lane: { flex: 1 },
  laneBorder: { borderRightWidth: 2, borderRightColor: 'rgba(255,255,255,0.6)', borderStyle: 'dashed' },

  object: { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  objectEmoji: { fontSize: 36 },

  player: { position: 'absolute', top: PLAYER_Y, width: 60, height: 60, alignItems: 'center', justifyContent: 'center', zIndex: 4 },
  playerEmoji: { fontSize: 44 },

  chaser: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, alignItems: 'center', justifyContent: 'center' },
  chaserText: { fontSize: 24, letterSpacing: 2 },

  lessonBox: { position: 'absolute', top: 60, left: 16, right: 16, borderRadius: 12, padding: 10, zIndex: 6 },
  lessonGood: { backgroundColor: '#D9F7EC', borderWidth: 1, borderColor: '#34D399' },
  lessonBad: { backgroundColor: '#FDE8E8', borderWidth: 1, borderColor: '#F0997B' },
  lessonText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },

  gateOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(30,41,59,0.55)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  gateCard: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 22 },
  gateTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  gateQuestion: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 16 },
  gateAnswer: { backgroundColor: '#E8F0FE', borderRadius: 12, padding: 14, marginBottom: 8 },
  gateAnswerText: { fontSize: 15, fontWeight: 'bold', color: '#1E3A8A', textAlign: 'center' }
});