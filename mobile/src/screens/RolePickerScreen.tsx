import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth, PortalRole } from '../context/AuthContext';

const PORTALS: Array<{ role: PortalRole; label: string; color: string }> = [
  { role: 'member', label: 'Member', color: '#0d9488' },
  { role: 'donor', label: 'Donor', color: '#7c3aed' },
  { role: 'kudumbakutayima_admin', label: 'Kudumbakutayima Admin', color: '#ea580c' },
  { role: 'church_admin', label: 'Church Admin', color: '#059669' },
];

export default function RolePickerScreen() {
  const { selectRole } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Church App</Text>
      <Text style={styles.subtitle}>Sign in as</Text>

      {PORTALS.map((portal) => (
        <TouchableOpacity
          key={portal.role}
          style={[styles.button, { backgroundColor: portal.color }]}
          onPress={() => selectRole(portal.role)}
        >
          <Text style={styles.buttonText}>{portal.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', color: '#0f766e', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32 },
  button: { width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
