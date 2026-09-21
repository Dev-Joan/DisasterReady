import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import Celebration from '../components/Celebration';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

const TOPICS = ['earthquake', 'flood'];
const NAVY = AGE_PALETTES.adult.navy;

const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const DIFFICULTY_COLORS = { 1: SEMANTIC.success, 2: AGE_PALETTES.adult.amber, 3: SEMANTIC.critical };

const ENGINES = [
  { key: 'bkt', label: '🧠 BKT (Adaptive)', blurb: 'Tracks a probabilistic P(mastery) per skill using Bayesian Knowledge Tracing, and picks question difficulty from it.' },
  { key: 'legacy', label: '📊 Baseline (Legacy)', blurb: 'The original heuristic: a rolling accuracy over your last 5 answers, thresholded to step difficulty up or down.' }
];

function metricColor(pct) {
  if (pct === null) return NAVY;
  if (pct < 40) return SEMANTIC.critical;
  if (pct < 75) return AGE_PALETTES.adult.amber;
  return SEMANTIC.success;
}

export default function QuizScreen() {
  const { userId } = useUser();
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();
  const [engineMode, setEngineMode] = useState('bkt');
  const [topic, setTopic] = useState(null);
  const [question, setQuestion] = useState(null);
  // The single live "knowledge estimate" for the current topic — pMastery
  // under BKT, rolling accuracy under the legacy baseline. Kept in one
  // shape so the UI can render whichever metric the active engine produces
  // without branching all over the JSX.
  const [knowledge, setKnowledge] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [justMastered, setJustMastered] = useState(false);

  const switchEngine = (key) => {
    if (key === engineMode) return;
    setEngineMode(key);
    setTopic(null);
    setQuestion(null);
    setKnowledge(null);
    setLastResult(null);
    setJustMastered(false);
  };

  const readMetric = (payload) => {
    if (engineMode === 'bkt') {
      return { label: 'P(Mastery)', pct: payload.pMastery != null ? Math.round(payload.pMastery * 100) : null };
    }
    return { label: 'Rolling Accuracy', pct: payload.accuracy != null ? Math.round(payload.accuracy * 100) : null };
  };

  const fetchQuestion = async (selectedTopic) => {
    setTopic(selectedTopic);
    setLastResult(null);
    setJustMastered(false);

    try {
      const result = await apiRequest(`/quiz/next-question?userId=${userId}&topic=${selectedTopic}&engine=${engineMode}`, 'GET');
      if (result.message) {
        setQuestion(null);
        Alert.alert('No more questions', result.message);
      } else {
        setQuestion(result);
        setKnowledge({ ...readMetric(result), difficulty: result.difficulty, mastered: result.mastered });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const submitAnswer = async (wasCorrect) => {
    const wasMasteredBefore = knowledge?.mastered || false;
    try {
      const result = await apiRequest('/quiz/answer', 'POST', {
        userId, topic, wasCorrect, engine: engineMode
      });
      setLastResult(result);
      setKnowledge({ ...readMetric(result), difficulty: result.newDifficulty, mastered: result.mastered });
      setJustMastered(!wasMasteredBefore && result.mastered);
      setQuestion(null);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const activeEngine = ENGINES.find((e) => e.key === engineMode);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {justMastered && <Celebration colors={[NAVY, SEMANTIC.success, AGE_PALETTES.adult.amber]} />}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Adaptive Quiz</Text>

        {/* Engine selector — lets an evaluator run the exact same quiz
            through either the BKT model or the original heuristic to
            compare their behaviour side by side. */}
        <View style={styles.engineRow}>
          {ENGINES.map((e) => {
            const active = engineMode === e.key;
            return (
              <TouchableOpacity
                key={e.key}
                style={[styles.engineButton, { borderColor: theme.border }, active && { backgroundColor: NAVY, borderColor: NAVY }, touchTargetStyle(a11y, 44)]}
                onPress={() => switchEngine(e.key)}
                accessibilityRole="button"
                accessibilityLabel={`Use ${e.label} engine`}
                accessibilityState={{ selected: active }}
                {...touchTargetProps(a11y)}
              >
                <Text style={[styles.engineButtonText, { color: active ? '#fff' : theme.text }]}>{e.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.engineBlurb, { color: theme.textSub }]}>{activeEngine.blurb}</Text>

        <View style={styles.topicRow}>
          {TOPICS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.topicButton, { backgroundColor: theme.card, borderColor: theme.border }, topic === t && { borderColor: NAVY }, touchTargetStyle(a11y, 44)]}
              onPress={() => fetchQuestion(t)}
              accessibilityRole="button"
              accessibilityLabel={`${t} quiz topic`}
              {...touchTargetProps(a11y)}
            >
              <Text style={[styles.topicButtonText, { color: theme.text }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* The live knowledge estimate — this is the "adaptive behaviour"
            made visible: the bar and number move after every answer, and
            the difficulty badge below it changes as mastery crosses each
            band. */}
        {knowledge && (
          <Animated.View entering={FadeInDown.duration(280)} style={[styles.knowledgeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.knowledgeHeaderRow}>
              <Text style={[styles.knowledgeLabel, { color: theme.textSub }]}>{knowledge.label} — {topic}</Text>
              {knowledge.pct !== null && (
                <CountUpNumber value={knowledge.pct} suffix="%" style={[styles.knowledgePct, { color: metricColor(knowledge.pct) }]} />
              )}
            </View>
            {knowledge.pct !== null ? (
              <AnimatedProgressBar progress={knowledge.pct} trackColor={theme.border} fillColor={metricColor(knowledge.pct)} height={12} />
            ) : (
              <Text style={[styles.knowledgeNoData, { color: theme.textSub }]}>No answers yet — answer a question to start tracking.</Text>
            )}
            <View style={styles.knowledgeFooterRow}>
              <View style={[styles.difficultyPill, { backgroundColor: DIFFICULTY_COLORS[knowledge.difficulty] + '22', borderColor: DIFFICULTY_COLORS[knowledge.difficulty] }]}>
                <Text style={[styles.difficultyPillText, { color: DIFFICULTY_COLORS[knowledge.difficulty] }]}>
                  {DIFFICULTY_LABELS[knowledge.difficulty] || knowledge.difficulty}
                </Text>
              </View>
              {knowledge.mastered && (
                <Animated.View entering={ZoomIn.springify().damping(9)} style={styles.masteredPill}>
                  <Text style={styles.masteredPillText}>✅ MASTERED</Text>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        )}

        {question && (
          <Animated.View entering={FadeInDown.duration(320)} style={[styles.questionBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.questionText, { color: theme.text }]}>{question.text}</Text>

            <Text style={[styles.hint, { color: theme.textSub }]}>(For this prototype, mark whether you got it right)</Text>
            <View style={styles.answerRow}>
              <TouchableOpacity style={[styles.correctButton, touchTargetStyle(a11y, 44)]} onPress={() => submitAnswer(true)} accessibilityRole="button" accessibilityLabel="I got it right" {...touchTargetProps(a11y)}>
                <Text style={styles.buttonText}>I got it right</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.wrongButton, touchTargetStyle(a11y, 44)]} onPress={() => submitAnswer(false)} accessibilityRole="button" accessibilityLabel="I got it wrong" {...touchTargetProps(a11y)}>
                <Text style={styles.buttonText}>I got it wrong</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {lastResult && (
          <Animated.View entering={FadeInDown.duration(320)} style={[styles.resultBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.resultText, { color: theme.text }]}>
              Next difficulty: {DIFFICULTY_LABELS[lastResult.newDifficulty] || lastResult.newDifficulty}
            </Text>
            {lastResult.gamification && (
              <Text style={[styles.resultText, { color: theme.text }]}>Total points: {lastResult.gamification.points}</Text>
            )}
            <TouchableOpacity style={[styles.button, touchTargetStyle(a11y, 44)]} onPress={() => fetchQuestion(topic)} accessibilityRole="button" accessibilityLabel="Next question" {...touchTargetProps(a11y)}>
              <Text style={styles.buttonText}>Next Question</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: SPACING.xl, paddingBottom: SPACING.huge },
  title: { fontSize: TYPE.display.fontSize - 4, fontWeight: 'bold', marginBottom: SPACING.lg },

  engineRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  engineButton: { flex: 1, padding: SPACING.md - 2, borderRadius: RADII.adult.button - 4, borderWidth: 1, marginRight: SPACING.sm, alignItems: 'center' },
  engineButtonText: { fontWeight: 'bold', fontSize: TYPE.caption.fontSize + 1 },
  engineBlurb: { fontSize: TYPE.caption.fontSize, lineHeight: 17, marginBottom: SPACING.xl },

  topicRow: { flexDirection: 'row', marginBottom: SPACING.lg },
  topicButton: { padding: SPACING.md, borderRadius: RADII.adult.button - 4, borderWidth: 1, marginRight: SPACING.md },
  topicButtonText: { fontWeight: 'bold' },

  knowledgeCard: { padding: SPACING.lg, borderRadius: RADII.adult.button - 4, borderWidth: 1, marginBottom: SPACING.lg },
  knowledgeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  knowledgeLabel: { fontSize: TYPE.caption.fontSize + 1, fontWeight: 'bold', textTransform: 'capitalize' },
  knowledgePct: { fontSize: TYPE.title.fontSize - 2, fontWeight: 'bold' },
  knowledgeNoData: { fontSize: TYPE.caption.fontSize, fontStyle: 'italic' },
  knowledgeFooterRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, justifyContent: 'space-between' },
  difficultyPill: { borderRadius: RADII.adult.chip + 8, borderWidth: 1, paddingVertical: 4, paddingHorizontal: SPACING.md },
  difficultyPillText: { fontWeight: 'bold', fontSize: TYPE.caption.fontSize },
  masteredPill: { backgroundColor: SEMANTIC.success, borderRadius: RADII.adult.chip + 8, paddingVertical: 4, paddingHorizontal: SPACING.md },
  masteredPillText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.caption.fontSize },

  questionBox: { padding: SPACING.lg, borderRadius: RADII.adult.button - 4, borderWidth: 1, marginBottom: SPACING.lg },
  questionText: { fontSize: TYPE.body.fontSize + 1, marginBottom: SPACING.sm },
  hint: { fontSize: TYPE.caption.fontSize, marginBottom: SPACING.sm },
  answerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  correctButton: { backgroundColor: SEMANTIC.success, padding: SPACING.md, borderRadius: RADII.adult.button - 4, flex: 1, marginRight: SPACING.sm, alignItems: 'center' },
  wrongButton: { backgroundColor: SEMANTIC.critical, padding: SPACING.md, borderRadius: RADII.adult.button - 4, flex: 1, marginLeft: SPACING.sm, alignItems: 'center' },
  resultBox: { padding: SPACING.lg, borderRadius: RADII.adult.button - 4, borderWidth: 1 },
  resultText: { fontSize: TYPE.body.fontSize + 1, marginBottom: SPACING.xs },
  button: { backgroundColor: NAVY, padding: SPACING.md + 2, borderRadius: RADII.adult.button - 4, alignItems: 'center', marginTop: SPACING.md },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize + 1 }
});
