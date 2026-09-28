import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { DISPATCH_ROUNDS } from '../constants/dispatchHero';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';
import HearButton from '../components/HearButton';
import useKidSpeech from '../hooks/useKidSpeech';
const CALM_CYCLE_MS = 1700;
const CALM_TARGET = 3;
const CARD_COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#DCFCE7'];
const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');
const tickSound = require('../assets/sounds/tick.wav');
function pickRound() {
  return DISPATCH_ROUNDS[Math.floor(Math.random() * DISPATCH_ROUNDS.length)];
}
function computeStars(mistakes) {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}
function PictureChoice({
  emoji,
  label,
  color,
  onPress,
  result,
  disabled
}) {
  return <View style={styles.choiceWrap}>
      <BouncyPress style={[styles.choiceCard, {
      backgroundColor: color
    }, result === 'correct' && styles.choiceCorrect, result === 'wrong' && styles.choiceWrong]} onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
        <Text style={styles.choiceEmoji}>{emoji}</Text>
        <Text style={styles.choiceLabel} numberOfLines={1}>{label}</Text>
        {result === 'correct' && <Text style={styles.choiceCheck}>✅</Text>}
      </BouncyPress>
    </View>;
}
export default function DispatchHeroScreen({
  navigation
}) {
  const {
    userId
  } = useUser();
  const {
    settings: a11y
  } = useAccessibility();
  const {
    speak
  } = useKidSpeech();
  const [phase, setPhase] = useState('intro');
  const [round, setRound] = useState(pickRound);
  const [mistakes, setMistakes] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [calmProgress, setCalmProgress] = useState(0);
  const [pickedId, setPickedId] = useState(null);
  const [pickedResult, setPickedResult] = useState(null);
  const breathT = useSharedValue(0);
  const ringPulse = useSharedValue(0);
  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);
  const tickPlayer = useAudioPlayer(tickSound);
  const correctCall = round.calls.reduce((a, b) => b.urgency > a.urgency ? b : a);
  useEffect(() => {
    if (phase === 'intro') speak("Someone needs help! Let's call for help together.");
    if (phase === 'spot') speak("What's the real emergency? Tap the one that needs help right now!");
    if (phase === 'calling') speak('Tap the phone to call for help!');
    if (phase === 'calm') speak('Take a breath. Then tell me calmly.');
    if (phase === 'who') speak("Dispatcher says: what's your name?");
    if (phase === 'what') speak('Dispatcher says: what happened?');
    if (phase === 'where') speak('Dispatcher says: where are you?');
    if (phase === 'won') speak('Great job! Help is on the way!');
  }, [phase]);
  useEffect(() => {
    if (phase !== 'calm') return;
    setBreathPhase('inhale');
    if (!a11y.reducedMotion) {
      breathT.value = withRepeat(withSequence(withTiming(1, {
        duration: CALM_CYCLE_MS,
        easing: Easing.inOut(Easing.sin)
      }), withTiming(0, {
        duration: CALM_CYCLE_MS,
        easing: Easing.inOut(Easing.sin)
      })), -1, false);
    }
    const toggle = setInterval(() => setBreathPhase(p => p === 'inhale' ? 'exhale' : 'inhale'), CALM_CYCLE_MS);
    return () => clearInterval(toggle);
  }, [phase, a11y.reducedMotion]);
  const startMission = () => {
    setRound(pickRound());
    setMistakes(0);
    setCalmProgress(0);
    setPickedId(null);
    setPickedResult(null);
    setPhase('spot');
  };
  const finishMission = async () => {
    winPlayer.seekTo(0);
    winPlayer.play();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const stars = computeStars(mistakes);
    setFinalStars(stars);
    setPhase('won');
    try {
      await apiRequest('/gamification/minigame-complete', 'POST', {
        userId,
        gameId: 'dispatch_hero',
        xp: 25 + stars * 5
      });
    } catch (err) {
      console.log('Dispatch Hero completion error:', err.message);
    }
  };
  const clearPick = () => {
    setPickedId(null);
    setPickedResult(null);
  };
  const handleSpot = call => {
    speak(call.speak);
    setPickedId(call.id);
    if (call.id === correctCall.id) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPickedResult('correct');
      setTimeout(() => {
        clearPick();
        setPhase('calling');
      }, 650);
    } else {
      wrongPlayer.seekTo(0);
      wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes(m => m + 1);
      setPickedResult('wrong');
      setTimeout(clearPick, 500);
    }
  };
  const handleCall = () => {
    tickPlayer.seekTo(0);
    tickPlayer.play();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('calm');
  };
  const handleSpeakTap = () => {
    if (breathPhase === 'exhale') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      packPlayer.seekTo(0);
      packPlayer.play();
      setCalmProgress(p => {
        const next = p + 1;
        if (next >= CALM_TARGET) setTimeout(() => setPhase('who'), 500);
        return next;
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      ringPulse.value = withSequence(withTiming(1, {
        duration: 80
      }), withTiming(0, {
        duration: 220
      }));
    }
  };
  const handleChoice = (option, nextPhase) => {
    speak(option.speak);
    setPickedId(option.id);
    if (option.correct) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPickedResult('correct');
      setTimeout(() => {
        clearPick();
        if (nextPhase) setPhase(nextPhase);else finishMission();
      }, 650);
    } else {
      wrongPlayer.seekTo(0);
      wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMistakes(m => m + 1);
      setPickedResult('wrong');
      setTimeout(clearPick, 500);
    }
  };
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: 0.75 + breathT.value * 0.5
    }],
    backgroundColor: breathPhase === 'exhale' ? '#34D399' : '#60A5FA'
  }));
  const ringFlashStyle = useAnimatedStyle(() => ({
    opacity: ringPulse.value * 0.6
  }));
  if (phase === 'intro') {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <BouncyMascot size={64} emoji="🦊📞" />
        <Text style={styles.title}>Emergency Call</Text>
        <View style={styles.introIconsRow}>
          <Text style={styles.introIcon}>🔎</Text>
          <Text style={styles.introIcon}>📞</Text>
          <Text style={styles.introIcon}>🌬️</Text>
          <Text style={styles.introIcon}>🗣️</Text>
        </View>
        <Text style={styles.introText}>Find the emergency. Call for help. Breathe calm. Speak clear!</Text>
        <HearButton onPress={() => speak("Someone needs help! First, find the emergency. Then call for help, breathe calm, and speak clearly.")} label="Hear the instructions again" />
        <BouncyPress style={styles.startButton} onPress={startMission} accessibilityRole="button" accessibilityLabel="Start the call">
          <Text style={styles.startButtonText}>▶ Start</Text>
        </BouncyPress>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </ScrollView>;
  }
  if (phase === 'won') {
    return <View style={[styles.screen, styles.center]}>
        <Celebration colors={['#6D5BD0', '#FBBF24', '#34D399', '#F472B6']} />
        <BouncyMascot size={64} emoji="🦊🎉" />
        <Text style={styles.title}>Help Is On The Way!</Text>
        <Text style={styles.stars}>{'⭐'.repeat(finalStars)}{'☆'.repeat(3 - finalStars)}</Text>
        <Text style={styles.introText}>You called for help and stayed calm!</Text>
        <BouncyPress style={styles.startButton} onPress={startMission} accessibilityRole="button" accessibilityLabel="Play again">
          <Text style={styles.startButtonText}>🔁 Play Again</Text>
        </BouncyPress>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </View>;
  }
  if (phase === 'spot') {
    return <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <BouncyMascot size={48} />
        <View style={styles.stepTitleRow}>
          <Text style={styles.stepTitle}>Who needs help right now?</Text>
          <HearButton onPress={() => speak("What's the real emergency? Tap the one that needs help right now!")} />
        </View>
        <View style={styles.grid}>
          {round.calls.map((call, i) => <PictureChoice key={call.id} emoji={call.emoji} label={call.label} color={CARD_COLORS[i % CARD_COLORS.length]} onPress={() => handleSpot(call)} disabled={pickedId !== null} result={pickedId === call.id ? pickedResult : null} />)}
        </View>
      </ScrollView>;
  }
  if (phase === 'calling') {
    return <View style={[styles.screen, styles.center]}>
        <Text style={styles.stepTitle}>Call for help!</Text>
        <HearButton onPress={() => speak('Tap the phone to call for help!')} />
        <BouncyPress style={styles.phoneButton} onPress={handleCall} accessibilityRole="button" accessibilityLabel="Call for help">
          <Text style={styles.phoneEmoji}>📞</Text>
        </BouncyPress>
      </View>;
  }
  if (phase === 'calm') {
    return <View style={[styles.screen, styles.center]}>
        <Text style={styles.stepTitle}>Breathe, then speak</Text>
        <Text style={styles.stepSub}>{calmProgress}/{CALM_TARGET} ✅</Text>
        <View style={styles.breathWrap}>
          <Animated.View pointerEvents="none" style={[styles.breathFlash, ringFlashStyle]} />
          <Animated.View style={[styles.breathRing, ringStyle]} />
          <BouncyPress style={styles.speakButton} onPress={handleSpeakTap} accessibilityRole="button" accessibilityLabel="Speak">
            <Text style={styles.speakButtonEmoji}>{breathPhase === 'exhale' ? '🗣️' : '🌬️'}</Text>
            <Text style={styles.speakButtonText}>{breathPhase === 'exhale' ? 'Speak Now!' : 'Breathe In...'}</Text>
          </BouncyPress>
        </View>
      </View>;
  }
  const CHOICE_PHASES = {
    who: {
      title: 'What do you say?',
      speakPrompt: "Dispatcher says: what's your name?",
      options: round.who,
      next: 'what'
    },
    what: {
      title: "What's wrong?",
      speakPrompt: 'Dispatcher says: what happened?',
      options: round.what,
      next: 'where'
    },
    where: {
      title: 'Where are you?',
      speakPrompt: 'Dispatcher says: where are you?',
      options: round.where,
      next: null
    }
  };
  if (CHOICE_PHASES[phase]) {
    const {
      title,
      speakPrompt,
      options,
      next
    } = CHOICE_PHASES[phase];
    return <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <BouncyMascot size={48} emoji="🦊📞" />
        <View style={styles.stepTitleRow}>
          <Text style={styles.stepTitle}>{title}</Text>
          <HearButton onPress={() => speak(speakPrompt)} />
        </View>
        <View style={styles.grid}>
          {options.map((opt, i) => <PictureChoice key={opt.id} emoji={opt.emoji} label={opt.label} color={CARD_COLORS[i % CARD_COLORS.length]} onPress={() => handleChoice(opt, next)} disabled={pickedId !== null} result={pickedId === opt.id ? pickedResult : null} />)}
        </View>
      </ScrollView>;
  }
  return null;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5'
  },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 20
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10
  },
  introIconsRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  introIcon: {
    fontSize: 34,
    marginHorizontal: 6
  },
  introText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: '600'
  },
  stars: {
    fontSize: 40,
    marginBottom: 12
  },
  startButton: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 44,
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: '#6D5BD0'
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
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16
  },
  stepTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginRight: 8
  },
  stepSub: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
    marginBottom: 18
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%'
  },
  choiceWrap: {
    width: '44%',
    margin: '3%'
  },
  choiceCard: {
    aspectRatio: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 10
  },
  choiceCorrect: {
    borderColor: '#34D399'
  },
  choiceWrong: {
    borderColor: '#EF4444'
  },
  choiceEmoji: {
    fontSize: 44,
    marginBottom: 8
  },
  choiceLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center'
  },
  choiceCheck: {
    position: 'absolute',
    top: 6,
    right: 10,
    fontSize: 24
  },
  phoneButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  phoneEmoji: {
    fontSize: 60
  },
  breathWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  breathFlash: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EF4444'
  },
  breathRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.35
  },
  speakButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 10
  },
  speakButtonEmoji: {
    fontSize: 36,
    marginBottom: 4
  },
  speakButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center'
  }
});
