import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RolePickerScreen() {
  const { selectRole } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Church App</Text>
      <Text style={styles.subtitle}>Sign in as</Text>

      <TouchableOpacity style={[styles.button, styles.memberButton]} onPress={() => selectRole('member')}>
        <Text style={styles.buttonText}>Member</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.donorButton]} onPress={() => selectRole('donor')}>
        <Text style={styles.buttonText}>Donor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', color: '#0f766e', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32 },
  button: { width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  memberButton: { backgroundColor: '#0d9488' },
  donorButton: { backgroundColor: '#7c3aed' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
