import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

const packSound = require('../assets/sounds/pack.wav');
const wrongSound = require('../assets/sounds/wrong.wav');
const winSound = require('../assets/sounds/win.wav');

const STORY = [
  {
    scene: '🌧️',
    text: "It's raining hard in Max and Mia's town. The river near their house is getting higher and higher. Mom says a flood might be coming!",
    question: 'What should Max and Mia do first?',
    choices: [
      { text: 'Go outside to watch the river', correct: false, why: 'The river is dangerous when it floods. Stay inside where it is safe!' },
      { text: 'Tell a grown-up and stay calm', correct: true, why: 'Yes! Always tell a trusted adult and stay calm.' },
      { text: 'Hide and tell no one', correct: false, why: 'Never hide! Grown-ups need to know so they can keep you safe.' }
    ]
  },
  {
    scene: '🎒',
    text: 'Mom says, "Let\'s pack our emergency bag!" Mia opens the closet and sees lots of things.',
    question: 'What should go in the emergency bag?',
    choices: [
      { text: 'Water, snacks and a flashlight', correct: true, why: 'Perfect! Water, food and light are the most important things.' },
      { text: 'A big TV and video games', correct: false, why: 'Those are too heavy and won\'t keep you safe. Leave them!' },
      { text: 'Only candy', correct: false, why: 'Candy isn\'t enough — you need water and real food to stay strong.' }
    ]
  },
  {
    scene: '💡',
    text: 'Suddenly, the lights go out! The whole house is dark. Max feels a little scared.',
    question: 'What should Max use to see?',
    choices: [
      { text: 'Light lots of candles everywhere', correct: false, why: 'Candles can start fires. A flashlight is much safer!' },
      { text: 'The flashlight from the bag', correct: true, why: 'Great choice! A flashlight is the safest way to see in the dark.' },
      { text: 'Walk around in the dark', correct: false, why: 'Walking in the dark is risky — you could trip. Use your flashlight!' }
    ]
  },
  {
    scene: '🏠',
    text: 'The water is rising outside. On the radio, a rescuer says: "Everyone move to higher ground!"',
    question: 'Where should the family go?',
    choices: [
      { text: 'Down to the basement', correct: false, why: 'No! Water fills basements first. Always go UP, not down.' },
      { text: 'Upstairs to a high, safe room', correct: true, why: 'Exactly! Higher ground keeps you above the flood water.' },
      { text: 'Outside into the water', correct: false, why: 'Never walk into flood water — it\'s deeper and faster than it looks!' }
    ]
  },
  {
    scene: '🚁',
    text: 'The rescue team arrives to help! Max and Mia stayed calm, packed their bag, used their flashlight, and moved to safety.',
    question: 'Max and Mia are safe! What made them heroes?',
    choices: [
      { text: 'They were prepared and made safe choices', correct: true, why: 'YES! Being prepared and making safe choices makes you a real hero!' },
      { text: 'They got lucky', correct: false, why: 'It wasn\'t luck — it was being ready! You can be ready too.' },
      { text: 'They panicked', correct: false, why: 'Staying calm is what helped them. Calm heroes make safe choices!' }
    ]
  }
];

