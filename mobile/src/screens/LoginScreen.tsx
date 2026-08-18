import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  member: 'Member Login',
  donor: 'Donor Login',
  church_admin: 'Church Admin Login',
  unit_admin: 'Unit Admin Login',
  kudumbakutayima_admin: 'Kutayima Admin Login',
};

export default function LoginScreen() {
  const { activeRole, login, selectRole } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setError('Enter your username/email/phone and password');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity onPress={() => selectRole(null)} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Choose a different portal</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{ROLE_LABELS[activeRole ?? ''] ?? 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Username, email, or phone"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
          <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  backLink: { marginBottom: 24 },
  backLinkText: { color: '#0d9488', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: '#fff' },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fff', marginBottom: 12 },
  passwordInput: { flex: 1, padding: 14 },
  eyeButton: { paddingHorizontal: 14 },
  eyeText: { fontSize: 18 },
  errorBox: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#991b1b', fontSize: 14 },
  button: { backgroundColor: '#0d9488', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
