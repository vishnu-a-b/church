import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Activity {
  _id: string;
  memberId: { firstName: string; lastName: string } | null;
  activityType: string;
  createdAt: string;
}

const api = createRoleApi('unit_admin');

export default function UnitAdminActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      // No includeAllStatuses flag — unit_admin is purely informational, so this
      // shows only approved (counted) entries, same as the web unit-admin view.
      const response = await api.get('/spiritual-activities');
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
        emptyText="No spiritual activities recorded yet"
        renderItem={(a) => (
          <View>
            <Text style={styles.name}>{a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : '-'}</Text>
            <Text style={styles.meta}>{a.activityType}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
});
