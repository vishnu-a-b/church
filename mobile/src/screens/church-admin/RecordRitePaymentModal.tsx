import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';
import { useAuth } from '../../context/AuthContext';

const api = createRoleApi('church_admin');

interface Rite {
  _id: string;
  nameEnglish: string;
  amount: number;
  splitConfigured: boolean;
  split: Array<{ recipientLabel: string; percent: number }>;
}

interface Member { _id: string; firstName: string; lastName: string; }

interface Props {
  visible: boolean;
  rite: Rite | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RecordRitePaymentModal({ visible, rite, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState('');
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && rite) {
      setAmount(String(rite.amount));
      setMemberId('');
      setError('');
      api.get('/members').then((res) => setMembers(res.data?.data || [])).catch(() => setMembers([]));
    }
  }, [visible, rite]);

  if (!rite) return null;

  const selectedMember = members.find((m) => m._id === memberId);
  const paidAmount = Number(amount) || 0;
  const preview = rite.splitConfigured ? rite.split.map((s) => ({ ...s, amount: Math.round(((paidAmount * s.percent) / 100) * 100) / 100 })) : [];

  const handleSubmit = async () => {
    if (!memberId) return setError('Select a member');
    if (!paidAmount || paidAmount <= 0) return setError('Enter a valid amount');
    if (!user?.churchId) return setError('Church admin must have a church assigned');

    setError('');
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        transactionType: 'thirukkarmangal',
        riteId: rite._id,
        churchId: user.churchId,
        memberId,
        distribution: 'member_only',
        memberAmount: paidAmount,
        houseAmount: 0,
        totalAmount: paidAmount,
        paymentMethod: 'cash',
        notes: `Thirukkarmangal: ${rite.nameEnglish}`,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Record Payment</Text>
            <Text style={styles.hint}>{rite.nameEnglish}</Text>

            <Text style={styles.label}>Member</Text>
            <PickerField
              label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
              placeholder="Select member..."
              onPress={() => setMemberPickerVisible(true)}
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

            {rite.splitConfigured ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Split preview</Text>
                {preview.map((p, i) => (
                  <Text key={i} style={styles.previewLine}>{p.recipientLabel}: {p.percent}% = ₹{p.amount}</Text>
                ))}
              </View>
            ) : (
              <Text style={styles.warning}>No split configured for this rite yet — payment will still be recorded.</Text>
            )}

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Record Payment</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <PickerModal
        visible={memberPickerVisible}
        title="Select Member"
        options={members.map((m) => ({ value: m._id, label: `${m.firstName} ${m.lastName}` }))}
        onSelect={setMemberId}
        onClose={() => setMemberPickerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  previewBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginTop: 12 },
  previewTitle: { fontWeight: '600', color: '#374151', marginBottom: 4, fontSize: 12 },
  previewLine: { fontSize: 12, color: '#6b7280' },
  warning: { color: '#d97706', fontSize: 12, marginTop: 12 },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#059669', minWidth: 140, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
