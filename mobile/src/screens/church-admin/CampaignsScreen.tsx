import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';

interface Campaign {
  _id: string;
  name: string;
  totalCollected?: number;
  participantCount?: number;
}

interface Member { _id: string; firstName: string; lastName: string; }

const api = createRoleApi('church_admin');
const COLOR = '#059669';
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'upi', 'cheque'];

export default function ChurchAdminCampaignsScreen() {
  const insets = useSafeAreaInsets();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      await api.post(`/campaigns/${selectedCampaign._id}/contribute`, { memberId, amount: value, paymentMethod });
      setSelectedCampaign(null);
      setRefreshing(true);
      fetchCampaigns();
    } catch (e: any) {
      setFormError(e.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMember = members.find((m) => m._id === memberId);
  const totalCollected = campaigns.reduce((s, c) => s + (c.totalCollected ?? 0), 0);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={campaigns}
        keyExtractor={(c) => c._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCampaigns(); }} tintColor={COLOR} />}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Campaigns</Text>
              <Text style={styles.bannerAmount}>₹{totalCollected.toLocaleString()} total</Text>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name="megaphone-outline" size={28} color="#fff" />
            </View>
          </View>
        }
        renderItem={({ item: c }) => {
          const col = c.totalCollected ?? 0;
          const count = c.participantCount ?? 0;
          return (
            <TouchableOpacity style={styles.card} onPress={() => openContribute(c)} activeOpacity={0.75}>
              <View style={styles.cardAccent} />
              <View style={styles.cardIconWrap}>
                <Ionicons name="megaphone-outline" size={20} color={COLOR} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{c.name}</Text>
                <Text style={styles.cardMeta}>{count} contributor{count !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>₹{col.toLocaleString()}</Text>
                <Ionicons name="add-circle-outline" size={18} color={COLOR} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="megaphone-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptySub}>Campaigns will appear here once created</Text>
          </View>
        }
      />

      <Modal visible={!!selectedCampaign} animationType="slide" transparent onRequestClose={() => setSelectedCampaign(null)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetHeaderIcon}>
                <Ionicons name="megaphone-outline" size={20} color={COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{selectedCampaign?.name}</Text>
                <Text style={styles.sheetSub}>
                  ₹{(selectedCampaign?.totalCollected ?? 0).toLocaleString()} · {selectedCampaign?.participantCount ?? 0} contributors
                </Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>MEMBER</Text>
            <PickerField
              label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
              placeholder="Select member..."
              onPress={() => setMemberPickerVisible(true)}
            />

            <Text style={styles.fieldLabel}>AMOUNT (₹)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
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

            {!!formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedCampaign(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.submitText}>Contribute</Text></>
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
  list: { padding: 16, paddingBottom: 40 },

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
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#6b7280' },
  cardRight: { paddingRight: 14, alignItems: 'flex-end' },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#059669' },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 50 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 18 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sheetHeaderIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sheetSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 12 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 14, marginBottom: 2,
  },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: '#059669', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111827', paddingVertical: 12 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginTop: 10 },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 14 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
