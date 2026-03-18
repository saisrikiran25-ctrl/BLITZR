import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';

type Mode = 'LOGIN' | 'REGISTER';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'LOGIN') {
        const res = await authApi.login(email, password);
        login(res.token, res.user.user_id, res.user.username, res.user.tos_accepted);
      } else {
        if (!username) { Alert.alert('Error', 'Username is required.'); return; }
        const res = await authApi.register(email, username, password);
        login(res.token, res.user.user_id, res.user.username, false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>BLITZR</Text>
          <Text style={styles.tagline}>The Campus Clout Exchange</Text>

          <View style={styles.modeSwitch}>
            {(['LOGIN', 'REGISTER'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === 'LOGIN' ? 'Log In' : 'Register'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="College email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {mode === 'REGISTER' && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.obsidian} />
            ) : (
              <Text style={styles.ctaBtnText}>{mode === 'LOGIN' ? 'Log In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.obsidian },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.kineticGreen,
    letterSpacing: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 2,
    marginBottom: Spacing.lg,
  },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  modeBtnActive: { backgroundColor: Colors.kineticGreen },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modeBtnTextActive: { color: Colors.obsidian },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ctaBtn: {
    backgroundColor: Colors.kineticGreen,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: Colors.obsidian },
});
