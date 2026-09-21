import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeOut, FadeInDown, LinearTransition,
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import apiRequest from '../services/api';
import { HAZARD_CATEGORIES, getArticlesByHazard } from '../constants/articles';
import { getVideosByHazard } from '../constants/videos';
import { getAudioByHazard } from '../constants/audio';
import { SPACING, TYPE, TYPE_SENIOR, RADII, AGE_PALETTES } from '../constants/tokens';

const NAVY = AGE_PALETTES.adult.navy;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressCard({ onPress, style, children, a11y, accessibilityLabel, accessibilityRole = 'button', minTargetHeight = 44 }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[style, touchTargetStyle(a11y, minTargetHeight), aStyle]}
      {...touchTargetProps(a11y)}
    >
      {children}
    </AnimatedPressable>
  );
}

function SubList({ label, isSenior, children }) {
  if (children.length === 0) return null;
  return (
    <View style={styles.subList}>
      <Text style={[styles.subLabel, isSenior && styles.subLabelSenior]}>{label}</Text>
      {children}
    </View>
  );
}

function HazardSection({ category, index, isSenior, expanded, onToggle, theme, a11y, onOpenArticle, onOpenVideo, onOpenAudio }) {
  const rotate = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    rotate.value = withTiming(expanded ? 180 : 0, { duration: 260, easing: Easing.out(Easing.quad) });
  }, [expanded]);

  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  const articles = getArticlesByHazard(category.key);
  const videos = getVideosByHazard(category.key);
  const audioEps = getAudioByHazard(category.key);
  const total = articles.length + videos.length + audioEps.length;

  const articleList = (
    <SubList label="📰 ARTICLES" isSenior={isSenior}>
      {articles.map((a) => (
        <PressCard
          key={a.id}
          onPress={() => onOpenArticle(a.id)}
          a11y={a11y}
          accessibilityLabel={`${a.title}, ${a.mins} minute read`}
          style={[styles.itemRow, { backgroundColor: theme.bg, borderColor: theme.border, borderLeftColor: category.color }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }, isSenior && styles.itemTitleSenior]}>{a.title}</Text>
            <Text style={[styles.itemMeta, { color: theme.textSub }, isSenior && styles.itemMetaSenior]}>{a.mins} min read</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={isSenior ? 26 : 20} color={theme.textSub} />
        </PressCard>
      ))}
    </SubList>
  );

  const videoList = (
    <SubList label="🎬 VIDEOS & GUIDES" isSenior={isSenior}>
      {videos.map((v) => (
        <PressCard
          key={v.id}
          onPress={() => onOpenVideo(v.url)}
          a11y={a11y}
          accessibilityLabel={`${v.title}, video from ${v.source}, opens externally`}
          style={[styles.itemRow, { backgroundColor: theme.bg, borderColor: theme.border, borderLeftColor: category.color }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }, isSenior && styles.itemTitleSenior]}>{v.title}</Text>
            <Text style={[styles.itemMeta, { color: theme.textSub }, isSenior && styles.itemMetaSenior]}>{v.source}</Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={isSenior ? 24 : 18} color={theme.textSub} />
        </PressCard>
      ))}
    </SubList>
  );

  const audioList = (
    <SubList label="🎧 AUDIO" isSenior={isSenior}>
      {audioEps.map((ep) => (
        <PressCard
          key={ep.id}
          onPress={() => onOpenAudio(ep.id)}
          a11y={a11y}
          accessibilityLabel={`${ep.title}, audio episode. ${ep.desc}`}
          style={[styles.itemRow, { backgroundColor: theme.bg, borderColor: theme.border, borderLeftColor: category.color }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }, isSenior && styles.itemTitleSenior]}>{ep.title}</Text>
            <Text style={[styles.itemMeta, { color: theme.textSub }, isSenior && styles.itemMetaSenior]}>{ep.desc}</Text>
          </View>
          <MaterialCommunityIcons name="play-circle" size={isSenior ? 26 : 20} color={NAVY} />
        </PressCard>
      ))}
    </SubList>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(index * (isSenior ? 150 : 60)).duration(isSenior ? 480 : 300)}
      layout={LinearTransition.duration(isSenior ? 360 : 220)}
      style={[styles.hazardCard, { backgroundColor: theme.card, borderColor: theme.border }, isSenior && styles.hazardCardSenior]}
    >
      <PressCard
        onPress={onToggle}
        a11y={a11y}
        accessibilityLabel={`${category.label}, ${total} resources, ${expanded ? 'expanded' : 'collapsed'}`}
        minTargetHeight={isSenior ? 68 : 56}
        style={[styles.hazardHeader, isSenior && styles.hazardHeaderSenior]}
      >
        <View style={[styles.hazardIconCircle, { backgroundColor: category.color + '1A' }]}>
          <MaterialCommunityIcons name={category.icon} size={isSenior ? 28 : 24} color={category.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hazardTitle, { color: theme.text }, isSenior && styles.hazardTitleSenior]}>{category.label}</Text>
          <Text style={[styles.hazardMeta, { color: theme.textSub }, isSenior && styles.hazardMetaSenior]}>{total} resources</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-down" size={isSenior ? 30 : 26} color={NAVY} />
        </Animated.View>
      </PressCard>

      {expanded && (
        <Animated.View entering={FadeIn.duration(isSenior ? 320 : 200)} exiting={FadeOut.duration(150)} style={styles.hazardBody}>
          {isSenior ? (
            <>{audioList}{articleList}{videoList}</>
          ) : (
            <>{articleList}{videoList}{audioList}</>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function ResourceHubScreen({ navigation }) {
  const { theme } = useTheme();
  const { userId } = useUser();
  const { settings: a11y } = useAccessibility();
  const [isSenior, setIsSenior] = useState(false);
  // Adults can quick-scan several open sections at once; seniors get one
  // section open at a time so the screen never holds more than one topic's
  // worth of content — "fewer items per screen" enforced, not just styled.
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [seniorExpandedKey, setSeniorExpandedKey] = useState(null);
  // Category filtering is an efficiency tool for quick access — seniors get
  // the plain fixed list instead, one less decision on the screen.
  const [filterKey, setFilterKey] = useState('all');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiRequest(`/onboarding/profile?userId=${userId}`, 'GET')
        .then((profile) => { if (active) setIsSenior(profile.experienceMode === 'elderly'); })
        .catch(() => {});
      return () => { active = false; };
    }, [userId])
  );

  const openArticle = (articleId) => navigation.navigate(isSenior ? 'SeniorArticleReader' : 'ArticleReader', { articleId });
  const openVideo = (url) => Linking.openURL(url).catch(() => {});
  const openAudio = (episodeId) => navigation.navigate('AudioPlayer', { episodeId });

  const toggleSection = (key) => {
    if (isSenior) {
      setSeniorExpandedKey((cur) => (cur === key ? null : key));
    } else {
      setExpandedKeys((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
    }
  };

  const visibleCategories = filterKey === 'all' ? HAZARD_CATEGORIES : HAZARD_CATEGORIES.filter((c) => c.key === filterKey);

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }, isSenior && styles.titleSenior]}>📚 Content Library</Text>
      <Text style={[styles.sub, { color: theme.textSub }, isSenior && styles.subSenior]}>
        Articles, videos, and audio guides from official sources — organised by disaster type.
      </Text>

      {!isSenior && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
          <PressCard
            onPress={() => setFilterKey('all')}
            a11y={a11y}
            minTargetHeight={32}
            accessibilityLabel="All categories"
            style={[styles.filterChip, { borderColor: theme.border }, filterKey === 'all' && { backgroundColor: NAVY, borderColor: NAVY }]}
          >
            <Text style={[styles.filterChipText, { color: filterKey === 'all' ? '#fff' : theme.text }]}>All</Text>
          </PressCard>
          {HAZARD_CATEGORIES.map((cat) => {
            const active = filterKey === cat.key;
            return (
              <PressCard
                key={cat.key}
                onPress={() => setFilterKey(cat.key)}
                a11y={a11y}
                minTargetHeight={32}
                accessibilityLabel={`Filter to ${cat.label}`}
                style={[styles.filterChip, { borderColor: theme.border }, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              >
                <MaterialCommunityIcons name={cat.icon} size={15} color={active ? '#fff' : cat.color} />
                <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text, marginLeft: 5 }]}>{cat.label}</Text>
              </PressCard>
            );
          })}
        </ScrollView>
      )}

      {visibleCategories.map((cat, i) => (
        <HazardSection
          key={cat.key}
          category={cat}
          index={i}
          isSenior={isSenior}
          expanded={isSenior ? seniorExpandedKey === cat.key : expandedKeys.includes(cat.key)}
          onToggle={() => toggleSection(cat.key)}
          theme={theme}
          a11y={a11y}
          onOpenArticle={openArticle}
          onOpenVideo={openVideo}
          onOpenAudio={openAudio}
        />
      ))}

      <Text style={[styles.disclaimer, { color: theme.textSub }, isSenior && styles.disclaimerSenior]}>
        Video and article links open official external websites. Always follow local emergency services in a real emergency.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.xl, paddingBottom: SPACING.huge },
  title: { fontSize: TYPE.display.fontSize - 2, fontWeight: 'bold' },
  titleSenior: { fontSize: TYPE_SENIOR.display.fontSize },
  sub: { fontSize: TYPE.body.fontSize - 1, marginBottom: SPACING.lg, lineHeight: 20 },
  subSenior: { fontSize: TYPE_SENIOR.body.fontSize, lineHeight: 24, marginBottom: SPACING.xxl + 2 },

  filterRow: { marginBottom: SPACING.lg, marginHorizontal: -SPACING.xl },
  filterRowContent: { paddingHorizontal: SPACING.xl },
  filterChip: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.adult.chip + 10, borderWidth: 1, paddingVertical: SPACING.sm - 1, paddingHorizontal: SPACING.md, marginRight: SPACING.sm },
  filterChipText: { fontSize: TYPE.caption.fontSize, fontWeight: 'bold' },

  hazardCard: { borderRadius: RADII.adult.card + 6, borderWidth: 1, marginBottom: SPACING.md + 2, overflow: 'hidden' },
  hazardCardSenior: { borderRadius: RADII.elderly.card, marginBottom: SPACING.lg + 4 },
  hazardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  hazardHeaderSenior: { padding: SPACING.xl },
  hazardIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md + 2 },
  hazardTitle: { fontSize: TYPE.title.fontSize - 3, fontWeight: 'bold' },
  hazardTitleSenior: { fontSize: TYPE_SENIOR.title.fontSize },
  hazardMeta: { fontSize: TYPE.caption.fontSize, marginTop: 3 },
  hazardMetaSenior: { fontSize: TYPE_SENIOR.caption.fontSize + 2, marginTop: 4 },
  hazardBody: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },

  subList: { marginBottom: SPACING.xs },
  subLabel: { fontSize: TYPE.caption.fontSize, fontWeight: 'bold', letterSpacing: 1, color: NAVY, marginTop: SPACING.sm + 2, marginBottom: SPACING.sm },
  subLabelSenior: { fontSize: TYPE_SENIOR.caption.fontSize + 2 },

  itemRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADII.adult.chip, borderWidth: 1, borderLeftWidth: 4, padding: SPACING.md + 1, marginBottom: SPACING.sm + 1 },
  itemTitle: { fontSize: TYPE.body.fontSize - 1, fontWeight: 'bold', lineHeight: 19 },
  itemTitleSenior: { fontSize: TYPE_SENIOR.body.fontSize, lineHeight: 23 },
  itemMeta: { fontSize: TYPE.caption.fontSize - 1, marginTop: 4 },
  itemMetaSenior: { fontSize: TYPE_SENIOR.caption.fontSize + 1, marginTop: 6 },

  disclaimer: { fontSize: TYPE.caption.fontSize - 1, marginTop: SPACING.md, textAlign: 'center', lineHeight: 16 },
  disclaimerSenior: { fontSize: TYPE_SENIOR.caption.fontSize + 1, lineHeight: 20 }
});
