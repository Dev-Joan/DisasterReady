import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import apiRequest from '../services/api';
import { KNOWLEDGE_CHECK_CHAPTERS, TOTAL_KNOWLEDGE_CHECK_QUESTIONS } from '../constants/knowledgeCheck';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import { SPACING, TYPE, TYPE_SENIOR, RADII, AGE_PALETTES } from '../constants/tokens';
import { SPRING_PRESS_OUT } from '../constants/motion';
const NAVY = AGE_PALETTES.adult.navy;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
function ChapterRow({
  chapter,
  index,
  state,
  isSenior,
  theme,
  a11y,
  onPress
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: scale.value
    }]
  }));
  const isDone = state === 'done';
  const isLocked = state === 'locked';
  return <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 45).duration(360)}>
      <AnimatedPressable disabled={isLocked} onPress={onPress} onPressIn={() => {
      if (!isLocked) scale.value = withTiming(0.97, {
        duration: 100
      });
    }} onPressOut={() => {
      scale.value = withSpring(1, SPRING_PRESS_OUT);
    }} accessibilityRole="button" accessibilityLabel={`${chapter.title}. ${isLocked ? 'Locked' : `${chapter.questions.length} questions`}`} style={[styles.row, {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderLeftColor: isLocked ? theme.border : chapter.color
    }, isLocked && styles.rowLocked, touchTargetStyle(a11y, 56), aStyle]} {...touchTargetProps(a11y)}>
        <View style={[styles.iconCircle, {
        backgroundColor: isLocked ? theme.border : chapter.color + '1A'
      }]}>
          <MaterialCommunityIcons name={isDone ? 'check-bold' : isLocked ? 'lock' : chapter.icon} size={isSenior ? 26 : 22} color={isLocked ? theme.textSub : chapter.color} />
        </View>
        <View style={{
        flex: 1
      }}>
          <Text style={[styles.rowTitle, {
          color: theme.text
        }, isSenior && styles.rowTitleSenior]}>{chapter.title}</Text>
          <Text style={[styles.rowMeta, {
          color: theme.textSub
        }, isSenior && styles.rowMetaSenior]}>
            {isLocked ? 'Complete the previous chapter to unlock' : `${chapter.questions.length} questions`}
          </Text>
        </View>
        {isDone && <MaterialCommunityIcons name="check-circle" size={isSenior ? 26 : 22} color="#059669" />}
      </AnimatedPressable>
    </Animated.View>;
}
export default function KnowledgeCheckScreen({
  navigation
}) {
  const {
    theme
  } = useTheme();
  const {
    userId
  } = useUser();
  const {
    settings: a11y
  } = useAccessibility();
  const [isSenior, setIsSenior] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      const [profile, chaptersRes] = await Promise.all([apiRequest(`/onboarding/profile?userId=${userId}`, 'GET'), apiRequest(`/gamification/knowledge-chapters?userId=${userId}`, 'GET')]);
      setIsSenior(profile.experienceMode === 'elderly');
      setCompleted(chaptersRes.completedChapters || []);
    } catch (err) {
      console.log('Knowledge Check load error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  const getState = index => {
    if (completed.includes(KNOWLEDGE_CHECK_CHAPTERS[index].id)) return 'done';
    if (index === 0 || completed.includes(KNOWLEDGE_CHECK_CHAPTERS[index - 1].id)) return 'unlocked';
    return 'locked';
  };
  const openChapter = chapterId => navigation.navigate('KnowledgeCheckQuiz', {
    chapterId
  });
  const doneCount = completed.length;
  const progressPct = Math.round(doneCount / KNOWLEDGE_CHECK_CHAPTERS.length * 100);
  let lastGroup = null;
  if (loading) return <LoadingState message="Loading Knowledge Check..." />;
  if (error) return <ErrorState onRetry={load} />;
  return <ScrollView style={{
    backgroundColor: theme.bg
  }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, {
      color: theme.text
    }, isSenior && styles.titleSenior]}>🧠 Knowledge Check</Text>
      <Text style={[styles.sub, {
      color: theme.textSub
    }, isSenior && styles.subSenior]}>
        {TOTAL_KNOWLEDGE_CHECK_QUESTIONS} questions across {KNOWLEDGE_CHECK_CHAPTERS.length} chapters, testing what you've read and watched.
      </Text>

      <View style={[styles.progressCard, {
      backgroundColor: NAVY
    }]}>
        <Text style={styles.progressLabel}>
          <CountUpNumber value={doneCount} style={styles.progressLabel} /> / {KNOWLEDGE_CHECK_CHAPTERS.length} chapters complete
        </Text>
        <AnimatedProgressBar progress={progressPct} trackColor="rgba(255,255,255,0.25)" fillColor="#fff" height={10} />
      </View>

      {KNOWLEDGE_CHECK_CHAPTERS.map((chapter, i) => {
      const showGroupHeader = chapter.group !== lastGroup;
      lastGroup = chapter.group;
      return <View key={chapter.id}>
            {showGroupHeader && <Text style={[styles.groupHeader, {
          color: NAVY
        }, isSenior && styles.groupHeaderSenior]}>{chapter.group.toUpperCase()}</Text>}
            <ChapterRow chapter={chapter} index={i} state={getState(i)} isSenior={isSenior} theme={theme} a11y={a11y} onPress={() => openChapter(chapter.id)} />
          </View>;
    })}
    </ScrollView>;
}
const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge
  },
  title: {
    fontSize: TYPE.display.fontSize - 2,
    fontWeight: 'bold'
  },
  titleSenior: {
    fontSize: TYPE_SENIOR.display.fontSize
  },
  sub: {
    fontSize: TYPE.body.fontSize - 1,
    marginTop: SPACING.sm - 2,
    marginBottom: SPACING.lg + 2,
    lineHeight: 20
  },
  subSenior: {
    fontSize: TYPE_SENIOR.body.fontSize,
    lineHeight: 24
  },
  progressCard: {
    borderRadius: RADII.adult.card + 4,
    padding: SPACING.lg,
    marginBottom: SPACING.sm
  },
  progressLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize - 1,
    marginBottom: SPACING.sm + 2
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 5,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5
  },
  groupHeader: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: SPACING.xxl - 2,
    marginBottom: SPACING.sm + 2
  },
  groupHeaderSenior: {
    fontSize: TYPE_SENIOR.caption.fontSize + 2
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.adult.card + 2,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md + 2,
    marginBottom: SPACING.sm + 2
  },
  rowLocked: {
    opacity: 0.6
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md + 2
  },
  rowTitle: {
    fontSize: TYPE.body.fontSize,
    fontWeight: 'bold'
  },
  rowTitleSenior: {
    fontSize: TYPE_SENIOR.body.fontSize + 1
  },
  rowMeta: {
    fontSize: TYPE.caption.fontSize,
    marginTop: 3
  },
  rowMetaSenior: {
    fontSize: TYPE_SENIOR.caption.fontSize + 2,
    marginTop: 4
  }
});
