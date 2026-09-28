import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Text from '../components/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { FIRST_AID_GUIDES, EMERGENCY_DISCLAIMER } from '../constants/firstAid';
import { SPACING, TYPE, RADII, getElevation, AGE_PALETTES } from '../constants/tokens';
export default function FirstAidGuideScreen({
  route
}) {
  const {
    theme
  } = useTheme();
  const {
    settings: a11y
  } = useAccessibility();
  const {
    guideId
  } = route.params;
  const guide = FIRST_AID_GUIDES.find(g => g.id === guideId);
  if (!guide) {
    return <View style={[styles.center, {
      backgroundColor: theme.bg
    }]}>
        <Text style={{
        color: theme.text
      }}>Guide not found.</Text>
      </View>;
  }
  const openVideo = () => {
    if (guide.video) Linking.openURL(guide.video.url).catch(() => {});
  };
  return <ScrollView style={{
    backgroundColor: theme.bg
  }} contentContainerStyle={styles.container}>
      <View style={[styles.iconCircle, {
      backgroundColor: guide.color + '1A'
    }]}>
        <MaterialCommunityIcons name={guide.icon.name} size={48} color={guide.color} />
      </View>
      <Text style={[styles.title, {
      color: theme.text
    }]}>{guide.title}</Text>
      <Text style={[styles.summary, {
      color: theme.textSub
    }]}>{guide.summary}</Text>

      <View style={styles.callBox} accessibilityLabel={`Call first: ${guide.callFirst}`}>
        <MaterialCommunityIcons name="phone" size={18} color="#991B1B" />
        <View style={{
        flex: 1,
        marginLeft: 8
      }}>
          <Text style={styles.callTitle}>Call first</Text>
          <Text style={styles.callText}>{guide.callFirst}</Text>
        </View>
      </View>

      {guide.video && <TouchableOpacity style={[styles.videoBtn, touchTargetStyle(a11y, 56)]} onPress={openVideo} accessibilityRole="button" accessibilityLabel={guide.video.label} accessibilityHint="Opens the video in your browser" {...touchTargetProps(a11y)}>
          <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
          <Text style={styles.videoBtnText}>{guide.video.label}</Text>
        </TouchableOpacity>}

      {guide.steps.map((step, i) => <Animated.View key={i} entering={FadeInDown.delay(i * 90).duration(340)} style={[styles.stepCard, {
      backgroundColor: theme.card,
      borderColor: theme.border
    }]} accessibilityLabel={`Step ${i + 1}: ${step.title}. ${step.text}`}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <View style={styles.stepInfo}>
            <Text style={[styles.stepTitle, {
          color: theme.text
        }]}>{step.title}</Text>
            <Text style={[styles.stepText, {
          color: theme.textSub
        }]}>{step.text}</Text>
          </View>
        </Animated.View>)}

      <View style={styles.disclaimerBox} accessibilityLabel={`Disclaimer: ${EMERGENCY_DISCLAIMER}`}>
        <MaterialCommunityIcons name="alert" size={18} color="#92400E" />
        <Text style={styles.disclaimerText}>{EMERGENCY_DISCLAIMER}</Text>
      </View>
    </ScrollView>;
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
    alignItems: 'stretch'
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.md
  },
  title: {
    fontSize: TYPE.display.fontSize - 2,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  summary: {
    fontSize: TYPE.body.fontSize - 1,
    textAlign: 'center',
    marginTop: SPACING.sm - 2,
    marginBottom: SPACING.xl,
    lineHeight: 20
  },
  callBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: RADII.adult.card,
    borderWidth: 1,
    borderColor: '#D32F2F',
    padding: SPACING.md + 2,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start'
  },
  callTitle: {
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: SPACING.xs
  },
  callText: {
    fontSize: TYPE.caption.fontSize + 1,
    color: '#991B1B',
    lineHeight: 19
  },
  videoBtn: {
    flexDirection: 'row',
    backgroundColor: AGE_PALETTES.adult.navy,
    borderRadius: RADII.adult.card,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl
  },
  videoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize - 1,
    marginLeft: SPACING.sm
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: RADII.adult.card + 2,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...getElevation('adult')
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AGE_PALETTES.adult.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md + 2
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize + 1
  },
  stepInfo: {
    flex: 1
  },
  stepTitle: {
    fontSize: TYPE.body.fontSize + 1,
    fontWeight: 'bold',
    marginBottom: SPACING.xs
  },
  stepText: {
    fontSize: TYPE.body.fontSize - 1,
    lineHeight: 21
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: RADII.adult.card,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: SPACING.md,
    marginTop: SPACING.sm,
    alignItems: 'flex-start'
  },
  disclaimerText: {
    fontSize: TYPE.caption.fontSize,
    color: '#92400E',
    lineHeight: 18,
    marginLeft: SPACING.sm,
    flex: 1
  }
});
