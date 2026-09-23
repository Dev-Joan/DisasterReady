import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, withDelay, withSpring,
  Easing, ZoomIn, FadeInDown
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

// Game 3 of 4: HAZARD HERO — ROUTE RUNNER. The core mechanic is discrete
// grid-step navigation via a D-PAD of directional buttons — deliberately
// NOT a gesture at all, so it can't read as "the same drag/swipe motion"
// as Games 1 (continuous drag) or 2 (press-and-hold). Every move here is a
// plain, separate tap, like a classic arcade maze game. Three levels of
// increasing maze size/hazard density give it real progression instead of
// one static round. Skill taught: picking a clear evacuation path and
// staying out of smoke, standing water, and live wires — real
// building-fire evacuation hazards.

// '#' wall, '.' floor, 'S' start, 'E' exit, 'K' smoke, 'W' water, 'Z' wire, 'I' item
const RAW_LEVELS = [
  {
    id: 1, name: 'Bedroom Escape', difficulty: 'Easy', time: 60, penalty: 8,
    grid: [
      ['#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '#'],
      ['#', '.', '#', '.', 'Z', '#'],
      ['#', '.', '#', 'K', '.', '#'],
      ['#', '.', 'I', '.', '.', '#'],
      ['#', 'W', '#', '.', '#', '#'],
      ['#', '.', '.', '.', 'I', '#'],
      ['#', '#', '#', '#', 'E', '#']
    ]
  },
  {
    id: 2, name: 'Hallway Maze', difficulty: 'Medium', time: 68, penalty: 9,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', '.', '.', '.', '#'],
      ['#', 'W', '#', '#', '#', '.', '#'],
      ['#', '.', '.', '.', '.', '.', '#'],
      ['#', '.', '#', 'K', '#', '#', '#'],
      ['#', '.', '.', '.', '.', '.', '#'],
      ['#', 'Z', '#', '#', '#', '.', '#'],
      ['#', 'I', '.', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '#', 'E', '#']
    ]
  },
  {
    id: 3, name: 'Whole House Run', difficulty: 'Hard', time: 85, penalty: 10,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#'],
      ['#', 'S', '.', 'I', '.', '.', '#'],
      ['#', 'Z', '#', '#', '#', '.', '#'],
      ['#', '.', '.', '.', '.', '.', '#'],
      ['#', '.', '#', 'K', '#', '#', '#'],
      ['#', '.', '.', 'I', '.', '.', '#'],
      ['#', 'W', '#', '#', '#', '.', '#'],
      ['#', '.', '.', '.', '.', '.', '#'],
      ['#', '.', '#', 'K', '#', '#', '#'],
      ['#', '.', '.', 'I', '.', '.', '#'],
      ['#', '#', '#', '#', '#', 'E', '#']
    ]
  }
];

function deriveLevel(level) {
  let start = null, exit = null;
  const itemCells = [];
  level.grid.forEach((row, r) => row.forEach((cell, c) => {
    if (cell === 'S') start = { row: r, col: c };
    if (cell === 'E') exit = { row: r, col: c };
    if (cell === 'I') itemCells.push(`${r}-${c}`);
  }));
  return { ...level, start, exit, itemCells, cols: level.grid[0].length, rows: level.grid.length };
}
const LEVELS = RAW_LEVELS.map(deriveLevel);

function cellSizeFor(rows) {
  if (rows > 10) return 32;
  if (rows > 8) return 35;
  return 40;
}

const HAZARD_INFO = {
  K: { emoji: '🌫️', name: 'Smoke', why: 'Smoke is toxic — stay low and pick a clearer path!' },
  W: { emoji: '💧', name: 'Standing Water', why: 'Water near wiring can be electrified — go around it!' },
  Z: { emoji: '⚡', name: 'Live Wire', why: 'Never step near a fallen wire — find another way!' }
};

