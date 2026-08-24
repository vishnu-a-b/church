import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';

const api = createRoleApi('kudumbakutayima_admin');

interface Entity { _id: string; label: string; }

interface Props {
  visible: boolean;
  stothrakazhchaId: string;
  amountType: 'per_member' | 'per_house';
  defaultAmount: number;
  entities: Entity[];
  onClose: () => void;
  onSaved: () => void;
}

export default function MarkContributionModal({ visible, stothrakazhchaId, amountType, defaultAmount, entities, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [entityId, setEntityId] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEntityId('');
    setAmount('');
    setError('');
  };

  const selectedLabel = entities.find((e) => e._id === entityId)?.label;

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!entityId) return setError(`Select a ${amountType === 'per_member' ? 'member' : 'house'}`);
    if (isNaN(value) || value < 0) return setError('Amount cannot be negative');

    setError('');
    setSubmitting(true);
    try {
      await api.post(`/approvals/stothrakazhcha/${stothrakazhchaId}/mark-pending`, {
        contributorId: entityId,
        contributorType: amountType === 'per_member' ? 'Member' : 'House',
        amount: value,
      });
      reset();
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to mark contribution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Mark Sthothrakazhcha Contribution</Text>
          <Text style={styles.hint}>Counted only once church management approves</Text>

          <Text style={styles.label}>{amountType === 'per_member' ? 'Member' : 'House'}</Text>
          <PickerField
            label={selectedLabel || ''}
            placeholder={`Select ${amountType === 'per_member' ? 'member' : 'house'}...`}
            onPress={() => setPickerVisible(true)}
          />

          <Text style={styles.label}>Amount (default ₹{defaultAmount})</Text>
          <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => { reset(); onClose(); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Mark as Pending</Text>}
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <PickerModal
        visible={pickerVisible}
        title={amountType === 'per_member' ? 'Select Member' : 'Select House'}
        options={entities.map((e) => ({ value: e._id, label: e.label }))}
        onSelect={setEntityId}
        onClose={() => setPickerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  hint: { fontSize: 12, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, color: '#111827' },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#ea580c', minWidth: 140, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
