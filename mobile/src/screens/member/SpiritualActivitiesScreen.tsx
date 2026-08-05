import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Activity {
  _id: string;
  activityType: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
}

const api = createRoleApi('member');

const STATUS_LABEL: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function MemberSpiritualActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/members/me/spiritual-activities');
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  return (
    <View style={styles.container}>
      <DataList
        data={activities}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyExtractor={(a) => a._id}
        emptyText="No spiritual activities recorded yet"
        renderItem={(a) => (
          <View style={styles.rowTop}>
            <Text style={styles.type}>{a.activityType}</Text>
            <Text style={styles.status}>{STATUS_LABEL[a.approvalStatus || 'approved']}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  status: { fontSize: 12, color: '#6b7280' },
});
