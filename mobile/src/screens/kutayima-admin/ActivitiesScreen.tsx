import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import MarkActivityModal from './MarkActivityModal';

interface Activity {
  _id: string;
  memberId: { firstName: string; lastName: string } | null;
  activityType: string;
  createdAt: string;
}

const api = createRoleApi('kudumbakutayima_admin');
const COLOR = '#ea580c';

const ACTIVITY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  holy_mass:     'flame-outline',
  fasting:       'moon-outline',
  prayer:        'hand-left-outline',
  bible_reading: 'book-outline',
};

export default function KutayimaAdminActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/spiritual-activities?includeAllStatuses=true');
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
              <Text style={styles.bannerSub}>{activities.length} marked</Text>
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
                <Text style={styles.cardDate}>
                  {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="leaf-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No activities marked yet</Text>
            <Text style={styles.emptySub}>Tap the + button to mark an activity</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <MarkActivityModal visible={modalVisible} onClose={() => setModalVisible(false)} onSaved={() => { setModalVisible(false); setRefreshing(true); fetchActivities(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },

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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#ea580c' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardType: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize', marginBottom: 2 },
  cardDate: { fontSize: 11, color: '#9ca3af' },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#ea580c', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
});
