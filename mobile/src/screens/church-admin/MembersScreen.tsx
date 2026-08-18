import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  hierarchicalNumber?: string;
  phone?: string;
  houseId?: { familyName: string } | string;
}

const api = createRoleApi('church_admin');

export default function ChurchAdminMembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = search.trim()
    ? members.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>
      <DataList
        data={filtered}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchMembers(); }}
        keyExtractor={(m) => m._id}
        emptyText="No members found"
        renderItem={(m) => (
          <View>
            <Text style={styles.name}>{m.firstName} {m.lastName}</Text>
            <Text style={styles.meta}>
              {m.hierarchicalNumber || '-'}
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
  searchWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  search: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
