import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface NewsItem {
  _id: string;
  title: string;
  publishedDate: string;
}

const api = createRoleApi('member');

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

  return (
    <View style={styles.container}>
      <DataList
        data={items}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchItems(); }}
        keyExtractor={(i) => i._id}
        emptyText="No news available"
        renderItem={(i) => (
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={2}>{i.title}</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{new Date(i.publishedDate).toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontWeight: '600', color: '#111827', flex: 1 },
  chip: { backgroundColor: '#f3f4f6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  chipText: { fontSize: 11, color: '#6b7280' },
});