export default function StoryScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const packPlayer = useAudioPlayer(packSound);
  const wrongPlayer = useAudioPlayer(wrongSound);
  const winPlayer = useAudioPlayer(winSound);

  const scene = STORY[step];

  const choose = async (choice) => {
    if (feedback) return;

    if (choice.correct) {
      packPlayer.seekTo(0);
      packPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedback({ good: true, text: choice.why });
    } else {
      wrongPlayer.seekTo(0);
      wrongPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback({ good: false, text: choice.why });
    }
  };

  const next = async () => {
    setFeedback(null);
    if (step < STORY.length - 1) {
      setStep(step + 1);
    } else {
      winPlayer.seekTo(0);
      winPlayer.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinished(true);
      try {
        await apiRequest('/gamification/story-complete', 'POST', { userId, storyId: 'flood_max_mia' });
      } catch (err) {
        console.log('Story completion error:', err.message);
      }
    }
  };

  if (finished) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Celebration colors={['#6D5BD0', '#FBBF24', '#34D399', '#38BDF8']} />
        <View style={styles.bigEmojiRow}>
          <Text style={styles.bigEmojiStar}>🌟</Text>
          <BouncyMascot size={56} />
          <Text style={styles.bigEmojiStar}>🌟</Text>
        </View>
        <Text style={styles.title}>Story Complete!</Text>
        <Text style={styles.introText}>
          You helped Max & Mia stay safe from the flood!{'\n\n'}
          You earned +30 XP! 🎉{'\n\n'}
          Remember: stay calm, pack your bag, use a flashlight, and always move to higher ground.{'\n\n'}
          Prepare today, protect tomorrow!
        </Text>
        <BouncyPress
          style={styles.button}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back home"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.buttonText}>Back Home</Text>
        </BouncyPress>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.progressRow}>
        {STORY.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      <Animated.View key={`scene-${step}`} entering={ZoomIn.springify().damping(14).duration(420)} style={styles.sceneCard}>
        <Text style={styles.sceneEmoji}>{scene.scene}</Text>
        <Text style={styles.sceneText}>{scene.text}</Text>
      </Animated.View>

      <Text style={styles.question}>{scene.question}</Text>

      {!feedback && scene.choices.map((choice, i) => (
        <Animated.View key={`${step}-${i}`} entering={FadeInDown.delay(i * 90).duration(320).springify().damping(14)}>
          <BouncyPress
            style={styles.choice}
            onPress={() => choose(choice)}
            accessibilityRole="button"
            accessibilityLabel={choice.text}
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.choiceText}>{choice.text}</Text>
          </BouncyPress>
        </Animated.View>
      ))}

      {feedback && (
        <Animated.View entering={FadeInDown.springify().damping(14).duration(360)} style={[styles.feedback, feedback.good ? styles.feedbackGood : styles.feedbackBad]}>
          <Text style={styles.feedbackEmoji}>{feedback.good ? '✅' : '💡'}</Text>
          <Text style={styles.feedbackText}>{feedback.text}</Text>
          <BouncyPress
            style={styles.nextButton}
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel={feedback.good ? (step < STORY.length - 1 ? 'Next' : 'Finish') : 'Try to remember, continue'}
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.nextButtonText}>
              {feedback.good ? (step < STORY.length - 1 ? 'Next ▶' : 'Finish 🎉') : 'Try to remember ▶'}
            </Text>
          </BouncyPress>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F0FB' },
  container: { padding: 20, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 28 },
  bigEmojiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bigEmojiStar: { fontSize: 44, marginHorizontal: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4C1D95', textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  button: { backgroundColor: '#6D5BD0', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  progressRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  progressDot: { width: 28, height: 6, borderRadius: 3, backgroundColor: '#DDD6FE', marginHorizontal: 3 },
  progressDotActive: { backgroundColor: '#6D5BD0' },

  sceneCard: { backgroundColor: '#6D5BD0', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  sceneEmoji: { fontSize: 60, marginBottom: 12 },
  sceneText: { fontSize: 16, color: '#fff', textAlign: 'center', lineHeight: 24 },

  question: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16, textAlign: 'center' },

  choice: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: '#E9E4F8',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  choiceText: { fontSize: 15, fontWeight: 'bold', color: '#4C1D95', textAlign: 'center' },

  feedback: { borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 8 },
  feedbackGood: { backgroundColor: '#D9F7EC', borderWidth: 2, borderColor: '#34D399' },
  feedbackBad: { backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#F59E0B' },
  feedbackEmoji: { fontSize: 40, marginBottom: 8 },
  feedbackText: { fontSize: 15, color: '#1E293B', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  nextButton: { backgroundColor: '#6D5BD0', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});