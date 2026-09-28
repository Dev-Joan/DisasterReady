import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat, withDelay, interpolateColor, Easing, ZoomIn } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { HAZARD_DATA } from '../constants/hazardGames';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import DraggableChip from '../components/DraggableChip';
import Celebration from '../components/Celebration';
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay';
import useBadgeUnlock from '../hooks/useBadgeUnlock';
const ROUND_TIME = 75;
const DROP_PAD = 30;
const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const tickSound = require('../assets/sounds/tick.wav');
const RING_COLORS = ['#FBBF24', '#60A5FA', '#F472B6', '#34D399', '#A78BFA', '#FB923C'];
const HAZARD_BITS = {
  flood: ['💧', '🫧', '💦'],
  earthquake: ['🍃', '⭐', '✨'],
  fire: ['✨', '🔥', '💫']
};
const answerFeedbackEntering = undefined;
function computeStars(timeLeft, mistakes, total) {
  if (mistakes === 0 && timeLeft > total * 0.4) return 3;
  if (mistakes <= 2 && timeLeft > total * 0.15) return 2;
  return 1;
}
function FloatingBit({
  emoji,
  left,
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
      translateY: 420 - t.value * 480
    }, {
      translateX: Math.sin(t.value * Math.PI * 2) * 14
    }],
    opacity: t.value < 0.1 ? t.value * 10 : t.value > 0.85 ? (1 - t.value) / 0.15 : 0.8
  }));
  return <Animated.Text pointerEvents="none" style={[styles.floatingBit, {
    left: `${left}%`,
    fontSize: size
  }, style]}>{emoji}</Animated.Text>;
}
function FloatingBits({
  hazardKey
}) {
  const {
    settings
  } = useAccessibility();
  const bits = useRef(Array.from({
    length: 8
  }).map((_, i) => {
    const emojiSet = HAZARD_BITS[hazardKey] || HAZARD_BITS.flood;
    return {
      emoji: emojiSet[i % emojiSet.length],
      left: 6 + Math.random() * 85,
      size: 14 + Math.random() * 14,
      delay: Math.random() * 4000,
      duration: 5500 + Math.random() * 4000
    };
  })).current;
  if (settings.reducedMotion) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bits.map((b, i) => <FloatingBit key={i} {...b} />)}
    </View>;
}
function BagAura({
  color,
  size,
  delay,
  duration
}) {
  const {
    settings
  } = useAccessibility();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (settings.reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withDelay(delay, withRepeat(withSequence(withTiming(1, {
      duration,
      easing: Easing.out(Easing.quad)
    }), withTiming(0, {
      duration,
      easing: Easing.in(Easing.quad)
    })), -1, false));
  }, [settings.reducedMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.14 + pulse.value * 0.24,
    transform: [{
      scale: 1 + pulse.value * 0.16
    }]
  }));
  return <Animated.View pointerEvents="none" style={[styles.bagAura, {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color
  }, style]} />;
}
function BurstFX() {
  const {
    settings
  } = useAccessibility();
  const bits = useRef(Array.from({
    length: 7
  }).map((_, i) => ({
    angle: i / 7 * Math.PI * 2,
    emoji: ['✨', '⭐', '🎉', '💫'][i % 4]
  }))).current;
  if (settings.reducedMotion) return null;
  return <View pointerEvents="none" style={styles.burstWrap}>
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
      duration: 550,
      easing: Easing.out(Easing.quad)
    });
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{
      translateX: Math.cos(angle) * t.value * 60
    }, {
      translateY: Math.sin(angle) * t.value * 60
    }, {
      scale: 1.1 - t.value * 0.5
    }],
    opacity: 1 - t.value
  }));
  return <Animated.Text style={[styles.burstBit, style]}>{emoji}</Animated.Text>;
}
function ItemChip({
  item,
  index,
  packed,
  onDrop,
  onGrab
}) {
  const {
    settings
  } = useAccessibility();
  const wobble = useSharedValue(0);
  const idleY = useSharedValue(0);
  const idleRot = useSharedValue(0);
  const twinkle = useSharedValue(0.5);
  useEffect(() => {
    if (settings.reducedMotion) {
      idleY.value = 0;
      idleRot.value = 0;
      twinkle.value = 0.6;
      return;
    }
    const stagger = index * 130;
    idleY.value = withDelay(stagger, withRepeat(withSequence(withTiming(-6, {
      duration: 820,
      easing: Easing.inOut(Easing.sin)
    }), withTiming(0, {
      duration: 820,
      easing: Easing.inOut(Easing.sin)
    })), -1, false));
    idleRot.value = withDelay(stagger, withRepeat(withSequence(withTiming(-4, {
      duration: 900
    }), withTiming(4, {
      duration: 900
    }), withTiming(0, {
      duration: 900
    })), -1, false));
    twinkle.value = withDelay(stagger, withRepeat(withSequence(withTiming(1, {
      duration: 620
    }), withTiming(0.35, {
      duration: 620
    })), -1, true));
  }, [settings.reducedMotion, index]);
  const chipStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${wobble.value + idleRot.value}deg`
    }, {
      translateY: idleY.value
    }]
  }));
  const twinkleStyle = useAnimatedStyle(() => ({
    opacity: twinkle.value
  }));
  if (packed) return null;
  const ringColor = RING_COLORS[index % RING_COLORS.length];
  return <Animated.View entering={ZoomIn.delay(index * 60).springify().damping(20)} style={styles.chipWrap}>
      <DraggableChip onDrop={(x, y) => onDrop(item, x, y)} onGrab={onGrab}>
        <Animated.View style={[styles.chip, {
        borderColor: ringColor
      }, chipStyle]}>
          <Animated.Text style={[styles.chipTwinkle, twinkleStyle]}>✨</Animated.Text>
          <View style={[styles.chipIcon, {
          backgroundColor: item.iconBg,
          borderColor: ringColor
        }]}>
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
          </View>
          <Text style={styles.chipName} numberOfLines={1}>{item.name}</Text>
        </Animated.View>
      </DraggableChip>
    </Animated.View>;
}
export default function KitBuilderScreen({
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
  const hazardKey = route.params && route.params.hazard || 'flood';
  const HAZARD = HAZARD_DATA[hazardKey];
  const KIT_ITEMS = HAZARD.items;
  const correctItems = KIT_ITEMS.filter(i => i.correct);
  const [phase, setPhase] = useState('intro');
  const [packedIds, setPackedIds] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [message, setMessage] = useState(null);
  const [finalStars, setFinalStars] = useState(0);
  const [burstSeq, setBurstSeq] = useState(0);
  const [gamBadges, setGamBadges] = useState(null);
  const {
    unlockedBadge,
    dismissBadgeUnlock
  } = useBadgeUnlock(gamBadges);
  const timerRef = useRef(null);
  const bagWrapRef = useRef(null);
  const bagRectRef = useRef(null);
  const bagScale = useSharedValue(1);
  const bagShakeX = useSharedValue(0);
  const goodFlash = useSharedValue(0);
  const badFlash = useSharedValue(0);
  const colorCycle = useSharedValue(0);
  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);
  const tickPlayer = useAudioPlayer(tickSound);
  const grabPlayer = useAudioPlayer(tickSound);
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 10 && t > 1) {
          tickPlayer.seekTo(0);
          tickPlayer.play();
        }
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('lost');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);
  useEffect(() => {
    if (a11y.reducedMotion) {
      colorCycle.value = 0;
      return;
    }
    colorCycle.value = withRepeat(withTiming(1, {
      duration: 2200,
      easing: Easing.inOut(Easing.sin)
    }), -1, true);
  }, [a11y.reducedMotion]);
  const measureBag = useCallback(() => {
    requestAnimationFrame(() => {
      if (!bagWrapRef.current) return;
      bagWrapRef.current.measureInWindow((x, y, width, height) => {
        bagRectRef.current = {
          x,
          y,
          width,
          height
        };
      });
    });
  }, []);
  useEffect(() => {
    if (phase === 'playing') measureBag();
  }, [phase, measureBag]);
  const startRound = () => {
    setPackedIds([]);
    setMistakes(0);
    setTimeLeft(ROUND_TIME);
    setMessage(null);
    setBurstSeq(0);
    bagScale.value = 1;
    bagShakeX.value = 0;
    goodFlash.value = 0;
    badFlash.value = 0;
    setPhase('playing');
  };
  const finishRound = async () => {
    clearInterval(timerRef.current);
    winPlayer.seekTo(0);
    winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFinalStars(computeStars(timeLeft, mistakes, ROUND_TIME));
    setPhase('won');
    try {
      const result = await apiRequest('/gamification/kit-complete', 'POST', {
        userId,
        kitId: `${hazardKey}_kids`
      });
      setGamBadges(result.badges || []);
    } catch (err) {
      console.log('Kit completion error:', err.message);
    }
  };
  const handleGrab = () => {
    grabPlayer.seekTo(0);
    grabPlayer.play();
  };
  const handleDrop = (item, absX, absY) => {
    const rect = bagRectRef.current;
    const inBag = rect && absX >= rect.x - DROP_PAD && absX <= rect.x + rect.width + DROP_PAD && absY >= rect.y - DROP_PAD && absY <= rect.y + rect.height + DROP_PAD;
    if (!inBag || packedIds.includes(item.id)) return;
    if (item.correct) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goodFlash.value = withSequence(withTiming(1, {
        duration: 90
      }), withTiming(0, {
        duration: 380
      }));
      setBurstSeq(s => s + 1);
      setMessage({
        good: true,
        title: `${item.emoji} ${item.name} packed!`,
        text: item.why
      });
      const nextPacked = [...packedIds, item.id];
      setPackedIds(nextPacked);
      if (nextPacked.length === correctItems.length) {
        clearInterval(timerRef.current);
        setTimeout(finishRound, 260);
      }
    } else {
      wrongPlayer.seekTo(0);
      wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      badFlash.value = withSequence(withTiming(1, {
        duration: 90
      }), withTiming(0, {
        duration: 380
      }));
      setMistakes(m => m + 1);
      setMessage({
        good: false,
        title: `${item.emoji} Not that one!`,
        text: item.why
      });
    }
  };
  const bagAnimStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: bagShakeX.value
    }, {
      scale: bagScale.value
    }],
    borderColor: interpolateColor(colorCycle.value, [0, 1], [HAZARD.color, '#FBBF24'])
  }));
  const goodFlashStyle = useAnimatedStyle(() => ({
    opacity: goodFlash.value
  }));
  const badFlashStyle = useAnimatedStyle(() => ({
    opacity: badFlash.value
  }));
  const percent = correctItems.length ? Math.round(packedIds.length / correctItems.length * 100) : 0;
  if (phase === 'intro') {
    return <GestureHandlerRootView style={styles.screen}>
        <FloatingBits hazardKey={hazardKey} />
        <SafeAreaView style={styles.safeFill} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <BouncyMascot size={64} />
          <Text style={styles.hazardEmoji}>{HAZARD.emoji}</Text>
          <Text style={styles.introTitle}>Pack & Protect</Text>
          <Text style={[styles.introTag, {
            color: HAZARD.color
          }]}>{HAZARD.label} Kit Challenge</Text>
          <Text style={styles.introText}>{HAZARD.intro}</Text>
          <Text style={styles.introHow}>Drag each item that belongs in your kit into the glowing bag - leave anything that doesn't help behind!</Text>
          <BouncyPress style={[styles.startButton, {
            backgroundColor: HAZARD.color
          }]} onPress={startRound} accessibilityRole="button" accessibilityLabel="Start packing">
            <Text style={styles.startButtonText}>🎒 Start Packing!</Text>
          </BouncyPress>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
      </GestureHandlerRootView>;
  }
  if (phase === 'won') {
    return <SafeAreaView style={[styles.screen, styles.centerScreen]} edges={['top', 'bottom']}>
        <Celebration colors={[HAZARD.color, '#FBBF24', '#34D399', '#F472B6']} />
        <BouncyMascot size={64} emoji="🦊🎉" />
        <Text style={styles.introTitle}>Bag Packed, Hero!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>
          {HAZARD.emoji} Your {HAZARD.label.toLowerCase()} kit is ready{mistakes > 0 ? ` - ${mistakes} mix-up${mistakes > 1 ? 's' : ''} along the way!` : ' with zero mix-ups!'}{'\n\n'}
          You earned +30 points and a safety badge!
        </Text>
        <BouncyPress style={[styles.startButton, {
        backgroundColor: HAZARD.color
      }]} onPress={startRound} accessibilityRole="button" accessibilityLabel="Play again">
          <Text style={styles.startButtonText}>🔁 Play Again</Text>
        </BouncyPress>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
        <BadgeUnlockOverlay badgeId={unlockedBadge} accent={HAZARD.color} onDismiss={dismissBadgeUnlock} />
      </SafeAreaView>;
  }
  if (phase === 'lost') {
    return <SafeAreaView style={[styles.screen, styles.centerScreen]} edges={['top', 'bottom']}>
        <BouncyMascot size={56} emoji="🦊💦" />
        <Text style={styles.introTitle}>Time's up!</Text>
        <Text style={styles.introText}>Don't worry - real heroes practice! Try again, you've got this!</Text>
        <BouncyPress style={[styles.startButton, {
        backgroundColor: HAZARD.color
      }]} onPress={startRound} accessibilityRole="button" accessibilityLabel="Try again">
          <Text style={styles.startButtonText}>🔁 Try Again</Text>
        </BouncyPress>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </SafeAreaView>;
  }
  return <GestureHandlerRootView style={styles.screen}>
      <FloatingBits hazardKey={hazardKey} />

      <View style={[styles.header, {
      backgroundColor: HAZARD.color,
      paddingTop: insets.top + 14
    }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
            <Text style={styles.headerBack}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.timer, timeLeft <= 15 && styles.timerLow]}>⏱ {timeLeft}s</Text>
        </View>
        <Text style={styles.headerTitle}>{HAZARD.emoji} Pack & Protect</Text>
      </View>

      <View style={styles.bagZone} onLayout={measureBag}>
        <BagAura color={HAZARD.color} size={170} delay={0} duration={1100} />
        <BagAura color="#FBBF24" size={130} delay={400} duration={1400} />
        {burstSeq > 0 && <BurstFX key={burstSeq} />}
        <View ref={bagWrapRef} onLayout={measureBag} collapsable={false}>
          <Animated.View style={[styles.bag, bagAnimStyle]}>
            <Animated.View pointerEvents="none" style={[styles.bagFlash, styles.bagFlashGood, goodFlashStyle]} />
            <Animated.View pointerEvents="none" style={[styles.bagFlash, styles.bagFlashBad, badFlashStyle]} />
            <View style={styles.bagStrap} />
            <View style={[styles.bagBody, {
            backgroundColor: HAZARD.color + '22'
          }]}>
              <View style={[styles.bagFill, {
              height: `${percent}%`,
              backgroundColor: HAZARD.color + '55'
            }]} />
              <Text style={styles.bagEmoji}>🎒</Text>
            </View>
            <View style={[styles.bagBadge, {
            backgroundColor: HAZARD.color
          }]}>
              <Text style={styles.bagBadgeText}>{packedIds.length}/{correctItems.length}</Text>
            </View>
          </Animated.View>
        </View>
        <Text style={styles.bagHint}>Drag gear here!</Text>
      </View>

      {message && <Animated.View entering={answerFeedbackEntering} style={[styles.messageBox, message.good ? styles.messageGood : styles.messageBad]}>
          <Text style={styles.messageTitle}>{message.title}</Text>
          <Text style={styles.messageText}>{message.text}</Text>
        </Animated.View>}

      <ScrollView contentContainerStyle={styles.shelf}>
        {KIT_ITEMS.map((item, index) => <ItemChip key={item.id} item={item} index={index} packed={packedIds.includes(item.id)} onDrop={handleDrop} onGrab={handleGrab} />)}
      </ScrollView>
    </GestureHandlerRootView>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5'
  },
  safeFill: {
    flex: 1
  },
  centerScreen: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28
  },
  floatingBit: {
    position: 'absolute',
    top: 0
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
    marginBottom: 16
  },
  introText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14
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
    marginBottom: 12
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
  header: {
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
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
  timer: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff'
  },
  timerLow: {
    color: '#FECACA'
  },
  bagZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18
  },
  bagAura: {
    position: 'absolute'
  },
  bag: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 28,
    borderWidth: 4,
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  bagFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28
  },
  bagFlashGood: {
    backgroundColor: '#34D399'
  },
  bagFlashBad: {
    backgroundColor: '#EF4444'
  },
  bagStrap: {
    position: 'absolute',
    top: -10,
    width: 60,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    zIndex: -1
  },
  bagBody: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  bagFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  bagEmoji: {
    fontSize: 64
  },
  bagBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  bagBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13
  },
  bagHint: {
    marginTop: 16,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  burstWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30
  },
  burstBit: {
    position: 'absolute',
    fontSize: 20
  },
  messageBox: {
    marginHorizontal: 16,
    marginBottom: 6,
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
  shelf: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32
  },
  chipWrap: {
    width: '31%',
    marginBottom: 14
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  chipTwinkle: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 13
  },
  chipIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  chipEmoji: {
    fontSize: 28
  },
  chipName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center'
  }
});
