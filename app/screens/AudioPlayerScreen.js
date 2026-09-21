import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import apiRequest from '../services/api';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import { AUDIO_EPISODES as EPISODES, getEpisodeById } from '../constants/audio';
import { SPACING, TYPE, TYPE_SENIOR, RADII, SEMANTIC } from '../constants/tokens';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function AudioPlayerScreen({ route }) {
  const { theme } = useTheme();
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [isSenior, setIsSenior] = useState(false);
  const preselected = route?.params?.episodeId ? getEpisodeById(route.params.episodeId) : null;
  const [selected, setSelected] = useState(preselected || EPISODES[0]);
  const player = useAudioPlayer(selected.file);
  const status = useAudioPlayerStatus(player);

  const [playing, setPlaying] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(a11y.captionsPreferred);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiRequest(`/onboarding/profile?userId=${userId}`, 'GET')
        .then((profile) => { if (active) setIsSenior(profile.experienceMode === 'elderly'); })
        .catch(() => {});
      return () => { active = false; };
    }, [userId])
  );

  useEffect(() => {
    setPlaying(false);
    player.pause();
    player.seekTo(0);
  }, [selected]);

  useEffect(() => {
    setTranscriptOpen(a11y.captionsPreferred || isSenior);
  }, [a11y.captionsPreferred, isSenior, selected]);

  const togglePlay = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  };

  const restart = () => {
    player.seekTo(0);
    player.play();
    setPlaying(true);
  };

  const type = isSenior ? TYPE_SENIOR : TYPE;
  const progressPct = status.duration ? Math.min(100, (status.currentTime / status.duration) * 100) : 0;

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={isSenior ? styles.containerSenior : styles.container}>
      <Text style={[styles.title, { color: theme.text, fontSize: type.display.fontSize - 2 }]}>🎧 Listen & Learn</Text>
      <Text style={[styles.sub, { color: theme.textSub, fontSize: type.body.fontSize - (isSenior ? 0 : 1) }]}>Audio guides you can listen to anytime.</Text>

      <View style={[styles.nowPlaying, isSenior && styles.nowPlayingSenior, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.npLabel, { color: theme.textSub, fontSize: type.caption.fontSize }]}>NOW PLAYING</Text>
        <Text style={[styles.npTitle, { color: theme.text, fontSize: type.title.fontSize + (isSenior ? 2 : 0) }]}>{selected.title}</Text>
        {!isSenior && <Text style={[styles.npDesc, { color: theme.textSub, fontSize: type.body.fontSize - 1 }]}>{selected.desc}</Text>}

        <View style={styles.progressWrap}>
          <AnimatedProgressBar progress={progressPct} trackColor={theme.border} fillColor={SEMANTIC.success} height={isSenior ? 14 : 8} />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: theme.textSub, fontSize: type.caption.fontSize - (isSenior ? 0 : 1) }]}>{formatTime(status.currentTime)}</Text>
            <Text style={[styles.timeText, { color: theme.textSub, fontSize: type.caption.fontSize - (isSenior ? 0 : 1) }]}>{formatTime(status.duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.ctrlSmall, isSenior && styles.ctrlSmallSenior]}
            onPress={restart}
            accessibilityRole="button"
            accessibilityLabel="Restart episode"
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.ctrlSmallText, isSenior && { fontSize: 36 }]}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctrlBig, isSenior && styles.ctrlBigSenior]}
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.ctrlBigText, isSenior && { fontSize: 46 }]}>{playing ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <View style={[styles.ctrlSmall, isSenior && styles.ctrlSmallSenior]} />
        </View>

        <TouchableOpacity
          style={[styles.transcriptToggle, { borderColor: theme.border }]}
          onPress={() => setTranscriptOpen((t) => !t)}
          accessibilityRole="button"
          accessibilityLabel={transcriptOpen ? 'Hide transcript' : 'Show transcript'}
          {...touchTargetProps(a11y)}
        >
          <Text style={[styles.transcriptToggleText, { color: theme.text, fontSize: type.body.fontSize - (isSenior ? -1 : 1) }]}>
            {transcriptOpen ? '▲ Hide Transcript' : '▼ Show Transcript'}
          </Text>
        </TouchableOpacity>

        {transcriptOpen && (
          <Animated.View entering={FadeIn.duration(isSenior ? 340 : 200)} style={[styles.transcriptBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.transcriptText, { color: theme.text, fontSize: type.body.fontSize - (isSenior ? -4 : 1), lineHeight: isSenior ? 32 : 22 }]}>{selected.transcript}</Text>
          </Animated.View>
        )}
      </View>

      <Text style={[styles.section, { color: theme.text, fontSize: type.title.fontSize - 2 }]}>All Episodes</Text>
      {EPISODES.map((ep, i) => (
        <Animated.View key={ep.id} entering={isSenior ? FadeInDown.delay(i * 150).duration(480) : FadeIn.delay(i * 40).duration(200)}>
          <TouchableOpacity
            style={[styles.epCard, isSenior && styles.epCardSenior, { backgroundColor: theme.card, borderColor: selected.id === ep.id ? SEMANTIC.success : theme.border }]}
            onPress={() => setSelected(ep)}
            accessibilityRole="button"
            accessibilityLabel={`${ep.title}. ${ep.desc}`}
            accessibilityState={{ selected: selected.id === ep.id }}
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.epIcon, isSenior && { fontSize: 34 }]}>{selected.id === ep.id && playing ? '🔊' : '🎵'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.epTitle, { color: theme.text, fontSize: type.body.fontSize + 1 }]}>{ep.title}</Text>
              <Text style={[styles.epSource, { color: theme.textSub, fontSize: type.caption.fontSize }]}>{ep.source}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  containerSenior: { padding: SPACING.xxl, paddingBottom: SPACING.huge },
  title: { fontWeight: 'bold' },
  sub: { marginBottom: SPACING.xl },
  nowPlaying: { borderRadius: RADII.adult.card + 8, borderWidth: 1, padding: SPACING.xxl, alignItems: 'center' },
  nowPlayingSenior: { borderRadius: RADII.elderly.card, padding: SPACING.xxl + 4, borderWidth: 2 },
  npLabel: { fontWeight: 'bold', letterSpacing: 1 },
  npTitle: { fontWeight: 'bold', marginTop: SPACING.sm, textAlign: 'center' },
  npDesc: { marginTop: SPACING.sm, textAlign: 'center', lineHeight: 20 },

  progressWrap: { width: '100%', marginTop: SPACING.xl },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs + 2 },
  timeText: { fontWeight: 'bold' },

  controls: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.lg },
  ctrlSmall: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  ctrlSmallSenior: { width: 76, height: 76 },
  ctrlSmallText: { fontSize: 30 },
  ctrlBig: { width: 84, height: 84, borderRadius: 42, backgroundColor: SEMANTIC.success, alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.lg },
  ctrlBigSenior: { width: 104, height: 104, borderRadius: 52 },
  ctrlBigText: { fontSize: 38, color: '#fff' },
  transcriptToggle: { marginTop: SPACING.lg, borderTopWidth: 1, paddingTop: SPACING.lg, width: '100%', alignItems: 'center' },
  transcriptToggleText: { fontWeight: 'bold' },
  transcriptBox: { marginTop: SPACING.md, borderRadius: RADII.adult.card + 2, borderWidth: 1, padding: SPACING.lg, width: '100%' },
  transcriptText: { textAlign: 'left' },
  section: { fontWeight: 'bold', marginTop: SPACING.xxl + 4, marginBottom: SPACING.md },
  epCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.adult.card + 2, borderWidth: 2, padding: SPACING.lg, marginBottom: SPACING.md },
  epCardSenior: { borderRadius: RADII.elderly.card, padding: SPACING.xl, marginBottom: SPACING.lg + 4 },
  epIcon: { fontSize: 28, marginRight: SPACING.md + 2 },
  epTitle: { fontWeight: 'bold' },
  epSource: { marginTop: 2 }
});
