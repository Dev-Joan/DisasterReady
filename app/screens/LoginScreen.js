import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import Text from '../components/Text';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import apiRequest from '../services/api';
import { useUser } from '../context/UserContext';
import { useAccessibility, touchTargetProps, touchTargetStyle } from '../context/AccessibilityContext';
import { SPACING, TYPE, RADII, AGE_PALETTES, SEMANTIC } from '../constants/tokens';

const SLATE = AGE_PALETTES.teen.slate;
const CARD = '#1E293B';
const SIGNAL = SEMANTIC.signal;

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setUserId, setUsername: setContextUsername } = useUser();
  const { settings: a11y } = useAccessibility();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Missing info', 'Please enter both username and password.');
      return;
    }

    try {
      const result = await apiRequest('/auth/login', 'POST', { username, password });
      setUserId(result.userId);
      setContextUsername(result.username);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      Alert.alert('Login failed', err.message);
    }
  };

  // Real Apple/Google sign-in needs credentials this environment can't
  // supply on its own: an Apple Developer Program membership with "Sign In
  // with Apple" enabled for a registered bundle ID, and a Google Cloud
  // project with OAuth client IDs (plus Android signing SHA-1
  // fingerprints). Both also require a native build (EAS/dev client) since
  // neither works in Expo Go. These buttons are an honest placeholder
  // until that setup exists — not a stub pretending to authenticate.
  const handleSocialLogin = (provider) => {
    Alert.alert(
      `${provider} Sign-In — Not Yet Configured`,
      `Real ${provider} sign-in needs developer account setup (an ${provider === 'Apple' ? 'Apple Developer Program membership' : 'Google Cloud OAuth project'}) that hasn't been provided yet. Please use username and password for now.`
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Animated.Image entering={ZoomIn.duration(420)} source={require('../assets/icon.png')} style={styles.logo} />
      <Animated.View entering={FadeInDown.delay(100).duration(360)} style={styles.titleBlock}>
        <Text style={styles.appName}>DisasteReady</Text>
        <Text style={styles.tagline}>Your Disaster Preparedness Companion</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(360)} style={styles.card}>
        <Text style={styles.cardTitle}>Sign In</Text>

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
          placeholder="Password"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(360)} style={{ width: '100%', alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.loginButton, touchTargetStyle(a11y, 44)]}
          onPress={handleLogin}
          accessibilityRole="button"
          accessibilityLabel="Sign in and continue"
          {...touchTargetProps(a11y)}
        >
          <Text style={styles.loginButtonText}>Sign In & Continue</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.orText}>or continue with</Text>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Google')} accessibilityRole="button" accessibilityLabel="Continue with Google, not yet configured">
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Apple')} accessibilityRole="button" accessibilityLabel="Continue with Apple, not yet configured">
          <Text style={styles.socialButtonText}>Apple</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.socialCaption}>Not yet configured — requires developer account setup. See project notes.</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Signup')}
        accessibilityRole="button"
        accessibilityLabel="New to DisasterReady? Create account"
        {...touchTargetProps(a11y)}
      >
        <Text style={styles.signupLink}>
          New to DisasterReady? <Text style={styles.signupLinkBold}>Create Account</Text>
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
  logo: { width: 110, height: 110, marginTop: SPACING.xxl, marginBottom: SPACING.md, borderRadius: RADII.teen.card + 10 },
  titleBlock: { alignItems: 'center', width: '100%' },
  appName: { fontSize: TYPE.display.fontSize, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center' },
  tagline: { fontSize: TYPE.body.fontSize - 1, color: '#94A3B8', marginBottom: SPACING.xxl, textAlign: 'center' },
  card: { width: '100%', backgroundColor: CARD, borderRadius: RADII.teen.card + 2, padding: SPACING.xl, marginBottom: SPACING.xxl },
  cardTitle: { fontSize: TYPE.title.fontSize, fontWeight: 'bold', color: '#F8FAFC', marginBottom: SPACING.lg },
  input: {
    backgroundColor: SLATE, borderWidth: 1, borderColor: '#334155', borderRadius: RADII.teen.button - 4,
    padding: SPACING.md + 2, marginBottom: SPACING.md, color: '#F8FAFC'
  },
  loginButton: {
    width: '100%', backgroundColor: SIGNAL, borderRadius: RADII.teen.button - 2, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.lg
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: TYPE.body.fontSize + 1 },
  orText: { color: '#64748B', fontSize: TYPE.caption.fontSize + 1, marginBottom: SPACING.md },
  socialRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: SPACING.xl },
  socialButton: { width: '48%', backgroundColor: CARD, borderRadius: RADII.teen.button - 4, padding: SPACING.md + 2, alignItems: 'center' },
  socialButtonText: { color: '#F8FAFC', fontWeight: 'bold' },
  socialCaption: { fontSize: TYPE.caption.fontSize - 1, color: '#475569', textAlign: 'center', marginTop: -SPACING.md, marginBottom: SPACING.xl },
  signupLink: { color: '#94A3B8', fontSize: TYPE.body.fontSize - 1, marginBottom: SPACING.lg },
  signupLinkBold: { color: SIGNAL, fontWeight: 'bold' },
  privacyNote: { fontSize: TYPE.caption.fontSize - 1, color: '#475569', textAlign: 'center', lineHeight: 16, marginBottom: SPACING.xxl }
});