// Correct/wrong feedback fires often while navigating — kept quick and
// subtle (small scale bump, no spring) rather than a big pop each time.
const answerFeedbackEntering = ZoomIn.duration(120).withInitialValues({ transform: [{ scale: 0.94 }] });

function computeStars(hazardHits, timeLeft, roundTime) {
  if (hazardHits === 0 && timeLeft > roundTime * 0.4) return 3;
  if (hazardHits <= 2 && timeLeft > roundTime * 0.15) return 2;
  return 1;
}

// Rising smoke wisps drifting up the screen — ambient scene-setting only,
// checks reducedMotion directly like the other games' background effects.
function SmokeWisp({ left, size, delay, duration }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: 500 - t.value * 560 }, { translateX: Math.sin(t.value * Math.PI * 2) * 10 }],
    opacity: t.value < 0.15 ? t.value * 6 : t.value > 0.8 ? (1 - t.value) / 0.2 : 0.35
  }));
  return <Animated.Text pointerEvents="none" style={[styles.smoke, { left: `${left}%`, fontSize: size }, style]}>🌫️</Animated.Text>;
}
function SmokeLayer() {
  const { settings } = useAccessibility();
  const wisps = useRef(Array.from({ length: 6 }).map(() => ({
    left: 5 + Math.random() * 85, size: 26 + Math.random() * 22, delay: Math.random() * 3000, duration: 6000 + Math.random() * 3000
  }))).current;
  if (settings.reducedMotion) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{wisps.map((w, i) => <SmokeWisp key={i} {...w} />)}</View>;
}

// Sparkle burst when a supply item is picked up.
function ItemBurst({ x, y, cell }) {
  const { settings } = useAccessibility();
  const bits = useRef(Array.from({ length: 6 }).map((_, i) => ({ angle: (i / 6) * Math.PI * 2 }))).current;
  if (settings.reducedMotion) return null;
  return (
    <View pointerEvents="none" style={[styles.burstWrap, { left: x + cell / 2, top: y + cell / 2 }]}>
      {bits.map((b, i) => <ItemBurstBit key={i} {...b} />)}
    </View>
  );
}
function ItemBurstBit({ angle }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.quad) }); }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.cos(angle) * t.value * 40 }, { translateY: Math.sin(angle) * t.value * 40 }, { scale: 1 - t.value * 0.4 }],
    opacity: 1 - t.value
  }));
  return <Animated.Text style={[styles.burstBit, style]}>✨</Animated.Text>;
}

