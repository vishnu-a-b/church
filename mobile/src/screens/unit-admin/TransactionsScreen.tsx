import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';

interface Transaction {
  _id: string;
  receiptNumber: string;
  transactionType: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
}

const api = createRoleApi('unit_admin');

export default function UnitAdminTransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions');
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

  return (
    <View style={styles.container}>
      <DataList
        data={transactions}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchTransactions(); }}
        keyExtractor={(t) => t._id}
        emptyText="No transactions in your unit"
        renderItem={(t) => (
          <View>
            <View style={styles.rowTop}>
              <Text style={styles.receipt}>{t.receiptNumber}</Text>
              <Text style={styles.amount}>₹{t.totalAmount.toLocaleString()}</Text>
            </View>
            <Text style={styles.meta}>
              {t.transactionType.replace(/_/g, ' ')} · {t.paymentMethod.replace(/_/g, ' ')} · {new Date(t.paymentDate).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  receipt: { fontWeight: '600', color: '#111827' },
  amount: { fontWeight: '700', color: '#059669' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' },
});
