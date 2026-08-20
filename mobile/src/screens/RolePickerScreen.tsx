import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, PortalRole } from '../context/AuthContext';

const PORTALS: Array<{
  role: PortalRole;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}> = [
  { role: 'member',               label: 'Member',              desc: 'Activities, news, events & transactions',  icon: 'person-circle-outline',     color: '#0d9488', bg: '#f0fdfa' },
  { role: 'donor',                label: 'Donor',               desc: 'View your donations and giving history',   icon: 'gift-outline',              color: '#7c3aed', bg: '#f5f3ff' },
  { role: 'kudumbakutayima_admin',label: 'Kudumbakutayima Admin',desc: 'Manage your family group',                icon: 'home-outline',              color: '#ea580c', bg: '#fff7ed' },
  { role: 'unit_admin',           label: 'Unit Admin',          desc: 'Oversee members and unit activities',      icon: 'people-outline',            color: '#2563eb', bg: '#eff6ff' },
  { role: 'church_admin',         label: 'Church Admin',        desc: 'Full administrative access',               icon: 'shield-checkmark-outline',  color: '#059669', bg: '#f0fdf4' },
];

export default function RolePickerScreen() {
  const { selectRole } = useAuth();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Branding */}
      <View style={styles.branding}>
        <View style={styles.logoCircle}>
          <Ionicons name="flower-outline" size={38} color="#fff" />
        </View>
        <Text style={styles.churchName}>St. Mary's Elthuruth</Text>
        <Text style={styles.tagline}>Choose your portal to sign in</Text>
      </View>

      {/* Portal cards */}
      <View style={styles.cards}>
        {PORTALS.map((p) => (
          <TouchableOpacity
            key={p.role}
            style={[styles.card, { borderLeftColor: p.color }]}
            onPress={() => selectRole(p.role)}
            activeOpacity={0.78}
          >
            <View style={[styles.cardIcon, { backgroundColor: p.bg }]}>
              <Ionicons name={p.icon} size={26} color={p.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardLabel, { color: p.color }]}>{p.label}</Text>
              <Text style={styles.cardDesc}>{p.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>St. Mary's Orthodox Syrian Church</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f3f4f6' },
  container: { flexGrow: 1, padding: 24, paddingTop: 64, paddingBottom: 40 },

  branding: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#0d9488',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 10 },
    }),
  },
  churchName: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 5 },
  tagline: { fontSize: 14, color: '#6b7280' },

  cards: { gap: 12, marginBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  cardIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#6b7280', lineHeight: 16 },

  footer: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
});
