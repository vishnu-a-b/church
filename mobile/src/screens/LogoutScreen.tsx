import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  member:                { label: 'Member',              color: '#0d9488', bg: '#f0fdfa' },
  donor:                 { label: 'Donor',               color: '#7c3aed', bg: '#f5f3ff' },
  church_admin:          { label: 'Church Admin',         color: '#059669', bg: '#f0fdf4' },
  unit_admin:            { label: 'Unit Admin',           color: '#2563eb', bg: '#eff6ff' },
  kudumbakutayima_admin: { label: 'Kutayima Admin',       color: '#ea580c', bg: '#fff7ed' },
};

export default function LogoutScreen() {
  const { user, logout } = useAuth();

  const role = user?.role ?? '';
  const rcfg = ROLE_CONFIG[role] ?? { label: role, color: '#0d9488', bg: '#f0fdfa' };
  const initials = ((user?.username || user?.email || '?')[0] ?? '?').toUpperCase();

  return (
    <View style={styles.container}>

      {/* Profile card */}
      <View style={styles.card}>
        {/* Avatar */}
        <View style={[styles.avatarRing, { borderColor: rcfg.color + '40' }]}>
          <View style={[styles.avatar, { backgroundColor: rcfg.color }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.username}>{user?.username || user?.email}</Text>

        <View style={[styles.roleBadge, { backgroundColor: rcfg.bg }]}>
          <Ionicons name="shield-checkmark-outline" size={13} color={rcfg.color} />
          <Text style={[styles.roleText, { color: rcfg.color }]}>{rcfg.label}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.hint}>You are signed in to the {rcfg.label} portal</Text>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 24, justifyContent: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, padding: 4,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatar: { width: 78, height: 78, borderRadius: 39, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  username: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999, marginBottom: 16,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  divider: { width: '100%', height: 1, backgroundColor: '#f3f4f6', marginBottom: 14 },
  hint: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#fecaca',
    ...Platform.select({
      ios: { shadowColor: '#dc2626', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
