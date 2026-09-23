import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import Text from './Text';
import { useAccessibility } from '../context/AccessibilityContext';
import { getBadgeInfo } from '../constants/badges';

const celebrationStarSource = require('../assets/lottie/celebration-star.json');

// A shared "you just unlocked a badge" moment, dropped in via useBadgeUnlock
// so every badge-awarding screen — kid game, teen lesson, adult quiz — gets
// the same fanfare instead of the badge just quietly showing up next time a
// list re-renders. `accent` is the one thing callers customize, so the
// modal itself reads as belonging to whichever age palette is live rather
// than a one-size-fits-all popup.
//
// The badge's zoom-in and the glow ring's pulse are both real motion, so
// with reducedMotion on they're skipped entirely: the badge appears at
// rest immediately (still fully legible — title/description are plain
// text, not conveyed only through the animation) and the Lottie sparkle is
// not rendered at all, matching how Celebration.js already treats this
// setting for confetti.
export default function BadgeUnlockOverlay({ badgeId, accent, onDismiss }) {
  const { settings: a11y } = useAccessibility();
  const scale = useSharedValue(a11y.reducedMotion ? 1 : 0);
  const glow = useSharedValue(a11y.reducedMotion ? 0.5 : 0);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (!badgeId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    backdrop.value = withTiming(1, { duration: 200 });
    if (a11y.reducedMotion) { scale.value = 1; glow.value = 0.5; return; }
    scale.value = withSpring(1, { damping: 8, stiffness: 130 });
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true);
  }, [badgeId]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.55, transform: [{ scale: 1 + glow.value * 0.3 }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  if (!badgeId) return null;
  const info = getBadgeInfo(badgeId);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View style={styles.card} pointerEvents="box-none">
          <Text style={[styles.kicker, { color: accent }]}>NEW BADGE UNLOCKED</Text>
          <View style={styles.stage}>
            <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: accent }, glowStyle]} />
            {!a11y.reducedMotion && (
              <LottieView source={celebrationStarSource} autoPlay loop={false} style={styles.lottie} />
            )}
            <Animated.Text style={[styles.badgeEmoji, badgeStyle]}>{info.emoji}</Animated.Text>
          </View>
          <Text style={styles.badgeTitle}>{info.title}</Text>
          <Text style={styles.badgeDesc}>{info.description}</Text>
          <TouchableOpacity
            style={[styles.dismissBtn, { backgroundColor: accent }]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.dismissBtnText}>NICE!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center' },
  kicker: { fontWeight: 'bold', fontSize: 13, letterSpacing: 1.5, marginBottom: 10 },
  stage: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  glow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  lottie: { position: 'absolute', width: 160, height: 160 },
  badgeEmoji: { fontSize: 64 },
  badgeTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 6 },
  badgeDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  dismissBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 44 },
  dismissBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});
