import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  hierarchicalNumber?: string;
  phone?: string;
  houseId?: { familyName: string } | string;
}

const api = createRoleApi('church_admin');
const COLOR = '#059669';

export default function ChurchAdminMembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = search.trim()
    ? members.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(m) => m._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMembers(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <>
            <View style={styles.banner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Members</Text>
                <Text style={styles.bannerSub}>{members.length} total</Text>
              </View>
              <View style={styles.bannerIcon}>
                <Ionicons name="people-outline" size={28} color="#fff" />
              </View>
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />
            </View>
          </>
        }
        renderItem={({ item: m }) => {
          const initials = `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase();
          const familyName = typeof m.houseId === 'object' ? m.houseId?.familyName : undefined;
          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{m.firstName} {m.lastName}</Text>
                <Text style={styles.cardMeta}>
                  {m.hierarchicalNumber || '-'}
                  {familyName ? ` · ${familyName}` : ''}
                  {m.phone ? ` · ${m.phone}` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="people-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'No members found' : 'No members yet'}
            </Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term' : 'Members will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 20, padding: 20, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  avatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
