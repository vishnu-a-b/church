import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';

interface Campaign {
  _id: string;
  name: string;
  targetAmount: number;
  totalCollected?: number;
  collectedAmount?: number;
}

interface Member { _id: string; firstName: string; lastName: string; }

const api = createRoleApi('church_admin');
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'];

export default function ChurchAdminCampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Contribute modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState('');
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [methodPickerVisible, setMethodPickerVisible] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const openContribute = async (campaign: Campaign) => {
    setMemberId('');
    setAmount('');
    setPaymentMethod('');
    setFormError('');
    setSelectedCampaign(campaign);
    try {
      const res = await api.get('/members');
      setMembers(res.data?.data || []);
    } catch {
      setMembers([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCampaign) return;
    if (!memberId) return setFormError('Select a member');
    const value = Number(amount);
    if (!value || value <= 0) return setFormError('Enter a valid amount');
    if (!paymentMethod) return setFormError('Select a payment method');

    setFormError('');
    setSubmitting(true);
    try {
      await api.post(`/campaigns/${selectedCampaign._id}/contribute`, {
        memberId,
        amount: value,
        paymentMethod,
      });
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (e: any) {
      setFormError(e.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find((m) => m._id === memberId);
  const collected = selectedCampaign
    ? (selectedCampaign.totalCollected ?? selectedCampaign.collectedAmount ?? 0)
    : 0;

  return (
    <View style={styles.container}>
      <DataList
        data={campaigns}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchCampaigns(); }}
        keyExtractor={(c) => c._id}
        emptyText="No campaigns"
        renderItem={(c) => {
          const col = c.totalCollected ?? c.collectedAmount ?? 0;
          const pct = c.targetAmount > 0 ? Math.min(100, Math.round((col / c.targetAmount) * 100)) : 0;
          return (
            <TouchableOpacity onPress={() => openContribute(c)}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.pct}>{pct}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
              </View>
              <Text style={styles.meta}>₹{col.toLocaleString()} of ₹{c.targetAmount.toLocaleString()}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={!!selectedCampaign}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedCampaign(null)}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sheetTitle}>{selectedCampaign?.name}</Text>
            <Text style={styles.sheetSub}>
              ₹{collected.toLocaleString()} of ₹{(selectedCampaign?.targetAmount ?? 0).toLocaleString()} collected
            </Text>

            <Text style={styles.label}>Member</Text>
            <PickerField
              label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
              placeholder="Select member..."
              onPress={() => setMemberPickerVisible(true)}
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="0" />

            <Text style={styles.label}>Payment Method</Text>
            <PickerField
              label={paymentMethod.replace(/_/g, ' ')}
              placeholder="Select method..."
              onPress={() => setMethodPickerVisible(true)}
            />

            {!!formError && <Text style={styles.error}>{formError}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedCampaign(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Contribute</Text>}
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
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#111827', flex: 1 },
  pct: { fontSize: 12, fontWeight: '700', color: '#059669' },
  progressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginVertical: 6 },
  progressFill: { height: 6, backgroundColor: '#059669', borderRadius: 3 },
  meta: { fontSize: 12, color: '#6b7280' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#059669', minWidth: 110, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
