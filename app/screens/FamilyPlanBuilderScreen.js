import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import LoadingState from '../components/LoadingState';
import { MEETING_POINT_OPTIONS, FAMILY_MEMBER_OPTIONS, GO_BAG_ITEMS } from '../constants/familyPlan';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';
import HearButton from '../components/HearButton';
import useKidSpeech from '../hooks/useKidSpeech';

// Redesigned for readers as young as 6: every step is a grid of big
// picture tiles (giant emoji + a 1-3 word label) instead of rows of text
// to read, and the free-text "add a detail" field is gone entirely — a
// 6-10 year old shouldn't need to type to finish this. Each option's full
// sentence still exists as `speak` text in constants/familyPlan.js and is
// read aloud with expo-speech (useKidSpeech) on selection and on demand
// via the 🔊 button, so the idea is never locked behind reading ability.
const TILE_COLORS = ['#FEF3C7', '#DBEAFE', '#FCE7F3', '#DCFCE7', '#FFE4E6', '#E0E7FF'];

const packSound = require('../assets/sounds/pack.wav');
const tickSound = require('../assets/sounds/tick.wav');

function PictureTile({ emoji, label, color, selected, badge, onPress }) {
  const { settings: a11y } = useAccessibility();
  return (
    <BouncyPress
      style={[styles.tile, { backgroundColor: color }, selected && styles.tileSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      {...touchTargetProps(a11y)}
    >
      <Text style={styles.tileEmoji}>{emoji}</Text>
      <Text style={styles.tileLabel} numberOfLines={2}>{label}</Text>
      {badge != null && (
        <Animated.View entering={ZoomIn.duration(200).springify().damping(11)} style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{badge}</Text>
        </Animated.View>
      )}
      {selected && badge == null && (
        <Animated.Text entering={ZoomIn.duration(200).springify().damping(11)} style={styles.tileCheck}>✅</Animated.Text>
      )}
    </BouncyPress>
  );
}

export default function FamilyPlanBuilderScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const { speak } = useKidSpeech();
  const [loading, setLoading] = useState(true);
  const [hadExistingPlan, setHadExistingPlan] = useState(false);
  const [step, setStep] = useState('meeting'); // meeting | calls | bag | review | saved
  const [meetingPointId, setMeetingPointId] = useState(null);
  const [callOrder, setCallOrder] = useState([]);
  const [goBag, setGoBag] = useState([]);
  const [saving, setSaving] = useState(false);
  const [justEarnedBadge, setJustEarnedBadge] = useState(false);

  const packPlayer = useAudioPlayer(packSound);
  const tickPlayer = useAudioPlayer(tickSound);

  useEffect(() => {
    apiRequest(`/gamification/family-plan?userId=${userId}`, 'GET')
      .then((res) => {
        if (res.familyPlan) {
          setHadExistingPlan(true);
          setMeetingPointId(res.familyPlan.meetingPoint.id);
          setCallOrder(res.familyPlan.callOrder || []);
          setGoBag(res.familyPlan.goBag || []);
        }
      })
      .catch((err) => console.log('Family plan load error:', err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    if (step === 'meeting') speak('Where should your family meet?');
    if (step === 'calls') speak('Who do you call? Tap people in order.');
    if (step === 'bag') speak("What's in your go-bag? Tap to pack it.");
    if (step === 'review') speak("Here's your plan! Tap Save when you're ready.");
    if (step === 'saved') speak('Your family plan is saved! Great job!');
  }, [step, loading]);

  const pickMeeting = (opt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    packPlayer.seekTo(0); packPlayer.play();
    speak(opt.speak);
    setMeetingPointId(opt.id);
  };

  const toggleCallMember = (opt) => {
    const already = callOrder.includes(opt.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (already) {
      tickPlayer.seekTo(0); tickPlayer.play();
      setCallOrder((prev) => prev.filter((m) => m !== opt.id));
    } else {
      packPlayer.seekTo(0); packPlayer.play();
      speak(opt.speak);
      setCallOrder((prev) => [...prev, opt.id]);
    }
  };

  const toggleBagItem = (opt) => {
    const already = goBag.includes(opt.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (already) {
      tickPlayer.seekTo(0); tickPlayer.play();
      setGoBag((prev) => prev.filter((i) => i !== opt.id));
    } else {
      packPlayer.seekTo(0); packPlayer.play();
      speak(opt.speak);
      setGoBag((prev) => [...prev, opt.id]);
    }
  };

  const speakWholePlan = () => {
    const meetingOpt = MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId);
    const callNames = callOrder.map((id) => FAMILY_MEMBER_OPTIONS.find((f) => f.id === id)?.label).filter(Boolean).join(', then ');
    const bagNames = goBag.map((id) => GO_BAG_ITEMS.find((g) => g.id === id)?.label).filter(Boolean).join(', ');
    const parts = [
      meetingOpt ? `Meet at the ${meetingOpt.label}.` : '',
      callNames ? `Call: ${callNames}.` : '',
      bagNames ? `Pack: ${bagNames}.` : 'Pack your go-bag.'
    ].filter(Boolean);
    speak(parts.join(' '));
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const meetingOpt = MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId);
      await apiRequest('/gamification/family-plan', 'POST', {
        userId,
        meetingPoint: { id: meetingPointId, label: meetingOpt.label, detail: '' },
        callOrder,
        goBag
      });
      setJustEarnedBadge(!hadExistingPlan);
      setHadExistingPlan(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('saved');
    } catch (err) {
      console.log('Family plan save error:', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Checking your family plan..." />;

  const meetingOpt = MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId);

  const PlanSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>🏡 MEET HERE</Text>
      {meetingOpt && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryEmoji}>{meetingOpt.emoji}</Text>
          <Text style={styles.summaryText}>{meetingOpt.label}</Text>
        </View>
      )}

      <Text style={[styles.summaryLabel, { marginTop: 14 }]}>📞 CALL, IN ORDER</Text>
      <View style={styles.summaryChipsRow}>
        {callOrder.map((id, i) => {
          const m = FAMILY_MEMBER_OPTIONS.find((f) => f.id === id);
          return (
            <View key={id} style={styles.summaryChip}>
              <Text style={styles.summaryChipBadge}>{i + 1}</Text>
              <Text style={styles.summaryChipEmoji}>{m.emoji}</Text>
              <Text style={styles.summaryChipText} numberOfLines={1}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.summaryLabel, { marginTop: 14 }]}>🎒 GO-BAG</Text>
      <View style={styles.summaryChipsRow}>
        {goBag.length === 0 && <Text style={styles.summaryEmptyText}>Nothing packed yet</Text>}
        {goBag.map((id) => {
          const item = GO_BAG_ITEMS.find((g) => g.id === id);
          return (
            <View key={id} style={styles.summaryChip}>
              <Text style={styles.summaryChipEmoji}>{item.emoji}</Text>
              <Text style={styles.summaryChipText} numberOfLines={1}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  if (step === 'saved') {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <Celebration colors={['#16A34A', '#FBBF24', '#38BDF8', '#F472B6']} />
        <BouncyMascot size={56} emoji="🦊📋" />
        <Text style={styles.title}>Plan Saved!</Text>
        {justEarnedBadge && <Text style={styles.badgeCallout}>👨‍👩‍👧‍👦 New badge! +40 XP</Text>}
        <HearButton onPress={speakWholePlan} label="Hear my plan" />
        <PlanSummary />
        <BouncyPress style={styles.startButton} onPress={() => setStep('meeting')} accessibilityRole="button" accessibilityLabel="Edit my plan" {...touchTargetProps(a11y)}>
          <Text style={styles.startButtonText}>✏️ Edit My Plan</Text>
        </BouncyPress>
        <BouncyPress style={styles.secondaryButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back home" {...touchTargetProps(a11y)}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </BouncyPress>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <BouncyMascot size={48} emoji="🦊👨‍👩‍👧‍👦" />
      <Text style={styles.title}>Family Plan</Text>

      <View style={styles.stepDots}>
        {['meeting', 'calls', 'bag', 'review'].map((s) => (
          <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive]} />
        ))}
      </View>

      {step === 'meeting' && (
        <Animated.View entering={FadeInDown.duration(280)}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Where do we meet?</Text>
            <HearButton onPress={() => speak('Where should your family meet if you can\'t go home?')} />
          </View>
          <View style={styles.grid}>
            {MEETING_POINT_OPTIONS.map((opt, i) => (
              <PictureTile
                key={opt.id}
                emoji={opt.emoji}
                label={opt.label}
                color={TILE_COLORS[i % TILE_COLORS.length]}
                selected={meetingPointId === opt.id}
                onPress={() => pickMeeting(opt)}
              />
            ))}
          </View>
          <BouncyPress
            style={[styles.nextButton, !meetingPointId && styles.nextButtonDisabled]}
            disabled={!meetingPointId}
            onPress={() => setStep('calls')}
            accessibilityRole="button"
            accessibilityLabel="Next"
            accessibilityState={{ disabled: !meetingPointId }}
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.nextButtonText}>Next ▶</Text>
          </BouncyPress>
        </Animated.View>
      )}

      {step === 'calls' && (
        <Animated.View entering={FadeInDown.duration(280)}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Who do we call?</Text>
            <HearButton onPress={() => speak('Tap people in the order your family should call them.')} />
          </View>
          <Text style={styles.sectionSub}>Tap in order. Tap again to remove.</Text>
          <View style={styles.grid}>
            {FAMILY_MEMBER_OPTIONS.map((opt, i) => {
              const orderIndex = callOrder.indexOf(opt.id);
              return (
                <PictureTile
                  key={opt.id}
                  emoji={opt.emoji}
                  label={opt.label}
                  color={TILE_COLORS[i % TILE_COLORS.length]}
                  selected={orderIndex !== -1}
                  badge={orderIndex !== -1 ? orderIndex + 1 : null}
                  onPress={() => toggleCallMember(opt)}
                />
              );
            })}
          </View>
          <View style={styles.rowButtons}>
            <BouncyPress style={styles.backButton} onPress={() => setStep('meeting')} accessibilityRole="button" accessibilityLabel="Back" {...touchTargetProps(a11y)}>
              <Text style={styles.backButtonText}>◀ Back</Text>
            </BouncyPress>
            <BouncyPress
              style={[styles.nextButton, callOrder.length < 2 && styles.nextButtonDisabled]}
              disabled={callOrder.length < 2}
              onPress={() => setStep('bag')}
              accessibilityRole="button"
              accessibilityLabel="Next"
              accessibilityState={{ disabled: callOrder.length < 2 }}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.nextButtonText}>Next ▶</Text>
            </BouncyPress>
          </View>
        </Animated.View>
      )}

      {step === 'bag' && (
        <Animated.View entering={FadeInDown.duration(280)}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pack your bag!</Text>
            <HearButton onPress={() => speak("Tap each item to pack it in your go-bag.")} />
          </View>
          <View style={styles.grid}>
            {GO_BAG_ITEMS.map((item, i) => (
              <PictureTile
                key={item.id}
                emoji={item.emoji}
                label={item.label}
                color={TILE_COLORS[i % TILE_COLORS.length]}
                selected={goBag.includes(item.id)}
                onPress={() => toggleBagItem(item)}
              />
            ))}
          </View>
          <View style={styles.rowButtons}>
            <BouncyPress style={styles.backButton} onPress={() => setStep('calls')} accessibilityRole="button" accessibilityLabel="Back" {...touchTargetProps(a11y)}>
              <Text style={styles.backButtonText}>◀ Back</Text>
            </BouncyPress>
            <BouncyPress style={styles.nextButton} onPress={() => setStep('review')} accessibilityRole="button" accessibilityLabel="Review" {...touchTargetProps(a11y)}>
              <Text style={styles.nextButtonText}>Review ▶</Text>
            </BouncyPress>
          </View>
        </Animated.View>
      )}

      {step === 'review' && (
        <Animated.View entering={FadeInDown.duration(280)}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Your Plan!</Text>
            <HearButton onPress={speakWholePlan} label="Hear my plan" />
          </View>
          <PlanSummary />
          <View style={styles.rowButtons}>
            <BouncyPress style={styles.backButton} onPress={() => setStep('bag')} accessibilityRole="button" accessibilityLabel="Back" {...touchTargetProps(a11y)}>
              <Text style={styles.backButtonText}>◀ Back</Text>
            </BouncyPress>
            <BouncyPress
              style={[styles.nextButton, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={savePlan}
              accessibilityRole="button"
              accessibilityLabel={saving ? 'Saving' : 'Save my plan'}
              accessibilityState={{ disabled: saving, busy: saving }}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.nextButtonText}>{saving ? 'Saving...' : '💾 Save'}</Text>
            </BouncyPress>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0FDF4' },
  center: { flexGrow: 1, alignItems: 'center', padding: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginTop: 6, marginBottom: 8 },
  badgeCallout: { fontSize: 14, fontWeight: 'bold', color: '#B45309', textAlign: 'center', marginBottom: 12 },

  stepDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  stepDot: { width: 24, height: 6, borderRadius: 3, backgroundColor: '#BBF7D0', marginHorizontal: 3 },
  stepDotActive: { backgroundColor: '#16A34A' },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginRight: 8 },
  sectionSub: { fontSize: 13, color: '#166534', textAlign: 'center', marginBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, marginBottom: 10 },
  tile: { width: '28%', aspectRatio: 1, margin: '2.6%', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent', padding: 6 },
  tileSelected: { borderColor: '#16A34A' },
  tileEmoji: { fontSize: 34, marginBottom: 4 },
  tileLabel: { fontSize: 12, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  tileCheck: { position: 'absolute', top: 4, right: 6, fontSize: 18 },
  tileBadge: { position: 'absolute', top: 4, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  tileBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  backButton: { paddingVertical: 14, paddingHorizontal: 20 },
  backButtonText: { fontSize: 14, fontWeight: 'bold', color: '#166534' },
  nextButton: { backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  nextButtonDisabled: { backgroundColor: '#BBF7D0' },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  summaryCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 10, marginBottom: 16, borderWidth: 2, borderColor: '#DCFCE7' },
  summaryLabel: { fontSize: 11, fontWeight: 'bold', color: '#16A34A', letterSpacing: 1, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryEmoji: { fontSize: 26, marginRight: 8 },
  summaryText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  summaryChipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, marginBottom: 8, maxWidth: 140 },
  summaryChipBadge: { fontSize: 12, fontWeight: 'bold', color: '#16A34A', marginRight: 4 },
  summaryChipEmoji: { fontSize: 16, marginRight: 4 },
  summaryChipText: { fontSize: 12, fontWeight: 'bold', color: '#1E293B' },
  summaryEmptyText: { fontSize: 12, color: '#64748B', fontStyle: 'italic' },

  startButton: { backgroundColor: '#16A34A', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 10, marginTop: 6 },
  startButtonText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 14, color: '#166534', fontWeight: 'bold' }
});
