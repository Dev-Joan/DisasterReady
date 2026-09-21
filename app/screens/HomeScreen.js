import React, { useState, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import CountUpNumber from '../components/CountUpNumber';
import BouncyPress from '../components/BouncyPress';
import BouncyMascot from '../components/BouncyMascot';
import SkyDecor from '../components/SkyDecor';
import FlameFlicker from '../components/FlameFlicker';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { EMERGENCY_COLORS, EMERGENCY_OVERRIDE, isSevereAlert } from '../constants/colors';
import { SPACING, TYPE, TYPE_SENIOR, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

const KID = AGE_PALETTES.child;
const TEEN = AGE_PALETTES.teen;
const ADULT = AGE_PALETTES.adult;
const SENIOR = AGE_PALETTES.elderly;

const KID_BADGES = [
  { id: 'flood_kids', emoji: '🌊', label: 'Flood Hero' },
  { id: 'earthquake_kids', emoji: '🏚️', label: 'Quake Hero' },
  { id: 'fire_kids', emoji: '🔥', label: 'Fire Hero' },
  { id: 'streak_7', emoji: '🔥', label: '7-Day Streak' },
  { id: 'rank_prepared', emoji: '🛡️', label: 'Prepared' }
];

// Hazard-identity colors (not age-identity) — flood/earthquake/fire keep their
// own meaning across the whole app regardless of which age mode is viewing them.
const KID_QUESTS = [
  { hazard: 'flood', emoji: '🌊', title: 'Flood Rescue', color: '#38BDF8', desc: 'Beat the rising water!' },
  { hazard: 'earthquake', emoji: '🏚️', title: 'Quake Ready', color: '#F59E0B', desc: 'Stay safe when it shakes!' },
  { hazard: 'fire', emoji: '🔥', title: 'Fire Escape', color: '#EF4444', desc: 'Get out fast and stay low!' }
];

export default function HomeScreen({ navigation }) {
  const { userId, username } = useUser();
  const { theme, setThemeName } = useTheme();
  const { settings: a11y, setFlags: setA11yFlags } = useAccessibility();
  const [profile, setProfile] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const themeHydrated = useRef(false);

  const loadData = async () => {
    try {
      const profileResult = await apiRequest(`/onboarding/profile?userId=${userId}`, 'GET');
      setProfile(profileResult);
      setLoadError(false);
      if (!themeHydrated.current) {
        themeHydrated.current = true;
        if (profileResult.theme) setThemeName(profileResult.theme);
        setA11yFlags(profileResult.accessibilityFlags || []);
      }
      const gamResult = await apiRequest('/gamification/login', 'POST', { userId });
      setGamification(gamResult);
      const alertsResult = await apiRequest(`/alerts/active?userId=${userId}`, 'GET');
      setAlerts(alertsResult.alerts);
    } catch (err) {
      console.log('Home load error:', err.message);
      if (!profile || !gamification) setLoadError(true);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [userId]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const showAll = !a11y.simplifiedNavigation || showMore;

  const SettingsGear = ({ color }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      accessibilityRole="button"
      accessibilityLabel="Settings"
      accessibilityHint="Opens app settings, including theme and accessibility options"
      {...touchTargetProps(a11y, { hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } })}
    >
      <MaterialCommunityIcons name="cog-outline" size={24} color={color} />
    </TouchableOpacity>
  );

  const HeaderIcons = ({ color }) => (
    <View style={styles.headerIconsRow}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        accessibilityRole="button"
        accessibilityLabel="Profile"
        accessibilityHint="View and edit your profile, stats, and badges"
        style={{ marginRight: SPACING.lg }}
        {...touchTargetProps(a11y, { hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } })}
      >
        <MaterialCommunityIcons name="account-circle-outline" size={24} color={color} />
      </TouchableOpacity>
      <SettingsGear color={color} />
    </View>
  );

  const ShowMoreToggle = ({ tintColor }) =>
    a11y.simplifiedNavigation ? (
      <TouchableOpacity
        onPress={() => setShowMore((s) => !s)}
        accessibilityRole="button"
        accessibilityLabel={showMore ? 'Show fewer options' : 'Show more options'}
        style={styles.showMoreBtn}
        {...touchTargetProps(a11y)}
      >
        <Text style={[styles.showMoreText, { color: tintColor }]}>
          {showMore ? '▲ Show fewer options' : '▼ Show more options'}
        </Text>
      </TouchableOpacity>
    ) : null;

  if (loadError && (!profile || !gamification)) {
    return <ErrorState message="Couldn't load your home screen. Please check your connection." onRetry={loadData} />;
  }

  if (!profile || !gamification) {
    return <LoadingState message="Loading your home screen..." />;
  }

  const mode = profile.experienceMode || 'adult';
  const hasActiveAlert = alerts.length > 0;
  const severeAlertActive = hasActiveAlert && isSevereAlert(alerts[0]);

  // When a severe alert is active, key surfaces override the age theme with
  // the universal emergency palette so alerts read the same in every mode.
  const surface = severeAlertActive
    ? { bg: EMERGENCY_OVERRIDE.background, text: EMERGENCY_OVERRIDE.text, textSub: EMERGENCY_OVERRIDE.textSub }
    : { bg: theme.bg, text: theme.text, textSub: theme.textSub };

  const AlertBanner = () =>
    hasActiveAlert ? (
      <TouchableOpacity
        style={styles.alertBanner}
        onPress={() => navigation.navigate('Alerts')}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        accessibilityLabel={`${isSevereAlert(alerts[0]) ? 'Active alert' : 'Weather alert'}: ${alerts[0].message}`}
        {...touchTargetProps(a11y)}
      >
        <Text style={styles.alertBannerText}>
          ⚠️ {isSevereAlert(alerts[0]) ? 'ACTIVE ALERT' : 'WEATHER ALERT'}: {alerts[0].message}
        </Text>
      </TouchableOpacity>
    ) : null;

  if (mode === 'child') {
    const xpInRank = gamification.points % 100;
    return (
      <ScrollView style={{ backgroundColor: severeAlertActive ? EMERGENCY_OVERRIDE.background : KID.cream }} contentContainerStyle={styles.kidContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={[styles.kidHeader, severeAlertActive && { backgroundColor: EMERGENCY_OVERRIDE.primary }]}>
          {!severeAlertActive && <SkyDecor />}
          <View style={styles.kidTopBar}>
            <HeaderIcons color="#fff" />
          </View>
          <View style={styles.kidHeaderTop}>
            <View style={styles.kidGreetingRow}>
              <BouncyMascot size={40} style={styles.kidMascot} />
              <View>
                <Text style={styles.kidHello}>Hello, Safety Hero!</Text>
                <Text style={styles.kidName}>{profile.name || username} 🌟</Text>
              </View>
            </View>
            <View style={styles.kidStreakPill}>
              <FlameFlicker style={styles.kidStreakFlame}>🔥</FlameFlicker>
              <Text style={styles.kidStreakText}> {gamification.currentStreak} day streak!</Text>
            </View>
          </View>
          <View style={styles.kidRankCard}>
            <View style={styles.kidRankRow}>
              <Text style={styles.kidRankTitle}>🛡️ {gamification.rank}</Text>
              <CountUpNumber value={gamification.points} suffix=" XP" style={styles.kidRankXp} />
            </View>
            <View style={{ marginBottom: SPACING.sm - 2 }}>
              <AnimatedProgressBar
                progress={Math.min(100, xpInRank)}
                trackColor="rgba(255,255,255,0.4)"
                fillColor="#fff"
                height={10}
              />
            </View>
            <Text style={styles.kidXpLabel}>{100 - xpInRank} XP until your next reward! 🚀</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeRow} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
          {KID_BADGES.map((badge, i) => {
            const earned = gamification.badges.includes(badge.id);
            return (
              <Animated.View key={badge.id} entering={FadeInDown.delay(i * 60).duration(300)} style={[styles.badgeChip, !earned && styles.badgeChipLocked]} accessibilityLabel={`${badge.label}: ${earned ? 'earned' : 'locked'}`}>
                <Text style={styles.badgeEmoji}>{earned ? badge.emoji : '🔒'}</Text>
                <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>{badge.label}</Text>
              </Animated.View>
            );
          })}
        </ScrollView>

        <View style={styles.missionCard}>
          <Text style={styles.missionTag}>⭐ TODAY'S MISSION</Text>
          <Text style={styles.missionTitle}>Become a Safety Hero for every disaster!</Text>
          <View style={styles.missionRewards}>
            <View style={styles.rewardPill}><Text style={styles.rewardPillText}>+30 XP</Text></View>
            <View style={styles.rewardPill}><Text style={styles.rewardPillText}>🏅 Badges</Text></View>
          </View>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🎮 Safety Adventures</Text></View>

        {KID_QUESTS.map((quest, i) => (
          <Animated.View key={quest.hazard} entering={FadeInDown.delay(i * 90).duration(340).springify().damping(14)}>
            <BouncyPress
              style={[styles.questCard, { backgroundColor: quest.color }, touchTargetStyle(a11y, 70)]}
              onPress={() => navigation.navigate('KitBuilder', { hazard: quest.hazard })}
              accessibilityRole="button"
              accessibilityLabel={`${quest.title}. ${quest.desc}. 4 levels.`}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.questEmoji}>{quest.emoji}</Text>
              <View style={styles.questInfo}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                <Text style={styles.questSub}>{quest.desc}</Text>
                <Text style={styles.questMeta}>4 levels · Play now ▶</Text>
              </View>
            </BouncyPress>
          </Animated.View>
        ))}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>📖 Story Mode</Text></View>
        <Animated.View entering={FadeInDown.delay(KID_QUESTS.length * 90).duration(340).springify().damping(14)}>
          <BouncyPress
            style={[styles.storyCard, touchTargetStyle(a11y, 70)]}
            onPress={() => navigation.navigate('Story')}
            accessibilityRole="button"
            accessibilityLabel="Story Mode, Chapter 1: Max and Mia and the Rising River. Read now for 30 XP."
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.storyTag}>🌟 CHAPTER 1</Text>
            <Text style={styles.storyTitle}>Max & Mia and the Rising River — help them get ready! ⛈️</Text>
            <View style={styles.storyRow}>
              <View style={styles.storyButton}><Text style={styles.storyButtonText}>READ NOW ▶</Text></View>
              <Text style={styles.storyXp}>💰 +30 XP on complete</Text>
            </View>
          </BouncyPress>
        </Animated.View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🌟 More Missions</Text></View>

        <Animated.View entering={FadeInDown.delay((KID_QUESTS.length + 1) * 90).duration(340).springify().damping(14)}>
          <BouncyPress
            style={[styles.questCard, { backgroundColor: '#6D5BD0' }, touchTargetStyle(a11y, 70)]}
            onPress={() => navigation.navigate('DispatchHero')}
            accessibilityRole="button"
            accessibilityLabel="Dispatch Hero. Rank emergencies and send a clear message."
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.questEmoji}>📞</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Dispatch Hero</Text>
              <Text style={styles.questSub}>Rank emergencies and send a clear message!</Text>
              <Text style={styles.questMeta}>Play now ▶</Text>
            </View>
          </BouncyPress>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay((KID_QUESTS.length + 2) * 90).duration(340).springify().damping(14)}>
          <BouncyPress
            style={[styles.questCard, { backgroundColor: '#16A34A' }, touchTargetStyle(a11y, 70)]}
            onPress={() => navigation.navigate('FamilyPlanBuilder')}
            accessibilityRole="button"
            accessibilityLabel="Family Plan Builder. Build a real emergency plan for your family."
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.questEmoji}>👨‍👩‍👧‍👦</Text>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Family Plan Builder</Text>
              <Text style={styles.questSub}>Build a real emergency plan for your family!</Text>
              <Text style={styles.questMeta}>No timer · Play now ▶</Text>
            </View>
          </BouncyPress>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay((KID_QUESTS.length + 3) * 90).duration(340).springify().damping(14)}>
          <BouncyPress
            style={[styles.leaderboardCard, touchTargetStyle(a11y, 56)]}
            onPress={() => navigation.navigate('Leaderboard')}
            accessibilityRole="button"
            accessibilityLabel="Class Leaderboard"
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.leaderboardText}>🏆 Class Leaderboard</Text>
          </BouncyPress>
        </Animated.View>
      </ScrollView>
    );
  }

  if (mode === 'teen') {
    return (
      <ScrollView style={{ backgroundColor: surface.bg }} contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={surface.text} />}>
        <AlertBanner />
        <View style={styles.teenHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.teenGreeting, { color: surface.text }]}>Hey, {profile.name || username} 👋</Text>
            <Text style={[styles.teenSub, { color: surface.textSub }]}>{gamification.rank} · {gamification.points} XP</Text>
          </View>
          <HeaderIcons color={surface.textSub} />
        </View>
        <View style={styles.teenStatsRow}>
          <View style={[styles.teenStatBox, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityLabel={`${gamification.currentStreak} day streak`}><CountUpNumber value={gamification.currentStreak} style={styles.teenStatNumber} /><Text style={[styles.teenStatLabel, { color: theme.textSub }]}>Day Streak</Text></View>
          <View style={[styles.teenStatBox, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityLabel={`${gamification.badges.length} badges earned`}><CountUpNumber value={gamification.badges.length} style={styles.teenStatNumber} /><Text style={[styles.teenStatLabel, { color: theme.textSub }]}>Badges</Text></View>
          <View style={[styles.teenStatBox, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityLabel={`Best streak ${gamification.longestStreak} days`}><CountUpNumber value={gamification.longestStreak} style={styles.teenStatNumber} /><Text style={[styles.teenStatLabel, { color: theme.textSub }]}>Best Streak</Text></View>
        </View>
        <Animated.View entering={FadeInDown.delay(0).duration(320)}>
          <TouchableOpacity
            style={[styles.teenCta, { backgroundColor: TEEN.teal }, touchTargetStyle(a11y, 60)]}
            onPress={() => navigation.navigate('LearningPath')}
            accessibilityRole="button"
            accessibilityLabel="Preparedness Path. Lesson-by-lesson learning, unlock as you go."
            {...touchTargetProps(a11y)}
          >
            <Text style={styles.teenCtaTitle}>📚 Preparedness Path</Text>
            <Text style={styles.teenCtaSub}>Lesson-by-lesson learning — unlock as you go</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(70).duration(320)}>
          <TouchableOpacity
            style={[styles.teenCard, { backgroundColor: theme.card, borderColor: SEMANTIC.critical }, touchTargetStyle(a11y, 56)]}
            onPress={() => navigation.navigate('FirstAid')}
            accessibilityRole="button"
            accessibilityLabel="First Aid Guides"
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.teenCardText, { color: theme.text }]}>🚑 First Aid Guides</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(140).duration(320)}>
          <TouchableOpacity
            style={[styles.teenCard, { backgroundColor: theme.card, borderColor: SEMANTIC.signal }, touchTargetStyle(a11y, 56)]}
            onPress={() => navigation.navigate('Alerts')}
            accessibilityRole="button"
            accessibilityLabel="Alerts Near You"
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.teenCardText, { color: theme.text }]}>🚨 Alerts Near You</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(175).duration(320)}>
          <TouchableOpacity
            style={[styles.teenCard, { backgroundColor: theme.card, borderColor: TEEN.teal }, touchTargetStyle(a11y, 56)]}
            onPress={() => navigation.navigate('Weather')}
            accessibilityRole="button"
            accessibilityLabel="Weather, current conditions and forecast"
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.teenCardText, { color: theme.text }]}>⛅ Weather</Text>
          </TouchableOpacity>
        </Animated.View>

        {showAll && (
          <>
            <Animated.View entering={FadeInDown.delay(210).duration(320)}>
              <TouchableOpacity
                style={[styles.teenCta, { backgroundColor: TEEN.coral }, touchTargetStyle(a11y, 60)]}
                onPress={() => navigation.navigate('Quiz')}
                accessibilityRole="button"
                accessibilityLabel="Start Drill. Adaptive quiz, difficulty scales with you."
                {...touchTargetProps(a11y)}
              >
                <Text style={styles.teenCtaTitle}>⚡ Start Drill</Text>
                <Text style={styles.teenCtaSub}>Adaptive quiz — difficulty scales with you</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(280).duration(320)}>
              <TouchableOpacity
                style={[styles.teenCard, { backgroundColor: theme.card, borderColor: TEEN.teal }, touchTargetStyle(a11y, 56)]}
                onPress={() => navigation.navigate('KitBuilder', { hazard: 'flood' })}
                accessibilityRole="button"
                accessibilityLabel="Kit Builder Challenge"
                {...touchTargetProps(a11y)}
              >
                <Text style={[styles.teenCardText, { color: theme.text }]}>🎒 Kit Builder Challenge</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(350).duration(320)}>
              <TouchableOpacity
                style={[styles.teenCard, { backgroundColor: theme.card, borderColor: TEEN.indigo }, touchTargetStyle(a11y, 56)]}
                onPress={() => navigation.navigate('Leaderboard')}
                accessibilityRole="button"
                accessibilityLabel="Leaderboard"
                {...touchTargetProps(a11y)}
              >
                <Text style={[styles.teenCardText, { color: theme.text }]}>🏆 Leaderboard</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(420).duration(320)}>
              <TouchableOpacity
                style={[styles.teenCard, { backgroundColor: theme.card, borderColor: TEEN.teal }, touchTargetStyle(a11y, 56)]}
                onPress={() => navigation.navigate('Chatbot')}
                accessibilityRole="button"
                accessibilityLabel="Preparedness Assistant chatbot"
                {...touchTargetProps(a11y)}
              >
                <Text style={[styles.teenCardText, { color: theme.text }]}>💬 Preparedness Assistant</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        <ShowMoreToggle tintColor={surface.textSub} />
      </ScrollView>
    );
  }

  if (mode === 'elderly') {
    // Fewer things, in a fixed calm order — first aid and alerts are safety
    // essentials so they always stay visible; audio is promoted into the
    // default three per "prominent audio", everything else waits behind
    // "Show more" rather than crowding the first screen.
    const SENIOR_PRIMARY = [
      { icon: '🚑', title: 'First Aid Guides', route: 'FirstAid', emergency: true, label: 'First Aid Guides' },
      { icon: '🚨', title: 'Alerts Near You', route: 'Alerts', label: 'Alerts Near You' },
      { icon: '🎧', title: 'Listen & Learn', route: 'AudioPlayer', label: 'Listen and Learn, audio guides' }
    ];
    const SENIOR_MORE = [
      { icon: '⛅', title: 'Weather', route: 'Weather', label: 'Weather, current conditions and forecast' },
      { icon: '📰', title: 'Read Articles', route: 'Resources', label: 'Read Articles' },
      { icon: '🧠', title: 'Daily Quiz', route: 'Quiz', label: 'Daily Quiz' },
      { icon: '🏆', title: 'Knowledge Check', route: 'KnowledgeCheck', label: 'Knowledge Check' },
      { icon: '💬', title: 'Ask a Question', route: 'Chatbot', label: 'Ask a Question, preparedness assistant' }
    ];
    const seniorItems = showAll ? [...SENIOR_PRIMARY, ...SENIOR_MORE] : SENIOR_PRIMARY;

    return (
      <ScrollView style={{ backgroundColor: surface.bg }} contentContainerStyle={styles.seniorContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <AlertBanner />
        <View style={styles.seniorHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.seniorGreeting, { color: surface.textSub }]}>Good day,</Text>
            <Text style={[styles.seniorName, { color: surface.text }]}>{profile.name || username}</Text>
          </View>
          <HeaderIcons color={surface.textSub} />
        </View>
        <View style={styles.seniorScoreCard}>
          <Text style={styles.seniorScoreLabel}>Your progress</Text>
          <Text style={styles.seniorScoreText}>{gamification.points} points · {gamification.rank}</Text>
          <Text style={styles.seniorStreakText}>{gamification.currentStreak}-day learning streak</Text>
        </View>

        {seniorItems.map((item, i) => (
          <Animated.View key={item.title} entering={FadeInDown.delay(i * 170).duration(560)}>
            <TouchableOpacity
              style={[styles.seniorButton, item.emergency && styles.seniorEmergency, touchTargetStyle(a11y, 68)]}
              onPress={() => navigation.navigate(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              {...touchTargetProps(a11y)}
            >
              <Text style={styles.seniorButtonIcon}>{item.icon}</Text>
              <Text style={[styles.seniorButtonText, item.emergency && styles.seniorEmergencyText]}>{item.title}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <ShowMoreToggle tintColor={surface.textSub} />
      </ScrollView>
    );
  }

  // A data-driven tile grid, not a stack of full-width cards — this is what
  // makes adult read as an efficient dashboard: more of it is visible in one
  // screen's height than the equivalent stacked-card layout ever showed.
  const ADULT_TILES = [
    { icon: 'weather-partly-cloudy', title: 'Weather', sub: 'Current & forecast', route: 'Weather', accent: ADULT.sage },
    { icon: 'clipboard-check-outline', title: 'Daily Tasks', sub: "Today's action", route: 'Tasks', accent: ADULT.navy },
    { icon: 'book-open-variant', title: 'Resource Hub', sub: 'Guides & videos', route: 'Resources', accent: ADULT.sage },
    { icon: 'bell-alert-outline', title: 'Live Alerts', sub: hasActiveAlert ? `${alerts.length} active` : 'All clear', route: 'Alerts', accent: hasActiveAlert ? SEMANTIC.critical : ADULT.navy },
    { icon: 'brain', title: 'Adaptive Quiz', sub: 'Scenario drills', route: 'Quiz', accent: ADULT.navy },
    { icon: 'school-outline', title: 'Knowledge Check', sub: '100 questions', route: 'KnowledgeCheck', accent: ADULT.amber },
    { icon: 'bag-personal-outline', title: 'Kit Builder', sub: 'Build your kit', route: 'KitBuilder', params: { hazard: 'flood' }, accent: ADULT.sage },
    { icon: 'chat-processing-outline', title: 'Assistant', sub: 'Ask a question', route: 'Chatbot', accent: ADULT.sage },
    { icon: 'trophy-variant-outline', title: 'Leaderboard', sub: 'See your rank', route: 'Leaderboard', accent: ADULT.sage }
  ];
  const adultTiles = showAll ? ADULT_TILES : ADULT_TILES.slice(0, 4);

  return (
    <ScrollView style={{ backgroundColor: surface.bg }} contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <AlertBanner />
      <View style={styles.adultHeaderRow}>
        <Text style={[styles.adultGreeting, { color: surface.text }]}>{profile.name || username}</Text>
        <HeaderIcons color={surface.textSub} />
      </View>

      <View style={styles.adultStatsStrip}>
        <View style={[styles.adultStatChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.adultStatChipValue, { color: theme.text }]}>{gamification.rank}</Text>
          <Text style={[styles.adultStatChipLabel, { color: surface.textSub }]}>Rank</Text>
        </View>
        <View style={[styles.adultStatChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <CountUpNumber value={gamification.points} style={[styles.adultStatChipValue, { color: theme.text }]} />
          <Text style={[styles.adultStatChipLabel, { color: surface.textSub }]}>XP</Text>
        </View>
        <View style={[styles.adultStatChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <CountUpNumber value={gamification.currentStreak} style={[styles.adultStatChipValue, { color: theme.text }]} />
          <Text style={[styles.adultStatChipLabel, { color: surface.textSub }]}>Streak</Text>
        </View>
        <View style={[styles.adultStatChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.adultStatChipValue, { color: hasActiveAlert ? SEMANTIC.critical : theme.text }]}>{alerts.length}</Text>
          <Text style={[styles.adultStatChipLabel, { color: surface.textSub }]}>Alerts</Text>
        </View>
      </View>

      <Animated.View entering={FadeIn.duration(200)}>
        <TouchableOpacity
          style={[styles.adultHero, touchTargetStyle(a11y, 56)]}
          onPress={() => navigation.navigate('FirstAid')}
          accessibilityRole="button"
          accessibilityLabel="First Aid Guides. CPR, burns, bleeding, and disaster response."
          {...touchTargetProps(a11y)}
        >
          <MaterialCommunityIcons name="medical-bag" size={22} color="#fff" />
          <View style={{ flex: 1, marginLeft: SPACING.sm + 2 }}>
            <Text style={styles.adultHeroTitle}>First Aid Guides</Text>
            <Text style={styles.adultHeroSub}>CPR, burns, bleeding, and disaster response</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.adultSectionTitle, { color: surface.text }]}>Your Preparedness</Text>

      <View style={styles.adultGrid}>
        {adultTiles.map((tile, i) => (
          <Animated.View key={tile.title} entering={FadeIn.delay(i * 35).duration(180)} style={styles.adultTileWrap}>
            <TouchableOpacity
              style={[styles.adultTile, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: tile.accent }, touchTargetStyle(a11y, 56)]}
              onPress={() => navigation.navigate(tile.route, tile.params)}
              accessibilityRole="button"
              accessibilityLabel={`${tile.title}. ${tile.sub}`}
              {...touchTargetProps(a11y)}
            >
              <MaterialCommunityIcons name={tile.icon} size={20} color={tile.accent} />
              <Text style={[styles.adultTileTitle, { color: theme.text }]}>{tile.title}</Text>
              <Text style={[styles.adultTileSub, { color: theme.textSub }]} numberOfLines={1}>{tile.sub}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <ShowMoreToggle tintColor={surface.textSub} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  alertBanner: { backgroundColor: EMERGENCY_COLORS.critical, borderRadius: SPACING.sm, padding: SPACING.md, marginBottom: SPACING.lg },
  alertBannerText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.caption.fontSize + 1 },
  headerIconsRow: { flexDirection: 'row', alignItems: 'center' },
  showMoreBtn: { alignItems: 'center', paddingVertical: SPACING.md + 2, marginTop: SPACING.xs },
  showMoreText: { fontWeight: 'bold', fontSize: TYPE.body.fontSize - 1 },

  // ---- KID ----
  kidContainer: { paddingBottom: SPACING.huge },
  kidHeader: { backgroundColor: KID.gold, paddingTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl, borderBottomLeftRadius: RADII.child.card, borderBottomRightRadius: RADII.child.card, overflow: 'hidden', position: 'relative' },
  kidTopBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SPACING.xs },
  kidHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  kidGreetingRow: { flexDirection: 'row', alignItems: 'center' },
  kidMascot: { marginRight: SPACING.sm },
  kidHello: { fontSize: TYPE.caption.fontSize + 1, color: '#FFF3D6', fontWeight: 'bold' },
  kidName: { fontSize: TYPE.display.fontSize, fontWeight: 'bold', color: '#fff' },
  kidStreakPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADII.child.chip, paddingVertical: SPACING.sm - 2, paddingHorizontal: SPACING.md },
  kidStreakFlame: { fontSize: TYPE.caption.fontSize },
  kidStreakText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.caption.fontSize },
  kidRankCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADII.child.card, padding: SPACING.md + 2 },
  kidRankRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  kidRankTitle: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize },
  kidRankXp: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize },
  kidXpLabel: { color: '#FFF3D6', fontSize: TYPE.caption.fontSize, fontWeight: 'bold' },
  badgeRow: { marginTop: SPACING.lg, marginBottom: SPACING.xs },
  badgeChip: { alignItems: 'center', backgroundColor: '#E8FBF3', borderRadius: RADII.child.chip, borderWidth: 2, borderColor: KID.mint, paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md, marginRight: SPACING.sm + 2, width: 84 },
  badgeChipLocked: { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', borderStyle: 'dashed' },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: { fontSize: 10, fontWeight: 'bold', color: '#065F46', marginTop: SPACING.xs, textAlign: 'center' },
  badgeLabelLocked: { color: '#94A3B8' },
  missionCard: { backgroundColor: KID.skyBlue, borderRadius: RADII.child.card, padding: SPACING.lg + 2, marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
  missionTag: { color: '#E0F2FE', fontSize: TYPE.caption.fontSize - 1, fontWeight: 'bold', letterSpacing: 1, marginBottom: SPACING.xs },
  missionTitle: { color: '#fff', fontSize: TYPE.title.fontSize - 2, fontWeight: 'bold', marginBottom: SPACING.sm + 2 },
  missionRewards: { flexDirection: 'row' },
  rewardPill: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADII.child.chip - 8, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm + 2, marginRight: SPACING.sm },
  rewardPillText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.caption.fontSize },
  sectionHeader: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xxl - 2, marginBottom: SPACING.sm + 2 },
  sectionTitle: { fontSize: TYPE.title.fontSize - 3, fontWeight: 'bold', color: KID.text },
  questCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.child.card, padding: SPACING.lg + 2, marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  questEmoji: { fontSize: 44, marginRight: SPACING.lg },
  questInfo: { flex: 1 },
  questTitle: { fontSize: TYPE.title.fontSize, fontWeight: 'bold', color: '#fff' },
  questSub: { fontSize: TYPE.caption.fontSize + 1, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  questMeta: { fontSize: TYPE.caption.fontSize, color: '#fff', fontWeight: 'bold', marginTop: SPACING.sm },
  storyCard: { backgroundColor: '#6D5BD0', borderRadius: RADII.child.card, padding: SPACING.lg + 2, marginHorizontal: SPACING.lg },
  storyTag: { color: '#DDD6FE', fontSize: TYPE.caption.fontSize - 1, fontWeight: 'bold', letterSpacing: 1, marginBottom: SPACING.sm - 2 },
  storyTitle: { color: '#fff', fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold', marginBottom: SPACING.md + 2, lineHeight: 22 },
  storyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storyButton: { backgroundColor: '#fff', borderRadius: RADII.child.button - 6, paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.lg + 2 },
  storyButtonText: { color: '#6D5BD0', fontWeight: 'bold', fontSize: TYPE.caption.fontSize + 1 },
  storyXp: { color: '#DDD6FE', fontSize: TYPE.caption.fontSize, fontWeight: 'bold' },
  leaderboardCard: { backgroundColor: KID.mint, borderRadius: RADII.child.card, padding: SPACING.lg + 2, marginHorizontal: SPACING.lg, marginTop: SPACING.md + 2, alignItems: 'center' },
  leaderboardText: { color: '#fff', fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold' },

  // ---- TEEN ----
  teenHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg },
  teenGreeting: { fontSize: TYPE.display.fontSize, fontWeight: 'bold', marginBottom: SPACING.xs },
  teenSub: { fontSize: TYPE.body.fontSize - 1 },
  teenStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl },
  teenStatBox: { flex: 1, borderRadius: RADII.teen.card, borderWidth: 1, padding: SPACING.md + 2, marginHorizontal: SPACING.xs, alignItems: 'center' },
  teenStatNumber: { fontSize: TYPE.title.fontSize + 2, fontWeight: 'bold', color: TEEN.teal },
  teenStatLabel: { fontSize: TYPE.caption.fontSize - 1, marginTop: SPACING.xs },
  teenCta: { borderRadius: RADII.teen.card + 2, padding: SPACING.xl, marginBottom: SPACING.lg },
  teenCtaTitle: { fontSize: TYPE.title.fontSize - 2, fontWeight: 'bold', color: '#fff' },
  teenCtaSub: { fontSize: TYPE.caption.fontSize + 1, color: '#FFE1E1', marginTop: SPACING.xs },
  teenCard: { borderRadius: RADII.teen.card, borderWidth: 1, padding: SPACING.lg + 2, marginBottom: SPACING.md },
  teenCardText: { fontSize: TYPE.body.fontSize + 1, fontWeight: 'bold' },

  // ---- SENIOR ---- calm: one column, generous space, no decorative
  // accents, slow gentle motion (see FadeInDown durations above).
  seniorContainer: { padding: SPACING.xl, paddingBottom: SPACING.huge + SPACING.xl },
  seniorHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.xxl },
  seniorGreeting: { fontSize: TYPE_SENIOR.body.fontSize },
  seniorName: { fontSize: TYPE_SENIOR.display.fontSize, fontWeight: 'bold' },
  seniorScoreCard: { backgroundColor: SENIOR.navy, borderRadius: RADII.elderly.card, padding: SPACING.xxl, marginBottom: SPACING.xxl },
  seniorScoreLabel: { fontSize: TYPE_SENIOR.body.fontSize - 2, color: '#BFDBFE' },
  seniorScoreText: { fontSize: TYPE_SENIOR.title.fontSize, fontWeight: 'bold', color: '#fff', marginVertical: SPACING.sm },
  seniorStreakText: { fontSize: TYPE_SENIOR.body.fontSize - 2, color: '#BFDBFE' },
  seniorButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: SENIOR.navy, borderRadius: RADII.elderly.card, paddingVertical: SPACING.xxl - 2, paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg + 4 },
  seniorButtonIcon: { fontSize: 28, marginRight: SPACING.lg },
  seniorButtonText: { fontSize: TYPE_SENIOR.title.fontSize - 2, fontWeight: 'bold', color: '#fff' },
  seniorEmergency: { backgroundColor: SEMANTIC.critical },
  seniorEmergencyText: { fontSize: TYPE_SENIOR.title.fontSize - 2, fontWeight: 'bold', color: '#fff' },

  // ---- ADULT ---- dense: a stats strip, a compact tile grid, minimal
  // per-item copy, fast/subtle motion (see FadeIn above, no spring bounce).
  adultHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  adultGreeting: { fontSize: TYPE.title.fontSize + 4, fontWeight: 'bold' },
  adultSectionTitle: { fontSize: TYPE.caption.fontSize, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.xs, textTransform: 'uppercase' },

  adultStatsStrip: { flexDirection: 'row', marginBottom: SPACING.md, marginHorizontal: -SPACING.xs },
  adultStatChip: { flex: 1, borderRadius: RADII.adult.chip, borderWidth: 1, paddingVertical: SPACING.sm, marginHorizontal: SPACING.xs, alignItems: 'center' },
  adultStatChipValue: { fontSize: TYPE.body.fontSize, fontWeight: 'bold' },
  adultStatChipLabel: { fontSize: 10, marginTop: 1 },

  adultHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: SEMANTIC.critical, borderRadius: RADII.adult.card, padding: SPACING.md + 2, marginBottom: SPACING.lg },
  adultHeroTitle: { fontSize: TYPE.body.fontSize, fontWeight: 'bold', color: '#fff' },
  adultHeroSub: { fontSize: TYPE.caption.fontSize - 1, color: 'rgba(255,255,255,0.85)', marginTop: 1 },

  adultGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs },
  adultTileWrap: { width: '50%', paddingHorizontal: SPACING.xs },
  adultTile: { borderRadius: RADII.adult.card, borderWidth: 1, borderTopWidth: 3, padding: SPACING.md, marginBottom: SPACING.sm + 2, minHeight: 84 },
  adultTileTitle: { fontSize: TYPE.caption.fontSize + 1, fontWeight: 'bold', marginTop: SPACING.sm - 2 },
  adultTileSub: { fontSize: 10, marginTop: 2 }
});
