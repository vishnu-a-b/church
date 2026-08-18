import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'] as const;

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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleContribute = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Contributed</Text>
        <Text style={styles.summaryAmount}>₹{total.toLocaleString()}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Make a Contribution</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount (₹)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <View style={styles.chipRow}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentMethod(method)}
              style={[styles.chip, paymentMethod === method && styles.chipActive]}
            >
              <Text style={[styles.chipText, paymentMethod === method && styles.chipTextActive]}>
                {method.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.submitButton} onPress={handleContribute} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Contribute</Text>}
        </TouchableOpacity>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  summary: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: '#0d9488' },
  form: { backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  formTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#0d9488' },
  chipText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  error: { color: '#dc2626', marginBottom: 10 },
  submitButton: { backgroundColor: '#0d9488', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receipt: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  amount: { fontWeight: '700', color: '#059669' },
});
