import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface EventItem {
  _id: string;
  title: string;
  location: string;
  startDate: string;
}

const api = createRoleApi('member');

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

  return (
    <View style={styles.container}>
      <DataList
        data={items}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchItems(); }}
        keyExtractor={(i) => i._id}
        emptyText="No upcoming events"
        renderItem={(i) => (
          <View>
            <Text style={styles.title}>{i.title}</Text>
            <Text style={styles.meta}>{i.location} · {new Date(i.startDate).toLocaleDateString('en-IN')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
