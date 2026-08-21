import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  houseId?: { familyName: string } | string;
}

const api = createRoleApi('kudumbakutayima_admin');
const COLOR = '#ea580c';

export default function KutayimaAdminMembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(m) => m._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMembers(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Members</Text>
              <Text style={styles.bannerSub}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="people-outline" size={28} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item: m }) => {
          const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
          const familyName = typeof m.houseId === 'object' ? m.houseId?.familyName : undefined;
          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{m.firstName} {m.lastName}</Text>
                <Text style={styles.cardMeta}>
                  {m.hierarchicalNumber || m.uniqueId || '-'}
                  {familyName ? ` · ${familyName}` : ''}
                  {m.phone ? ` · ${m.phone}` : ''}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="people-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No members in your group</Text>
            <Text style={styles.emptySub}>Members will appear here once added</Text>
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
    backgroundColor: '#ea580c', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#ea580c', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
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
  avatar: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
