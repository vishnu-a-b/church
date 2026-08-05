import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';
import { useAuth } from '../../context/AuthContext';

const api = createRoleApi('church_admin');
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'] as const;

interface Member { _id: string; firstName: string; lastName: string; }

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function RecordPathavarmModal({ visible, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState('');
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>('cash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMemberId('');
      setAmount('');
      setError('');
      api.get('/members').then((res) => setMembers(res.data?.data || [])).catch(() => setMembers([]));
    }
  }, [visible]);

  const selectedMember = members.find((m) => m._id === memberId);

  const handleSubmit = async () => {
    if (!memberId) return setError('Select a member');
    const value = Number(amount);
    if (!value || value <= 0) return setError('Enter a valid amount');
    if (!user?.churchId) return setError('Church admin must have a church assigned');

    setError('');
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        transactionType: 'pathavarm',
        churchId: user.churchId,
        memberId,
        distribution: 'member_only',
        memberAmount: value,
        houseAmount: 0,
        totalAmount: value,
        paymentMethod,
        notes: 'Pathavarm (Tithe)',
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Record Pathavarm Contribution</Text>

          <Text style={styles.label}>Member</Text>
          <PickerField
            label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
            placeholder="Select member..."
            onPress={() => setMemberPickerVisible(true)}
          />

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity key={method} onPress={() => setPaymentMethod(method)} style={[styles.chip, paymentMethod === method && styles.chipActive]}>
                <Text style={[styles.chipText, paymentMethod === method && styles.chipTextActive]}>{method.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 4, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#059669' },
  chipText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#059669', minWidth: 100, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
