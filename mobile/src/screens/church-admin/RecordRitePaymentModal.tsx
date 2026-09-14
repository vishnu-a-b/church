import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';
import { DatePickerField, formatDateISO } from '../../components/DatePickerField';

const api = createRoleApi('church_admin');
const COLOR = '#059669';

interface EdvLedger { id: string; name: string; group: { name: string } }

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
];

interface Rite {
  _id: string;
  nameEnglish: string;
  amount: number;
  splitConfigured: boolean;
  split: Array<{ recipientLabel: string; percent: number }>;
}

interface Unit { _id: string; name: string; }
interface Bavanakutayima { _id: string; name: string; }
interface House { _id: string; familyName: string; }
interface Member { _id: string; firstName: string; lastName: string; }

interface Props {
  visible: boolean;
  rite: Rite | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RecordRitePaymentModal({ visible, rite, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();

  const [units, setUnits] = useState<Unit[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [unitId, setUnitId] = useState('');
  const [bkId, setBkId] = useState('');
  const [houseId, setHouseId] = useState('');
  const [memberId, setMemberId] = useState('');

  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [bkPickerVisible, setBkPickerVisible] = useState(false);
  const [housePickerVisible, setHousePickerVisible] = useState(false);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [methodPickerVisible, setMethodPickerVisible] = useState(false);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [referenceNo, setReferenceNo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [edvLedgers, setEdvLedgers] = useState<EdvLedger[]>([]);
  const [receivingLedgerId, setReceivingLedgerId] = useState('');
  const [ledgerPickerVisible, setLedgerPickerVisible] = useState(false);

  useEffect(() => {
    if (visible && rite) {
      setAmount(String(rite.amount));
      setUnitId('');
      setBkId('');
      setHouseId('');
      setMemberId('');
      setBavanakutayimas([]);
      setHouses([]);
      setMembers([]);
      setPaymentMethod('cash');
      setPaymentDate(new Date());
      setReferenceNo('');
      setError('');
      setReceivingLedgerId('');
      api.get('/units').then((r) => setUnits(r.data?.data || [])).catch(() => setUnits([]));
      api.get('/edv-sync/ledgers').then((r) => setEdvLedgers(r.data?.data ?? [])).catch(() => {});
    }
  }, [visible, rite]);

  const handleUnitSelect = async (id: string) => {
    setUnitId(id);
    setBkId('');
    setHouseId('');
    setMemberId('');
    setBavanakutayimas([]);
    setHouses([]);
    setMembers([]);
    const r = await api.get(`/bavanakutayimas?unitId=${id}`);
    setBavanakutayimas(r.data?.data || []);
  };

  const handleBkSelect = async (id: string) => {
    setBkId(id);
    setHouseId('');
    setMemberId('');
    setHouses([]);
    setMembers([]);
    const r = await api.get(`/houses?bavanakutayimaId=${id}`);
    setHouses(r.data?.data || []);
  };

  const handleHouseSelect = async (id: string) => {
    setHouseId(id);
    setMemberId('');
    setMembers([]);
    const r = await api.get(`/members?houseId=${id}`);
    setMembers(r.data?.data || []);
  };

  if (!rite) return null;

  const selectedUnit = units.find((u) => u._id === unitId);
  const selectedBk = bavanakutayimas.find((b) => b._id === bkId);
  const selectedHouse = houses.find((h) => h._id === houseId);
  const selectedMember = members.find((m) => m._id === memberId);
  const selectedMethodLabel = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? 'Cash';

  const paidAmount = Number(amount) || 0;
  const preview = rite.splitConfigured
    ? rite.split.map((s) => ({ ...s, amount: Math.round(((paidAmount * s.percent) / 100) * 100) / 100 }))
    : [];

  const handleSubmit = async () => {
    if (!memberId) return setError('Select a member');
    if (!paidAmount || paidAmount <= 0) return setError('Enter a valid amount');

    setError('');
    setSubmitting(true);
    try {
      await api.post('/thirukkarmangal/bookings', {
        riteId: rite._id,
        memberId,
        totalAmount: paidAmount,
        paymentMethod,
        paymentDate: formatDateISO(paymentDate),
        referenceNo: referenceNo.trim() || undefined,
        notes: `Thirukkarmangal: ${rite.nameEnglish}`,
        receivingLedgerId: receivingLedgerId || undefined,
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
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Record Payment</Text>
            <Text style={styles.hint}>{rite.nameEnglish}</Text>

            <Text style={styles.label}>Unit</Text>
            <PickerField
              label={selectedUnit?.name}
              placeholder="Select unit..."
              onPress={() => setUnitPickerVisible(true)}
            />

            <Text style={styles.label}>Bavanakutayima</Text>
            <PickerField
              label={selectedBk?.name}
              placeholder={unitId ? 'Select bavanakutayima...' : 'Select unit first'}
              onPress={() => unitId && setBkPickerVisible(true)}
            />

            <Text style={styles.label}>House</Text>
            <PickerField
              label={selectedHouse?.familyName}
              placeholder={bkId ? 'Select house...' : 'Select bavanakutayima first'}
              onPress={() => bkId && setHousePickerVisible(true)}
            />

            <Text style={styles.label}>Member</Text>
            <PickerField
              label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
              placeholder={houseId ? 'Select member...' : 'Select house first'}
              onPress={() => houseId && setMemberPickerVisible(true)}
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <Text style={styles.label}>Payment Method</Text>
            <PickerField
              label={selectedMethodLabel}
              placeholder="Select method..."
              onPress={() => setMethodPickerVisible(true)}
            />

            <Text style={styles.label}>Payment Date</Text>
            <DatePickerField
              value={paymentDate}
              onChange={setPaymentDate}
              color={COLOR}
              modalTitle="Payment Date"
            />

            {paymentMethod !== 'cash' && (
              <>
                <Text style={styles.label}>Reference No.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Transaction / cheque reference"
                  value={referenceNo}
                  onChangeText={setReferenceNo}
                />
              </>
            )}

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

            {edvLedgers.length > 0 && (
              <>
                <Text style={styles.label}>Receiving Account</Text>
                <PickerField
                  label={receivingLedgerId ? `${edvLedgers.find(l => l.id === receivingLedgerId)?.group.name} › ${edvLedgers.find(l => l.id === receivingLedgerId)?.name}` : ''}
                  placeholder="— None (use default) —"
                  onPress={() => setLedgerPickerVisible(true)}
                />
              </>
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
        visible={unitPickerVisible}
        title="Select Unit"
        options={units.map((u) => ({ value: u._id, label: u.name }))}
        onSelect={handleUnitSelect}
        onClose={() => setUnitPickerVisible(false)}
      />
      <PickerModal
        visible={bkPickerVisible}
        title="Select Bavanakutayima"
        options={bavanakutayimas.map((b) => ({ value: b._id, label: b.name }))}
        onSelect={handleBkSelect}
        onClose={() => setBkPickerVisible(false)}
      />
      <PickerModal
        visible={housePickerVisible}
        title="Select House"
        options={houses.map((h) => ({ value: h._id, label: h.familyName }))}
        onSelect={handleHouseSelect}
        onClose={() => setHousePickerVisible(false)}
      />
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
        options={PAYMENT_METHODS}
        onSelect={setPaymentMethod}
        onClose={() => setMethodPickerVisible(false)}
      />
      <PickerModal
        visible={ledgerPickerVisible}
        title="Receiving Account"
        options={[
          { value: '', label: '— None (use default) —' },
          ...edvLedgers.map((l) => ({ value: l.id, label: `${l.group.name} › ${l.name}` })),
        ]}
        onSelect={setReceivingLedgerId}
        onClose={() => setLedgerPickerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, color: '#111827' },
  previewBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginTop: 12 },
  previewTitle: { fontWeight: '600', color: '#374151', marginBottom: 4, fontSize: 12 },
  previewLine: { fontSize: 12, color: '#6b7280' },
  warning: { color: '#d97706', fontSize: 12, marginTop: 12 },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: COLOR, minWidth: 140, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
