import React, { useState, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Text from '../components/Text';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import CountUpNumber from '../components/CountUpNumber';
import StackReveal from '../components/StackReveal';
import { REGION_COUNTRIES } from '../constants/regions';
import { getBadgeInfo } from '../constants/badges';
import { SPACING, TYPE, RADII, getElevation, AGE_PALETTES } from '../constants/tokens';
const NAVY = AGE_PALETTES.adult.navy;
const MODE_LABELS = {
  child: 'Kids (5-12)',
  teen: 'Teen (13-24)',
  adult: 'Adult (25-49)',
  elderly: 'Senior (50+)'
};
export default function ProfileScreen({
  navigation
}) {
  const {
    userId,
    username,
    setUserId,
    setUsername
  } = useUser();
  const {
    theme
  } = useTheme();
  const {
    settings: a11y
  } = useAccessibility();
  const [profile, setProfile] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState(null);
  const [country, setCountry] = useState(null);
  const load = useCallback(async () => {
    setError(false);
    try {
      const [profileResult, gamResult] = await Promise.all([apiRequest(`/onboarding/profile?userId=${userId}`, 'GET'), apiRequest('/gamification/login', 'POST', {
        userId
      })]);
      setProfile(profileResult);
      setGamification(gamResult);
      setName(profileResult.name || '');
      setAge(profileResult.age ? String(profileResult.age) : '');
      setRegion(profileResult.region || null);
      setCountry(profileResult.country || null);
    } catch (err) {
      console.log('Profile load error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useFocusEffect(useCallback(() => {
    if (!editing) load();
  }, [load, editing]));
  const cancelEdit = () => {
    setName(profile.name || '');
    setAge(profile.age ? String(profile.age) : '');
    setRegion(profile.region || null);
    setCountry(profile.country || null);
    setEditing(false);
  };
  const handleSave = async () => {
    const ageNum = parseInt(age, 10);
    if (!name.trim() || !age || isNaN(ageNum) || ageNum < 5 || !region || !country) {
      Alert.alert('Missing info', 'Please fill in your name, age, region, and country.');
      return;
    }
    setSaving(true);
    try {
      const result = await apiRequest('/onboarding/update-profile', 'POST', {
        userId,
        name: name.trim(),
        age: ageNum,
        region,
        country
      });
      const modeChanged = result.experienceMode !== profile.experienceMode;
      setEditing(false);
      await load();
      if (modeChanged) {
        Alert.alert('Age group updated', `Your account is now set up for ${MODE_LABELS[result.experienceMode] || result.experienceMode}. Returning to Home.`, [{
          text: 'OK',
          onPress: () => navigation.reset({
            index: 0,
            routes: [{
              name: 'Home'
            }]
          })
        }]);
      }
    } catch (err) {
      Alert.alert('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Log Out',
      style: 'destructive',
      onPress: () => {
        setUserId(null);
        setUsername(null);
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Login'
          }]
        });
      }
    }]);
  };
  if (loading) return <LoadingState message="Loading your profile..." />;
  if (error) return <ErrorState onRetry={load} />;
  const badges = gamification?.badges || [];
  return <ScrollView style={{
    backgroundColor: theme.bg
  }} contentContainerStyle={styles.container}>
      <View style={styles.avatarRow}>
        <View style={[styles.avatar, {
        backgroundColor: NAVY
      }]}>
          <Text style={styles.avatarText}>{(profile.name || username || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{
        flex: 1,
        marginLeft: SPACING.lg
      }}>
          <Text style={[styles.name, {
          color: theme.text
        }]}>{profile.name || username}</Text>
          <View style={[styles.modeChip, {
          backgroundColor: NAVY + '1A'
        }]}>
            <Text style={[styles.modeChipText, {
            color: NAVY
          }]}>{MODE_LABELS[profile.experienceMode] || profile.experienceMode}</Text>
          </View>
        </View>
        {!editing && <TouchableOpacity onPress={() => setEditing(true)} style={styles.editIconBtn} accessibilityRole="button" accessibilityLabel="Edit profile" {...touchTargetProps(a11y)}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.textSub} />
          </TouchableOpacity>}
      </View>

      {!editing && <View style={[styles.statsRow]}>
          <Animated.View entering={FadeInDown.delay(0).duration(340)} style={[styles.statBox, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <CountUpNumber value={gamification.points} style={[styles.statNum, {
          color: NAVY
        }]} />
            <Text style={[styles.statLabel, {
          color: theme.textSub
        }]}>Points</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80).duration(340)} style={[styles.statBox, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <Text style={[styles.statNum, {
          color: NAVY
        }]}>{gamification.rank}</Text>
            <Text style={[styles.statLabel, {
          color: theme.textSub
        }]}>Rank</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(160).duration(340)} style={[styles.statBox, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <CountUpNumber value={gamification.currentStreak} style={[styles.statNum, {
          color: NAVY
        }]} />
            <Text style={[styles.statLabel, {
          color: theme.textSub
        }]}>Day Streak</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(240).duration(340)} style={[styles.statBox, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <CountUpNumber value={gamification.longestStreak} style={[styles.statNum, {
          color: NAVY
        }]} />
            <Text style={[styles.statLabel, {
          color: theme.textSub
        }]}>Best Streak</Text>
          </Animated.View>
        </View>}

      {!editing && <>
          <Text style={[styles.sectionLabel, {
        color: theme.text
      }]} accessibilityRole="header">Your Info</Text>
          <View style={[styles.infoCard, {
        backgroundColor: theme.card,
        borderColor: theme.border
      }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
            color: theme.textSub
          }]}>Age</Text>
              <Text style={[styles.infoValue, {
            color: theme.text
          }]}>{profile.age}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
            color: theme.textSub
          }]}>Region</Text>
              <Text style={[styles.infoValue, {
            color: theme.text
          }]}>{profile.region}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
            color: theme.textSub
          }]}>Country</Text>
              <Text style={[styles.infoValue, {
            color: theme.text
          }]}>{profile.country}</Text>
            </View>
            <View style={[styles.infoRow, {
          borderBottomWidth: 0
        }]}>
              <Text style={[styles.infoLabel, {
            color: theme.textSub
          }]}>Relevant Hazards</Text>
              <Text style={[styles.infoValue, {
            color: theme.text
          }]}>{(profile.relevantHazards || []).join(', ')}</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, {
        color: theme.text
      }]} accessibilityRole="header">Badges Earned</Text>
          {badges.length === 0 ? <EmptyState icon="medal-outline" title="No badges yet" message="Complete lessons, quizzes, and daily tasks to earn your first badge." /> : <View style={styles.badgeGrid}>
              {badges.map((badgeId, index) => {
          const info = getBadgeInfo(badgeId);
          return <StackReveal key={badgeId} index={Math.min(index, 10)} style={[styles.badgeCard, {
            backgroundColor: theme.card,
            borderColor: theme.border
          }]} accessibilityLabel={`${info.title}: ${info.description}`}>
                    <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                    <Text style={[styles.badgeTitle, {
              color: theme.text
            }]}>{info.title}</Text>
                    <Text style={[styles.badgeDesc, {
              color: theme.textSub
            }]}>{info.description}</Text>
                  </StackReveal>;
        })}
            </View>}

          <TouchableOpacity style={[styles.logoutBtn, {
        borderColor: '#DC2626'
      }, touchTargetStyle(a11y, 52)]} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out" {...touchTargetProps(a11y)}>
            <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </>}

      {editing && <View style={styles.editForm}>
          <Text style={[styles.sectionLabel, {
        color: theme.text
      }]} accessibilityRole="header">Edit Your Info</Text>

          <Text style={[styles.fieldLabel, {
        color: theme.textSub
      }]}>Name</Text>
          <TextInput style={[styles.input, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        color: theme.text
      }]} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.textSub} accessibilityLabel="Name" />

          <Text style={[styles.fieldLabel, {
        color: theme.textSub
      }]}>Age</Text>
          <TextInput style={[styles.input, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        color: theme.text
      }]} value={age} onChangeText={setAge} placeholder="Your age" placeholderTextColor={theme.textSub} keyboardType="numeric" accessibilityLabel="Age" />

          <Text style={[styles.fieldLabel, {
        color: theme.textSub
      }]}>Region</Text>
          <View style={styles.chipRow}>
            {Object.keys(REGION_COUNTRIES).map(r => <TouchableOpacity key={r} style={[styles.chip, {
          borderColor: theme.border
        }, region === r && styles.chipActive]} onPress={() => {
          setRegion(r);
          setCountry(null);
        }} accessibilityRole="button" accessibilityLabel={`Region ${r}`} accessibilityState={{
          selected: region === r
        }} {...touchTargetProps(a11y)}>
                <Text style={[styles.chipText, {
            color: region === r ? '#fff' : theme.text
          }]}>{r}</Text>
              </TouchableOpacity>)}
          </View>

          {region && <>
              <Text style={[styles.fieldLabel, {
          color: theme.textSub
        }]}>Country</Text>
              <View style={styles.chipRow}>
                {REGION_COUNTRIES[region].map(c => <TouchableOpacity key={c} style={[styles.chip, {
            borderColor: theme.border
          }, country === c && styles.chipActive]} onPress={() => setCountry(c)} accessibilityRole="button" accessibilityLabel={`Country ${c}`} accessibilityState={{
            selected: country === c
          }} {...touchTargetProps(a11y)}>
                    <Text style={[styles.chipText, {
              color: country === c ? '#fff' : theme.text
            }]}>{c}</Text>
                  </TouchableOpacity>)}
              </View>
            </>}

          <Text style={[styles.editNote, {
        color: theme.textSub
      }]}>
            Changing your age may move you to a different age group and change your Home screen.
          </Text>

          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.cancelBtn, {
          borderColor: theme.border
        }, touchTargetStyle(a11y, 52)]} onPress={cancelEdit} disabled={saving} accessibilityRole="button" accessibilityLabel="Cancel editing" {...touchTargetProps(a11y)}>
              <Text style={[styles.cancelBtnText, {
            color: theme.text
          }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, touchTargetStyle(a11y, 52), saving && {
          opacity: 0.6
        }]} onPress={handleSave} disabled={saving} accessibilityRole="button" accessibilityLabel="Save changes" {...touchTargetProps(a11y)}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>}
    </ScrollView>;
}
const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge + 8
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: TYPE.title.fontSize + 6,
    fontWeight: 'bold'
  },
  name: {
    fontSize: TYPE.title.fontSize,
    fontWeight: 'bold'
  },
  modeChip: {
    alignSelf: 'flex-start',
    borderRadius: RADII.adult.chip,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    marginTop: SPACING.xs + 2
  },
  modeChipText: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold'
  },
  editIconBtn: {
    padding: SPACING.sm - 2
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
    marginHorizontal: -SPACING.xs
  },
  statBox: {
    width: '48%',
    borderRadius: RADII.adult.card,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    margin: SPACING.xs,
    ...getElevation('adult')
  },
  statNum: {
    fontSize: TYPE.title.fontSize,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: TYPE.caption.fontSize,
    marginTop: SPACING.xs
  },
  sectionLabel: {
    fontSize: TYPE.title.fontSize - 3,
    fontWeight: 'bold',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md
  },
  infoCard: {
    borderRadius: RADII.adult.card,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    ...getElevation('adult')
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)'
  },
  infoLabel: {
    fontSize: TYPE.body.fontSize - 1,
    fontWeight: '600'
  },
  infoValue: {
    fontSize: TYPE.body.fontSize - 1,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: SPACING.md
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs
  },
  badgeCard: {
    width: '48%',
    borderRadius: RADII.adult.card,
    borderWidth: 1,
    padding: SPACING.md + 2,
    alignItems: 'center',
    margin: SPACING.xs,
    ...getElevation('adult')
  },
  badgeEmoji: {
    fontSize: 30,
    marginBottom: SPACING.xs + 2
  },
  badgeTitle: {
    fontSize: TYPE.caption.fontSize + 1,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  badgeDesc: {
    fontSize: TYPE.caption.fontSize - 1,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 15
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: RADII.adult.button,
    paddingVertical: SPACING.md + 2,
    marginTop: SPACING.xxxl
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize,
    marginLeft: SPACING.sm
  },
  editForm: {
    marginTop: SPACING.xs
  },
  fieldLabel: {
    fontSize: TYPE.caption.fontSize,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm - 2,
    marginTop: SPACING.md + 2
  },
  input: {
    borderWidth: 1,
    borderRadius: RADII.adult.button - 2,
    padding: SPACING.md + 2
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chip: {
    borderWidth: 1,
    borderRadius: RADII.adult.chip + 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm
  },
  chipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY
  },
  chipText: {
    fontWeight: 'bold'
  },
  editNote: {
    fontSize: TYPE.caption.fontSize,
    marginTop: SPACING.lg,
    lineHeight: 17,
    fontStyle: 'italic'
  },
  editActions: {
    flexDirection: 'row',
    marginTop: SPACING.xl
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADII.adult.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md - 2
  },
  cancelBtnText: {
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: NAVY,
    borderRadius: RADII.adult.button,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPE.body.fontSize
  }
});
