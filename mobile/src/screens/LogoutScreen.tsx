import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  donor: 'Donor',
  church_admin: 'Church Admin',
  unit_admin: 'Unit Admin',
  kudumbakutayima_admin: 'Kudumbakutayima Admin',
};

// Shared "Account" tab for admin portals — shows who's signed in and a logout action.
export default function LogoutScreen() {
  const { user, logout } = useAuth();

  const initials = (user?.username || user?.email || '?')[0].toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.username}>{user?.username || user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#059669', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#fff' },
  username: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  roleBadge: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingVertical: 4, paddingHorizontal: 14, borderRadius: 999 },
  roleText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  logoutButton: { backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
