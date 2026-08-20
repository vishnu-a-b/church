import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface NewsItem {
  _id: string;
  title: string;
  startDate: string;
}

const api = createRoleApi('member');

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function NewsCard({ item }: { item: NewsItem }) {
  const d = new Date(item.startDate);
  return (
    <View style={styles.card}>
      {/* Megaphone icon */}
      <View style={styles.iconWrap}>
        <Ionicons name="megaphone-outline" size={20} color="#0d9488" />
      </View>
      {/* Content */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={11} color="#0d9488" />
          <Text style={styles.dateText}>
            {d.getDate()} {MONTH_SHORT[d.getMonth()]} {d.getFullYear()}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </View>
  );
}

export default function MemberNewsScreen() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get('/news/active/list');
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i._id}
        renderItem={({ item }) => <NewsCard item={item} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#0d9488" />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="newspaper-outline" size={26} color="#fff" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Church News</Text>
              <Text style={styles.bannerSub}>{items.length} announcement{items.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="newspaper-outline" size={36} color="#0d9488" />
            </View>
            <Text style={styles.emptyTitle}>No news right now</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, padding: 16 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#0d9488', borderRadius: 20,
    padding: 18, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 7 },
    }),
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#0d9488',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6, lineHeight: 20 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#f0fdfa', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  dateText: { fontSize: 11, color: '#0d9488', fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdfa', borderWidth: 2, borderColor: '#ccfbf1', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af' },
});
