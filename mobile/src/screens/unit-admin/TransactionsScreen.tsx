import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
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

const api = createRoleApi('unit_admin');
const COLOR = '#2563eb';

const PAYMENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  cash: 'cash-outline',
  bank_transfer: 'swap-horizontal-outline',
  upi: 'phone-portrait-outline',
  cheque: 'document-text-outline',
};

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

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const total = transactions.reduce((s, t) => s + t.totalAmount, 0);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(t) => t._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTransactions(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Transactions</Text>
              <Text style={styles.bannerAmount}>₹{total.toLocaleString()} total</Text>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="receipt-outline" size={28} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item: t }) => {
          const d = new Date(t.paymentDate);
          const icon = PAYMENT_ICON[t.paymentMethod] ?? 'receipt-outline';
          return (
            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <View style={styles.cardIconWrap}>
                <Ionicons name="receipt-outline" size={18} color={COLOR} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardReceipt} numberOfLines={1}>{t.receiptNumber}</Text>
                  <Text style={styles.cardAmount}>₹{t.totalAmount.toLocaleString()}</Text>
                </View>
                <Text style={styles.cardType}>{t.transactionType.replace(/_/g, ' ')}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.methodPill}>
                    <Ionicons name={icon} size={11} color="#6b7280" />
                    <Text style={styles.methodText}>{t.paymentMethod.replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="receipt-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Unit transactions will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2563eb', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerAmount: { fontSize: 24, fontWeight: '800', color: '#fff' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#2563eb' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardReceipt: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  cardAmount: { fontSize: 15, fontWeight: '800', color: '#2563eb' },
  cardType: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9fafb', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  methodText: { fontSize: 11, color: '#6b7280', textTransform: 'capitalize' },
  cardDate: { fontSize: 11, color: '#9ca3af' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});
