import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming,
  withRepeat
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { HAZARD_DATA, HAZARD_LEVELS, BONUS_MISSIONS } from '../constants/hazardGames';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const SCREEN = Dimensions.get('window');

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const tickSound = require('../assets/sounds/tick.wav');

const ROOM_SLOTS = [
  { type: 'shelf', x: 20, y: 90 },
  { type: 'shelf', x: 210, y: 150 },
  { type: 'window', x: 250, y: 70 },
  { type: 'bed', x: 30, y: 340 },
  { type: 'lamp', x: 250, y: 330 },
  { type: 'toybox', x: 150, y: 430 },
  { type: 'plant', x: 30, y: 250 },
  { type: 'dresser', x: 220, y: 430 },
  { type: 'toybox', x: 30, y: 430 }
];

function ItemCard({ item, packed, onTap, wrong }) {
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (wrong) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 }));
    }
  }, [wrong]);

  useEffect(() => { if (packed) pop.value = withSequence(withSpring(1.1), withSpring(1)); }, [packed]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { scale: pop.value }] }));
  const { settings: a11y } = useAccessibility();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onTap(item)}
      style={styles.cardWrap}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityHint={packed ? 'Already packed' : 'Tap to pack this item'}
      accessibilityState={{ selected: packed }}
      {...touchTargetProps(a11y)}
    >
      <Animated.View style={[styles.card, packed && styles.cardPacked, style]}>
        {packed && <View style={styles.cardCheck}><Text style={styles.cardCheckText}>✓</Text></View>}
        <View style={[styles.cardIcon, { backgroundColor: packed ? '#DCFCE7' : item.iconBg }]}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.cardName}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function Furniture({ slot, item, searched, onSearch, showHint }) {
  const wiggle = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (showHint && !searched && item) {
      glow.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })), -1, true);
    } else { glow.value = 0; }
  }, [showHint, searched]);

  const doSearch = () => {
    if (searched) return;
    wiggle.value = withSequence(
      withTiming(-5, { duration: 60 }), withTiming(5, { duration: 60 }),
      withTiming(-3, { duration: 60 }), withTiming(0, { duration: 60 }));
    onSearch(slot, item);
  };

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${wiggle.value}deg` }], opacity: searched ? 0.5 : 1 }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.6 }));
  const { settings: a11y } = useAccessibility();

  const shapes = {
    shelf: <View style={styles.fShelf}><View style={styles.fShelfBoard} /><View style={styles.fShelfBoard} /></View>,
    window: <View style={styles.fWindow}><Text style={styles.fEmojiSmall}>☁️</Text></View>,
    bed: <View style={styles.fBed}><View style={styles.fPillow} /><View style={styles.fBlanket} /></View>,
    lamp: <View style={styles.fLamp}><View style={styles.fLampShade} /><View style={styles.fLampBase} /></View>,
    toybox: <View style={styles.fToybox}><Text style={styles.fEmojiSmall}>📦</Text></View>,
    dresser: <View style={styles.fDresser}><View style={styles.fDrawer} /><View style={styles.fDrawer} /></View>,
    plant: <View style={styles.fPlant}><Text style={styles.fEmojiSmall}>🪴</Text></View>
  };

  return (
    <TouchableOpacity
      style={[styles.furniture, { left: slot.x, top: slot.y }]}
      onPress={doSearch}
      activeOpacity={0.8}
      disabled={searched}
      accessibilityRole="button"
      accessibilityLabel={`${slot.type}`}
      accessibilityHint={searched ? 'Already searched' : 'Tap to search for hidden items'}
      accessibilityState={{ disabled: searched }}
      {...touchTargetProps(a11y)}
    >
      <Animated.View style={glowStyle}><View style={styles.furnitureGlow} /></Animated.View>
      <Animated.View style={style}>
        {shapes[slot.type]}
        {searched && <View style={styles.searchedBadge}><Text style={styles.searchedBadgeText}>✓</Text></View>}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function KitBuilderScreen({ route, navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const hazardKey = (route.params && route.params.hazard) || 'flood';
  const HAZARD = HAZARD_DATA[hazardKey];
  const KIT_ITEMS = HAZARD.items;
  const DANGERS = HAZARD.dangers;
  const correctItems = KIT_ITEMS.filter(i => i.correct);

  // furniture assignment: correct items + a couple decoys hidden, some slots empty
  const roomAssignment = useRef(null);
  if (!roomAssignment.current) {
    const hideable = [...correctItems.slice(0, 7), KIT_ITEMS.find(i => !i.correct)].filter(Boolean);
    roomAssignment.current = ROOM_SLOTS.map((slot, i) => ({ slot, item: hideable[i] || null }));
  }

  const [phase, setPhase] = useState('map');
  const [level, setLevel] = useState(null);
  const [levelStars, setLevelStars] = useState({});
  const [packedIds, setPackedIds] = useState([]);
  const [searchedSlots, setSearchedSlots] = useState([]);
  const [fixedDangers, setFixedDangers] = useState([]);
  const [foundItem, setFoundItem] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [message, setMessage] = useState(null);
  const [finalStars, setFinalStars] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);
  const hintRef = useRef(null);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);
  const tickPlayer = useAudioPlayer(tickSound);

  useEffect(() => {
    if (phase !== 'playing') return;
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
    if (phase === 'playing' && level && level.mode === 'explore') {
      hintRef.current = setTimeout(() => setShowHint(true), 15000);
    }
    return () => clearTimeout(hintRef.current);
  }, [phase, searchedSlots.length]);

  const startLevel = (lvl) => {
    if (lvl.mode === 'runner') { navigation.navigate('FloodRunner', { hazard: hazardKey }); return; }
    setLevel(lvl);
    setPackedIds([]); setSearchedSlots([]); setFixedDangers([]); setFoundItem(null);
    setMistakes(0); setTimeLeft(lvl.time); setMessage(null); setShowHint(false); setWrongId(null);
    setPhase('playing');
  };

  const computeStars = (time, mk, total) => {
    if (mk === 0 && time > total * 0.33) return 3;
    if (mk <= 1 && time > total * 0.1) return 2;
    return 1;
  };

  const finishLevel = async () => {
    clearInterval(timerRef.current);
    winPlayer.seekTo(0); winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const stars = computeStars(timeLeft, mistakes, level.time);
    setFinalStars(stars);
    setLevelStars((prev) => ({ ...prev, [level.id]: Math.max(prev[level.id] || 0, stars) }));
    setPhase('won');
    try { await apiRequest('/gamification/kit-complete', 'POST', { userId, kitId: `${hazardKey}_kids` }); }
    catch (err) { console.log('Kit completion error:', err.message); }
  };

  const tapItem = (item) => {
    if (phase !== 'playing' || packedIds.includes(item.id)) return;
    if (item.correct) {
      packPlayer.seekTo(0); packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const np = [...packedIds, item.id];
      setPackedIds(np);
      setMessage({ good: true, title: `${item.emoji} ${item.name} packed!`, text: item.why });
      if (np.length === correctItems.length) finishLevel();
    } else {
      wrongPlayer.seekTo(0); wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongId(item.id);
      setTimeout(() => setWrongId(null), 400);
      setMistakes((m) => m + 1);
      setMessage({ good: false, title: `${item.emoji} Not that one!`, text: item.why });
    }
  };

  const handleSearch = (slot, item) => {
    const key = `${slot.x}-${slot.y}`;
    if (searchedSlots.includes(key) || foundItem) return;
    setSearchedSlots((prev) => [...prev, key]);
    setShowHint(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item) { setMessage({ good: true, title: '🔍 Nothing here!', text: 'Keep searching, little hero!' }); return; }
    setFoundItem(item);
  };

  const decideFoundItem = (pack) => {
    const item = foundItem;
    setFoundItem(null);
    if (pack) {
      if (item.correct) {
        if (packedIds.includes(item.id)) return;
        packPlayer.seekTo(0); packPlayer.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const np = [...packedIds, item.id];
        setPackedIds(np);
        setMessage({ good: true, title: `${item.emoji} ${item.name} packed!`, text: item.why });
        if (np.length === correctItems.length) finishLevel();
      } else {
        wrongPlayer.seekTo(0); wrongPlayer.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMistakes((m) => m + 1);
        setMessage({ good: false, title: `${item.emoji} That doesn't belong!`, text: item.why });
      }
    } else {
      if (item.correct) {
        setMessage({ good: false, title: `${item.emoji} Wait, you need that!`, text: item.why });
      } else {
        setMessage({ good: true, title: `${item.emoji} Good call!`, text: `Right — ${item.why.toLowerCase()}` });
      }
    }
  };

  const fixDanger = (d) => {
    if (fixedDangers.includes(d.id)) return;
    packPlayer.seekTo(0); packPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nf = [...fixedDangers, d.id];
    setFixedDangers(nf);
    setMessage({ good: true, title: `${d.safe} Fixed: ${d.name}`, text: d.why });
    if (nf.length === DANGERS.length) finishLevel();
  };

  if (phase === 'map') {
    const bonus = BONUS_MISSIONS[hazardKey];
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.mapContainer}>
        <BouncyMascot size={64} />
        <Text style={styles.hazardMascotEmoji}>{HAZARD.emoji}</Text>
        <Text style={styles.introTitle}>{HAZARD.label} Rescue Missions</Text>
        <Text style={styles.mapSub}>Pick a mission, little hero!</Text>
        {HAZARD_LEVELS.map((lvl) => (
          <BouncyPress
            key={lvl.id}
            style={styles.levelCard}
            onPress={() => startLevel(lvl)}
            accessibilityRole="button"
            accessibilityLabel={`Level ${lvl.id}: ${lvl.title}`}
            accessibilityHint={`${lvl.desc}. ${levelStars[lvl.id] || 0} of 3 stars earned.`}
          >
            <View style={[styles.levelIconBox, { backgroundColor: HAZARD.color + '33' }]}><Text style={styles.levelEmoji}>{lvl.emoji}</Text></View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {lvl.id}: {lvl.title}</Text>
              <Text style={styles.levelDesc}>{lvl.desc}</Text>
            </View>
            <Text style={styles.levelStars}>{'⭐'.repeat(levelStars[lvl.id] || 0)}{'☆'.repeat(3 - (levelStars[lvl.id] || 0))}</Text>
          </BouncyPress>
        ))}
        {bonus && (
          <BouncyPress
            style={styles.bonusCard}
            onPress={() => navigation.navigate(bonus.screen, { hazard: hazardKey })}
            accessibilityRole="button"
            accessibilityLabel={`Bonus mission: ${bonus.title}`}
            accessibilityHint={bonus.desc}
          >
            <Text style={styles.bonusTag}>🌟 BONUS MISSION</Text>
            <View style={styles.bonusRow}>
              <View style={[styles.levelIconBox, { backgroundColor: '#FFFFFF44' }]}><Text style={styles.levelEmoji}>{bonus.emoji}</Text></View>
              <View style={styles.levelInfo}>
                <Text style={styles.bonusTitle}>{bonus.title}</Text>
                <Text style={styles.bonusDesc}>{bonus.desc}</Text>
              </View>
            </View>
          </BouncyPress>
        )}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back home"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (phase === 'won') {
    return (
      <View style={[styles.screen, styles.centerScreen]}>
        <Celebration colors={[HAZARD.color, '#FBBF24', '#34D399', '#F472B6']} />
        <BouncyMascot size={64} emoji="🦊🎉" />
        <Text style={styles.introTitle}>Mission Complete, Hero!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>
          {level.emoji} {level.title} done{mistakes > 0 ? ` with ${mistakes} mix-up${mistakes > 1 ? 's' : ''}` : ' with no mistakes'}!{'\n\n'}
          You earned +30 points and a safety badge!{'\n\n'}Prepare today, protect tomorrow!
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setPhase('map')}
          accessibilityRole="button"
          accessibilityLabel="Mission map"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🗺 Mission Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back home"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'lost') {
    return (
      <View style={[styles.screen, styles.centerScreen]}>
        <BouncyMascot size={56} emoji="🦊💦" />
        <Text style={styles.introTitle}>Time's up!</Text>
        <Text style={styles.introText}>Don't worry — real heroes practice! Try again, you've got this!</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => startLevel(level)}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🔁 Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setPhase('map')}
          accessibilityRole="button"
          accessibilityLabel="Mission map"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.secondaryButtonText}>Mission Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (level.mode === 'detective') {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{level.emoji} {level.title}</Text>
            <Text style={[styles.timer, timeLeft <= 15 && styles.timerLow]}>⏱ {timeLeft}s</Text>
          </View>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(fixedDangers.length / DANGERS.length) * 100}%` }]} /></View>
          <Text style={styles.progressText}>{fixedDangers.length}/{DANGERS.length} dangers fixed · Tap the dangers!</Text>
        </View>
        {message && (
          <View style={[styles.messageBox, message.good ? styles.messageGood : styles.messageBad]}>
            <Text style={styles.messageTitle}>{message.title}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}
        <View style={styles.detectiveRoom}>
          {DANGERS.map((d) => {
            const fixed = fixedDangers.includes(d.id);
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.dangerSpot, { left: d.x, top: d.y }]}
                onPress={() => fixDanger(d)}
                activeOpacity={0.7}
                disabled={fixed}
                accessibilityRole="button"
                accessibilityLabel={d.name}
                accessibilityHint={fixed ? 'Already fixed' : 'Tap to fix this danger'}
                accessibilityState={{ disabled: fixed }}
                {...touchTargetProps(a11y)}
              >
                <Text style={styles.dangerEmoji}>{fixed ? d.safe : d.emoji}</Text>
                {!fixed && <View style={styles.dangerPulse} />}
                <Text style={styles.dangerLabel}>{fixed ? 'Safe!' : 'Danger!'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (level.mode === 'explore') {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{level.emoji} {level.title}</Text>
            <Text style={[styles.timer, timeLeft <= 15 && styles.timerLow]}>⏱ {timeLeft}s</Text>
          </View>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(packedIds.length / correctItems.length) * 100}%` }]} /></View>
          <Text style={styles.progressText}>Found {packedIds.length}/{correctItems.length} · Tap furniture to search!</Text>
        </View>
        {message && !foundItem && (
          <View style={[styles.messageBox, message.good ? styles.messageGood : styles.messageBad]}>
            <Text style={styles.messageTitle}>{message.title}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}
        <View style={styles.bedroom}>
          <View style={styles.bedroomWall} />
          <View style={styles.bedroomFloor} />
          {roomAssignment.current.map((entry, i) => {
            const key = `${entry.slot.x}-${entry.slot.y}`;
            const alreadyPacked = entry.item && packedIds.includes(entry.item.id);
            return (
              <Furniture
                key={i}
                slot={entry.slot}
                item={alreadyPacked ? null : entry.item}
                searched={searchedSlots.includes(key)}
                onSearch={handleSearch}
                showHint={showHint}
              />
            );
          })}
        </View>
        {foundItem && (
          <View style={styles.foundOverlay}>
            <View style={styles.foundCard}>
              <Text style={styles.foundEmoji}>{foundItem.emoji}</Text>
              <Text style={styles.foundTitle}>You found: {foundItem.name}!</Text>
              <Text style={styles.foundText}>Should it go in your emergency bag?</Text>
              <View style={styles.foundButtons}>
                <TouchableOpacity
                  style={styles.packBtn}
                  onPress={() => decideFoundItem(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Pack it"
                  accessibilityHint="Puts this item in your emergency bag"
                  {...touchTargetProps(a11y)}
                >
                  <Text style={styles.packBtnText}>🎒 Pack it!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.leaveBtn}
                  onPress={() => decideFoundItem(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Leave it"
                  accessibilityHint="Does not pack this item"
                  {...touchTargetProps(a11y)}
                >
                  <Text style={styles.leaveBtnText}>Leave it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // drag mode (Level 1) — tap to pack
  return (
    <View style={styles.screen}>
      <View style={[styles.packHeader, { backgroundColor: HAZARD.color }]}>
        <View style={styles.headerRow}>
          <Text style={styles.packTitle}>{HAZARD.emoji} Safety Pack!</Text>
          <Text style={[styles.timer, timeLeft <= 15 && styles.timerLow]}>⏱ {timeLeft}s</Text>
        </View>
        <Text style={styles.packSub}>Quick! Tap the items you need for a {HAZARD.label.toLowerCase()}.</Text>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.round((packedIds.length / correctItems.length) * 100)}%` }]} /></View>
        <Text style={styles.progressText}>{Math.round((packedIds.length / correctItems.length) * 100)}% READY</Text>
      </View>

      {message && (
        <View style={[styles.messageBox, message.good ? styles.messageGood : styles.messageBad]}>
          <Text style={styles.messageTitle}>{message.title}</Text>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.cardGrid}>
        {KIT_ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} packed={packedIds.includes(item.id)} wrong={wrongId === item.id} onTap={tapItem} />
        ))}
      </ScrollView>

      <View style={styles.packBagBar}>
        <Text style={styles.packBagText}>🎒 {packedIds.length}/{correctItems.length} PACKED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F5' },
  centerScreen: { justifyContent: 'center', alignItems: 'center', padding: 28 },
  mapContainer: { padding: 20, alignItems: 'center' },
  hazardMascotEmoji: { fontSize: 32, marginTop: -6, marginBottom: 8 },
  introTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  mapSub: { fontSize: 14, color: '#B45309', marginBottom: 20 },
  introText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  stars: { fontSize: 40, marginBottom: 12 },
  startButton: { backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 10 },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#64748B', fontWeight: 'bold' },

  levelCard: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 5, elevation: 3 },
  levelIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  levelEmoji: { fontSize: 28 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  levelDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  levelStars: { fontSize: 13, marginLeft: 6 },

  bonusCard: { width: '100%', backgroundColor: '#6D5BD0', borderRadius: 18, padding: 14, marginBottom: 14, marginTop: 4 },
  bonusTag: { color: '#FDE68A', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  bonusRow: { flexDirection: 'row', alignItems: 'center' },
  bonusTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  bonusDesc: { fontSize: 12, color: '#E9E4F8', marginTop: 2 },

  header: { padding: 16, paddingBottom: 8 },
  packHeader: { padding: 16, paddingTop: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  packTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  packSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  timer: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  timerLow: { color: '#FECACA' },
  progressBar: { height: 12, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#34D399', borderRadius: 6 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#fff', marginTop: 4, textAlign: 'right' },

  messageBox: { marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 10 },
  messageGood: { backgroundColor: '#D9F7EC', borderWidth: 1, borderColor: '#34D399' },
  messageBad: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  messageTitle: { fontWeight: 'bold', fontSize: 13, color: '#1E293B' },
  messageText: { fontSize: 12, color: '#475569', marginTop: 2 },

  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 },
  cardWrap: { width: '48%', marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 2, borderColor: '#fff' },
  cardPacked: { borderColor: '#34D399', backgroundColor: '#F0FDF9' },
  cardCheck: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#34D399', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  cardCheckText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 34 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },

  packBagBar: { backgroundColor: '#34D399', paddingVertical: 18, alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  packBagText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  bedroom: { flex: 1, margin: 12, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  bedroomWall: { position: 'absolute', top: 0, left: 0, right: 0, height: '62%', backgroundColor: '#FDE8B0' },
  bedroomFloor: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', backgroundColor: '#F5D07A' },
  furniture: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  furnitureGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#FBBF24', alignSelf: 'center' },
  searchedBadge: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#34D399', alignItems: 'center', justifyContent: 'center' },
  searchedBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  fEmojiSmall: { fontSize: 26 },
  fShelf: { width: 90, height: 60, justifyContent: 'space-around' },
  fShelfBoard: { height: 12, backgroundColor: '#B07B4F', borderRadius: 3 },
  fWindow: { width: 70, height: 70, backgroundColor: '#BAE6FD', borderWidth: 6, borderColor: '#fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fBed: { width: 120, height: 60 },
  fPillow: { width: 34, height: 24, backgroundColor: '#fff', borderRadius: 6, position: 'absolute', left: 4, top: 8, zIndex: 2 },
  fBlanket: { width: 120, height: 40, backgroundColor: '#60A5FA', borderRadius: 8, position: 'absolute', bottom: 0 },
  fLamp: { alignItems: 'center' },
  fLampShade: { width: 44, height: 26, backgroundColor: '#FBBF24', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  fLampBase: { width: 8, height: 34, backgroundColor: '#94A3B8' },
  fToybox: { width: 70, height: 54, backgroundColor: '#F87171', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fDresser: { width: 76, height: 60, backgroundColor: '#C08457', borderRadius: 8, justifyContent: 'space-around', padding: 6 },
  fDrawer: { height: 18, backgroundColor: '#A16A43', borderRadius: 4 },
  fPlant: { width: 50, height: 60, alignItems: 'center', justifyContent: 'center' },

  detectiveRoom: { flex: 1, margin: 12, borderRadius: 20, backgroundColor: '#E7D3B3', position: 'relative', overflow: 'hidden' },
  dangerSpot: { position: 'absolute', alignItems: 'center', width: 84 },
  dangerEmoji: { fontSize: 40 },
  dangerPulse: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: '#EF4444', top: -6 },
  dangerLabel: { fontSize: 11, fontWeight: 'bold', color: '#B91C1C', marginTop: 2 },

  foundOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(30,41,59,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 50 },
  foundCard: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  foundEmoji: { fontSize: 52, marginBottom: 8 },
  foundTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 6, textAlign: 'center' },
  foundText: { fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' },
  foundButtons: { flexDirection: 'row' },
  packBtn: { backgroundColor: '#34D399', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginRight: 10 },
  packBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  leaveBtn: { backgroundColor: '#E2E8F0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  leaveBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 15 }
});