import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';
import MarkActivityModal from './MarkActivityModal';

interface Activity {
  _id: string;
  memberId: { firstName: string; lastName: string } | null;
  activityType: string;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
}

const api = createRoleApi('kudumbakutayima_admin');

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
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

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <View style={styles.container}>
      <DataList
        data={activities}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchActivities(); }}
        keyExtractor={(a) => a._id}
        emptyText="No activities marked yet"
        renderItem={(a) => {
          const status = STATUS_STYLE[a.approvalStatus] || STATUS_STYLE.approved;
          return (
            <View style={styles.rowTop}>
              <View>
                <Text style={styles.name}>{a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : '-'}</Text>
                <Text style={styles.meta}>{a.activityType.replace(/_/g, ' ')}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <MarkActivityModal visible={modalVisible} onClose={() => setModalVisible(false)} onSaved={fetchActivities} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
