import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Bavanakutayima {
  _id: string;
  name: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  leaderName?: string;
}

const api = createRoleApi('unit_admin');

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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <View style={styles.container}>
      <DataList
        data={items}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchItems(); }}
        keyExtractor={(b) => b._id}
        emptyText="No bavanakutayimas in your unit"
        renderItem={(b) => (
          <View>
            <Text style={styles.name}>{b.name}</Text>
            <Text style={styles.meta}>
              {b.hierarchicalNumber || b.uniqueId || '-'}{b.leaderName ? ` · Leader: ${b.leaderName}` : ''}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
