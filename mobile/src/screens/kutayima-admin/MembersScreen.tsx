import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
  Platform, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  role?: string;
  uniqueId?: string;
  houseId?: { _id: string; familyName: string; uniqueId?: string } | string;
}

const api = createRoleApi('kudumbakutayima_admin');
const COLOR = '#ea580c';
const shortId = (uid?: string) => uid ? uid.split('-').slice(1).map(s => String(+s.replace(/\D/g, ''))).join('-') : '';

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}><Ionicons name={icon} size={16} color={COLOR} /></View>
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function KutayimaAdminMembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/members/${id}`);
      setSelected(res.data?.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    const house = typeof selected.houseId === 'object' ? selected.houseId : null;
    const initials = `${selected.firstName?.[0] ?? ''}${selected.lastName?.[0] ?? ''}`.toUpperCase();
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.detailBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => setSelected(null)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={s.backText}>Members</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.detailContent}>
          <View style={s.heroCard}>
            <View style={s.heroAvatar}><Text style={s.heroAvatarText}>{initials}</Text></View>
            <Text style={s.heroName}>{selected.firstName} {selected.lastName}</Text>
            {shortId(selected.uniqueId) ? <Text style={s.heroId}>{shortId(selected.uniqueId)}</Text> : null}
            {selected.role && (
              <View style={s.roleBadge}>
                <Text style={s.roleBadgeText}>{selected.role.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>

          <View style={s.infoCard}>
            {selected.phone ? <InfoRow icon="call-outline" label="Phone" value={selected.phone} /> : null}
            {selected.email ? <InfoRow icon="mail-outline" label="Email" value={selected.email} /> : null}
            {selected.gender ? <InfoRow icon="person-outline" label="Gender" value={selected.gender} /> : null}
            {selected.dateOfBirth ? <InfoRow icon="calendar-outline" label="Date of Birth" value={new Date(selected.dateOfBirth).toLocaleDateString()} /> : null}
            {house ? <InfoRow icon="home-outline" label="House" value={`${house.familyName}${shortId(house.uniqueId) ? ` (${shortId(house.uniqueId)})` : ''}`} /> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {detailLoading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={COLOR} />
        </View>
      )}
      <FlatList
        data={members}
        keyExtractor={(m) => m._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMembers(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={s.banner}>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Members</Text>
              <Text style={s.bannerSub}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={s.bannerIcon}><Ionicons name="people-outline" size={28} color="#fff" /></View>
          </View>
        }
        renderItem={({ item: m }) => {
          const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
          return (
            <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => openDetail(m._id)}>
              <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
              <View style={s.cardBody}>
                <Text style={s.cardName}>{m.firstName} {m.lastName}</Text>
                <Text style={s.cardMeta}>
                  {shortId(m.uniqueId) || '-'}{m.phone ? ` · ${m.phone}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyCircle}><Ionicons name="people-outline" size={36} color={COLOR} /></View>
            <Text style={s.emptyTitle}>No members in your group</Text>
            <Text style={s.emptySub}>Members will appear here once added</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLOR, borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: COLOR, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  avatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: COLOR, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  // Detail
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  detailBar: { backgroundColor: COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  detailContent: { padding: 16, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  heroAvatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: COLOR, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroAvatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4, textAlign: 'center' },
  heroId: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  roleBadge: { backgroundColor: '#fff7ed', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#fed7aa' },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: COLOR, textTransform: 'capitalize' },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
});
