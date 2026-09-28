import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import apiRequest from '../services/api';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import { AUDIO_EPISODES as EPISODES, getEpisodeById } from '../constants/audio';
import { SPACING, TYPE, TYPE_SENIOR, RADII, SEMANTIC } from '../constants/tokens';
const NORMAL_RATE = 0.92;
const SENIOR_RATE = 0.68;
const IS_ANDROID = Platform.OS === 'android';
export default function AudioPlayerScreen({
  route
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
  const preselected = route?.params?.episodeId ? getEpisodeById(route.params.episodeId) : null;
  const [selected, setSelected] = useState(preselected || EPISODES[0]);
  const [status, setStatus] = useState('idle');
  const [wordRange, setWordRange] = useState(null);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest(`/onboarding/profile?userId=${userId}`, 'GET').then(profile => {
      if (active) setIsSenior(profile.experienceMode === 'elderly');
    }).catch(() => {});
    return () => {
      active = false;
      Speech.stop();
    };
  }, [userId]));
  useEffect(() => {
    Speech.stop();
    setStatus('idle');
    setWordRange(null);
  }, [selected]);
  const speak = () => {
    Speech.stop();
    Speech.speak(selected.transcript, {
      rate: isSenior ? SENIOR_RATE : NORMAL_RATE,
      pitch: 1.0,
      onStart: () => setStatus('speaking'),
      onDone: () => {
        setStatus('idle');
        setWordRange(null);
      },
      onStopped: () => {
        setStatus('idle');
        setWordRange(null);
      },
      onError: () => {
        setStatus('idle');
        setWordRange(null);
      },
      onBoundary: e => setWordRange({
        charIndex: e.charIndex,
        charLength: e.charLength
      })
    });
  };
  const togglePlay = () => {
    if (status === 'speaking') {
      if (IS_ANDROID) {
        Speech.stop();
        setStatus('idle');
        setWordRange(null);
      } else {
        Speech.pause();
        setStatus('paused');
      }
      return;
    }
    if (status === 'paused' && !IS_ANDROID) {
      Speech.resume();
      setStatus('speaking');
      return;
    }
    speak();
  };
  const stop = () => {
    Speech.stop();
    setStatus('idle');
    setWordRange(null);
  };
  const restart = () => {
    speak();
  };
  const type = isSenior ? TYPE_SENIOR : TYPE;
  const progressPct = wordRange && selected.transcript.length ? Math.min(100, (wordRange.charIndex + wordRange.charLength) / selected.transcript.length * 100) : 0;
  const playPauseGlyph = status === 'speaking' ? IS_ANDROID ? '⏹' : '⏸' : '▶';
  const playPauseLabel = status === 'speaking' ? IS_ANDROID ? 'Stop' : 'Pause' : status === 'paused' ? 'Resume' : 'Play';
  const renderTranscript = () => {
    const text = selected.transcript;
    if (!wordRange || status === 'idle') {
      return <Text style={[styles.transcriptText, {
        color: theme.text,
        fontSize: type.body.fontSize - (isSenior ? -4 : 1),
        lineHeight: isSenior ? 32 : 22
      }]}>{text}</Text>;
    }
    const {
      charIndex,
      charLength
    } = wordRange;
    const before = text.slice(0, charIndex);
    const current = text.slice(charIndex, charIndex + charLength);
    const after = text.slice(charIndex + charLength);
    const baseStyle = {
      fontSize: type.body.fontSize - (isSenior ? -4 : 1),
      lineHeight: isSenior ? 32 : 22
    };
    return <Text style={[styles.transcriptText, baseStyle, {
      color: theme.text
    }]}>
        <Text style={{
        color: theme.textSub
      }}>{before}</Text>
        <Text style={[styles.currentWord, {
        backgroundColor: SEMANTIC.success + '33',
        color: theme.text
      }]}>{current}</Text>
        <Text style={{
        color: theme.text
      }}>{after}</Text>
      </Text>;
  };
  return <ScrollView style={{
    backgroundColor: theme.bg
  }} contentContainerStyle={isSenior ? styles.containerSenior : styles.container}>
      <Text style={[styles.title, {
      color: theme.text,
      fontSize: type.display.fontSize - 2
    }]}>🎧 Listen & Learn</Text>
      <Text style={[styles.sub, {
      color: theme.textSub,
      fontSize: type.body.fontSize - (isSenior ? 0 : 1)
    }]}>Guides read aloud - no recordings, spoken live on this device.</Text>

      <View style={[styles.nowPlaying, isSenior && styles.nowPlayingSenior, {
      backgroundColor: theme.card,
      borderColor: theme.border
    }]}>
        <Text style={[styles.npLabel, {
        color: theme.textSub,
        fontSize: type.caption.fontSize
      }]}>{status === 'speaking' ? 'READING NOW' : status === 'paused' ? 'PAUSED' : 'READY'}</Text>
        <Text style={[styles.npTitle, {
        color: theme.text,
        fontSize: type.title.fontSize + (isSenior ? 2 : 0)
      }]}>{selected.title}</Text>
        {!isSenior && <Text style={[styles.npDesc, {
        color: theme.textSub,
        fontSize: type.body.fontSize - 1
      }]}>{selected.desc}</Text>}

        <View style={styles.progressWrap}>
          <AnimatedProgressBar progress={progressPct} trackColor={theme.border} fillColor={SEMANTIC.success} height={isSenior ? 14 : 8} />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.ctrlSmall, isSenior && styles.ctrlSmallSenior]} onPress={restart} accessibilityRole="button" accessibilityLabel="Restart from the beginning" {...touchTargetProps(a11y)}>
            <Text style={[styles.ctrlSmallText, isSenior && {
            fontSize: 36
          }]}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlBig, isSenior && styles.ctrlBigSenior]} onPress={togglePlay} accessibilityRole="button" accessibilityLabel={playPauseLabel} {...touchTargetProps(a11y)}>
            <Text style={[styles.ctrlBigText, isSenior && {
            fontSize: 46
          }]}>{playPauseGlyph}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctrlSmall, isSenior && styles.ctrlSmallSenior]} onPress={stop} disabled={status === 'idle'} accessibilityRole="button" accessibilityLabel="Stop reading" {...touchTargetProps(a11y)}>
            <Text style={[styles.ctrlSmallText, isSenior && {
            fontSize: 36
          }, status === 'idle' && styles.ctrlDisabled]}>⏹</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.transcriptToggle, {
        borderColor: theme.border
      }]} onPress={() => setTranscriptOpen(t => !t)} accessibilityRole="button" accessibilityLabel={transcriptOpen ? 'Hide transcript' : 'Show transcript'} {...touchTargetProps(a11y)}>
          <Text style={[styles.transcriptToggleText, {
          color: theme.text,
          fontSize: type.body.fontSize - (isSenior ? -1 : 1)
        }]}>
            {transcriptOpen ? '▲ Hide Transcript' : '▼ Show Transcript'}
          </Text>
        </TouchableOpacity>

        {transcriptOpen && <Animated.View entering={FadeIn.duration(isSenior ? 340 : 200)} style={[styles.transcriptBox, {
        backgroundColor: theme.bg,
        borderColor: theme.border
      }]}>
            {renderTranscript()}
          </Animated.View>}
      </View>

      <Text style={[styles.section, {
      color: theme.text,
      fontSize: type.title.fontSize - 2
    }]}>All Episodes</Text>
      {EPISODES.map((ep, i) => <Animated.View key={ep.id} entering={isSenior ? FadeInDown.delay(i * 150).duration(480) : FadeIn.delay(i * 40).duration(200)}>
          <TouchableOpacity style={[styles.epCard, isSenior && styles.epCardSenior, {
        backgroundColor: theme.card,
        borderColor: selected.id === ep.id ? SEMANTIC.success : theme.border
      }]} onPress={() => setSelected(ep)} accessibilityRole="button" accessibilityLabel={`${ep.title}. ${ep.desc}`} accessibilityState={{
        selected: selected.id === ep.id
      }} {...touchTargetProps(a11y)}>
            <Text style={[styles.epIcon, isSenior && {
          fontSize: 34
        }]}>{selected.id === ep.id && status === 'speaking' ? '🔊' : '🎵'}</Text>
            <View style={{
          flex: 1
        }}>
              <Text style={[styles.epTitle, {
            color: theme.text,
            fontSize: type.body.fontSize + 1
          }]}>{ep.title}</Text>
              <Text style={[styles.epSource, {
            color: theme.textSub,
            fontSize: type.caption.fontSize
          }]}>{ep.source}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>)}
    </ScrollView>;
}
const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge
  },
  containerSenior: {
    padding: SPACING.xxl,
    paddingBottom: SPACING.huge
  },
  title: {
    fontWeight: 'bold'
  },
  sub: {
    marginBottom: SPACING.xl
  },
  nowPlaying: {
    borderRadius: RADII.adult.card + 8,
    borderWidth: 1,
    padding: SPACING.xxl,
    alignItems: 'center'
  },
  nowPlayingSenior: {
    borderRadius: RADII.elderly.card,
    padding: SPACING.xxl + 4,
    borderWidth: 2
  },
  npLabel: {
    fontWeight: 'bold',
    letterSpacing: 1
  },
  npTitle: {
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    textAlign: 'center'
  },
  npDesc: {
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20
  },
  progressWrap: {
    width: '100%',
    marginTop: SPACING.xl
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg
  },
  ctrlSmall: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ctrlSmallSenior: {
    width: 76,
    height: 76
  },
  ctrlSmallText: {
    fontSize: 30
  },
  ctrlDisabled: {
    opacity: 0.3
  },
  ctrlBig: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: SEMANTIC.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg
  },
  ctrlBigSenior: {
    width: 104,
    height: 104,
    borderRadius: 52
  },
  ctrlBigText: {
    fontSize: 38,
    color: '#fff'
  },
  transcriptToggle: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    paddingTop: SPACING.lg,
    width: '100%',
    alignItems: 'center'
  },
  transcriptToggleText: {
    fontWeight: 'bold'
  },
  transcriptBox: {
    marginTop: SPACING.md,
    borderRadius: RADII.adult.card + 2,
    borderWidth: 1,
    padding: SPACING.lg,
    width: '100%'
  },
  transcriptText: {
    textAlign: 'left'
  },
  currentWord: {
    fontWeight: 'bold',
    borderRadius: 4
  },
  section: {
    fontWeight: 'bold',
    marginTop: SPACING.xxl + 4,
    marginBottom: SPACING.md
  },
  epCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.adult.card + 2,
    borderWidth: 2,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  epCardSenior: {
    borderRadius: RADII.elderly.card,
    padding: SPACING.xl,
    marginBottom: SPACING.lg + 4
  },
  epIcon: {
    fontSize: 28,
    marginRight: SPACING.md + 2
  },
  epTitle: {
    fontWeight: 'bold'
  },
  epSource: {
    marginTop: 2
  }
});
