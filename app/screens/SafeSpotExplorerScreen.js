import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat, withDelay, Easing, FadeInDown } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { HAZARD_DATA } from '../constants/hazardGames';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
const LEVELS = [{
  key: 'fire',
  hazardKey: 'fire',
  title: 'Kitchen Fire Check',
  roomLabel: '🍳 The Kitchen',
  wall: '#FFE8D6',
  floor: '#F2A65A',
  rugColor: '#FCA5A5',
  clutter: [{
    emoji: '🧸',
    x: 165,
    y: 55
  }, {
    emoji: '📚',
    x: 20,
    y: 195
  }, {
    emoji: '🎈',
    x: 285,
    y: 205
  }, {
    emoji: '🧦',
    x: 165,
    y: 355
  }, {
    emoji: '🖍️',
    x: 190,
    y: 65
  }]
}, {
  key: 'flood',
  hazardKey: 'flood',
  title: 'Flood Ready Room',
  roomLabel: '🌧️ The Living Room',
  wall: '#CBD5E1',
  floor: '#7DD3FC',
  rugColor: '#93C5FD',
  clutter: [{
    emoji: '📖',
    x: 165,
    y: 55
  }, {
    emoji: '🧴',
    x: 20,
    y: 195
  }, {
    emoji: '🧺',
    x: 285,
    y: 205
  }, {
    emoji: '👟',
    x: 165,
    y: 355
  }, {
    emoji: '🪀',
    x: 190,
    y: 65
  }]
}, {
  key: 'earthquake',
  hazardKey: 'earthquake',
  title: 'Quake Check Bedroom',
  roomLabel: '🛏️ The Bedroom',
  wall: '#FDE8B0',
  floor: '#F5D07A',
  rugColor: '#F472B6',
  clutter: [{
    emoji: '🎮',
    x: 165,
    y: 55
  }, {
    emoji: '🧢',
    x: 20,
    y: 195
  }, {
    emoji: '🧩',
    x: 285,
    y: 205
  }, {
    emoji: '📗',
    x: 165,
    y: 355
  }, {
    emoji: '🪀',
    x: 190,
    y: 65
  }]
}];
const REF_W = 320;
const REF_H = 400;
const SCREEN_W = Dimensions.get('window').width;
const ROOM_W = Math.min(SCREEN_W - 40, 340);
const SCALE = ROOM_W / REF_W;
const ROOM_H = REF_H * SCALE;
const HIT_RADIUS = 42 * SCALE;
const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const tickSound = require('../assets/sounds/tick.wav');
const celebrationStarSource = require('../assets/lottie/celebration-star.json');
const answerFeedbackEntering = undefined;
function computeStars(mistakes, elapsed) {
  if (mistakes === 0 && elapsed <= 35) return 3;
  if (mistakes <= 2 && elapsed <= 65) return 2;
  return 1;
}
function HiddenSparkle({
  x,
  y,
  bright
}) {
  const {
    settings
  } = useAccessibility();
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    if (settings.reducedMotion) {
      pulse.value = bright ? 0.8 : 0.5;
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(1, {
      duration: 650
    }), withTiming(bright ? 0.5 : 0.12, {
      duration: 650
    })), -1, true);
  }, [settings.reducedMotion, bright]);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{
      scale: 0.9 + pulse.value * 0.3
    }]
  }));
  return <Animated.Text pointerEvents="none" style={[styles.sparkle, {
    left: x - 12,
    top: y - 12
  }, style]}>✨</Animated.Text>;
}
function FindBurst({
  x,
  y
}) {
  const {
    settings
  } = useAccessibility();
  const bits = useRef(Array.from({
    length: 6
  }).map((_, i) => ({
    angle: i / 6 * Math.PI * 2,
    emoji: ['✨', '⭐', '💫'][i % 3]
  }))).current;
  if (settings.reducedMotion) return null;
  return <View pointerEvents="none" style={[styles.burstWrap, {
    left: x,
    top: y
  }]}>
      {bits.map((b, i) => <BurstBit key={i} {...b} />)}
    </View>;
}
function BurstBit({
  angle,
  emoji
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.quad)
    });
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{
      translateX: Math.cos(angle) * t.value * 46
    }, {
      translateY: Math.sin(angle) * t.value * 46
    }, {
      scale: 1 - t.value * 0.4
    }],
    opacity: 1 - t.value
  }));
  return <Animated.Text style={[styles.burstBit, style]}>{emoji}</Animated.Text>;
}
function TapPing({
  x,
  y
}) {
  const {
    settings
  } = useAccessibility();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.quad)
    });
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{
      scale: 0.3 + t.value * 1.3
    }],
    opacity: 1 - t.value
  }));
  if (settings.reducedMotion) return null;
  return <Animated.View pointerEvents="none" style={[styles.tapPing, {
    left: x - 22,
    top: y - 22
  }, style]} />;
}
function DustMote({
  x,
  size,
  delay,
  duration
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, {
      duration,
      easing: Easing.linear
    }), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{
      translateY: (1 - t.value) * ROOM_H
    }, {
      translateX: Math.sin(t.value * Math.PI * 2) * 10
    }],
    opacity: t.value < 0.1 ? t.value * 6 : t.value > 0.85 ? (1 - t.value) / 0.15 : 0.5
  }));
  return <Animated.View pointerEvents="none" style={[styles.dustMote, {
    left: x,
    width: size,
    height: size,
    borderRadius: size / 2
  }, style]} />;
}
function DustLayer() {
  const {
    settings
  } = useAccessibility();
  const motes = useRef(Array.from({
    length: 10
  }).map(() => ({
    x: Math.random() * ROOM_W,
    size: 3 + Math.random() * 4,
    delay: Math.random() * 4000,
    duration: 6000 + Math.random() * 4000
  }))).current;
  if (settings.reducedMotion) return null;
  return <>{motes.map((m, i) => <DustMote key={i} {...m} />)}</>;
}
function ChecklistChip({
  item,
  found,
  accent
}) {
  return <Animated.View key={found ? 'found' : 'hidden'} style={[styles.chip, found ? {
    backgroundColor: accent,
    borderColor: accent
  } : styles.chipHidden]}>
      <Text style={styles.chipEmoji}>{found ? '✅' : item.emoji}</Text>
      <Text style={[styles.chipText, found && styles.chipTextFound]} numberOfLines={1}>{item.name}</Text>
    </Animated.View>;
}
export default function SafeSpotExplorerScreen({
  navigation
}) {
  const {
    userId
  } = useUser();
  const {
    settings: a11y
  } = useAccessibility();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState('intro');
  const [levelIndex, setLevelIndex] = useState(0);
  const [foundIds, setFoundIds] = useState([]);
  const [message, setMessage] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [burst, setBurst] = useState(null);
  const [ping, setPing] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [levelStars, setLevelStars] = useState([]);
  const hintRef = useRef(null);
  const elapsedRef = useRef(null);
  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);
  const tickPlayer = useAudioPlayer(tickSound);
  const level = LEVELS[levelIndex];
  const hazard = HAZARD_DATA[level.hazardKey];
  const DANGERS = hazard.dangers;
  useEffect(() => {
    if (phase !== 'playing') {
      clearTimeout(hintRef.current);
      setShowHint(false);
      return;
    }
    hintRef.current = setTimeout(() => setShowHint(true), 16000);
    return () => clearTimeout(hintRef.current);
  }, [phase, foundIds.length]);
  useEffect(() => {
    if (phase !== 'playing') {
      clearInterval(elapsedRef.current);
      return;
    }
    elapsedRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(elapsedRef.current);
  }, [phase]);
  const startLevel = index => {
    setLevelIndex(index);
    setFoundIds([]);
    setMessage(null);
    setMistakes(0);
    setShowHint(false);
    setElapsed(0);
    setPhase('playing');
  };
  const startGame = () => {
    setLevelStars([]);
    startLevel(0);
  };
  const finishGame = async finalStars => {
    winPlayer.seekTo(0);
    winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const totalStars = finalStars.reduce((a, b) => a + b, 0);
    setPhase('won');
    try {
      await apiRequest('/gamification/minigame-complete', 'POST', {
        userId,
        gameId: 'safe_spot_explorer',
        xp: 40 + totalStars * 5
      });
    } catch (err) {
      console.log('Safe Spot completion error:', err.message);
    }
  };
  const completeLevel = () => {
    const stars = computeStars(mistakes, elapsed);
    const nextStars = [...levelStars, stars];
    setLevelStars(nextStars);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (levelIndex + 1 >= LEVELS.length) {
      finishGame(nextStars);
    } else {
      setPhase('levelComplete');
    }
  };
  const handleRoomTap = evt => {
    if (phase !== 'playing') return;
    const {
      locationX,
      locationY
    } = evt.nativeEvent;
    setPing({
      seq: Date.now(),
      x: locationX,
      y: locationY
    });
    const found = DANGERS.find(d => !foundIds.includes(d.id) && Math.hypot(locationX - d.x * SCALE, locationY - d.y * SCALE) <= HIT_RADIUS);
    if (found) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBurst({
        seq: Date.now(),
        x: found.x * SCALE,
        y: found.y * SCALE
      });
      setMessage({
        good: true,
        title: `${found.emoji} Found it: ${found.name}!`,
        text: found.why
      });
      const next = [...foundIds, found.id];
      setFoundIds(next);
      if (next.length === DANGERS.length) {
        setTimeout(() => {
          setMessage(null);
          completeLevel();
        }, 900);
      }
      return;
    }
    const decoy = level.clutter.find(s => Math.hypot(locationX - s.x * SCALE, locationY - s.y * SCALE) <= HIT_RADIUS);
    if (decoy) {
      tickPlayer.seekTo(0);
      tickPlayer.play();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMistakes(m => m + 1);
      setMessage({
        good: false,
        title: '🔍 Nothing here...',
        text: 'Keep looking, sharp eyes!'
      });
    }
  };
  if (phase === 'intro') {
    return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <BouncyMascot size={64} />
          <Text style={styles.hazardEmoji}>🔎</Text>
          <Text style={styles.introTitle}>Safe Spot Explorer</Text>
          <Text style={styles.introTag}>A Hidden Hazard Hunt</Text>
          <Text style={styles.introText}>Three rooms are hiding real safety hazards! Search each one, tap every hazard on your checklist, and clear all three rooms.</Text>
          <View style={styles.introLevelsRow}>
            {LEVELS.map((l, i) => <Animated.View key={l.key} entering={FadeInDown.delay(i * 100).duration(320)} style={styles.introLevelCard}>
                <Text style={styles.introLevelEmoji}>{HAZARD_DATA[l.hazardKey].emoji}</Text>
                <Text style={styles.introLevelText}>{HAZARD_DATA[l.hazardKey].label}</Text>
              </Animated.View>)}
          </View>
          <Text style={styles.introHow}>Tap around each room to search. Find every item on the checklist to clear the room!</Text>
          <BouncyPress style={styles.startButton} onPress={startGame} accessibilityRole="button" accessibilityLabel="Start exploring">
            <Text style={styles.startButtonText}>🔎 Start Exploring!</Text>
          </BouncyPress>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>;
  }
  if (phase === 'levelComplete') {
    const stars = levelStars[levelStars.length - 1];
    return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.centerScreen}>
          <Celebration colors={['#F59E0B', '#FBBF24', '#34D399', '#60A5FA']} pieceCount={16} />
          <BouncyMascot size={64} emoji="🦊✨" />
          <Text style={styles.introTitle}>Room Cleared!</Text>
          <Text style={styles.stars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
          <Text style={styles.introText}>Great eyes! You found every hazard in the {level.roomLabel.replace(/^\S+\s/, '')}.</Text>
          <BouncyPress style={styles.startButton} onPress={() => startLevel(levelIndex + 1)} accessibilityRole="button" accessibilityLabel="Go to next room">
            <Text style={styles.startButtonText}>➡️ Next Room</Text>
          </BouncyPress>
        </ScrollView>
      </SafeAreaView>;
  }
  if (phase === 'won') {
    const totalStars = levelStars.reduce((a, b) => a + b, 0);
    return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.centerScreen}>
          <Celebration colors={['#F59E0B', '#FBBF24', '#34D399', '#60A5FA']} />
          <LottieView source={celebrationStarSource} autoPlay={!a11y.reducedMotion} loop={!a11y.reducedMotion} style={styles.wonLottie} />
          <BouncyMascot size={64} emoji="🦊🎉" />
          <Text style={styles.introTitle}>Safe & Sound, Hero!</Text>
          <View style={styles.wonRoomsRow}>
            {LEVELS.map((l, i) => <View key={l.key} style={styles.wonRoomBox}>
                <Text style={styles.wonRoomEmoji}>{HAZARD_DATA[l.hazardKey].emoji}</Text>
                <Text style={styles.wonRoomStars}>{'⭐'.repeat(levelStars[i] || 0)}{'☆'.repeat(3 - (levelStars[i] || 0))}</Text>
              </View>)}
          </View>
          <Text style={styles.introText}>
            You cleared all three rooms and spotted every hazard, {totalStars}/{LEVELS.length * 3} stars total!{'\n\n'}
            You earned XP and a safety badge!
          </Text>
          <BouncyPress style={styles.startButton} onPress={startGame} accessibilityRole="button" accessibilityLabel="Play again">
            <Text style={styles.startButtonText}>🔁 Play Again</Text>
          </BouncyPress>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>;
  }
  return <View style={styles.screen}>
      <View style={[styles.header, {
      paddingTop: insets.top + 14
    }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.headerBack}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerStats}>
            <Text style={styles.headerProgress}>🔎 {foundIds.length}/{DANGERS.length}</Text>
            <Text style={styles.headerTimer}>⏱ {elapsed}s</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>{level.roomLabel}</Text>
        <View style={styles.levelDotsRow}>
          {LEVELS.map((l, i) => <View key={l.key} style={[styles.levelDot, i === levelIndex && styles.levelDotActive, i < levelIndex && styles.levelDotDone]} />)}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.searchScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Find these hazards:</Text>
          <View style={styles.checklistRow}>
            {DANGERS.map(d => <ChecklistChip key={d.id} item={d} found={foundIds.includes(d.id)} accent={hazard.color} />)}
          </View>
          <AnimatedProgressBar progress={foundIds.length / DANGERS.length * 100} trackColor="#F1F5F9" fillColor={hazard.color} height={8} />
        </View>

        {message && <Animated.View entering={answerFeedbackEntering} style={[styles.messageBox, message.good ? styles.messageGood : styles.messageBad]}>
            <Text style={styles.messageTitle}>{message.title}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </Animated.View>}

        <View style={styles.roomWrap}>
          <Pressable onPress={handleRoomTap} style={[styles.room, {
          width: ROOM_W,
          height: ROOM_H,
          backgroundColor: level.wall
        }]}>
            <View style={[styles.roomWall, {
            backgroundColor: level.wall
          }]} />
            <View style={[styles.roomFloor, {
            backgroundColor: level.floor
          }]} />
            <View style={[styles.deco, styles.decoBed, {
            left: 235 * SCALE,
            top: 260 * SCALE,
            width: 70 * SCALE,
            height: 46 * SCALE,
            borderRadius: 8 * SCALE
          }]} />
            <View style={[styles.deco, styles.decoRug, {
            left: 40 * SCALE,
            top: 300 * SCALE,
            width: 100 * SCALE,
            height: 60 * SCALE,
            borderRadius: 30 * SCALE,
            backgroundColor: level.rugColor
          }]} />
            <View style={[styles.deco, styles.decoWindow, {
            left: 130 * SCALE,
            top: 15 * SCALE,
            width: 60 * SCALE,
            height: 60 * SCALE,
            borderRadius: 8 * SCALE
          }]} />
            <View style={[styles.deco, styles.decoShelf, {
            left: 15 * SCALE,
            top: 40 * SCALE,
            width: 60 * SCALE,
            height: 80 * SCALE
          }]}>
              <View style={styles.decoShelfBoard} /><View style={styles.decoShelfBoard} />
            </View>

            <DustLayer />
            {level.clutter.map((c, i) => <Text key={i} style={[styles.deco, styles.clutterEmoji, {
            left: c.x * SCALE - 15 * SCALE,
            top: c.y * SCALE - 15 * SCALE,
            fontSize: 26 * SCALE
          }]}>{c.emoji}</Text>)}
            {DANGERS.filter(d => !foundIds.includes(d.id)).map(d => <HiddenSparkle key={d.id} x={d.x * SCALE} y={d.y * SCALE} bright={showHint} />)}
            {DANGERS.filter(d => foundIds.includes(d.id)).map(d => <Animated.Text key={d.id} style={[styles.foundMark, {
            left: d.x * SCALE - 18,
            top: d.y * SCALE - 18
          }]}>{d.safe}</Animated.Text>)}
            {ping && <TapPing key={ping.seq} x={ping.x} y={ping.y} />}
            {burst && <FindBurst key={burst.seq} x={burst.x} y={burst.y} />}
          </Pressable>
          <BouncyMascot size={40} style={styles.roomMascot} />
        </View>

        <Text style={styles.roomHint}>Tap around the room - hazards are hiding in plain sight!</Text>
      </ScrollView>
    </View>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5'
  },
  centerScreen: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28
  },
  introContainer: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 20
  },
  hazardEmoji: {
    fontSize: 40,
    marginTop: -6,
    marginBottom: 6
  },
  introTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4
  },
  introTag: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#B45309'
  },
  introText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14
  },
  introLevelsRow: {
    flexDirection: 'row',
    marginBottom: 14
  },
  introLevelCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: '#F1F5F9'
  },
  introLevelEmoji: {
    fontSize: 26,
    marginBottom: 2
  },
  introLevelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569'
  },
  introHow: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 26,
    fontStyle: 'italic'
  },
  stars: {
    fontSize: 40,
    marginBottom: 12
  },
  startButton: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 44,
    marginBottom: 12,
    backgroundColor: '#F59E0B'
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  secondaryButton: {
    paddingVertical: 10
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: 'bold'
  },
  wonLottie: {
    width: 100,
    height: 100,
    marginBottom: -14
  },
  wonRoomsRow: {
    flexDirection: 'row',
    marginVertical: 10
  },
  wonRoomBox: {
    alignItems: 'center',
    marginHorizontal: 10
  },
  wonRoomEmoji: {
    fontSize: 28,
    marginBottom: 2
  },
  wonRoomStars: {
    fontSize: 14
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#B45309'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  headerBack: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10
  },
  headerTimer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FDE8B0'
  },
  levelDotsRow: {
    flexDirection: 'row',
    marginTop: 8
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginRight: 6
  },
  levelDotActive: {
    backgroundColor: '#FBBF24',
    width: 22
  },
  levelDotDone: {
    backgroundColor: '#34D399'
  },
  searchScroll: {
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 18
  },
  checklistCard: {
    width: '100%',
    maxWidth: ROOM_W,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: 150
  },
  chipHidden: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0'
  },
  chipEmoji: {
    fontSize: 15,
    marginRight: 5
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569'
  },
  chipTextFound: {
    color: '#fff'
  },
  messageBox: {
    width: '100%',
    maxWidth: ROOM_W,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 12,
    padding: 10
  },
  messageGood: {
    backgroundColor: '#D9F7EC',
    borderWidth: 1,
    borderColor: '#34D399'
  },
  messageBad: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  messageTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1E293B'
  },
  messageText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2
  },
  roomWrap: {
    alignItems: 'center',
    marginTop: 10
  },
  room: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative'
  },
  roomWall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%'
  },
  roomFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%'
  },
  deco: {
    position: 'absolute'
  },
  decoBed: {
    backgroundColor: '#60A5FA'
  },
  decoRug: {
    opacity: 0.55
  },
  decoWindow: {
    backgroundColor: '#BAE6FD',
    borderWidth: 5,
    borderColor: '#fff'
  },
  decoShelf: {
    backgroundColor: '#B07B4F',
    borderRadius: 6,
    justifyContent: 'space-around',
    padding: 4
  },
  decoShelfBoard: {
    height: '18%',
    backgroundColor: '#8B5A2B',
    borderRadius: 3
  },
  clutterEmoji: {
    opacity: 0.9
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24
  },
  foundMark: {
    position: 'absolute',
    fontSize: 30
  },
  roomMascot: {
    marginTop: 8
  },
  roomHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
    marginTop: 12
  },
  dustMote: {
    position: 'absolute',
    backgroundColor: '#FFFFFF'
  },
  tapPing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F59E0B'
  },
  burstWrap: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30
  },
  burstBit: {
    position: 'absolute',
    fontSize: 18
  }
});
