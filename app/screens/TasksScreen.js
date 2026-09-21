import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

export default function TasksScreen() {
  const { userId } = useUser();
  const { theme } = useTheme();
  const { settings: a11y } = useAccessibility();
  const [tasks, setTasks] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const result = await apiRequest(`/gamification/tasks?userId=${userId}`, 'GET');
      setTasks(result.tasks || []);
      setCompletedToday(result.completedToday || []);
    } catch (err) {
      console.log('Tasks error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const completeTask = async (taskId) => {
    try {
      const result = await apiRequest('/gamification/complete-task', 'POST', { userId, taskId });
      Alert.alert('Task complete! 🎉', `You now have ${result.points} points (${result.rank}).`);
      load();
    } catch (err) {
      Alert.alert('Oops', err.message);
    }
  };

  if (loading) return <LoadingState message="Loading today's tasks..." />;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>⚡ Daily Tasks</Text>
      <Text style={[styles.subtitle, { color: theme.textSub }]}>Small real-world actions that keep you prepared</Text>

      {tasks.map((task, index) => {
        const done = completedToday.includes(task.taskId);
        return (
          <Animated.View key={task.taskId} entering={FadeInDown.delay(index * 80).duration(340)} layout={LinearTransition.duration(260)} style={[styles.taskCard, { backgroundColor: theme.card }, done && styles.taskDone]}>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: theme.text }]}>{done ? '✅ ' : ''}{task.title}</Text>
              <Text style={[styles.taskDescription, { color: theme.textSub }]}>{task.description}</Text>
              <Text style={styles.taskPoints}>+{task.pointsAwarded} points</Text>
            </View>
            {!done && (
              <TouchableOpacity
                style={[styles.doneButton, touchTargetStyle(a11y, 44)]}
                onPress={() => completeTask(task.taskId)}
                accessibilityRole="button"
                accessibilityLabel={`Mark "${task.title}" as done, +${task.pointsAwarded} points`}
                {...touchTargetProps(a11y)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        );
      })}

      {tasks.length === 0 && (
        <EmptyState icon="clipboard-check-outline" title="No tasks right now" message="Check back tomorrow for a new set of daily preparedness actions." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl },
  title: { fontSize: TYPE.display.fontSize - 2, fontWeight: 'bold' },
  subtitle: { fontSize: TYPE.body.fontSize - 1, marginBottom: SPACING.xl },
  taskCard: {
    flexDirection: 'row', borderRadius: RADII.adult.card, padding: SPACING.lg, marginBottom: SPACING.md,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1
  },
  taskDone: { opacity: 0.6 },
  taskInfo: { flex: 1, paddingRight: SPACING.md },
  taskTitle: { fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold' },
  taskDescription: { fontSize: TYPE.caption.fontSize + 1, marginTop: SPACING.xs },
  taskPoints: { fontSize: TYPE.caption.fontSize, color: AGE_PALETTES.adult.amber, fontWeight: 'bold', marginTop: SPACING.sm - 2 },
  doneButton: { backgroundColor: SEMANTIC.success, borderRadius: RADII.adult.button - 2, paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.lg + 2 },
  doneButtonText: { color: '#fff', fontWeight: 'bold' }
});
