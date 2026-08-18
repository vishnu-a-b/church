import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { createRoleApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Profile {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  churchId?: { name: string };
  unitId?: { name: string };
  bavanakutayimaId?: { name: string };
  houseId?: { familyName: string };
}

const api = createRoleApi('member');

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function MemberProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/members/me');
      setProfile(response.data?.data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.firstName} {profile?.lastName}</Text>
        {!!profile?.email && <Text style={styles.email}>{profile.email}</Text>}
      </View>

      <View style={styles.card}>
        <Row label="Phone" value={profile?.phone} />
        <Row label="Church" value={profile?.churchId?.name} />
        <Row label="Unit" value={profile?.unitId?.name} />
        <Row label="Bavanakutayima" value={profile?.bavanakutayimaId?.name} />
        <Row label="House" value={profile?.houseId?.familyName} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarWrap: { alignItems: 'center', marginBottom: 20, paddingVertical: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0d9488', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  rowLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },
  logoutButton: { backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
});
