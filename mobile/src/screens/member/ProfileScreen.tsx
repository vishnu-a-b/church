import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Profile {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  churchId?: { name: string };
  unitId?: { name: string };
  bavanakutayimaId?: { name: string };
  houseId?: { familyName: string };
}

const api = createRoleApi('member');

const ROLE_LABEL: Record<string, string> = {
  member: 'Member',
  church_admin: 'Church Admin',
  unit_admin: 'Unit Admin',
  kudumbakutayima_admin: 'Kutayima Admin',
};

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name={icon} size={16} color="#0d9488" />
      </View>
      <View style={rowStyles.textWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  iconWrap: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 1 },
});

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
    return <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';
  const roleLabel = ROLE_LABEL[profile?.role ?? ''] ?? profile?.role ?? 'Member';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero banner */}
      <View style={styles.hero}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        {!!profile?.email && <Text style={styles.emailText}>{profile.email}</Text>}
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={13} color="#fff" />
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      {/* Contact info */}
      <Text style={styles.sectionTitle}>Contact</Text>
      <View style={styles.card}>
        <InfoRow icon="call-outline"  label="Phone" value={profile?.phone} />
        <InfoRow icon="mail-outline"  label="Email" value={profile?.email} />
      </View>

      {/* Hierarchy */}
      <Text style={styles.sectionTitle}>Parish Info</Text>
      <View style={styles.card}>
        <InfoRow icon="business-outline"  label="Church"          value={profile?.churchId?.name} />
        <InfoRow icon="people-outline"    label="Unit"            value={profile?.unitId?.name} />
        <InfoRow icon="home-outline"      label="Bavanakutayima"  value={profile?.bavanakutayimaId?.name} />
        <InfoRow icon="heart-outline"     label="Family"          value={profile?.houseId?.familyName} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero: {
    backgroundColor: '#0d9488', alignItems: 'center',
    paddingTop: 36, paddingBottom: 32, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 10 },
    }),
  },
  avatarOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)', padding: 4, marginBottom: 14,
  },
  avatar: { flex: 1, borderRadius: 41, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#0d9488' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  emailText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 16, marginBottom: 8, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', marginHorizontal: 16, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#fecaca',
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
