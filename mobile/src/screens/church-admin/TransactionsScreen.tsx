import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';
import { useAuth } from '../../context/AuthContext';

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
const COLOR = '#059669';

const TRANSACTION_TYPES = [
  'lelam', 'thirunnaal_panam', 'dashamansham', 'spl_contribution',
  'stothrakazhcha', 'monthly_support', 'thirukkarmangal', 'pathavarm',
];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'];

const PAYMENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  cash: 'cash-outline',
  bank_transfer: 'swap-horizontal-outline',
  upi: 'phone-portrait-outline',
  cheque: 'document-text-outline',
};

export default function ChurchAdminTransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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
        churchId: user?.churchId,
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
                <Ionicons name="receipt-outline" size={20} color={COLOR} />
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
            <Text style={styles.emptySub}>Recorded transactions will appear here</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetHeaderIcon}>
                <Ionicons name="receipt-outline" size={20} color={COLOR} />
              </View>
              <Text style={styles.sheetTitle}>Record Transaction</Text>
            </View>

            <Text style={styles.fieldLabel}>MEMBER</Text>
            <PickerField
              label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
              placeholder="Select member..."
              onPress={() => setMemberPickerVisible(true)}
            />

            <Text style={styles.fieldLabel}>TRANSACTION TYPE</Text>
            <PickerField
              label={transactionType.replace(/_/g, ' ')}
              placeholder="Select type..."
              onPress={() => setTypePickerVisible(true)}
            />

            <Text style={styles.fieldLabel}>AMOUNT (₹)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={totalAmount}
                onChangeText={setTotalAmount}
                placeholder="0"
                placeholderTextColor="#c4c4c4"
              />
            </View>

            <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
            <PickerField
              label={paymentMethod.replace(/_/g, ' ')}
              placeholder="Select method..."
              onPress={() => setMethodPickerVisible(true)}
            />

            <Text style={styles.fieldLabel}>PAYMENT DATE (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="e.g. 18/08/2026"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="..."
              placeholderTextColor="#9ca3af"
            />

            {!!formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.submitText}>Record</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

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
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
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
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#059669' },
  cardIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  cardBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardReceipt: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#059669' },
  cardType: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9fafb', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  methodText: { fontSize: 11, color: '#6b7280', textTransform: 'capitalize' },
  cardDate: { fontSize: 11, color: '#9ca3af' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 18 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sheetHeaderIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 12 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 14,
  },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: '#059669', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', paddingVertical: 12 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827',
  },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginTop: 10 },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 14 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