export default function RouteRunnerScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState('intro'); // intro | levelSelect | running | won | lost
  const [levelIndex, setLevelIndex] = useState(0);
  const [levelStars, setLevelStars] = useState({});
  const level = LEVELS[levelIndex];
  const CELL = cellSizeFor(level.rows);

  const [pos, setPos] = useState(level.start);
  const [lastSafe, setLastSafe] = useState(level.start);
  const [timeLeft, setTimeLeft] = useState(level.time);
  const [hazardHits, setHazardHits] = useState(0);
  const [collected, setCollected] = useState([]);
  const [message, setMessage] = useState(null);
  const [finalStars, setFinalStars] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [facing, setFacing] = useState('right');
  const [itemBurst, setItemBurst] = useState(null);

  const timerRef = useRef(null);
  const posX = useSharedValue(level.start.col * CELL);
  const posY = useSharedValue(level.start.row * CELL);
  const bump = useSharedValue(0);
  const hop = useSharedValue(1);
  const mazeShake = useSharedValue(0);
  const hazardFlash = useSharedValue(0);
  const exitGlow = useSharedValue(0.5);

  const packPlayer = useAudioPlayer(require('../assets/sounds/pack.wav'));
  const wrongPlayer = useAudioPlayer(require('../assets/sounds/wrong.wav'));
  const winPlayer = useAudioPlayer(require('../assets/sounds/win.wav'));
  const tickPlayer = useAudioPlayer(require('../assets/sounds/tick.wav'));

  useEffect(() => {
    if (phase !== 'running') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 10 && t > 1) { tickPlayer.seekTo(0); tickPlayer.play(); }
        if (t <= 1) { clearInterval(timerRef.current); setPhase('lost'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (a11y.reducedMotion) { exitGlow.value = 0.7; return; }
    exitGlow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true);
  }, [a11y.reducedMotion]);

  const openLevelSelect = () => setPhase('levelSelect');

  const startLevel = (idx) => {
    const lvl = LEVELS[idx];
    setLevelIndex(idx);
    setPos(lvl.start); setLastSafe(lvl.start); setTimeLeft(lvl.time); setHazardHits(0);
    setCollected([]); setMessage(null); setIsMoving(false); setFacing('right');
    const cell = cellSizeFor(lvl.rows);
    posX.value = lvl.start.col * cell; posY.value = lvl.start.row * cell;
    hop.value = 1; mazeShake.value = 0;
    setPhase('running');
  };

  const finishRun = async () => {
    clearInterval(timerRef.current);
    winPlayer.seekTo(0); winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const stars = computeStars(hazardHits, timeLeft, level.time);
    setFinalStars(stars);
    setLevelStars((prev) => ({ ...prev, [level.id]: Math.max(prev[level.id] || 0, stars) }));
    setPhase('won');
    try { await apiRequest('/gamification/minigame-complete', 'POST', { userId, gameId: 'route_runner', xp: 25 + stars * 5 }); }
    catch (err) { console.log('Route Runner completion error:', err.message); }
  };

  const attemptMove = (dRow, dCol) => {
    if (phase !== 'running' || isMoving) return;
    const nextRow = pos.row + dRow;
    const nextCol = pos.col + dCol;
    const cell = level.grid[nextRow] && level.grid[nextRow][nextCol];
    if (!cell || cell === '#') {
      bump.value = withSequence(withTiming(dCol ? 6 * Math.sign(dCol) : 0, { duration: 60 }), withTiming(0, { duration: 60 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    setIsMoving(true);
    if (dCol !== 0) setFacing(dCol > 0 ? 'right' : 'left');
    const key = `${nextRow}-${nextCol}`;
    const isHazard = HAZARD_INFO[cell];
    const targetX = nextCol * CELL;
    const targetY = nextRow * CELL;

    posX.value = withTiming(targetX, { duration: 180 });
    posY.value = withTiming(targetY, { duration: 180, easing: Easing.out(Easing.quad) });
    hop.value = withSequence(withTiming(1.12, { duration: 80 }), withSpring(1, { damping: 14 }));

    setTimeout(() => {
      if (isHazard) {
        wrongPlayer.seekTo(0); wrongPlayer.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        hazardFlash.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 400 }));
        mazeShake.value = withSequence(
          withTiming(-8, { duration: 45 }), withTiming(8, { duration: 45 }),
          withTiming(-5, { duration: 45 }), withTiming(5, { duration: 45 }), withTiming(0, { duration: 45 })
        );
        setHazardHits((h) => h + 1);
        setTimeLeft((t) => Math.max(1, t - level.penalty));
        setMessage({ good: false, title: `${isHazard.emoji} ${isHazard.name}!`, text: isHazard.why });
        setPos(lastSafe);
        posX.value = withTiming(lastSafe.col * CELL, { duration: 220 });
        posY.value = withTiming(lastSafe.row * CELL, { duration: 220 });
        setTimeout(() => setIsMoving(false), 230);
        return;
      }

      const newPos = { row: nextRow, col: nextCol };
      setPos(newPos);
      setLastSafe(newPos);

      if (level.itemCells.includes(key) && !collected.includes(key)) {
        packPlayer.seekTo(0); packPlayer.play();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCollected((c) => [...c, key]);
        setItemBurst({ seq: Date.now(), x: nextCol * CELL, y: nextRow * CELL });
        setMessage({ good: true, title: '🎒 Found a supply!', text: 'Every bit of gear helps once you\'re out safely.' });
      } else {
        setMessage(null);
      }

      if (cell === 'E') {
        setIsMoving(false);
        finishRun();
        return;
      }
      setIsMoving(false);
    }, 190);
  };

  const playerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value + bump.value },
      { translateY: posY.value },
      { scaleX: (facing === 'left' ? -1 : 1) * hop.value },
      { scaleY: hop.value }
    ]
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: hazardFlash.value }));
  const exitStyle = useAnimatedStyle(() => ({ opacity: exitGlow.value }));
  const mazeShakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: mazeShake.value }] }));

  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <BouncyMascot size={64} />
          <Text style={styles.hazardEmoji}>🔥</Text>
          <Text style={styles.introTitle}>Hazard Hero: Route Runner</Text>
          <Text style={styles.introTag}>Evacuation Maze · 3 Levels</Text>
          <Text style={styles.introText}>Buildings can fill with smoke, water, and live wires. Find Buddy a clear path outside before time runs out!</Text>
          <Text style={styles.introHow}>Tap the arrow buttons to move one step at a time. Avoid the hazards — they'll cost you precious seconds!</Text>
          <BouncyPress style={styles.startButton} onPress={openLevelSelect} accessibilityRole="button" accessibilityLabel="Choose a level">
            <Text style={styles.startButtonText}>🗺️ Choose a Level</Text>
          </BouncyPress>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'levelSelect') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <BouncyMascot size={56} />
          <Text style={styles.introTitle}>Choose a Level</Text>
          <Text style={styles.introHow}>Bigger buildings, more hazards — see how far you can go!</Text>
          {LEVELS.map((lvl, i) => (
            <Animated.View key={lvl.id} entering={FadeInDown.delay(i * 100).duration(320).springify().damping(14)} style={{ width: '100%' }}>
              <BouncyPress style={styles.levelCard} onPress={() => startLevel(i)} accessibilityRole="button" accessibilityLabel={`Level ${lvl.id}: ${lvl.name}, ${lvl.difficulty}`}>
                <View style={styles.levelCardIcon}><Text style={styles.levelCardIconText}>{i + 1}</Text></View>
                <View style={styles.levelCardInfo}>
                  <Text style={styles.levelCardTitle}>{lvl.name}</Text>
                  <Text style={styles.levelCardSub}>{lvl.difficulty} · {lvl.time}s</Text>
                </View>
                <Text style={styles.levelCardStars}>
                  {'⭐'.repeat(levelStars[lvl.id] || 0)}{'☆'.repeat(3 - (levelStars[lvl.id] || 0))}
                </Text>
              </BouncyPress>
            </Animated.View>
          ))}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'won') {
    return (
      <SafeAreaView style={[styles.screen, styles.centerScreen]} edges={['top', 'bottom']}>
        <Celebration colors={['#EF4444', '#FBBF24', '#34D399', '#60A5FA']} />
        <BouncyMascot size={64} emoji="🦊🎉" />
        <Text style={styles.introTitle}>Made It Out, Hero!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>
          🏃 You escaped {level.name}{hazardHits > 0 ? ` — ${hazardHits} close call${hazardHits > 1 ? 's' : ''} along the way!` : ' without a single close call!'}{'\n\n'}
          You earned XP and a safety badge!
        </Text>
        <BouncyPress style={styles.startButton} onPress={() => startLevel(levelIndex)} accessibilityRole="button" accessibilityLabel="Play again">
          <Text style={styles.startButtonText}>🔁 Play Again</Text>
        </BouncyPress>
        <BouncyPress style={[styles.startButton, styles.startButtonAlt]} onPress={openLevelSelect} accessibilityRole="button" accessibilityLabel="Choose a level">
          <Text style={styles.startButtonText}>🗺️ Choose Level</Text>
        </BouncyPress>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (phase === 'lost') {
    return (
      <SafeAreaView style={[styles.screen, styles.centerScreen]} edges={['top', 'bottom']}>
        <BouncyMascot size={56} emoji="🦊💦" />
        <Text style={styles.introTitle}>Out of Time!</Text>
        <Text style={styles.introText}>Don't worry — real heroes practice! Try again, you've got this!</Text>
        <BouncyPress style={styles.startButton} onPress={() => startLevel(levelIndex)} accessibilityRole="button" accessibilityLabel="Try again">
          <Text style={styles.startButtonText}>🔁 Try Again</Text>
        </BouncyPress>
        <BouncyPress style={[styles.startButton, styles.startButtonAlt]} onPress={openLevelSelect} accessibilityRole="button" accessibilityLabel="Choose a level">
          <Text style={styles.startButtonText}>🗺️ Choose Level</Text>
        </BouncyPress>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <SmokeLayer />
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={openLevelSelect} accessibilityRole="button" accessibilityLabel="Choose a different level" {...touchTargetProps(a11y)}>
            <Text style={styles.headerBack}>‹ Levels</Text>
          </TouchableOpacity>
          <Text style={[styles.timer, timeLeft <= 15 && styles.timerLow]}>⏱ {timeLeft}s</Text>
        </View>
        <Text style={styles.headerTitle}>🔥 {level.name}</Text>
      </View>

      {message && (
        <Animated.View entering={answerFeedbackEntering} style={[styles.messageBox, message.good ? styles.messageGood : styles.messageBad]}>
          <Text style={styles.messageTitle}>{message.title}</Text>
          <Text style={styles.messageText}>{message.text}</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={[styles.mazeScroll, { paddingBottom: 20 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.mazeWrap, mazeShakeStyle]}>
          <View style={[styles.maze, { width: level.cols * CELL, height: level.rows * CELL }]}>
            {level.grid.map((row, r) => row.map((cell, c) => {
              if (cell === '#') return <View key={`${r}-${c}`} style={[styles.wallCell, { left: c * CELL, top: r * CELL, width: CELL, height: CELL }]} />;
              const key = `${r}-${c}`;
              const isCollectedItem = cell === 'I' && collected.includes(key);
              return (
                <View key={key} style={[styles.floorCell, { left: c * CELL, top: r * CELL, width: CELL, height: CELL }]}>
                  {cell === 'E' && <Animated.Text style={[styles.exitEmoji, exitStyle]}>🚪</Animated.Text>}
                  {HAZARD_INFO[cell] && <Text style={styles.hazardEmoji2}>{HAZARD_INFO[cell].emoji}</Text>}
                  {cell === 'I' && !isCollectedItem && <Text style={styles.itemEmoji}>🎒</Text>}
                </View>
              );
            }))}
            <Animated.Text style={[styles.player, { width: CELL, height: CELL, fontSize: CELL * 0.82, lineHeight: CELL }, playerStyle]}>🦊</Animated.Text>
            <Animated.View pointerEvents="none" style={[styles.hazardVignette, flashStyle]} />
            {itemBurst && <ItemBurst key={itemBurst.seq} x={itemBurst.x} y={itemBurst.y} cell={CELL} />}
          </View>
        </Animated.View>

        <Text style={styles.roomHint}>Tap the arrows to move — find the clear way out!</Text>

        <View style={styles.dpad}>
          <View style={styles.dpadRow}>
            <View style={styles.dpadSpacer} />
            <BouncyPress style={styles.dpadButton} onPress={() => attemptMove(-1, 0)} accessibilityRole="button" accessibilityLabel="Move up">
              <Text style={styles.dpadArrow}>▲</Text>
            </BouncyPress>
            <View style={styles.dpadSpacer} />
          </View>
          <View style={styles.dpadRow}>
            <BouncyPress style={styles.dpadButton} onPress={() => attemptMove(0, -1)} accessibilityRole="button" accessibilityLabel="Move left">
              <Text style={styles.dpadArrow}>◀</Text>
            </BouncyPress>
            <View style={styles.dpadSpacer} />
            <BouncyPress style={styles.dpadButton} onPress={() => attemptMove(0, 1)} accessibilityRole="button" accessibilityLabel="Move right">
              <Text style={styles.dpadArrow}>▶</Text>
            </BouncyPress>
          </View>
          <View style={styles.dpadRow}>
            <View style={styles.dpadSpacer} />
            <BouncyPress style={styles.dpadButton} onPress={() => attemptMove(1, 0)} accessibilityRole="button" accessibilityLabel="Move down">
              <Text style={styles.dpadArrow}>▼</Text>
            </BouncyPress>
            <View style={styles.dpadSpacer} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F5' },
  centerScreen: { justifyContent: 'center', alignItems: 'center', padding: 28 },

  introContainer: { padding: 20, alignItems: 'center', paddingTop: 20 },
  hazardEmoji: { fontSize: 40, marginTop: -6, marginBottom: 6 },
  introTitle: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 4 },
  introTag: { fontSize: 15, fontWeight: 'bold', marginBottom: 16, color: '#C2410C' },
  introText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  introHow: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 26, fontStyle: 'italic' },
  stars: { fontSize: 40, marginBottom: 12 },
  startButton: { borderRadius: 18, paddingVertical: 16, paddingHorizontal: 44, marginBottom: 12, backgroundColor: '#EF4444' },
  startButtonAlt: { backgroundColor: '#C2410C' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#64748B', fontWeight: 'bold' },

  levelCard: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 5, elevation: 3 },
  levelCardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  levelCardIconText: { fontSize: 18, fontWeight: 'bold', color: '#C2410C' },
  levelCardInfo: { flex: 1 },
  levelCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  levelCardSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  levelCardStars: { fontSize: 13, marginLeft: 6 },

  header: { paddingBottom: 14, paddingHorizontal: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, backgroundColor: '#C2410C' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerBack: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  timer: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  timerLow: { color: '#FECACA' },

  messageBox: { marginHorizontal: 16, marginTop: 10, marginBottom: 2, borderRadius: 12, padding: 10 },
  messageGood: { backgroundColor: '#D9F7EC', borderWidth: 1, borderColor: '#34D399' },
  messageBad: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  messageTitle: { fontWeight: 'bold', fontSize: 13, color: '#1E293B' },
  messageText: { fontSize: 12, color: '#475569', marginTop: 2 },

  mazeScroll: { alignItems: 'center', paddingBottom: 20 },
  mazeWrap: { alignItems: 'center', marginTop: 10 },
  dpad: { alignItems: 'center', marginTop: 4, marginBottom: 10 },
  dpadRow: { flexDirection: 'row' },
  dpadSpacer: { width: 52, height: 52 },
  dpadButton: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#C2410C', alignItems: 'center', justifyContent: 'center', margin: 3 },
  dpadArrow: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  maze: { backgroundColor: '#2B2320', borderRadius: 16, position: 'relative', overflow: 'hidden' },
  wallCell: { position: 'absolute', backgroundColor: '#4B3B33', borderWidth: 1, borderColor: '#3A2C26' },
  floorCell: { position: 'absolute', backgroundColor: '#D9C9A3', borderWidth: 0.5, borderColor: '#C7B48A', alignItems: 'center', justifyContent: 'center' },
  hazardEmoji2: { fontSize: 20 },
  itemEmoji: { fontSize: 18 },
  exitEmoji: { fontSize: 24 },
  player: { position: 'absolute', textAlign: 'center', zIndex: 10 },
  hazardVignette: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#EF4444', borderRadius: 16 },
  smoke: { position: 'absolute', top: 0 },
  roomHint: { textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: 'bold', marginTop: 8, marginBottom: 4 },

  burstWrap: { position: 'absolute', width: 0, height: 0, alignItems: 'center', justifyContent: 'center', zIndex: 30 },
  burstBit: { position: 'absolute', fontSize: 16 }
});
