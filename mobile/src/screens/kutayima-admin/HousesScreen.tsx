import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface House {
  _id: string;
  familyName: string;
  headOfFamily?: string;
  houseNumber?: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
}

const api = createRoleApi('kudumbakutayima_admin');

export default function KutayimaAdminHousesScreen() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHouses = useCallback(async () => {
    try {
      const response = await api.get('/houses');
      setHouses(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  return (
    <View style={styles.container}>
      <DataList
        data={houses}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchHouses(); }}
        keyExtractor={(h) => h._id}
        emptyText="No houses in your bavanakutayima"
        renderItem={(h) => (
          <View>
            <Text style={styles.name}>{h.familyName}</Text>
            <Text style={styles.meta}>
              {h.hierarchicalNumber || h.uniqueId || '-'}{h.headOfFamily ? ` · Head: ${h.headOfFamily}` : ''}
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
