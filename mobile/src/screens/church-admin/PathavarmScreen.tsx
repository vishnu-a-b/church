import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';
import RecordPathavarmModal from './RecordPathavarmModal';

interface Transaction {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  memberId?: { firstName: string; lastName: string };
}

const api = createRoleApi('church_admin');

export default function ChurchAdminPathavarmScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions?transactionType=pathavarm');
      setTransactions(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const total = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Collected</Text>
        <Text style={styles.summaryAmount}>₹{total.toLocaleString()}</Text>
      </View>

      <DataList
        data={transactions}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchTransactions(); }}
        keyExtractor={(t) => t._id}
        emptyText="No Pathavarm contributions yet"
        renderItem={(t) => (
          <View style={styles.rowTop}>
            <View>
              <Text style={styles.name}>{t.memberId ? `${t.memberId.firstName} ${t.memberId.lastName}` : '-'}</Text>
              <Text style={styles.meta}>{new Date(t.paymentDate).toLocaleDateString('en-IN')}</Text>
            </View>
            <Text style={styles.amount}>₹{t.totalAmount.toLocaleString()}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <RecordPathavarmModal visible={modalVisible} onClose={() => setModalVisible(false)} onSaved={fetchTransactions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  summary: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: '#059669' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  amount: { fontWeight: '700', color: '#059669' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
