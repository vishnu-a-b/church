import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Transaction {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
}

const api = createRoleApi('member');

export default function MemberPathavarmScreen() {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get('/members/me/pathavarm');
      setHistory(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const total = history.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Contributed</Text>
        <Text style={styles.summaryAmount}>₹{total.toLocaleString()}</Text>
      </View>
      <DataList
        data={history}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        keyExtractor={(t) => t._id}
        emptyText="No Pathavarm contributions yet — this is a one-time, optional gift"
        renderItem={(t) => (
          <View style={styles.rowTop}>
            <View>
              <Text style={styles.receipt}>{t.receiptNumber}</Text>
              <Text style={styles.meta}>{new Date(t.paymentDate).toLocaleDateString('en-IN')}</Text>
            </View>
            <Text style={styles.amount}>₹{t.totalAmount.toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  summary: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: '#0d9488' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receipt: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  amount: { fontWeight: '700', color: '#059669' },
});
