import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface EventItem {
  _id: string;
  title: string;
  location: string;
  startDate: string;
}

const api = createRoleApi('member');

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function EventCard({ item }: { item: EventItem }) {
  const d = new Date(item.startDate);
  const isUpcoming = d >= new Date();

  return (
    <View style={styles.card}>
      {/* Date box */}
      <View style={[styles.dateBox, isUpcoming ? styles.dateBoxUpcoming : styles.dateBoxPast]}>
        <Text style={[styles.dateDay, !isUpcoming && styles.datePastText]}>{DAY_SHORT[d.getDay()]}</Text>
        <Text style={[styles.dateNum, !isUpcoming && styles.datePastText]}>{d.getDate()}</Text>
        <Text style={[styles.dateMon, !isUpcoming && styles.datePastText]}>{MONTH_SHORT[d.getMonth()]}</Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color="#6b7280" />
          <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color="#6b7280" />
          <Text style={styles.cardMeta}>
            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {isUpcoming && (
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingText}>Soon</Text>
        </View>
      )}
    </View>
  );
}

export default function MemberEventsScreen() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get('/events/active/list');
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i._id}
        renderItem={({ item }) => <EventCard item={item} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#7c3aed" />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="calendar-outline" size={26} color="#fff" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Events</Text>
              <Text style={styles.bannerSub}>{items.length} event{items.length !== 1 ? 's' : ''} listed</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="calendar-outline" size={36} color="#7c3aed" />
            </View>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySub}>Check back soon</Text>
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
    backgroundColor: '#7c3aed', borderRadius: 20,
    padding: 18, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 7 },
    }),
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  dateBox: {
    width: 52, borderRadius: 14, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4,
  },
  dateBoxUpcoming: { backgroundColor: '#f5f3ff' },
  dateBoxPast: { backgroundColor: '#f3f4f6' },
  dateDay: { fontSize: 10, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  dateNum: { fontSize: 22, fontWeight: '800', color: '#7c3aed', lineHeight: 26 },
  dateMon: { fontSize: 10, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  datePastText: { color: '#9ca3af' },

  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  cardLocation: { fontSize: 12, color: '#6b7280', flex: 1 },
  cardMeta: { fontSize: 12, color: '#6b7280' },

  upcomingBadge: { backgroundColor: '#f5f3ff', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  upcomingText: { fontSize: 10, fontWeight: '700', color: '#7c3aed' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f5f3ff', borderWidth: 2, borderColor: '#ede9fe', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af' },
});
