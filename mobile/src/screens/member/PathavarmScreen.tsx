import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Transaction {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
}

const api = createRoleApi('member');
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'] as const;

const PAYMENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  cash:          'cash-outline',
  bank_transfer: 'swap-horizontal-outline',
  upi:           'phone-portrait-outline',
  cheque:        'document-text-outline',
};

function HistoryCard({ t }: { t: Transaction }) {
  const d = new Date(t.paymentDate);
  const icon = PAYMENT_ICON[t.paymentMethod] ?? 'receipt-outline';
  return (
    <View style={styles.histCard}>
      <View style={styles.histIcon}>
        <Ionicons name="gift-outline" size={18} color="#7c3aed" />
      </View>
      <View style={styles.histBody}>
        <Text style={styles.histReceipt}>{t.receiptNumber}</Text>
        <View style={styles.histMeta}>
          <Ionicons name={icon} size={11} color="#9ca3af" />
          <Text style={styles.histMethod}>{t.paymentMethod.replace(/_/g, ' ')}</Text>
          <Text style={styles.histDot}>·</Text>
          <Text style={styles.histDate}>{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
      </View>
      <Text style={styles.histAmount}>₹{t.totalAmount.toLocaleString()}</Text>
    </View>
  );
}

export default function MemberPathavarmScreen() {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>('cash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get('/members/me/pathavarm');
      setHistory(response.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleContribute = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return setError('Please enter a valid amount');
    setError('');
    setSubmitting(true);
    try {
      await api.post('/members/me/pathavarm', { amount: value, paymentMethod });
      setAmount('');
      fetchHistory();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const total = history.reduce((sum, t) => sum + t.totalAmount, 0);

  const ListHeader = (
    <>
      {/* Total banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerLabel}>Total Contributed</Text>
          <Text style={styles.bannerAmount}>₹{total.toLocaleString()}</Text>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons name="gift-outline" size={26} color="#fff" />
        </View>
      </View>

      {/* Contribution form */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Ionicons name="add-circle-outline" size={20} color="#7c3aed" />
          <Text style={styles.formTitle}>Make a Contribution</Text>
        </View>

        {/* Amount input */}
        <Text style={styles.fieldLabel}>Amount (₹)</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor="#c4c4c4"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            returnKeyType="done"
          />
        </View>

        {/* Payment method */}
        <Text style={styles.fieldLabel}>Payment Method</Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map((m) => {
            const active = paymentMethod === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setPaymentMethod(m)}
                style={[styles.methodChip, active && styles.methodChipActive]}
              >
                <Ionicons name={PAYMENT_ICON[m] ?? 'card-outline'} size={14} color={active ? '#fff' : '#6b7280'} />
                <Text style={[styles.methodText, active && styles.methodTextActive]}>
                  {m.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleContribute} disabled={submitting} activeOpacity={0.85}>
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.submitText}>Submit Contribution</Text></>
          }
        </TouchableOpacity>
      </View>

      {history.length > 0 && (
        <Text style={styles.histTitle}>History</Text>
      )}
    </>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#7c3aed" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={history}
        keyExtractor={t => t._id}
        renderItem={({ item }) => <HistoryCard t={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor="#7c3aed" />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyHist}>
            <Ionicons name="receipt-outline" size={24} color="#d1d5db" />
            <Text style={styles.emptyHistText}>No contributions yet — this is a one-time, optional gift</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#7c3aed', borderRadius: 20, padding: 20, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  bannerAmount: { fontSize: 28, fontWeight: '800', color: '#fff' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 4 },

  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 14, marginBottom: 14,
  },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: '#7c3aed', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111827', paddingVertical: 12 },

  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  methodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  methodChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  methodText: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'capitalize' },
  methodTextActive: { color: '#fff' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 10 },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#7c3aed', paddingVertical: 14, borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  histTitle: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  histCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#7c3aed',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  histIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  histBody: { flex: 1 },
  histReceipt: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  histMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  histMethod: { fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' },
  histDot: { fontSize: 11, color: '#d1d5db' },
  histDate: { fontSize: 11, color: '#9ca3af' },
  histAmount: { fontSize: 16, fontWeight: '800', color: '#7c3aed' },

  emptyHist: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyHistText: { color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
