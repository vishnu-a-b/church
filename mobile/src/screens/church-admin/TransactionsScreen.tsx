import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';

interface Transaction {
  _id: string;
  receiptNumber: string;
  transactionType: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
}

interface Member { _id: string; firstName: string; lastName: string; }

const api = createRoleApi('church_admin');

const TRANSACTION_TYPES = ['pathavarm', 'due', 'donation', 'offering', 'campaign', 'other'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'];

export default function ChurchAdminTransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Modal state
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState('');
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [methodPickerVisible, setMethodPickerVisible] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const openModal = async () => {
    setMemberId('');
    setTransactionType('');
    setTotalAmount('');
    setPaymentMethod('');
    setPaymentDate('');
    setNotes('');
    setFormError('');
    setModalVisible(true);
    try {
      const res = await api.get('/members');
      setMembers(res.data?.data || []);
    } catch {
      setMembers([]);
    }
  };

  const handleSubmit = async () => {
    if (!memberId) return setFormError('Select a member');
    if (!transactionType) return setFormError('Select a transaction type');
    const amount = Number(totalAmount);
    if (!amount || amount <= 0) return setFormError('Enter a valid amount');
    if (!paymentMethod) return setFormError('Select a payment method');
    if (!paymentDate.trim()) return setFormError('Enter a payment date');

    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        memberId,
        transactionType,
        totalAmount: amount,
        paymentMethod,
        paymentDate,
        notes: notes.trim() || undefined,
      });
      setModalVisible(false);
      fetchTransactions();
    } catch (e: any) {
      setFormError(e.response?.data?.error || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find((m) => m._id === memberId);

  return (
    <View style={styles.container}>
      <DataList
        data={transactions}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchTransactions(); }}
        keyExtractor={(t) => t._id}
        emptyText="No transactions recorded"
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

      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Record Transaction</Text>

            <Text style={styles.label}>Member</Text>
            <PickerField
              label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
              placeholder="Select member..."
              onPress={() => setMemberPickerVisible(true)}
            />

            <Text style={styles.label}>Transaction Type</Text>
            <PickerField
              label={transactionType.replace(/_/g, ' ')}
              placeholder="Select type..."
              onPress={() => setTypePickerVisible(true)}
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={totalAmount} onChangeText={setTotalAmount} placeholder="0" />

            <Text style={styles.label}>Payment Method</Text>
            <PickerField
              label={paymentMethod.replace(/_/g, ' ')}
              placeholder="Select method..."
              onPress={() => setMethodPickerVisible(true)}
            />

            <Text style={styles.label}>Payment Date (DD/MM/YYYY)</Text>
            <TextInput style={styles.input} value={paymentDate} onChangeText={setPaymentDate} placeholder="e.g. 18/08/2026" />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="..." />

            {!!formError && <Text style={styles.error}>{formError}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Record</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <PickerModal
          visible={memberPickerVisible}
          title="Select Member"
          options={members.map((m) => ({ value: m._id, label: `${m.firstName} ${m.lastName}` }))}
          onSelect={setMemberId}
          onClose={() => setMemberPickerVisible(false)}
        />
        <PickerModal
          visible={typePickerVisible}
          title="Transaction Type"
          options={TRANSACTION_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
          onSelect={setTransactionType}
          onClose={() => setTypePickerVisible(false)}
        />
        <PickerModal
          visible={methodPickerVisible}
          title="Payment Method"
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))}
          onSelect={setPaymentMethod}
          onClose={() => setMethodPickerVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  receipt: { fontWeight: '600', color: '#111827' },
  amount: { fontWeight: '700', color: '#059669' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#059669', minWidth: 100, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
