import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import {
  GRID_ROWS, COLS, ROWS, START, computeFloodOrder, isWalkable, isGoal
} from '../constants/escapeRoute';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const SCREEN = Dimensions.get('window');
const GRID_W = SCREEN.width - 32;
const CELL = GRID_W / COLS;
const GRID_H = CELL * ROWS;
const FLOOD_TICK_MS = 700;
const CELLS_PER_TICK = 1;

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

function keyOf(r, c) { return `${r}-${c}`; }

export default function EscapeRouteScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const floodOrder = useRef(computeFloodOrder()).current;
  const startDistance = useRef(floodOrder.findIndex((f) => f.r === START.r && f.c === START.c)).current;

  const [phase, setPhase] = useState('intro');
  const [floodStep, setFloodStep] = useState(0);
  const [path, setPath] = useState([]);
  const [finalStars, setFinalStars] = useState(0);
  const pathRef = useRef([]);
  const floodedRef = useRef(new Set());
  const tickRef = useRef(null);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  useEffect(() => { pathRef.current = path; }, [path]);

  // Computed fresh on every render (not inside an effect) so the ref handlers
  // read from is never a tick behind the flood state that just rendered.
  const floodedSet = new Set(floodOrder.slice(0, floodStep).map((f) => keyOf(f.r, f.c)));
  floodedRef.current = floodedSet;

  useEffect(() => {
    if (phase === 'playing' && floodedSet.has(keyOf(START.r, START.c))) {
      clearInterval(tickRef.current);
      setPhase('lost');
    }
  }, [floodStep, phase]);

  useEffect(() => {
    if (phase !== 'playing') { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      setFloodStep((s) => Math.min(floodOrder.length, s + CELLS_PER_TICK));
    }, FLOOD_TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [phase]);

  const startGame = () => {
    setFloodStep(0);
    setPath([]);
    setPhase('playing');
  };

  const finishWin = useCallback(async () => {
    clearInterval(tickRef.current);
    winPlayer.seekTo(0); winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const stars = floodStep < startDistance * 0.4 ? 3 : floodStep < startDistance * 0.7 ? 2 : 1;
    setFinalStars(stars);
    setPhase('won');
    try { await apiRequest('/gamification/minigame-complete', 'POST', { userId, gameId: 'flood_route', xp: 25 + stars * 5 }); }
    catch (err) { console.log('Escape route completion error:', err.message); }
  }, [floodStep, startDistance, userId]);

  const tryExtendPath = (row, col) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const current = pathRef.current;

    if (current.length === 0) {
      if (row === START.r && col === START.c) {
        pathRef.current = [{ r: row, c: col }];
        setPath(pathRef.current);
      }
      return;
    }

    const last = current[current.length - 1];
    if (last.r === row && last.c === col) return;

    // touching the second-to-last cell again = backtrack one step
    if (current.length > 1) {
      const prev = current[current.length - 2];
      if (prev.r === row && prev.c === col) {
        pathRef.current = current.slice(0, -1);
        setPath(pathRef.current);
        return;
      }
    }

    const adjacent = (Math.abs(last.r - row) === 1 && last.c === col) || (Math.abs(last.c - col) === 1 && last.r === row);
    if (!adjacent) return;
    if (!isWalkable(row, col)) return;
    if (floodedRef.current.has(keyOf(row, col))) {
      wrongPlayer.seekTo(0); wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (current.some((p) => p.r === row && p.c === col)) return;

    const next = [...current, { r: row, c: col }];
    pathRef.current = next;
    setPath(next);
    packPlayer.seekTo(0); packPlayer.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isGoal(row, col)) finishWin();
  };

  const handleRelease = () => {
    if (pathRef.current.length > 0) {
      const last = pathRef.current[pathRef.current.length - 1];
      if (!isGoal(last.r, last.c)) {
        pathRef.current = [];
        setPath([]);
      }
    }
  };

  // Tracking runs on the UI thread for a buttery-smooth 1:1 finger trace;
  // each touched cell hops back to JS only to update the small path array.
  //
  // Known accessibility gap: tracing a path is a raw pan gesture over a
  // grid with no accessible equivalent, so this game isn't currently
  // operable via screen reader. Flagged rather than guessed at — needs
  // on-device screen reader testing to design a workable cell-by-cell
  // tap alternative for this puzzle type.
  const tracePan = Gesture.Pan()
    .enabled(phase === 'playing')
    .onBegin((e) => {
      runOnJS(tryExtendPath)(Math.floor(e.y / CELL), Math.floor(e.x / CELL));
    })
    .onUpdate((e) => {
      runOnJS(tryExtendPath)(Math.floor(e.y / CELL), Math.floor(e.x / CELL));
    })
    .onEnd(() => {
      runOnJS(handleRelease)();
    });

  const pctFlooded = Math.min(100, Math.round((floodStep / Math.max(1, startDistance)) * 100));

  if (phase === 'intro') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <BouncyMascot size={56} emoji="🦊🌊" />
        <Text style={styles.title}>Escape Route Architect</Text>
        <Text style={styles.introText}>
          Water is rushing in from one side of the house!{'\n\n'}
          👉 Trace a path with your finger from your bedroom to the safe high ground at the top.{'\n\n'}
          🌊 Don't step where the water already is — it changes fast, so watch and think before you trace!
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

  if (phase === 'won') {
    return (
      <View style={[styles.screen, styles.center]}>
        <Celebration colors={['#38BDF8', '#FBBF24', '#34D399', '#F472B6']} />
        <BouncyMascot size={56} emoji="🦊🏆" />
        <Text style={styles.title}>You reached high ground!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>Great planning, hero! Knowing your escape route before a flood means you never have to think twice when the water rises.</Text>
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

  if (phase === 'lost') {
    return (
      <View style={[styles.screen, styles.center]}>
        <BouncyMascot size={56} emoji="🦊💦" />
        <Text style={styles.title}>The water reached home!</Text>
        <Text style={styles.introText}>Next time, start tracing your route the moment you see water coming. Try again — you've got this!</Text>
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

  const last = path[path.length - 1];

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View style={styles.hud}>
        <Text style={styles.hudLabel}>🌊 Water rising...</Text>
        <View style={styles.hudBar}><View style={[styles.hudFill, { width: `${pctFlooded}%` }]} /></View>
      </View>

      <GestureDetector gesture={tracePan}>
        <View style={[styles.grid, { width: GRID_W, height: GRID_H }]}>
          {GRID_ROWS.map((rowStr, r) =>
            rowStr.split('').map((type, c) => {
              const flooded = floodedSet.has(keyOf(r, c));
              const inPath = path.some((p) => p.r === r && p.c === c);
              const isStartCell = type === 'S';
              const isGoalCell = type === 'G';
              const isWall = type === '#';
              return (
                <View
                  key={keyOf(r, c)}
                  style={[
                    styles.cell,
                    { left: c * CELL, top: r * CELL, width: CELL, height: CELL },
                    isWall && styles.cellWall,
                    isGoalCell && styles.cellGoal,
                    !isWall && !isGoalCell && styles.cellFloor
                  ]}
                >
                  {flooded && !isGoalCell && <Animated.View entering={FadeIn.duration(300)} style={StyleSheet.absoluteFill} pointerEvents="none">
                    <View style={styles.waterOverlay} />
                  </Animated.View>}
                  {inPath && !isStartCell && <View style={styles.pathDot} />}
                  {isStartCell && <Text style={styles.cellEmoji}>{last && last.r === r && last.c === c ? '🦊' : '🛏️'}</Text>}
                  {isGoalCell && c === Math.floor(COLS / 2) && <Text style={styles.cellEmoji}>⛰️</Text>}
                </View>
              );
            })
          )}
          {path.length > 0 && path[path.length - 1] && !(path[path.length - 1].r === START.r && path[path.length - 1].c === START.c) && (
            <View
              style={[
                styles.heroMarker,
                { left: path[path.length - 1].c * CELL, top: path[path.length - 1].r * CELL, width: CELL, height: CELL }
              ]}
              pointerEvents="none"
            >
              <Text style={styles.cellEmoji}>🦊</Text>
            </View>
          )}
        </View>
      </GestureDetector>

      <Text style={styles.hint}>Trace from your bed 🛏️ up to the hill ⛰️ — avoid the blue water!</Text>

      <BouncyPress
        style={styles.resetButton}
        onPress={() => { pathRef.current = []; setPath([]); }}
        accessibilityRole="button"
        accessibilityLabel="Reset path"
        {...touchTargetProps(a11y)}
      >
        <Text style={styles.resetButtonText}>🔄 Reset Path</Text>
      </BouncyPress>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#D6EDF7' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 15, color: '#334155', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  stars: { fontSize: 34, marginBottom: 10 },
  startButton: { backgroundColor: '#38BDF8', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginBottom: 10 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#475569', fontWeight: 'bold' },

  hud: { padding: 16, paddingBottom: 6 },
  hudLabel: { fontSize: 14, fontWeight: 'bold', color: '#075985', marginBottom: 6 },
  hudBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 6, overflow: 'hidden' },
  hudFill: { height: '100%', backgroundColor: '#0284C7' },

  grid: { alignSelf: 'center', marginTop: 10, position: 'relative', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FDF6E3' },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)' },
  cellFloor: { backgroundColor: '#FDF6E3' },
  cellWall: { backgroundColor: '#8B5E34' },
  cellGoal: { backgroundColor: '#86EFAC' },
  cellEmoji: { fontSize: 18 },
  waterOverlay: { flex: 1, backgroundColor: 'rgba(14,165,233,0.75)' },
  pathDot: { width: '40%', height: '40%', borderRadius: 20, backgroundColor: '#FBBF24' },
  heroMarker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  hint: { textAlign: 'center', fontSize: 13, color: '#0369A1', marginTop: 10, fontWeight: 'bold' },
  resetButton: { alignSelf: 'center', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 18 },
  resetButtonText: { fontWeight: 'bold', color: '#075985' }
});
