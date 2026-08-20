import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Bavanakutayima {
  _id: string;
  name: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  leaderName?: string;
}

const api = createRoleApi('unit_admin');
const COLOR = '#2563eb';

export default function UnitAdminBavanakutayimasScreen() {
  const [items, setItems] = useState<Bavanakutayima[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get('/bavanakutayimas');
      setItems(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(b) => b._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Bavanakutayimas</Text>
              <Text style={styles.bannerSub}>{items.length} group{items.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="home-outline" size={28} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item: b }) => (
          <View style={styles.card}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="home-outline" size={20} color={COLOR} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{b.name}</Text>
              <Text style={styles.cardMeta}>
                {b.hierarchicalNumber || b.uniqueId || '-'}
                {b.leaderName ? ` · Leader: ${b.leaderName}` : ''}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="home-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No groups in your unit</Text>
            <Text style={styles.emptySub}>Bavanakutayimas will appear here</Text>
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
    backgroundColor: '#2563eb', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#2563eb',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
