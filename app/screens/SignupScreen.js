import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInDown } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { ACCESSIBILITY_OPTIONS } from '../constants/accessibility';
import { REGION_COUNTRIES } from '../constants/regions';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

const SLATE = AGE_PALETTES.teen.slate;
const CARD = '#1E293B';
const SIGNAL = SEMANTIC.signal;

// Each tile's accent is drawn from that mode's real identity palette, not a
// one-off guess — this screen is the first place a user sees their age skin.
const AGE_TILES = [
  { key: 'child', label: 'Kids', ages: 'Ages 5-12', tags: 'Games · Learn', color: AGE_PALETTES.child.gold, min: 5, max: 12 },
  { key: 'teen', label: 'Teens', ages: 'Ages 13-24', tags: 'Streaks · XP', color: AGE_PALETTES.teen.teal, min: 13, max: 24 },
  { key: 'adult', label: 'Adults', ages: 'Ages 25-49', tags: 'Guides · Ranks', color: AGE_PALETTES.adult.navy, min: 25, max: 49 },
  { key: 'elderly', label: 'Seniors', ages: 'Ages 50+', tags: 'Audio · Articles', color: AGE_PALETTES.elderly.amber, min: 50, max: 200 }
];

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState(null);
  const [country, setCountry] = useState(null);
  const [accessibilityFlags, setAccessibilityFlags] = useState([]);
  const { setUserId, setUsername: setContextUsername } = useUser();
  const { settings: a11y } = useAccessibility();

  const ageNum = parseInt(age, 10);
  const activeTile = AGE_TILES.find(t => ageNum >= t.min && ageNum <= t.max);

  const toggleFlag = (key) => {
    setAccessibilityFlags((prev) =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const selectRegion = (r) => {
    setRegion(r);
    setCountry(null);
  };

  const handleSignup = async () => {
    if (!username || !password || !name || !age || !region || !country) {
      Alert.alert('Missing info', 'Please fill in all fields including region and country.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    if (isNaN(ageNum) || ageNum < 5) {
      Alert.alert('Invalid age', 'Please enter a valid age (5 or older).');
      return;
    }

    try {
      const result = await apiRequest('/auth/signup', 'POST', {
        username, password, name, age: ageNum, region, country, accessibilityFlags
      });
      setUserId(result.userId);
      setContextUsername(result.username);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      Alert.alert('Signup failed', err.message);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <Text style={styles.appName}>DisasterReady</Text>
      <Text style={styles.tagline}>Create your account</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#64748B"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Your age"
          placeholderTextColor="#64748B"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.sectionLabel}>YOUR AGE GROUP</Text>
      <View style={styles.tileGrid}>
        {AGE_TILES.map((tile, index) => {
          const isActive = activeTile && activeTile.key === tile.key;
          return (
            <Animated.View
              key={tile.key}
              entering={FadeInDown.delay(index * 90).duration(340)}
              style={[
                styles.tile,
                { borderColor: isActive ? tile.color : '#334155' },
                isActive && { backgroundColor: CARD }
              ]}
            >
              <Text style={[styles.tileLabel, { color: isActive ? tile.color : '#64748B' }]}>{tile.label}</Text>
              <Text style={styles.tileAges}>{tile.ages}</Text>
              <Text style={styles.tileTags}>{tile.tags}</Text>
              {isActive && <Text style={[styles.tileActive, { color: tile.color }]}>✓ That's you</Text>}
            </Animated.View>
          );
        })}
      </View>
      <Text style={styles.tileNote}>Enter your age above and your experience is set automatically.</Text>

      <Text style={styles.sectionLabel}>YOUR REGION</Text>
      <View style={styles.regionRow}>
        {Object.keys(REGION_COUNTRIES).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.regionChip, region === r && styles.regionChipActive]}
            onPress={() => selectRegion(r)}
            accessibilityRole="button"
            accessibilityLabel={r}
            accessibilityState={{ selected: region === r }}
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.regionChipText, region === r && styles.regionChipTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {region && (
        <>
          <Text style={styles.sectionLabel}>YOUR COUNTRY</Text>
          <View style={styles.regionRow}>
            {REGION_COUNTRIES[region].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.regionChip, country === c && styles.regionChipActive]}
                onPress={() => setCountry(c)}
                accessibilityRole="button"
                accessibilityLabel={c}
                accessibilityState={{ selected: country === c }}
                {...touchTargetProps(a11y)}
              >
                <Text style={[styles.regionChipText, country === c && styles.regionChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>ACCESSIBILITY (OPTIONAL)</Text>
      <Text style={styles.accessNote}>Used only to adjust how the app looks and works for you.</Text>
      <View style={styles.regionRow}>
        {ACCESSIBILITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.regionChip, accessibilityFlags.includes(opt.key) && styles.regionChipActive]}
            onPress={() => toggleFlag(opt.key)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityHint={opt.description}
            accessibilityState={{ selected: accessibilityFlags.includes(opt.key) }}
            {...touchTargetProps(a11y)}
          >
            <Text style={[styles.regionChipText, accessibilityFlags.includes(opt.key) && styles.regionChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.signupButton, touchTargetStyle(a11y, 44)]}
        onPress={handleSignup}
        accessibilityRole="button"
        accessibilityLabel="Create account and continue"
        {...touchTargetProps(a11y)}
      >
        <Text style={styles.signupButtonText}>Create Account & Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        accessibilityRole="button"
        accessibilityLabel="Already have an account? Sign in"
        {...touchTargetProps(a11y)}
      >
        <Text style={styles.loginLink}>
          Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.privacyNote}>
        Your data stays on this app's own server and is used only to personalise your experience. No data is shared with third parties.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SLATE },
  container: { padding: SPACING.xxl, alignItems: 'center' },
  logo: { width: 90, height: 90, marginTop: SPACING.lg, marginBottom: SPACING.sm + 2, borderRadius: RADII.teen.card + 6 },
  appName: { fontSize: TYPE.display.fontSize - 2, fontWeight: 'bold', color: '#F8FAFC' },
  tagline: { fontSize: TYPE.body.fontSize - 1, color: '#94A3B8', marginBottom: SPACING.xl },
  card: { width: '100%', backgroundColor: CARD, borderRadius: RADII.teen.card + 2, padding: SPACING.xl, marginBottom: SPACING.xl },
  input: {
    backgroundColor: SLATE, borderWidth: 1, borderColor: '#334155', borderRadius: RADII.teen.button - 4,
    padding: SPACING.md + 2, marginBottom: SPACING.md, color: '#F8FAFC'
  },
  sectionLabel: { fontSize: TYPE.caption.fontSize, color: '#64748B', letterSpacing: 1, marginBottom: SPACING.sm + 2, alignSelf: 'flex-start' },
  tileGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48%', backgroundColor: '#141F35', borderRadius: RADII.teen.card + 2, borderWidth: 2,
    padding: SPACING.md + 2, marginBottom: SPACING.md, alignItems: 'center'
  },
  tileLabel: { fontSize: TYPE.body.fontSize + 2, fontWeight: 'bold' },
  tileAges: { fontSize: TYPE.caption.fontSize, color: '#94A3B8', marginTop: SPACING.xs },
  tileTags: { fontSize: TYPE.caption.fontSize - 1, color: '#64748B', marginTop: SPACING.xs },
  tileActive: { fontSize: TYPE.caption.fontSize, fontWeight: 'bold', marginTop: SPACING.sm - 2 },
  tileNote: { fontSize: TYPE.caption.fontSize - 1, color: '#64748B', marginBottom: SPACING.lg, textAlign: 'center' },
  regionRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.lg },
  regionChip: {
    borderWidth: 1, borderColor: '#334155', borderRadius: RADII.teen.chip + 8, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg, marginRight: SPACING.sm, marginBottom: SPACING.sm
  },
  regionChipActive: { backgroundColor: SIGNAL, borderColor: SIGNAL },
  regionChipText: { color: '#94A3B8', fontWeight: 'bold' },
  regionChipTextActive: { color: '#fff' },
  accessNote: { fontSize: TYPE.caption.fontSize - 1, color: '#64748B', alignSelf: 'flex-start', marginBottom: SPACING.sm },
  signupButton: {
    width: '100%', backgroundColor: SIGNAL, borderRadius: RADII.teen.button - 2, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.lg, marginTop: SPACING.sm
  },
  signupButtonText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize + 1 },
  loginLink: { color: '#94A3B8', fontSize: TYPE.body.fontSize - 1, marginBottom: SPACING.lg },
  loginLinkBold: { color: SIGNAL, fontWeight: 'bold' },
  privacyNote: { fontSize: TYPE.caption.fontSize - 1, color: '#475569', textAlign: 'center', lineHeight: 16, marginBottom: SPACING.xxl }
});