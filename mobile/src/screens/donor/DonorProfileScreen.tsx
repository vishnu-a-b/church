import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { createRoleApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface DonorProfile {
  name: string;
  email?: string;
  phone?: string;
  churchId?: { name: string };
}

const api = createRoleApi('donor');

export default function DonorProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/donors/me');
      setProfile(response.data?.data || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{profile?.name}</Text>
        {!!profile?.email && <Text style={styles.field}>Email: {profile.email}</Text>}
        {!!profile?.phone && <Text style={styles.field}>Phone: {profile.phone}</Text>}
        {!!profile?.churchId?.name && <Text style={styles.field}>Church: {profile.churchId.name}</Text>}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f3f4f6' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  field: { fontSize: 14, color: '#4b5563', marginBottom: 6 },
  logoutButton: { backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '600' },
});
