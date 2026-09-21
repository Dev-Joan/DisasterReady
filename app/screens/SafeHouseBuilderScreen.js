import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Text from '../components/Text';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, ZoomIn, LinearTransition } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { SAFE_HOUSE_ZONES, SAFE_HOUSE_ITEMS } from '../constants/safeHouse';
import DraggableChip from '../components/DraggableChip';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

function statusOf(item, zoneKey) {
  if (!zoneKey) return null;
  if (item.safeZones.includes(zoneKey)) return 'safe';
  if (item.dangerZones.includes(zoneKey)) return 'danger';
  return 'neutral';
}

export default function SafeHouseBuilderScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [phase, setPhase] = useState('intro'); // intro | placing | testing | report | finished
  const [assignments, setAssignments] = useState({});
  const [finalStars, setFinalStars] = useState(0);
  const zoneNodes = useRef({});
  const zoneRects = useRef({});

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const tray = SAFE_HOUSE_ITEMS.filter((i) => !assignments[i.id]);

  const startGame = () => {
    setAssignments({});
    setPhase('placing');
  };

  const measureZoneOnLayout = (zoneKey) => () => {
    const node = zoneNodes.current[zoneKey];
    if (node) node.measureInWindow((x, y, width, height) => { zoneRects.current[zoneKey] = { x, y, width, height }; });
  };

  const dropItem = (item, absX, absY) => {
    const hit = Object.entries(zoneRects.current).find(([, r]) => (
      r && absX >= r.x && absX <= r.x + r.width && absY >= r.y && absY <= r.y + r.height
    ));
    if (!hit) return;
    const [zoneKey] = hit;
    setAssignments((prev) => ({ ...prev, [item.id]: zoneKey }));
    packPlayer.seekTo(0); packPlayer.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const tapPlacedItem = (itemId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const runTest = () => {
    setPhase('testing');
    setTimeout(() => {
      const dangerCount = SAFE_HOUSE_ITEMS.filter((i) => statusOf(i, assignments[i.id]) === 'danger').length;
      if (dangerCount === 0) { winPlayer.seekTo(0); winPlayer.play(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      else { wrongPlayer.seekTo(0); wrongPlayer.play(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
      setPhase('report');
    }, 1600);
  };

  const fixAndRetest = () => setPhase('placing');

  const finishMission = async () => {
    const dangerCount = SAFE_HOUSE_ITEMS.filter((i) => statusOf(i, assignments[i.id]) === 'danger').length;
    const stars = dangerCount === 0 ? 3 : dangerCount === 1 ? 2 : 1;
    setFinalStars(stars);
    packPlayer.seekTo(0); packPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('finished');
    try { await apiRequest('/gamification/minigame-complete', 'POST', { userId, gameId: 'fire_safehouse', xp: 25 + stars * 5 }); }
    catch (err) { console.log('Safe House completion error:', err.message); }
  };

  if (phase === 'intro') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <BouncyMascot size={56} emoji="🦊🏠" />
        <Text style={styles.title}>Build-It Safe House</Text>
        <Text style={styles.introText}>
          You get to decide where everything in this house goes!{'\n\n'}
          👉 Drag each item onto the room spot where you'd put it.{'\n'}
          🔥 When you're done, hit "Test It!" and see what happens.{'\n\n'}
          Some spots are safe, some are dangerous — you'll find out which is which!
        </Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Start building"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>▶ Start Building</Text>
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

  if (phase === 'testing') {
    return (
      <View style={[styles.screen, styles.center]}>
        <Animated.Text entering={ZoomIn.duration(400)} style={styles.mascot}>🔥🏠</Animated.Text>
        <Text style={styles.title}>Testing your house...</Text>
        <Text style={styles.introText}>Let's see what happens if a fire starts!</Text>
      </View>
    );
  }

  if (phase === 'finished') {
    return (
      <View style={[styles.screen, styles.center]}>
        <Celebration colors={['#EF4444', '#FBBF24', '#34D399', '#38BDF8']} />
        <BouncyMascot size={56} emoji="🦊🏆" />
        <Text style={styles.title}>Safe House Complete!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>Now you know how small choices — like where a heater or a candle goes — can make a home so much safer.</Text>
        <BouncyPress
          style={styles.startButton}
          onPress={startGame}
          accessibilityRole="button"
          accessibilityLabel="Build again"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🔁 Build Again</Text>
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

  if (phase === 'report') {
    const dangerCount = SAFE_HOUSE_ITEMS.filter((i) => statusOf(i, assignments[i.id]) === 'danger').length;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.reportContainer}>
        <BouncyMascot size={56} emoji={dangerCount === 0 ? '🦊✅' : '🦊⚠️'} />
        <Text style={styles.title}>{dangerCount === 0 ? 'Every spot is fire-safe!' : `${dangerCount} risky spot${dangerCount > 1 ? 's' : ''} found`}</Text>

        {SAFE_HOUSE_ITEMS.map((item, i) => {
          const status = statusOf(item, assignments[item.id]);
          const zone = SAFE_HOUSE_ZONES.find((z) => z.key === assignments[item.id]);
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(i * 70).duration(320)} style={[styles.reportRow, status === 'safe' && styles.reportSafe, status === 'danger' && styles.reportDanger]}>
              <Text style={styles.reportEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportName}>{item.name} — {zone ? zone.label : 'Nowhere'}</Text>
                <Text style={styles.reportWhy}>{status === 'neutral' ? 'That spot is OK, but this item would do more good somewhere else.' : item.why}</Text>
              </View>
              <Text style={styles.reportMark}>{status === 'safe' ? '✅' : status === 'danger' ? '🔥' : '➖'}</Text>
            </Animated.View>
          );
        })}

        <BouncyPress
          style={styles.startButton}
          onPress={fixAndRetest}
          accessibilityRole="button"
          accessibilityLabel="Fix and retest"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>🔧 Fix & Retest</Text>
        </BouncyPress>
        <BouncyPress
          style={styles.finishButton}
          onPress={finishMission}
          accessibilityRole="button"
          accessibilityLabel="Finish mission"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.finishButtonText}>✅ Finish Mission</Text>
        </BouncyPress>
      </ScrollView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.roundTitle}>🏠 Place every item somewhere</Text>
        <Text style={styles.roundSub}>Drag an item onto a room spot</Text>
      </View>

      <View style={styles.zoneGrid}>
        {SAFE_HOUSE_ZONES.map((zone) => {
          const items = SAFE_HOUSE_ITEMS.filter((i) => assignments[i.id] === zone.key);
          return (
            <View
              key={zone.key}
              ref={(el) => { zoneNodes.current[zone.key] = el; }}
              onLayout={measureZoneOnLayout(zone.key)}
              style={styles.zoneCard}
            >
              <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
              <Text style={styles.zoneLabel}>{zone.label}</Text>
              <View style={styles.zoneItemsRow}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => tapPlacedItem(item.id)}
                    style={styles.zoneItemChip}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    accessibilityHint={`Placed in ${zone.label}. Tap to remove and place elsewhere`}
                    {...touchTargetProps(a11y)}
                  >
                    <Text style={styles.zoneItemEmoji}>{item.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Known accessibility gap: placement here is drag-and-drop only
          (DraggableChip has no tap-to-place fallback or accessibilityActions),
          so this step isn't currently operable via screen reader. Flagged
          rather than guessed at — needs on-device screen reader testing to
          design a workable tap-based alternative. */}
      <ScrollView contentContainerStyle={styles.tray}>
        {tray.map((item) => (
          <Animated.View key={item.id} layout={LinearTransition.duration(220)} entering={FadeIn.duration(200)}>
            <DraggableChip style={styles.trayCard} onDrop={(x, y) => dropItem(item, x, y)}>
              <Text style={styles.trayEmoji}>{item.emoji}</Text>
              <Text style={styles.trayText}>{item.name}</Text>
            </DraggableChip>
          </Animated.View>
        ))}
      </ScrollView>

      <BouncyPress
        style={[styles.testButton, tray.length > 0 && styles.testButtonDisabled]}
        disabled={tray.length > 0}
        onPress={runTest}
        accessibilityRole="button"
        accessibilityLabel="Test it"
        accessibilityState={{ disabled: tray.length > 0 }}
        {...touchTargetProps(a11y)}
      >
        <Text style={styles.testButtonText}>🔥 Test It!</Text>
      </BouncyPress>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF7ED' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  mascot: { fontSize: 56, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 15, color: '#7C2D12', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  stars: { fontSize: 34, marginBottom: 10 },
  startButton: { backgroundColor: '#EF4444', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 44, marginBottom: 10 },
  startButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 15, color: '#7C2D12', fontWeight: 'bold' },

  header: { padding: 16, paddingBottom: 8 },
  roundTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  roundSub: { fontSize: 13, color: '#EA580C', fontWeight: 'bold', marginTop: 2 },

  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, justifyContent: 'space-between' },
  zoneCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 10, alignItems: 'center', minHeight: 92, borderWidth: 2, borderColor: '#FED7AA' },
  zoneEmoji: { fontSize: 24 },
  zoneLabel: { fontSize: 11, fontWeight: 'bold', color: '#1E293B', marginTop: 2, textAlign: 'center' },
  zoneItemsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 },
  zoneItemChip: { backgroundColor: '#FFEDD5', borderRadius: 10, padding: 4, margin: 2 },
  zoneItemEmoji: { fontSize: 16 },

  tray: { paddingHorizontal: 10, paddingBottom: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  trayCard: { width: 110, backgroundColor: '#fff', borderRadius: 14, padding: 10, margin: 5, alignItems: 'center', borderWidth: 2, borderColor: '#FED7AA' },
  trayEmoji: { fontSize: 22, marginBottom: 2 },
  trayText: { fontSize: 11, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },

  testButton: { backgroundColor: '#EF4444', borderRadius: 16, paddingVertical: 16, marginHorizontal: 16, marginBottom: 16, alignItems: 'center' },
  testButtonDisabled: { backgroundColor: '#FCA5A5' },
  testButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  reportContainer: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  reportRow: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 2, borderColor: '#E5E7EB' },
  reportSafe: { borderColor: '#34D399', backgroundColor: '#ECFDF5' },
  reportDanger: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  reportEmoji: { fontSize: 24, marginRight: 10 },
  reportName: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  reportWhy: { fontSize: 12, color: '#57534E', marginTop: 2, lineHeight: 16 },
  reportMark: { fontSize: 18, marginLeft: 8 },
  finishButton: { backgroundColor: '#1E293B', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, marginTop: 4 },
  finishButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
