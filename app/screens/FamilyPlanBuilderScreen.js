import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps } from '../context/AccessibilityContext';
import LoadingState from '../components/LoadingState';
import { MEETING_POINT_OPTIONS, FAMILY_MEMBER_OPTIONS, GO_BAG_ITEMS } from '../constants/familyPlan';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import Celebration from '../components/Celebration';

export default function FamilyPlanBuilderScreen({ navigation }) {
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [hadExistingPlan, setHadExistingPlan] = useState(false);
  const [step, setStep] = useState('meeting'); // meeting | calls | bag | review | saved
  const [meetingPointId, setMeetingPointId] = useState(null);
  const [meetingDetail, setMeetingDetail] = useState('');
  const [callOrder, setCallOrder] = useState([]);
  const [goBag, setGoBag] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [justEarnedBadge, setJustEarnedBadge] = useState(false);

  useEffect(() => {
    apiRequest(`/gamification/family-plan?userId=${userId}`, 'GET')
      .then((res) => {
        if (res.familyPlan) {
          setHadExistingPlan(true);
          setMeetingPointId(res.familyPlan.meetingPoint.id);
          setMeetingDetail(res.familyPlan.meetingPoint.detail || '');
          setCallOrder(res.familyPlan.callOrder || []);
          setGoBag(res.familyPlan.goBag || []);
        }
      })
      .catch((err) => console.log('Family plan load error:', err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const toggleCallMember = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCallOrder((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const toggleBagItem = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoBag((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const meetingOpt = MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId);
      const result = await apiRequest('/gamification/family-plan', 'POST', {
        userId,
        meetingPoint: { id: meetingPointId, label: meetingOpt.label, detail: meetingDetail.trim() },
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

  if (step === 'saved') {
    const meetingOpt = MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.center}>
        <Celebration colors={['#16A34A', '#FBBF24', '#38BDF8', '#F472B6']} />
        <BouncyMascot size={48} emoji="🦊📋" />
        <Text style={styles.title}>Your Family Plan is Saved!</Text>
        {justEarnedBadge && <Text style={styles.badgeCallout}>👨‍👩‍👧‍👦 Family Planner badge earned! +40 XP</Text>}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>MEETING POINT</Text>
          <Text style={styles.cardValue}>{meetingOpt.emoji} {meetingOpt.label}{meetingDetail ? ` — ${meetingDetail}` : ''}</Text>

          <Text style={[styles.cardLabel, { marginTop: 16 }]}>WHO TO CALL, IN ORDER</Text>
          {callOrder.map((id, i) => {
            const m = FAMILY_MEMBER_OPTIONS.find((f) => f.id === id);
            return <Text key={id} style={styles.cardValue}>{i + 1}. {m.emoji} {m.label}</Text>;
          })}

          <Text style={[styles.cardLabel, { marginTop: 16 }]}>GO-BAG CHECKLIST</Text>
          {goBag.map((id) => {
            const item = GO_BAG_ITEMS.find((g) => g.id === id);
            return <Text key={id} style={styles.cardValue}>✅ {item.emoji} {item.label}</Text>;
          })}
        </View>

        <BouncyPress
          style={styles.startButton}
          onPress={() => setStep('meeting')}
          accessibilityRole="button"
          accessibilityLabel="Edit my plan"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.startButtonText}>✏️ Edit My Plan</Text>
        </BouncyPress>
        <BouncyPress
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back home"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </BouncyPress>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <BouncyMascot size={48} emoji="🦊👨‍👩‍👧‍👦" />
      <Text style={styles.title}>Family Plan Builder</Text>
      <Text style={styles.introText}>{hadExistingPlan ? 'Edit your family\'s real emergency plan.' : 'Build a real plan your family can use — no timer, just think it through!'}</Text>

      <View style={styles.stepDots}>
        {['meeting', 'calls', 'bag', 'review'].map((s) => (
          <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive]} />
        ))}
      </View>

      {step === 'meeting' && (
        <Animated.View entering={FadeInDown.duration(280)}>
          <Text style={styles.sectionTitle}>Where should your family meet if you can't go home?</Text>
          {MEETING_POINT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionRow, meetingPointId === opt.id && styles.optionSelected]}
              onPress={() => { setMeetingPointId(opt.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: meetingPointId === opt.id }}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          {meetingPointId && (
            <TextInput
              style={styles.input}
              placeholder="Add a detail (e.g. the oak tree by Grandma's yard)"
              placeholderTextColor="#94A3B8"
              value={meetingDetail}
              onChangeText={setMeetingDetail}
              accessibilityLabel="Meeting point detail"
            />
          )}
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
          <Text style={styles.sectionTitle}>Who do you call, and in what order?</Text>
          <Text style={styles.sectionSub}>Tap people in the order your family should call them. Tap again to remove.</Text>

          {callOrder.length > 0 && (
            <View style={styles.chain}>
              {callOrder.map((id, i) => {
                const m = FAMILY_MEMBER_OPTIONS.find((f) => f.id === id);
                return (
                  <View key={id} style={styles.chainRow}>
                    <View style={styles.chainNode}><Text style={styles.chainNodeText}>{i + 1}</Text></View>
                    <TouchableOpacity
                      style={styles.chainItem}
                      onPress={() => toggleCallMember(id)}
                      accessibilityRole="button"
                      accessibilityLabel={m.label}
                      accessibilityHint="Removes this person from the call order"
                      {...touchTargetProps(a11y)}
                    >
                      <Text style={styles.chainItemText}>{m.emoji} {m.label}</Text>
                    </TouchableOpacity>
                    {i < callOrder.length - 1 && <View style={styles.chainLine} />}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.pool}>
            {FAMILY_MEMBER_OPTIONS.filter((m) => !callOrder.includes(m.id)).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.poolChip}
                onPress={() => toggleCallMember(m.id)}
                accessibilityRole="button"
                accessibilityLabel={m.label}
                accessibilityHint="Adds this person to the call order"
                {...touchTargetProps(a11y)}
              >
                <Text style={styles.poolChipText}>{m.emoji} {m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowButtons}>
            <BouncyPress
              style={styles.backButton}
              onPress={() => setStep('meeting')}
              accessibilityRole="button"
              accessibilityLabel="Back"
              {...touchTargetProps(a11y)}
            >
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
          <Text style={styles.sectionTitle}>What should be in your family's go-bag?</Text>
          <Text style={styles.sectionSub}>Tap an item to check it off. Tap it again to see why it matters.</Text>

          {GO_BAG_ITEMS.map((item) => {
            const checked = goBag.includes(item.id);
            return (
              <View key={item.id}>
                <TouchableOpacity
                  style={[styles.checklistRow, checked && styles.checklistRowChecked]}
                  onPress={() => setExpandedItem((cur) => (cur === item.id ? null : item.id))}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityHint={expandedItem === item.id ? 'Hides why this item matters' : 'Shows why this item matters'}
                  {...touchTargetProps(a11y)}
                >
                  <TouchableOpacity
                    onPress={() => toggleBagItem(item.id)}
                    style={[styles.checkbox, checked && styles.checkboxChecked]}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Pack ${item.label}`}
                    accessibilityState={{ checked }}
                    {...touchTargetProps(a11y)}
                  >
                    {checked && <Text style={styles.checkboxMark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={styles.checklistEmoji}>{item.emoji}</Text>
                  <Text style={styles.checklistText}>{item.label}</Text>
                </TouchableOpacity>
                {expandedItem === item.id && (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.whyBox}>
                    <Text style={styles.whyText}>{item.why}</Text>
                  </Animated.View>
                )}
              </View>
            );
          })}

          <View style={styles.rowButtons}>
            <BouncyPress
              style={styles.backButton}
              onPress={() => setStep('calls')}
              accessibilityRole="button"
              accessibilityLabel="Back"
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.backButtonText}>◀ Back</Text>
            </BouncyPress>
            <BouncyPress
              style={styles.nextButton}
              onPress={() => setStep('review')}
              accessibilityRole="button"
              accessibilityLabel="Review"
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.nextButtonText}>Review ▶</Text>
            </BouncyPress>
          </View>
        </Animated.View>
      )}

      {step === 'review' && (
        <Animated.View entering={FadeInDown.duration(280)}>
          <Text style={styles.sectionTitle}>Here's your plan!</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MEETING POINT</Text>
            <Text style={styles.cardValue}>
              {MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId)?.emoji} {MEETING_POINT_OPTIONS.find((m) => m.id === meetingPointId)?.label}
              {meetingDetail ? ` — ${meetingDetail}` : ''}
            </Text>
            <Text style={[styles.cardLabel, { marginTop: 16 }]}>WHO TO CALL, IN ORDER</Text>
            {callOrder.map((id, i) => {
              const m = FAMILY_MEMBER_OPTIONS.find((f) => f.id === id);
              return <Text key={id} style={styles.cardValue}>{i + 1}. {m.emoji} {m.label}</Text>;
            })}
            <Text style={[styles.cardLabel, { marginTop: 16 }]}>GO-BAG CHECKLIST</Text>
            {goBag.length === 0 && <Text style={styles.cardValue}>No items checked yet</Text>}
            {goBag.map((id) => {
              const item = GO_BAG_ITEMS.find((g) => g.id === id);
              return <Text key={id} style={styles.cardValue}>✅ {item.emoji} {item.label}</Text>;
            })}
          </View>

          <View style={styles.rowButtons}>
            <BouncyPress
              style={styles.backButton}
              onPress={() => setStep('bag')}
              accessibilityRole="button"
              accessibilityLabel="Back"
              {...touchTargetProps(a11y)}
            >
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
              <Text style={styles.nextButtonText}>{saving ? 'Saving...' : '💾 Save My Plan'}</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  introText: { fontSize: 14, color: '#166534', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  badgeCallout: { fontSize: 14, fontWeight: 'bold', color: '#B45309', textAlign: 'center', marginBottom: 16 },

  stepDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  stepDot: { width: 24, height: 6, borderRadius: 3, backgroundColor: '#BBF7D0', marginHorizontal: 3 },
  stepDotActive: { backgroundColor: '#16A34A' },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 6, textAlign: 'center' },
  sectionSub: { fontSize: 13, color: '#166534', textAlign: 'center', marginBottom: 14 },

  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: '#DCFCE7', padding: 14, marginBottom: 10 },
  optionSelected: { borderColor: '#16A34A', backgroundColor: '#ECFDF5' },
  optionEmoji: { fontSize: 22, marginRight: 10 },
  optionText: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#DCFCE7', padding: 12, marginBottom: 14, color: '#1E293B' },

  chain: { marginBottom: 14 },
  chainRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  chainNode: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chainNodeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  chainItem: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#16A34A', padding: 10, marginBottom: 18 },
  chainItemText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  chainLine: { position: 'absolute', left: 13, top: 28, width: 2, height: 18, backgroundColor: '#16A34A' },

  pool: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  poolChip: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 2, borderColor: '#DCFCE7', paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, marginBottom: 8 },
  poolChipText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },

  checklistRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#DCFCE7', padding: 12, marginBottom: 4 },
  checklistRowChecked: { borderColor: '#16A34A', backgroundColor: '#ECFDF5' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#16A34A' },
  checkboxMark: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  checklistEmoji: { fontSize: 18, marginRight: 8 },
  checklistText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
  whyBox: { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 10, marginBottom: 10, marginLeft: 34 },
  whyText: { fontSize: 12, color: '#166534', lineHeight: 17 },

  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  backButton: { paddingVertical: 14, paddingHorizontal: 20 },
  backButtonText: { fontSize: 14, fontWeight: 'bold', color: '#166534' },
  nextButton: { backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  nextButtonDisabled: { backgroundColor: '#BBF7D0' },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 2, borderColor: '#DCFCE7' },
  cardLabel: { fontSize: 11, fontWeight: 'bold', color: '#16A34A', letterSpacing: 1, marginBottom: 6 },
  cardValue: { fontSize: 14, color: '#1E293B', marginBottom: 4, fontWeight: '600' },

  startButton: { backgroundColor: '#16A34A', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 10 },
  startButtonText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { fontSize: 14, color: '#166534', fontWeight: 'bold' }
});
