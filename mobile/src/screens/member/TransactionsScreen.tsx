import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Transaction {
  _id: string;
  receiptNumber: string;
  transactionType: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
}

const api = createRoleApi('member');

const PAYMENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  cash:          'cash-outline',
  bank_transfer: 'swap-horizontal-outline',
  upi:           'phone-portrait-outline',
  cheque:        'document-text-outline',
};

function TransactionCard({ t }: { t: Transaction }) {
  const d = new Date(t.paymentDate);
  const icon = PAYMENT_ICON[t.paymentMethod] ?? 'receipt-outline';

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="receipt-outline" size={20} color="#059669" />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <Text style={styles.receipt} numberOfLines={1}>{t.receiptNumber}</Text>
          <Text style={styles.amount}>₹{t.totalAmount.toLocaleString()}</Text>
        </View>
        <Text style={styles.type} numberOfLines={1}>{t.transactionType.replace(/_/g, ' ')}</Text>
        <View style={styles.metaRow}>
          <View style={styles.methodPill}>
            <Ionicons name={icon} size={11} color="#6b7280" />
            <Text style={styles.method}>{t.paymentMethod.replace(/_/g, ' ')}</Text>
          </View>
          <Text style={styles.date}>
            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MemberTransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/members/me/transactions');
      setTransactions(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const total = transactions.reduce((s, t) => s + t.totalAmount, 0);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={t => t._id}
        renderItem={({ item }) => <TransactionCard t={item} />}
        contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTransactions(); }} tintColor="#059669" />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerTitle}>Transactions</Text>
              <Text style={styles.bannerTotal}>₹{total.toLocaleString()} total</Text>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="receipt-outline" size={26} color="#fff" />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="receipt-outline" size={36} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Your payment history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, padding: 16 },

  banner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 20,
    padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 7 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerTotal: { fontSize: 24, fontWeight: '800', color: '#fff' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#059669',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  receipt: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  amount: { fontSize: 16, fontWeight: '800', color: '#059669' },
  type: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9fafb', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  method: { fontSize: 11, color: '#6b7280', textTransform: 'capitalize' },
  date: { fontSize: 11, color: '#9ca3af' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
