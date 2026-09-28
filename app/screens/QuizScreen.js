import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/Text';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import Celebration from '../components/Celebration';
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay';
import useBadgeUnlock from '../hooks/useBadgeUnlock';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';
const TOPICS = ['earthquake', 'flood', 'wildfire', 'severe_weather', 'general_prep'];
const NAVY = AGE_PALETTES.adult.navy;
const DIFFICULTY_LABELS = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard'
};
const DIFFICULTY_COLORS = {
  1: SEMANTIC.success,
  2: AGE_PALETTES.adult.amber,
  3: SEMANTIC.critical
};
const ENGINES = [{
  key: 'bkt',
  label: 'Flashcard',
  blurb: 'Tracks a probabilistic P(mastery) per skill using Bayesian Knowledge Tracing, and picks question difficulty from it.'
}, {
  key: 'legacy',
  label: 'Baseline',
  blurb: 'The original heuristic: a rolling accuracy over your last 5 answers, thresholded to step difficulty up or down.'
}];
function topicLabel(topic) {
  return topic.replace(/_/g, ' ');
}
function metricColor(pct) {
  if (pct === null) return NAVY;
  if (pct < 40) return SEMANTIC.critical;
  if (pct < 75) return AGE_PALETTES.adult.amber;
  return SEMANTIC.success;
}
export default function QuizScreen() {
  const {
    userId
  } = useUser();
  const {
    theme
  } = useTheme();
  const {
    settings: a11y
  } = useAccessibility();
  const [engineMode, setEngineMode] = useState('bkt');
  const [topic, setTopic] = useState(null);
  const [question, setQuestion] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [seenIds, setSeenIds] = useState([]);
  const [knowledge, setKnowledge] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [justMastered, setJustMastered] = useState(false);
  const [totalPoints, setTotalPoints] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState('adult');
  const [gamBadges, setGamBadges] = useState(null);
  const {
    unlockedBadge,
    dismissBadgeUnlock
  } = useBadgeUnlock(gamBadges);
  const accent = AGE_PALETTES[mode]?.primary || NAVY;
  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest(`/onboarding/profile?userId=${userId}`, 'GET').then(profile => {
      if (active) setMode(profile.experienceMode || 'adult');
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]));
  const switchEngine = key => {
    if (key === engineMode) return;
    setEngineMode(key);
    setTopic(null);
    setQuestion(null);
    setKnowledge(null);
    setLastResult(null);
    setJustMastered(false);
    setRevealed(false);
    setSeenIds([]);
  };
  const readMetric = payload => {
    if (engineMode === 'bkt') {
      return {
        label: 'P(Mastery)',
        pct: payload.pMastery != null ? Math.round(payload.pMastery * 100) : null
      };
    }
    return {
      label: 'Rolling Accuracy',
      pct: payload.accuracy != null ? Math.round(payload.accuracy * 100) : null
    };
  };
  const fetchQuestion = async selectedTopic => {
    const isNewTopic = selectedTopic !== topic;
    const effectiveSeenIds = isNewTopic ? [] : seenIds;
    setTopic(selectedTopic);
    setLastResult(null);
    setJustMastered(false);
    setRevealed(false);
    try {
      const seenParam = effectiveSeenIds.length > 0 ? `&seen=${effectiveSeenIds.join(',')}` : '';
      const result = await apiRequest(`/quiz/next-question?userId=${userId}&topic=${selectedTopic}&engine=${engineMode}${seenParam}`, 'GET');
      if (result.message) {
        setQuestion(null);
        Alert.alert('No more questions', result.message);
      } else {
        setQuestion(result);
        setSeenIds([...effectiveSeenIds, result.questionId]);
        setKnowledge({
          ...readMetric(result),
          difficulty: result.difficulty,
          mastered: result.mastered
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };
  const submitAnswer = async wasCorrect => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const wasMasteredBefore = knowledge?.mastered || false;
    try {
      const result = await apiRequest('/quiz/answer', 'POST', {
        userId,
        topic,
        wasCorrect,
        engine: engineMode
      });
      setLastResult(result);
      setKnowledge({
        ...readMetric(result),
        difficulty: result.newDifficulty,
        mastered: result.mastered
      });
      setJustMastered(!wasMasteredBefore && result.mastered);
      if (result.gamification) {
        setTotalPoints(result.gamification.points);
        setGamBadges(result.gamification.badges || []);
      }
      setQuestion(null);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const activeEngine = ENGINES.find(e => e.key === engineMode);
  return <View style={{
    flex: 1,
    backgroundColor: theme.bg
  }}>
      {justMastered && <Celebration colors={[NAVY, SEMANTIC.success, AGE_PALETTES.adult.amber]} />}
      <BadgeUnlockOverlay badgeId={unlockedBadge} accent={accent} onDismiss={dismissBadgeUnlock} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, {
        color: theme.text
      }]}>Flashcards</Text>

        {}
        <View style={styles.engineRow}>
          {ENGINES.map(e => {
          const active = engineMode === e.key;
          return <TouchableOpacity key={e.key} style={[styles.engineButton, {
            borderColor: theme.border
          }, active && {
            backgroundColor: NAVY,
            borderColor: NAVY
          }, touchTargetStyle(a11y, 44)]} onPress={() => switchEngine(e.key)} accessibilityRole="button" accessibilityLabel={`Use ${e.label} engine`} accessibilityState={{
            selected: active
          }} {...touchTargetProps(a11y)}>
                <Text style={[styles.engineButtonText, {
              color: active ? '#fff' : theme.text
            }]}>{e.label}</Text>
              </TouchableOpacity>;
        })}
        </View>
        <Text style={[styles.engineBlurb, {
        color: theme.textSub
      }]}>{activeEngine.blurb}</Text>

        <View style={styles.topicRow}>
          {TOPICS.map(t => <TouchableOpacity key={t} style={[styles.topicButton, {
          backgroundColor: theme.card,
          borderColor: theme.border
        }, topic === t && {
          borderColor: NAVY
        }, touchTargetStyle(a11y, 44)]} onPress={() => fetchQuestion(t)} accessibilityRole="button" accessibilityLabel={`${topicLabel(t)} quiz topic`} accessibilityState={{
          selected: topic === t
        }} {...touchTargetProps(a11y)}>
              <Text style={[styles.topicButtonText, {
            color: theme.text
          }]}>{topicLabel(t)}</Text>
            </TouchableOpacity>)}
        </View>

        {}
        {knowledge && <Animated.View entering={FadeInDown.duration(280)} style={[styles.knowledgeCard, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <View style={styles.knowledgeHeaderRow}>
              <Text style={[styles.knowledgeLabel, {
            color: theme.textSub
          }]}>{knowledge.label} - {topicLabel(topic)}</Text>
              {knowledge.pct !== null && <CountUpNumber value={knowledge.pct} suffix="%" style={[styles.knowledgePct, {
            color: metricColor(knowledge.pct)
          }]} />}
            </View>
            {knowledge.pct !== null ? <AnimatedProgressBar progress={knowledge.pct} trackColor={theme.border} fillColor={metricColor(knowledge.pct)} height={12} /> : <Text style={[styles.knowledgeNoData, {
          color: theme.textSub
        }]}>No answers yet - answer a question to start tracking.</Text>}
            <View style={styles.knowledgeFooterRow}>
              <View style={[styles.difficultyPill, {
            backgroundColor: DIFFICULTY_COLORS[knowledge.difficulty] + '22',
            borderColor: DIFFICULTY_COLORS[knowledge.difficulty]
          }]}>
                <Text style={[styles.difficultyPillText, {
              color: DIFFICULTY_COLORS[knowledge.difficulty]
            }]}>
                  {DIFFICULTY_LABELS[knowledge.difficulty] || knowledge.difficulty}
                </Text>
              </View>
              {knowledge.mastered && <Animated.View entering={ZoomIn.duration(160).springify().damping(20)} style={styles.masteredPill}>
                  <Text style={styles.masteredPillText}>✅ MASTERED</Text>
                </Animated.View>}
            </View>
          </Animated.View>}

        {question && <Animated.View entering={FadeInDown.duration(320)} style={[styles.questionBox, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <Text style={[styles.questionText, {
          color: theme.text
        }]}>{question.text}</Text>

            {!revealed && <TouchableOpacity style={[styles.revealButton, touchTargetStyle(a11y, 44)]} onPress={() => setRevealed(true)} accessibilityRole="button" accessibilityLabel="Reveal answer" {...touchTargetProps(a11y)}>
                <Text style={styles.buttonText}>Reveal Answer</Text>
              </TouchableOpacity>}

            {revealed && <Animated.View entering={FadeInDown.duration(240)}>
                <View style={[styles.answerBox, {
            backgroundColor: theme.bg,
            borderColor: theme.border
          }]}>
                  <Text style={[styles.answerLabel, {
              color: theme.textSub
            }]}>Correct answer</Text>
                  <Text style={[styles.answerText, {
              color: theme.text
            }]}>{question.correctAnswer}</Text>
                  {question.explanation && <Text style={[styles.explanationText, {
              color: theme.textSub
            }]}>{question.explanation}</Text>}
                </View>

                <Text style={[styles.hint, {
            color: theme.textSub
          }]}>Be honest - this is what teaches the app your real level.</Text>
                <View style={styles.answerRow}>
                  <TouchableOpacity style={[styles.correctButton, touchTargetStyle(a11y, 44), isSubmitting && styles.buttonDisabled]} onPress={() => submitAnswer(true)} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="I got it right" accessibilityState={{
              disabled: isSubmitting
            }} {...touchTargetProps(a11y)}>
                    <Text style={styles.buttonText}>I got it right</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.wrongButton, touchTargetStyle(a11y, 44), isSubmitting && styles.buttonDisabled]} onPress={() => submitAnswer(false)} disabled={isSubmitting} accessibilityRole="button" accessibilityLabel="I got it wrong" accessibilityState={{
              disabled: isSubmitting
            }} {...touchTargetProps(a11y)}>
                    <Text style={styles.buttonText}>I got it wrong</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>}
          </Animated.View>}

        {lastResult && <Animated.View entering={FadeInDown.duration(320)} style={[styles.resultBox, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <Text style={[styles.resultText, {
          color: theme.text
        }]}>
              Next difficulty: {DIFFICULTY_LABELS[lastResult.newDifficulty] || lastResult.newDifficulty}
            </Text>
            {totalPoints !== null && <View style={{
          flexDirection: 'row'
        }}>
                <Text style={[styles.resultText, {
            color: theme.text
          }]}>Total points: </Text>
                <CountUpNumber value={totalPoints} style={[styles.resultText, {
            color: theme.text,
            fontWeight: 'bold'
          }]} />
              </View>}
            <TouchableOpacity style={[styles.button, touchTargetStyle(a11y, 44)]} onPress={() => fetchQuestion(topic)} accessibilityRole="button" accessibilityLabel="Next question" {...touchTargetProps(a11y)}>
              <Text style={styles.buttonText}>Next Question</Text>
            </TouchableOpacity>
          </Animated.View>}
      </ScrollView>
    </View>;
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: SPACING.xl,
    paddingBottom: SPACING.huge
  },
  title: {
    fontSize: TYPE.display.fontSize - 4,
    fontWeight: 'bold',
    marginBottom: SPACING.lg
  },
  engineRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm
  },
  engineButton: {
    flex: 1,
    padding: SPACING.md - 2,
    borderRadius: RADII.adult.button - 4,
    borderWidth: 1,
    marginRight: SPACING.sm,
    alignItems: 'center'
  },
  engineButtonText: {
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize + 1
  },
  engineBlurb: {
    fontSize: TYPE.caption.fontSize,
    lineHeight: 17,
    marginBottom: SPACING.xl
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg
  },
  topicButton: {
    padding: SPACING.md,
    borderRadius: RADII.adult.button - 4,
    borderWidth: 1,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm
  },
  topicButtonText: {
    fontWeight: 'bold'
  },
  knowledgeCard: {
    padding: SPACING.lg,
    borderRadius: RADII.adult.button - 4,
    borderWidth: 1,
    marginBottom: SPACING.lg
  },
  knowledgeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  knowledgeLabel: {
    fontSize: TYPE.caption.fontSize + 1,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  knowledgePct: {
    fontSize: TYPE.title.fontSize - 2,
    fontWeight: 'bold'
  },
  knowledgeNoData: {
    fontSize: TYPE.caption.fontSize,
    fontStyle: 'italic'
  },
  knowledgeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    justifyContent: 'space-between'
  },
  difficultyPill: {
    borderRadius: RADII.adult.chip + 8,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md
  },
  difficultyPillText: {
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize
  },
  masteredPill: {
    backgroundColor: SEMANTIC.success,
    borderRadius: RADII.adult.chip + 8,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md
  },
  masteredPillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize
  },
  questionBox: {
    padding: SPACING.lg,
    borderRadius: RADII.adult.button - 4,
    borderWidth: 1,
    marginBottom: SPACING.lg
  },
  questionText: {
    fontSize: TYPE.body.fontSize + 1,
    marginBottom: SPACING.md
  },
  revealButton: {
    backgroundColor: NAVY,
    padding: SPACING.md,
    borderRadius: RADII.adult.button - 4,
    alignItems: 'center'
  },
  answerBox: {
    padding: SPACING.md + 2,
    borderRadius: RADII.adult.button - 6,
    borderWidth: 1,
    marginBottom: SPACING.md
  },
  answerLabel: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs
  },
  answerText: {
    fontSize: TYPE.body.fontSize + 1,
    fontWeight: 'bold',
    marginBottom: SPACING.xs
  },
  explanationText: {
    fontSize: TYPE.body.fontSize - 1,
    lineHeight: 20
  },
  hint: {
    fontSize: TYPE.caption.fontSize,
    marginBottom: SPACING.sm,
    fontStyle: 'italic'
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  correctButton: {
    backgroundColor: SEMANTIC.success,
    padding: SPACING.md,
    borderRadius: RADII.adult.button - 4,
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: 'center'
  },
  wrongButton: {
    backgroundColor: SEMANTIC.critical,
    padding: SPACING.md,
    borderRadius: RADII.adult.button - 4,
    flex: 1,
    marginLeft: SPACING.sm,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  resultBox: {
    padding: SPACING.lg,
    borderRadius: RADII.adult.button - 4,
    borderWidth: 1
  },
  resultText: {
    fontSize: TYPE.body.fontSize + 1,
    marginBottom: SPACING.xs
  },
  button: {
    backgroundColor: NAVY,
    padding: SPACING.md + 2,
    borderRadius: RADII.adult.button - 4,
    alignItems: 'center',
    marginTop: SPACING.md
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize + 1
  }
});
