import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  houseId?: { familyName: string } | string;
}

const api = createRoleApi('kudumbakutayima_admin');

export default function KutayimaAdminMembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <View style={styles.container}>
      <DataList
        data={members}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchMembers(); }}
        keyExtractor={(m) => m._id}
        emptyText="No members in your bavanakutayima"
        renderItem={(m) => (
          <View>
            <Text style={styles.name}>{m.firstName} {m.lastName}</Text>
            <Text style={styles.meta}>
              {m.hierarchicalNumber || m.uniqueId || '-'}
              {typeof m.houseId === 'object' && m.houseId?.familyName ? ` · ${m.houseId.familyName}` : ''}
              {m.phone ? ` · ${m.phone}` : ''}
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
