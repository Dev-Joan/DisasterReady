import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import { TEEN_LESSONS as LESSONS } from '../constants/lessonSchema';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import FlameFlicker from '../components/FlameFlicker';
import { SPACING, TYPE, RADII, AGE_PALETTES } from '../constants/tokens';
const TEEN = AGE_PALETTES.teen;
const TEAL = TEEN.teal;
const INDIGO = TEEN.indigo;
const CORAL = TEEN.coral;
const SCREEN_WIDTH = Dimensions.get('window').width;
const NODE_SIZE = 76;
const LABEL_WIDTH = 130;
const NODE_SPACING_Y = 138;
const TRAIL_PADDING_X = 24;
const X_PATTERN = [0.5, 0.22, 0.78, 0.30, 0.66, 0.20, 0.80];
const LEAGUE_NAMES = {
  Novice: 'Bronze League',
  Prepared: 'Silver League',
  Resilient: 'Gold League',
  Guardian: 'Diamond League'
};
const LEAGUE_EMOJI = {
  Novice: '🥉',
  Prepared: '🥈',
  Resilient: '🥇',
  Guardian: '💎'
};
function centerX(index) {
  const usable = SCREEN_WIDTH - TRAIL_PADDING_X * 2;
  return TRAIL_PADDING_X + X_PATTERN[index % X_PATTERN.length] * usable;
}
function centerY(index, total) {
  return (total - 1 - index) * NODE_SPACING_Y + NODE_SIZE / 2 + 20;
}
function PulsingNode({
  isCurrent,
  children
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (isCurrent) {
      scale.value = withRepeat(withSequence(withTiming(1.08, {
        duration: 600
      }), withTiming(1, {
        duration: 600
      })), -1, true);
    } else {
      scale.value = withTiming(1, {
        duration: 200
      });
    }
  }, [isCurrent]);
  const style = useAnimatedStyle(() => ({
    transform: [{
      scale: scale.value
    }]
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
export default function LearningPathScreen({
  navigation
}) {
  const {
    userId
  } = useUser();
  const {
    settings: a11y
  } = useAccessibility();
  const [completed, setCompleted] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      const [lessonsRes, gamRes, leaderRes] = await Promise.all([apiRequest(`/gamification/lessons?userId=${userId}`, 'GET'), apiRequest('/gamification/login', 'POST', {
        userId
      }), apiRequest('/leaderboard/top?mode=teen&limit=5', 'GET')]);
      setCompleted(lessonsRes.completedLessons || []);
      setGamification(gamRes);
      setLeaderboard(leaderRes.leaderboard || []);
    } catch (err) {
      console.log('Learning path load error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));
  if (loading) return <LoadingState message="Loading your path..." />;
  if (error) return <ErrorState onRetry={load} />;
  const isUnlocked = index => {
    if (index === 0) return true;
    return completed.includes(LESSONS[index - 1].id);
  };
  const currentIndex = LESSONS.findIndex(l => !completed.includes(l.id));
  const trailHeight = centerY(0, LESSONS.length) + NODE_SIZE / 2 + 50;
  const league = LEAGUE_NAMES[gamification.rank] || 'Bronze League';
  const leagueEmoji = LEAGUE_EMOJI[gamification.rank] || '🥉';
  const dailyGoalXp = gamification.dailyGoalXp || 30;
  const dailyXpEarned = Math.min(dailyGoalXp, gamification.dailyXpEarned || 0);
  const dailyGoalPct = Math.round(dailyXpEarned / dailyGoalXp * 100);
  const streakFreezes = gamification.streakFreezes || 0;
  return <ScrollView style={{
    backgroundColor: TEEN.slate
  }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, {
      color: TEEN.text
    }]}>Preparedness Path</Text>
      <Text style={[styles.sub, {
      color: TEEN.textSub
    }]}>Complete lessons to unlock the next. Earn XP as you go.</Text>

      {}
      <Animated.View entering={FadeInDown.duration(340).springify().damping(20)} style={[styles.statusCard, {
      backgroundColor: TEEN.base,
      borderColor: TEEN.border
    }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <FlameFlicker style={styles.statusEmoji}>🔥</FlameFlicker>
            <CountUpNumber value={gamification.currentStreak} style={[styles.statusNum, {
            color: TEEN.text
          }]} />
            <Text style={[styles.statusLabel, {
            color: TEEN.textSub
          }]}>Day streak</Text>
          </View>
          <View style={[styles.statusDivider, {
          backgroundColor: TEEN.border
        }]} />
          <View style={styles.statusItem}>
            <Text style={styles.statusEmoji}>🧊</Text>
            <CountUpNumber value={streakFreezes} style={[styles.statusNum, {
            color: TEEN.text
          }]} />
            <Text style={[styles.statusLabel, {
            color: TEEN.textSub
          }]}>Freezes</Text>
          </View>
          <View style={[styles.statusDivider, {
          backgroundColor: TEEN.border
        }]} />
          <View style={styles.statusItem}>
            <Text style={styles.statusEmoji}>🎯</Text>
            <CountUpNumber value={gamification.points} style={[styles.statusNum, {
            color: TEEN.text
          }]} />
            <Text style={[styles.statusLabel, {
            color: TEEN.textSub
          }]}>Total XP</Text>
          </View>
        </View>
        <View style={styles.goalRow}>
          <Text style={[styles.goalLabel, {
          color: TEEN.textSub
        }]}>Daily goal - {dailyXpEarned}/{dailyGoalXp} XP</Text>
          <AnimatedProgressBar progress={dailyGoalPct} trackColor={TEEN.border} fillColor={dailyGoalPct >= 100 ? '#34D399' : TEAL} height={10} />
        </View>
      </Animated.View>

      {}
      <Animated.View entering={FadeInDown.delay(80).duration(340).springify().damping(20)} style={[styles.leagueCard, {
      backgroundColor: TEEN.base,
      borderColor: TEEN.border
    }]}>
        <View style={styles.leagueHeader}>
          <Text style={styles.leagueTitle}>{leagueEmoji} {league}</Text>
          <BouncyPress onPress={() => navigation.navigate('Leaderboard')} accessibilityRole="button" accessibilityLabel="View full leaderboard" {...touchTargetProps(a11y)}>
            <Text style={styles.leagueLink}>Full leaderboard ▶</Text>
          </BouncyPress>
        </View>
        {leaderboard.length === 0 && <Text style={[styles.leagueEmpty, {
        color: TEEN.textSub
      }]}>Be the first teen to earn XP this week!</Text>}
        {leaderboard.map((entry, i) => <Animated.View key={entry.userId} entering={FadeInDown.delay(120 + i * 60).duration(300)} style={[styles.leagueRow, entry.userId === userId && {
        backgroundColor: TEAL + '18',
        borderRadius: RADII.teen.chip
      }]}>
            <Text style={styles.leagueRank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</Text>
            <Text style={[styles.leagueName, {
          color: TEEN.text
        }]} numberOfLines={1}>
              {entry.username}{entry.userId === userId ? ' (You)' : ''}
            </Text>
            <CountUpNumber value={entry.points} suffix=" XP" style={[styles.leaguePoints, {
          color: INDIGO
        }]} />
          </Animated.View>)}
      </Animated.View>

      {}
      <View style={[styles.trail, {
      height: trailHeight
    }]}>
        {LESSONS.map((lesson, index) => {
        if (index === 0) return null;
        const from = {
          x: centerX(index - 1),
          y: centerY(index - 1, LESSONS.length)
        };
        const to = {
          x: centerX(index),
          y: centerY(index, LESSONS.length)
        };
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const segmentActive = completed.includes(LESSONS[index - 1].id);
        return <View key={`line-${lesson.id}`} style={[styles.connectorLine, {
          left: from.x,
          top: from.y - 2,
          width: length,
          backgroundColor: segmentActive ? TEAL : TEEN.border,
          transform: [{
            rotate: `${angle}deg`
          }]
        }]} />;
      })}

        {LESSONS.map((lesson, index) => {
        const done = completed.includes(lesson.id);
        const unlocked = isUnlocked(index);
        const isCurrent = !done && unlocked;
        const cx = centerX(index);
        const cy = centerY(index, LESSONS.length);
        return <Animated.View key={lesson.id} entering={FadeInDown.delay(index * 90).duration(380).springify().damping(20)} style={[styles.nodeWrap, {
          left: cx - LABEL_WIDTH / 2,
          top: cy - NODE_SIZE / 2
        }]}>
              {isCurrent && <Animated.View entering={ZoomIn.delay(index * 90 + 200).duration(180).springify().damping(20)} style={[styles.startBubble, {
            backgroundColor: CORAL
          }]}>
                  <Text style={styles.startBubbleText}>START</Text>
                </Animated.View>}
              <PulsingNode isCurrent={isCurrent}>
                <TouchableOpacity disabled={!unlocked} onPress={() => navigation.navigate('Lesson', {
              lessonId: lesson.id
            })} accessibilityRole="button" accessibilityLabel={`${lesson.title}. ${done ? 'Completed' : unlocked ? 'Ready to play' : 'Locked'}`} style={[styles.node, {
              backgroundColor: TEEN.base,
              borderColor: TEEN.border
            }, done && styles.nodeDone, isCurrent && {
              borderColor: TEAL
            }]} {...touchTargetProps(a11y)}>
                  <Text style={styles.nodeEmoji}>{done ? '✅' : unlocked ? lesson.emoji : '🔒'}</Text>
                </TouchableOpacity>
              </PulsingNode>
              <Text style={[styles.nodeLabel, {
            color: TEEN.text
          }, !unlocked && {
            color: TEEN.textSub
          }]} numberOfLines={2}>
                {lesson.title}
              </Text>
            </Animated.View>;
      })}

        {currentIndex !== -1 && <Animated.View entering={ZoomIn.delay(500).duration(180).springify().damping(20)} style={[styles.mascotMarker, {
        left: centerX(currentIndex) - 20,
        top: centerY(currentIndex, LESSONS.length) - NODE_SIZE / 2 - 46
      }]}>
            <BouncyMascot size={38} emoji="🏃" />
          </Animated.View>}
      </View>

      <View style={[styles.footer, {
      backgroundColor: TEEN.base
    }]}>
        <Text style={styles.footerText}>
          {completed.length === LESSONS.length ? '🎉 Path complete! You\'re a preparedness pro.' : `${completed.length}/${LESSONS.length} lessons done`}
        </Text>
      </View>
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
  sub: {
    fontSize: TYPE.body.fontSize - 1,
    marginBottom: SPACING.lg
  },
  statusCard: {
    borderRadius: RADII.teen.card,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md + 2
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  statusItem: {
    flex: 1,
    alignItems: 'center'
  },
  statusDivider: {
    width: 1,
    height: 36
  },
  statusEmoji: {
    fontSize: 20,
    marginBottom: 2
  },
  statusNum: {
    fontSize: TYPE.title.fontSize - 3,
    fontWeight: 'bold'
  },
  statusLabel: {
    fontSize: TYPE.caption.fontSize - 1,
    marginTop: 1
  },
  goalRow: {
    marginTop: SPACING.xs
  },
  goalLabel: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    marginBottom: SPACING.sm - 2
  },
  leagueCard: {
    borderRadius: RADII.teen.card,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2
  },
  leagueTitle: {
    fontSize: TYPE.body.fontSize + 1,
    fontWeight: 'bold',
    color: CORAL
  },
  leagueLink: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    color: TEAL
  },
  leagueEmpty: {
    fontSize: TYPE.caption.fontSize + 1,
    fontStyle: 'italic',
    paddingVertical: SPACING.sm
  },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs
  },
  leagueRank: {
    width: 28,
    fontSize: TYPE.body.fontSize
  },
  leagueName: {
    flex: 1,
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: '600'
  },
  leaguePoints: {
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: 'bold'
  },
  trail: {
    width: '100%',
    position: 'relative'
  },
  connectorLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    transformOrigin: 'left center'
  },
  nodeWrap: {
    position: 'absolute',
    width: LABEL_WIDTH,
    alignItems: 'center'
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4
  },
  nodeDone: {
    backgroundColor: TEAL,
    borderColor: TEEN.tealDeep
  },
  nodeEmoji: {
    fontSize: 32
  },
  nodeLabel: {
    fontSize: TYPE.caption.fontSize + 1,
    fontWeight: 'bold',
    marginTop: SPACING.sm - 2,
    textAlign: 'center'
  },
  startBubble: {
    borderRadius: RADII.teen.chip,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 6
  },
  startBubbleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.caption.fontSize - 1,
    letterSpacing: 1
  },
  mascotMarker: {
    position: 'absolute',
    width: 40,
    alignItems: 'center'
  },
  footer: {
    marginTop: SPACING.xxl,
    borderRadius: RADII.teen.card,
    padding: SPACING.lg,
    alignItems: 'center'
  },
  footerText: {
    color: TEAL,
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize - 1
  }
});
