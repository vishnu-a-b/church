import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Shared "Account" tab for admin portals — just shows who's signed in and a
// logout action, since admin roles don't have a personal profile of their own
// the way Member/Donor do.
export default function LogoutScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user?.username || user?.email}</Text>
        <Text style={styles.role}>{user?.role.replace('_', ' ')}</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f3f4f6' },
  label: { fontSize: 12, color: '#6b7280' },
  value: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  role: { fontSize: 13, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' },
  logoutButton: { backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '600' },
});
