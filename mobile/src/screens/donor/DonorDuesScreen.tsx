import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Due {
  _id: string;
  planId?: { name: string };
  periodMonth: string;
  amount: number;
  isPaid: boolean;
  balance: number;
}

const api = createRoleApi('donor');

export default function DonorDuesScreen() {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDues = useCallback(async () => {
    try {
      const response = await api.get('/monthly-support-dues/mine');
      setDues(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDues();
  };

  return (
    <View style={styles.container}>
      <DataList
        data={dues}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyExtractor={(d) => d._id}
        emptyText="No Monthly Support dues"
        renderItem={(d) => (
          <View style={styles.rowTop}>
            <View>
              <Text style={styles.plan}>{d.planId?.name || 'Monthly Support'}</Text>
              <Text style={styles.meta}>{d.periodMonth}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>₹{d.amount.toLocaleString()}</Text>
              <Text style={d.isPaid ? styles.paid : styles.unpaid}>{d.isPaid ? 'Paid' : `₹${d.balance} due`}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plan: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontWeight: '700', color: '#111827' },
  paid: { fontSize: 12, color: '#059669', marginTop: 2 },
  unpaid: { fontSize: 12, color: '#dc2626', marginTop: 2 },
});
