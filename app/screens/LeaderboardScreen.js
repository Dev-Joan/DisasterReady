import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import CountUpNumber from '../components/CountUpNumber';
import { SPACING, TYPE, RADII, getElevation, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

export default function LeaderboardScreen() {
  const { userId } = useUser();
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const result = await apiRequest('/leaderboard/top', 'GET');
      setLeaderboard(result.leaderboard || []);
    } catch (err) {
      console.log('Leaderboard error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) return <LoadingState message="Loading leaderboard..." />;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>🏆 Leaderboard</Text>
      <Text style={[styles.subtitle, { color: theme.textSub }]}>Top preparedness champions</Text>

      {leaderboard.map((entry, index) => (
        <Animated.View
          key={entry.userId}
          entering={FadeInDown.delay(Math.min(index, 14) * 60).duration(340)}
          style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }, entry.userId === userId && styles.rowHighlight]}
        >
          <Text style={styles.medal}>{medals[index] || `${index + 1}.`}</Text>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowName, { color: theme.text }]}>
              {entry.username}{entry.userId === userId ? ' (You)' : ''}
            </Text>
            <Text style={[styles.rowRank, { color: theme.textSub }]}>{entry.rank}</Text>
          </View>
          <CountUpNumber value={entry.points} suffix=" XP" style={styles.rowPoints} />
        </Animated.View>
      ))}

      {leaderboard.length === 0 && (
        <EmptyState icon="trophy-outline" title="No players yet" message="Be the first to earn points and top the leaderboard!" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl },
  title: { fontSize: TYPE.display.fontSize - 2, fontWeight: 'bold' },
  subtitle: { fontSize: TYPE.body.fontSize - 1, marginBottom: SPACING.xl },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADII.adult.card, padding: SPACING.lg, marginBottom: SPACING.sm + 2,
    ...getElevation('adult')
  },
  rowHighlight: { borderWidth: 2, borderColor: SEMANTIC.signal },
  medal: { fontSize: 22, width: 40 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold' },
  rowRank: { fontSize: TYPE.caption.fontSize },
  rowPoints: { fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold', color: AGE_PALETTES.adult.amber }
});
