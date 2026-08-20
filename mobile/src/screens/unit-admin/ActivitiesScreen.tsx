import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Activity {
  _id: string;
  memberId: { firstName: string; lastName: string } | null;
  activityType: string;
  createdAt: string;
}

const api = createRoleApi('unit_admin');
const COLOR = '#2563eb';

const ACTIVITY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  holy_mass:    'flame-outline',
  fasting:      'moon-outline',
  prayer:       'hand-left-outline',
  bible_reading: 'book-outline',
};

export default function UnitAdminActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/spiritual-activities');
      setActivities(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(a) => a._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActivities(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Spiritual Activities</Text>
              <Text style={styles.bannerSub}>{activities.length} approved</Text>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="leaf-outline" size={28} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item: a }) => {
          const icon = ACTIVITY_ICON[a.activityType] ?? 'leaf-outline';
          const d = new Date(a.createdAt);
          return (
            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardIconWrap}>
                <Ionicons name={icon} size={18} color={COLOR} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>
                  {a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : '-'}
                </Text>
                <Text style={styles.cardType}>{a.activityType.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.cardDate}>
                {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="leaf-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySub}>Approved spiritual activities will appear here</Text>
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#2563eb' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardType: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },
  cardDate: { fontSize: 11, color: '#9ca3af', paddingRight: 14 },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
