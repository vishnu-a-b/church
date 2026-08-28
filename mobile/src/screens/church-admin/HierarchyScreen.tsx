import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
  Platform, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

const api = createRoleApi('church_admin');
const COLOR = '#059669';

type ViewState = 'bks' | 'houses' | 'detail';

interface BK {
  _id: string;
  name: string;
  uniqueId?: string;
  leaderName?: string;
  unitId?: { _id: string; name: string } | string;
}

interface House {
  _id: string;
  familyName: string;
  headOfFamily?: string;
  houseNumber?: string;
  uniqueId?: string;
  bavanakutayimaId?: { _id: string; name: string } | string;
}

interface Member {
  _id: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  uniqueId?: string;
  role?: string;
  gender?: 'male' | 'female';
  relationToHead?: string;
  baptismName?: string;
  dateOfBirth?: string;
}

const shortId = (uid?: string) =>
  uid ? uid.split('-').slice(1).join('-') : '';

const roleLabel: Record<string, string> = {
  church_admin: 'Church Admin',
  unit_admin: 'Unit Admin',
  kudumbakutayima_admin: 'BK Admin',
  member: '',
};

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={16} color={COLOR} />
      </View>
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── BK list ───────────────────────────────────────────────────────────────────
function BKList({
  bks,
  loading,
  refreshing,
  onRefresh,
  onSelect,
}: {
  bks: BK[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onSelect: (bk: BK) => void;
}) {
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLOR} />
      </View>
    );
  }
  return (
    <FlatList
      data={bks}
      keyExtractor={(b) => b._id}
      contentContainerStyle={s.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR} />
      }
      ListHeaderComponent={
        <View style={s.banner}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Kudumbakutayimas</Text>
            <Text style={s.bannerSub}>
              {bks.length} group{bks.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={s.bannerIcon}>
            <Ionicons name="layers-outline" size={28} color="#fff" />
          </View>
        </View>
      }
      renderItem={({ item: b }) => {
        const unitName =
          b.unitId && typeof b.unitId === 'object' ? b.unitId.name : undefined;
        return (
          <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => onSelect(b)}>
            <View style={s.cardIconWrap}>
              <Ionicons name="people-circle-outline" size={22} color={COLOR} />
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{b.name}</Text>
              <Text style={s.cardMeta}>
                {shortId(b.uniqueId) || '-'}
                {unitName ? ` · ${unitName}` : ''}
                {b.leaderName ? ` · Leader: ${b.leaderName}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={s.emptyState}>
          <View style={s.emptyCircle}>
            <Ionicons name="layers-outline" size={36} color={COLOR} />
          </View>
          <Text style={s.emptyTitle}>No groups found</Text>
          <Text style={s.emptySub}>Kudumbakutayimas will appear here</Text>
        </View>
      }
    />
  );
}

// ── Houses list ───────────────────────────────────────────────────────────────
function HouseList({
  bk,
  houses,
  loading,
  onBack,
  onSelect,
}: {
  bk: BK;
  houses: House[];
  loading: boolean;
  onBack: () => void;
  onSelect: (h: House) => void;
}) {
  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.detailBar}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={s.backText}>Groups</Text>
        </TouchableOpacity>
        <Text style={s.barTitle} numberOfLines={1}>{bk.name}</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLOR} />
        </View>
      ) : (
        <FlatList
          data={houses}
          keyExtractor={(h) => h._id}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <View style={[s.banner, { marginBottom: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.bannerTitle}>Houses</Text>
                <Text style={s.bannerSub}>
                  {houses.length} famil{houses.length !== 1 ? 'ies' : 'y'}
                </Text>
              </View>
              <View style={s.bannerIcon}>
                <Ionicons name="home-outline" size={26} color="#fff" />
              </View>
            </View>
          }
          renderItem={({ item: h }) => {
            const initial = (h.familyName?.[0] ?? '?').toUpperCase();
            return (
              <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => onSelect(h)}>
                <View style={s.avatarSm}>
                  <Text style={s.avatarSmText}>{initial}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardName}>{h.familyName}</Text>
                  <Text style={s.cardMeta}>
                    {shortId(h.uniqueId) || '-'}
                    {h.houseNumber ? ` · No. ${h.houseNumber}` : ''}
                    {h.headOfFamily ? ` · Head: ${h.headOfFamily}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyCircle}>
                <Ionicons name="home-outline" size={36} color={COLOR} />
              </View>
              <Text style={s.emptyTitle}>No houses in this group</Text>
              <Text style={s.emptySub}>Houses will appear here once added</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── House detail ──────────────────────────────────────────────────────────────
function HouseDetail({
  house,
  members,
  bkName,
  onBack,
}: {
  house: House;
  members: Member[];
  bkName: string;
  onBack: () => void;
}) {
  const initial = (house.familyName?.[0] ?? '?').toUpperCase();

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.detailBar}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
          <Text style={s.backText}>Houses</Text>
        </TouchableOpacity>
        <Text style={s.barTitle} numberOfLines={1}>{house.familyName}</Text>
      </View>

      <ScrollView contentContainerStyle={s.detailContent}>
        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroAvatar}>
            <Text style={s.heroAvatarText}>{initial}</Text>
          </View>
          <Text style={s.heroName}>{house.familyName}</Text>
          {shortId(house.uniqueId) ? (
            <Text style={s.heroId}>{shortId(house.uniqueId)}</Text>
          ) : null}
        </View>

        {/* House info */}
        <View style={[s.infoCard, { marginBottom: 16 }]}>
          <InfoRow icon="layers-outline" label="Kudumbakutayima" value={bkName} />
          {house.houseNumber ? (
            <InfoRow icon="home-outline" label="House Number" value={house.houseNumber} />
          ) : null}
          {house.headOfFamily ? (
            <InfoRow icon="person-outline" label="Head of Family" value={house.headOfFamily} />
          ) : null}
        </View>

        {/* Members */}
        <SectionHeader title={`Members (${members.length})`} />
        {members.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptySub}>No members in this house</Text>
          </View>
        ) : (
          <View style={s.infoCard}>
            {members.map((m, i) => {
              const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
              const fullName = `${m.firstName}${m.lastName ? ' ' + m.lastName : ''}`;
              const roleTag = m.role && m.role !== 'member' ? roleLabel[m.role] || m.role : '';
              const genderIcon: React.ComponentProps<typeof Ionicons>['name'] =
                m.gender === 'female' ? 'woman-outline' : 'man-outline';
              const relation =
                m.relationToHead && m.relationToHead !== 'other'
                  ? m.relationToHead.charAt(0).toUpperCase() + m.relationToHead.slice(1)
                  : '';

              return (
                <View
                  key={m._id}
                  style={[s.memberRow, i < members.length - 1 && s.memberRowBorder]}
                >
                  <View style={s.memberAvatar}>
                    <Text style={s.memberAvatarText}>{initials}</Text>
                  </View>
                  <View style={s.memberBody}>
                    <View style={s.memberNameRow}>
                      <Text style={s.memberName}>{fullName}</Text>
                      {m.gender ? (
                        <Ionicons
                          name={genderIcon}
                          size={13}
                          color={m.gender === 'female' ? '#db2777' : '#2563eb'}
                          style={{ marginLeft: 4, marginTop: 2 }}
                        />
                      ) : null}
                      {roleTag ? (
                        <View style={s.roleBadge}>
                          <Text style={s.roleBadgeText}>{roleTag}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.memberMeta}>
                      {shortId(m.uniqueId) || '-'}
                      {relation ? ` · ${relation}` : ''}
                      {m.baptismName ? ` · ${m.baptismName}` : ''}
                      {m.phone ? ` · ${m.phone}` : ''}
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChurchAdminHierarchyScreen() {
  const [view, setView] = useState<ViewState>('bks');
  const [bks, setBks] = useState<BK[]>([]);
  const [selectedBK, setSelectedBK] = useState<BK | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [houseMembers, setHouseMembers] = useState<Member[]>([]);

  const [bkLoading, setBkLoading] = useState(true);
  const [bkRefreshing, setBkRefreshing] = useState(false);
  const [housesLoading, setHousesLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchBKs = useCallback(async () => {
    try {
      const res = await api.get('/bavanakutayimas');
      setBks(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBkLoading(false);
      setBkRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBKs(); }, [fetchBKs]);

  const selectBK = useCallback(async (bk: BK) => {
    setSelectedBK(bk);
    setView('houses');
    setHousesLoading(true);
    try {
      const res = await api.get(`/houses?bavanakutayimaId=${bk._id}`);
      setHouses(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHousesLoading(false);
    }
  }, []);

  const selectHouse = useCallback(async (house: House) => {
    setSelectedHouse(house);
    setView('detail');
    setDetailLoading(true);
    try {
      const [houseRes, membersRes] = await Promise.all([
        api.get(`/houses/${house._id}`),
        api.get(`/members?houseId=${house._id}`),
      ]);
      setSelectedHouse(houseRes.data?.data || house);
      setHouseMembers(membersRes.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const backToHouses = useCallback(() => {
    setView('houses');
    setSelectedHouse(null);
    setHouseMembers([]);
  }, []);

  const backToBKs = useCallback(() => {
    setView('bks');
    setSelectedBK(null);
    setHouses([]);
    setSelectedHouse(null);
    setHouseMembers([]);
  }, []);

  if (view === 'detail' && selectedHouse) {
    if (detailLoading) {
      return (
        <SafeAreaView style={s.safeArea} edges={['top']}>
          <View style={s.detailBar}>
            <TouchableOpacity style={s.backBtn} onPress={backToHouses} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
              <Text style={s.backText}>Houses</Text>
            </TouchableOpacity>
          </View>
          <View style={s.center}>
            <ActivityIndicator size="large" color={COLOR} />
          </View>
        </SafeAreaView>
      );
    }
    return (
      <HouseDetail
        house={selectedHouse}
        members={houseMembers}
        bkName={selectedBK?.name ?? ''}
        onBack={backToHouses}
      />
    );
  }

  if (view === 'houses' && selectedBK) {
    return (
      <HouseList
        bk={selectedBK}
        houses={houses}
        loading={housesLoading}
        onBack={backToBKs}
        onSelect={selectHouse}
      />
    );
  }

  return (
    <View style={s.container}>
      <BKList
        bks={bks}
        loading={bkLoading}
        refreshing={bkRefreshing}
        onRefresh={() => { setBkRefreshing(true); fetchBKs(); }}
        onSelect={selectBK}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

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
  cardIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  avatarSm: { width: 44, height: 44, borderRadius: 13, backgroundColor: COLOR, justifyContent: 'center', alignItems: 'center' },
  avatarSmText: { fontSize: 18, fontWeight: '800', color: '#fff' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  // Nav bar
  detailBar: {
    backgroundColor: COLOR, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  barTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'right' },

  detailContent: { padding: 16, paddingBottom: 40 },

  // Hero
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

  // Info card
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },

  // Member rows
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  memberRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  memberAvatar: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontSize: 13, fontWeight: '700', color: COLOR },
  memberBody: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  memberMeta: { fontSize: 12, color: '#6b7280' },
  roleBadge: { marginLeft: 6, backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#bbf7d0' },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: COLOR },
});
