import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, FadeInDown, LinearTransition, useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import apiRequest from '../services/api';
import { HAZARD_CATEGORIES, getArticlesByHazard } from '../constants/articles';
import { getVideosByHazard } from '../constants/videos';
import { getAudioByHazard } from '../constants/audio';
import { SPACING, TYPE, TYPE_SENIOR, RADII, AGE_PALETTES } from '../constants/tokens';
import { SPRING_PRESS_OUT } from '../constants/motion';
const NAVY = AGE_PALETTES.adult.navy;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
function PressCard({
  onPress,
  style,
  children,
  a11y,
  accessibilityLabel,
  accessibilityRole = 'button',
  minTargetHeight = 44
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: scale.value
    }]
  }));
  return <AnimatedPressable onPress={onPress} onPressIn={() => {
    scale.value = withTiming(0.97, {
      duration: 100
    });
  }} onPressOut={() => {
    scale.value = withSpring(1, SPRING_PRESS_OUT);
  }} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} style={[style, touchTargetStyle(a11y, minTargetHeight), aStyle]} {...touchTargetProps(a11y)}>
      {children}
    </AnimatedPressable>;
}
function StatChip({
  icon,
  count,
  label,
  color
}) {
  if (count === 0) return null;
  return <View style={[styles.statChip, {
    backgroundColor: color + '1F'
  }]}>
      <MaterialCommunityIcons name={icon} size={13} color={color} />
      <Text style={[styles.statChipText, {
      color
    }]}>{count} {label}</Text>
    </View>;
}
function SubList({
  label,
  isSenior,
  children
}) {
  if (children.length === 0) return null;
  return <View style={styles.subList}>
      <Text style={[styles.subLabel, isSenior && styles.subLabelSenior]}>{label}</Text>
      {children}
    </View>;
}
function HazardSection({
  category,
  index,
  isSenior,
  expanded,
  onToggle,
  theme,
  a11y,
  onOpenArticle,
  onOpenVideo,
  onOpenAudio
}) {
  const rotate = useSharedValue(expanded ? 180 : 0);
  useEffect(() => {
    rotate.value = withTiming(expanded ? 180 : 0, {
      duration: 260,
      easing: Easing.out(Easing.quad)
    });
  }, [expanded]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: `${rotate.value}deg`
    }]
  }));
  const articles = getArticlesByHazard(category.key);
  const videos = getVideosByHazard(category.key);
  const audioEps = getAudioByHazard(category.key);
  const total = articles.length + videos.length + audioEps.length;
  const articleList = <SubList label="📰 ARTICLES" isSenior={isSenior}>
      {articles.map(a => <PressCard key={a.id} onPress={() => onOpenArticle(a.id)} a11y={a11y} accessibilityLabel={`${a.title}, ${a.mins} minute read`} style={[styles.itemRow, {
      backgroundColor: theme.bg,
      borderColor: theme.border,
      borderLeftColor: category.color
    }]}>
          <View style={{
        flex: 1
      }}>
            <Text style={[styles.itemTitle, {
          color: theme.text
        }, isSenior && styles.itemTitleSenior]}>{a.title}</Text>
            <Text style={[styles.itemMeta, {
          color: theme.textSub
        }, isSenior && styles.itemMetaSenior]}>{a.mins} min read</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={isSenior ? 26 : 20} color={theme.textSub} />
        </PressCard>)}
    </SubList>;
  const videoList = <SubList label="🎬 VIDEOS & GUIDES" isSenior={isSenior}>
      {videos.map(v => <PressCard key={v.id} onPress={() => onOpenVideo(v.url)} a11y={a11y} accessibilityLabel={`${v.title}, video from ${v.source}, opens externally`} style={[styles.itemRow, {
      backgroundColor: theme.bg,
      borderColor: theme.border,
      borderLeftColor: category.color
    }]}>
          <View style={{
        flex: 1
      }}>
            <Text style={[styles.itemTitle, {
          color: theme.text
        }, isSenior && styles.itemTitleSenior]}>{v.title}</Text>
            <Text style={[styles.itemMeta, {
          color: theme.textSub
        }, isSenior && styles.itemMetaSenior]}>{v.source}</Text>
          </View>
          <MaterialCommunityIcons name="open-in-new" size={isSenior ? 24 : 18} color={theme.textSub} />
        </PressCard>)}
    </SubList>;
  const audioList = <SubList label="🎧 AUDIO" isSenior={isSenior}>
      {audioEps.map(ep => <PressCard key={ep.id} onPress={() => onOpenAudio(ep.id)} a11y={a11y} accessibilityLabel={`${ep.title}, audio episode. ${ep.desc}`} style={[styles.itemRow, {
      backgroundColor: theme.bg,
      borderColor: theme.border,
      borderLeftColor: category.color
    }]}>
          <View style={{
        flex: 1
      }}>
            <Text style={[styles.itemTitle, {
          color: theme.text
        }, isSenior && styles.itemTitleSenior]}>{ep.title}</Text>
            <Text style={[styles.itemMeta, {
          color: theme.textSub
        }, isSenior && styles.itemMetaSenior]}>{ep.desc}</Text>
          </View>
          <MaterialCommunityIcons name="play-circle" size={isSenior ? 26 : 20} color={NAVY} />
        </PressCard>)}
    </SubList>;
  return <Animated.View entering={FadeInDown.delay(index * (isSenior ? 150 : 70)).duration(isSenior ? 480 : 380).springify().damping(20)} layout={LinearTransition.duration(isSenior ? 360 : 220)} style={[styles.hazardCard, {
    backgroundColor: theme.card,
    borderColor: theme.border
  }, isSenior && styles.hazardCardSenior]}>
      <PressCard onPress={onToggle} a11y={a11y} accessibilityLabel={`${category.label}, ${total} resources, ${expanded ? 'expanded' : 'collapsed'}`} minTargetHeight={isSenior ? 84 : 72} style={[styles.hazardHeader, {
      backgroundColor: category.color + '14'
    }, isSenior && styles.hazardHeaderSenior]}>
        {}
        <MaterialCommunityIcons name={category.icon} size={100} color={category.color} style={styles.hazardWatermark} />
        <View style={[styles.hazardIconBadge, {
        backgroundColor: category.color
      }, isSenior && styles.hazardIconBadgeSenior]}>
          <MaterialCommunityIcons name={category.icon} size={isSenior ? 32 : 26} color="#fff" />
        </View>
        <View style={{
        flex: 1
      }}>
          <Text style={[styles.hazardTitle, {
          color: theme.text
        }, isSenior && styles.hazardTitleSenior]}>{category.label}</Text>
          {isSenior ? <Text style={[styles.hazardMetaSenior, {
          color: theme.textSub
        }]}>{total} resources</Text> : <View style={styles.statChipsRow}>
              <StatChip icon="file-document-outline" count={articles.length} label="articles" color={category.color} />
              <StatChip icon="play-circle-outline" count={videos.length} label="videos" color={category.color} />
              <StatChip icon="headphones" count={audioEps.length} label="audio" color={category.color} />
            </View>}
        </View>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-down" size={isSenior ? 30 : 26} color={category.color} />
        </Animated.View>
      </PressCard>

      {expanded && <Animated.View entering={FadeIn.duration(isSenior ? 320 : 200)} exiting={FadeOut.duration(150)} style={styles.hazardBody}>
          {isSenior ? <>{audioList}{articleList}{videoList}</> : <>{articleList}{videoList}{audioList}</>}
        </Animated.View>}
    </Animated.View>;
}
export default function ResourceHubScreen({
  navigation
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
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [seniorExpandedKey, setSeniorExpandedKey] = useState(null);
  const [filterKey, setFilterKey] = useState('all');
  useFocusEffect(useCallback(() => {
    let active = true;
    apiRequest(`/onboarding/profile?userId=${userId}`, 'GET').then(profile => {
      if (active) setIsSenior(profile.experienceMode === 'elderly');
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]));
  const openArticle = articleId => navigation.navigate(isSenior ? 'SeniorArticleReader' : 'ArticleReader', {
    articleId
  });
  const openVideo = url => Linking.openURL(url).catch(() => {});
  const openAudio = episodeId => navigation.navigate('AudioPlayer', {
    episodeId
  });
  const toggleSection = key => {
    if (isSenior) {
      setSeniorExpandedKey(cur => cur === key ? null : key);
    } else {
      setExpandedKeys(cur => cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
    }
  };
  const visibleCategories = filterKey === 'all' ? HAZARD_CATEGORIES : HAZARD_CATEGORIES.filter(c => c.key === filterKey);
  const totalResourceCount = HAZARD_CATEGORIES.reduce((sum, cat) => sum + getArticlesByHazard(cat.key).length + getVideosByHazard(cat.key).length + getAudioByHazard(cat.key).length, 0);
  return <ScrollView style={{
    backgroundColor: theme.bg
  }} contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInDown.duration(320)}>
        <Text style={[styles.title, {
        color: theme.text
      }, isSenior && styles.titleSenior]}>📚 Content Library</Text>
        <Text style={[styles.sub, {
        color: theme.textSub
      }, isSenior && styles.subSenior]}>
          Articles, videos, and audio guides from official sources - organised by disaster type.
        </Text>
        {!isSenior && <View style={[styles.headerStatBar, {
        backgroundColor: NAVY + '12'
      }]}>
            <MaterialCommunityIcons name="bookshelf" size={16} color={NAVY} />
            <Text style={[styles.headerStatText, {
          color: NAVY
        }]}>
              {totalResourceCount} resources across {HAZARD_CATEGORIES.length} categories
            </Text>
          </View>}
      </Animated.View>

      {!isSenior && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
          <PressCard onPress={() => setFilterKey('all')} a11y={a11y} minTargetHeight={32} accessibilityLabel="All categories" style={[styles.filterChip, {
        borderColor: theme.border
      }, filterKey === 'all' && {
        backgroundColor: NAVY,
        borderColor: NAVY
      }]}>
            <Text style={[styles.filterChipText, {
          color: filterKey === 'all' ? '#fff' : theme.text
        }]}>All</Text>
          </PressCard>
          {HAZARD_CATEGORIES.map(cat => {
        const active = filterKey === cat.key;
        return <PressCard key={cat.key} onPress={() => setFilterKey(cat.key)} a11y={a11y} minTargetHeight={32} accessibilityLabel={`Filter to ${cat.label}`} style={[styles.filterChip, {
          borderColor: theme.border
        }, active && {
          backgroundColor: cat.color,
          borderColor: cat.color
        }]}>
                <MaterialCommunityIcons name={cat.icon} size={15} color={active ? '#fff' : cat.color} />
                <Text style={[styles.filterChipText, {
            color: active ? '#fff' : theme.text,
            marginLeft: 5
          }]}>{cat.label}</Text>
              </PressCard>;
      })}
        </ScrollView>}

      {visibleCategories.map((cat, i) => <HazardSection key={cat.key} category={cat} index={i} isSenior={isSenior} expanded={isSenior ? seniorExpandedKey === cat.key : expandedKeys.includes(cat.key)} onToggle={() => toggleSection(cat.key)} theme={theme} a11y={a11y} onOpenArticle={openArticle} onOpenVideo={openVideo} onOpenAudio={openAudio} />)}

      <Text style={[styles.disclaimer, {
      color: theme.textSub
    }, isSenior && styles.disclaimerSenior]}>
        Video and article links open official external websites. Always follow local emergency services in a real emergency.
      </Text>
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
  titleSenior: {
    fontSize: TYPE_SENIOR.display.fontSize
  },
  sub: {
    fontSize: TYPE.body.fontSize - 1,
    marginBottom: SPACING.md,
    lineHeight: 20
  },
  subSenior: {
    fontSize: TYPE_SENIOR.body.fontSize,
    lineHeight: 24,
    marginBottom: SPACING.xxl + 2
  },
  headerStatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADII.adult.chip + 6,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg
  },
  headerStatText: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    marginLeft: SPACING.xs + 2
  },
  filterRow: {
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.xl
  },
  filterRowContent: {
    paddingHorizontal: SPACING.xl
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.adult.chip + 10,
    borderWidth: 1,
    paddingVertical: SPACING.sm - 1,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm
  },
  filterChipText: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold'
  },
  hazardCard: {
    borderRadius: RADII.adult.card + 8,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 2
  },
  hazardCardSenior: {
    borderRadius: RADII.elderly.card,
    marginBottom: SPACING.xl
  },
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    overflow: 'hidden'
  },
  hazardHeaderSenior: {
    padding: SPACING.xl
  },
  hazardWatermark: {
    position: 'absolute',
    right: -18,
    top: -22,
    opacity: 0.10
  },
  hazardIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md + 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 3
  },
  hazardIconBadgeSenior: {
    width: 64,
    height: 64,
    borderRadius: 20
  },
  hazardTitle: {
    fontSize: TYPE.title.fontSize - 2,
    fontWeight: 'bold',
    marginBottom: 4
  },
  hazardTitleSenior: {
    fontSize: TYPE_SENIOR.title.fontSize
  },
  hazardMeta: {
    fontSize: TYPE.caption.fontSize,
    marginTop: 3
  },
  hazardMetaSenior: {
    fontSize: TYPE_SENIOR.caption.fontSize + 2,
    marginTop: 4
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginRight: 6,
    marginTop: 2
  },
  statChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 3
  },
  hazardBody: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg
  },
  subList: {
    marginBottom: SPACING.xs
  },
  subLabel: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: NAVY,
    marginTop: SPACING.sm + 2,
    marginBottom: SPACING.sm
  },
  subLabelSenior: {
    fontSize: TYPE_SENIOR.caption.fontSize + 2
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.adult.chip,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md + 1,
    marginBottom: SPACING.sm + 1
  },
  itemTitle: {
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: 'bold',
    lineHeight: 19
  },
  itemTitleSenior: {
    fontSize: TYPE_SENIOR.body.fontSize,
    lineHeight: 23
  },
  itemMeta: {
    fontSize: TYPE.caption.fontSize - 1,
    marginTop: 4
  },
  itemMetaSenior: {
    fontSize: TYPE_SENIOR.caption.fontSize + 1,
    marginTop: 6
  },
  disclaimer: {
    fontSize: TYPE.caption.fontSize - 1,
    marginTop: SPACING.md,
    textAlign: 'center',
    lineHeight: 16
  },
  disclaimerSenior: {
    fontSize: TYPE_SENIOR.caption.fontSize + 1,
    lineHeight: 20
  }
});
