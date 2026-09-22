import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
  Platform, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface House {
  _id: string;
  familyName: string;
  headOfFamily?: string;
  houseNumber?: string;
  uniqueId?: string;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  uniqueId?: string;
  role?: string;
}

const api = createRoleApi('unit_admin');
const COLOR = '#2563eb';
const shortId = (uid?: string) => uid ? uid.split('-').slice(1).join('-') : '';

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

export default function UnitAdminHousesScreen() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<House | null>(null);
  const [houseMembers, setHouseMembers] = useState<Member[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHouses = useCallback(async () => {
    try {
      const res = await api.get('/houses');
      setHouses(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHouses(); }, [fetchHouses]);

  const openDetail = async (house: House) => {
    setDetailLoading(true);
    try {
      const [houseRes, membersRes] = await Promise.all([
        api.get(`/houses/${house._id}`),
        api.get(`/members?houseId=${house._id}`),
      ]);
      setSelected(houseRes.data?.data || house);
      setHouseMembers(membersRes.data?.data || []);
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
    const initial = (selected.familyName[0] ?? '?').toUpperCase();
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.detailBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => { setSelected(null); setHouseMembers([]); }} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
            <Text style={s.backText}>Houses</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.detailContent}>
          <View style={s.heroCard}>
            <View style={s.heroAvatar}><Text style={s.heroAvatarText}>{initial}</Text></View>
            <Text style={s.heroName}>{selected.familyName}</Text>
            {shortId(selected.uniqueId) ? <Text style={s.heroId}>{shortId(selected.uniqueId)}</Text> : null}
          </View>

          <View style={[s.infoCard, { marginBottom: 16 }]}>
            {selected.houseNumber ? <InfoRow icon="home-outline" label="House Number" value={selected.houseNumber} /> : null}
            {selected.headOfFamily ? <InfoRow icon="person-outline" label="Head of Family" value={selected.headOfFamily} /> : null}
          </View>

          <Text style={s.sectionTitle}>Members ({houseMembers.length})</Text>
          {houseMembers.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptySub}>No members in this house</Text>
            </View>
          ) : (
            <View style={s.infoCard}>
              {houseMembers.map((m, i) => {
                const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
                return (
                  <View key={m._id} style={[s.memberRow, i < houseMembers.length - 1 && s.memberRowBorder]}>
                    <View style={s.memberAvatar}><Text style={s.memberAvatarText}>{initials}</Text></View>
                    <View style={s.memberBody}>
                      <Text style={s.memberName}>{m.firstName} {m.lastName}</Text>
                      <Text style={s.memberMeta}>
                        {shortId(m.uniqueId) || '-'}{m.phone ? ` · ${m.phone}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
        data={houses}
        keyExtractor={(h) => h._id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHouses(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={s.banner}>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Houses</Text>
              <Text style={s.bannerSub}>{houses.length} famil{houses.length !== 1 ? 'ies' : 'y'}</Text>
            </View>
            <View style={s.bannerIcon}><Ionicons name="home-outline" size={28} color="#fff" /></View>
          </View>
        }
        renderItem={({ item: h }) => {
          const initial = (h.familyName[0] ?? '?').toUpperCase();
          return (
            <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => openDetail(h)}>
              <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
              <View style={s.cardBody}>
                <Text style={s.cardName}>{h.familyName}</Text>
                <Text style={s.cardMeta}>
                  {shortId(h.uniqueId) || '-'}
                  {h.headOfFamily ? ` · Head: ${h.headOfFamily}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyCircle}><Ionicons name="home-outline" size={36} color={COLOR} /></View>
            <Text style={s.emptyTitle}>No houses in your unit</Text>
            <Text style={s.emptySub}>Houses will appear here once added</Text>
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
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
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
  heroId: { fontSize: 13, color: '#6b7280' },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  memberRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  memberAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontSize: 13, fontWeight: '700', color: COLOR },
  memberBody: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  memberMeta: { fontSize: 12, color: '#6b7280' },
});
