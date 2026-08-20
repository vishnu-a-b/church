import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}> = {
  member:                { label: 'Member Portal',       icon: 'person-circle-outline',    color: '#0d9488' },
  donor:                 { label: 'Donor Portal',         icon: 'gift-outline',             color: '#7c3aed' },
  church_admin:          { label: 'Church Admin',         icon: 'shield-checkmark-outline', color: '#059669' },
  unit_admin:            { label: 'Unit Admin',           icon: 'people-outline',           color: '#2563eb' },
  kudumbakutayima_admin: { label: 'Kutayima Admin',       icon: 'home-outline',             color: '#ea580c' },
};

export default function LoginScreen() {
  const { activeRole, login, selectRole } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cfg = ROLE_CONFIG[activeRole ?? ''] ?? { label: 'Login', icon: 'lock-closed-outline' as const, color: '#0d9488' };

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      setError('Please enter your username and password');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);
    if (!result.success) setError(result.error || 'Login failed');
  };

  return (
    <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity onPress={() => selectRole(null)} style={styles.back}>
          <Ionicons name="chevron-back" size={18} color={cfg.color} />
          <Text style={[styles.backText, { color: cfg.color }]}>All Portals</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon} size={32} color="#fff" />
          </View>
          <Text style={styles.title}>{cfg.label}</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          {/* Username */}
          <Text style={styles.fieldLabel}>Username</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Username, email or phone"
              placeholderTextColor="#c4c4c4"
              autoCapitalize="none"
              returnKeyType="next"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* Password */}
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#c4c4c4"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: cfg.color }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="log-in-outline" size={20} color="#fff" /><Text style={styles.buttonText}>Sign In</Text></>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>St. Mary's Orthodox Syrian Church · Elthuruth</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { flexGrow: 1, padding: 24, paddingTop: 56, paddingBottom: 40 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 36 },
  backText: { fontSize: 14, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 76, height: 76, borderRadius: 38,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 10 },
    }),
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#f3f4f6',
    marginBottom: 4,
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 4,
  },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 14, marginTop: 12,
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 28 },
});
