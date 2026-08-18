import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';

const api = createRoleApi('kudumbakutayima_admin');

const ACTIVITY_TYPES = ['mass', 'fasting', 'prayer'] as const;
const PRAYER_TYPES = ['rosary', 'divine_mercy', 'stations', 'other'] as const;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function ChipGroup<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} onPress={() => onChange(opt)} style={[styles.chip, value === opt && styles.chipActive]}>
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt.replace('_', ' ')}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface Member { _id: string; firstName: string; lastName: string; }

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function MarkActivityModal({ visible, onClose, onSaved }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState('');
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [activityType, setActivityType] = useState<(typeof ACTIVITY_TYPES)[number]>('mass');
  const [massDate, setMassDate] = useState('');
  const [fastingWeek, setFastingWeek] = useState('');
  const [fastingDays, setFastingDays] = useState<string[]>([]);
  const [prayerType, setPrayerType] = useState<(typeof PRAYER_TYPES)[number]>('rosary');
  const [prayerCount, setPrayerCount] = useState('');
  const [prayerWeek, setPrayerWeek] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      api.get('/members').then((res) => setMembers(res.data?.data || [])).catch(() => setMembers([]));
    }
  }, [visible]);

  const toggleDay = (day: string) => {
    setFastingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const reset = () => {
    setMemberId('');
    setActivityType('mass');
    setMassDate('');
    setFastingWeek('');
    setFastingDays([]);
    setPrayerType('rosary');
    setPrayerCount('');
    setPrayerWeek('');
    setError('');
  };

  const selectedMemberLabel = members.find((m) => m._id === memberId);

  const handleSubmit = async () => {
    if (!memberId) return setError('Select a member');

    const body: any = { memberId, activityType };
    if (activityType === 'mass') {
      if (!massDate) return setError('Enter the mass date (YYYY-MM-DD)');
      body.massDate = massDate;
      body.massAttended = true;
    } else if (activityType === 'fasting') {
      if (!fastingWeek) return setError('Enter the fasting week (e.g. 2026-W32)');
      body.fastingWeek = fastingWeek;
      body.fastingDays = fastingDays;
    } else {
      if (!prayerWeek) return setError('Enter the prayer week (e.g. 2026-W32)');
      body.prayerType = prayerType;
      body.prayerCount = Number(prayerCount) || 0;
      body.prayerWeek = prayerWeek;
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/approvals/spiritual-activities/mark-pending', body);
      reset();
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to mark activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Mark Spiritual Activity</Text>
            <Text style={styles.hint}>Counted only once church management approves</Text>

            <Text style={styles.label}>Member</Text>
            <PickerField
              label={selectedMemberLabel ? `${selectedMemberLabel.firstName} ${selectedMemberLabel.lastName}` : ''}
              placeholder="Select member..."
              onPress={() => setMemberPickerVisible(true)}
            />

            <Text style={styles.label}>Type</Text>
            <ChipGroup options={ACTIVITY_TYPES} value={activityType} onChange={setActivityType} />

            {activityType === 'mass' && (
              <>
                <Text style={styles.label}>Mass Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} placeholder="2026-08-05" value={massDate} onChangeText={setMassDate} />
              </>
            )}

            {activityType === 'fasting' && (
              <>
                <Text style={styles.label}>Fasting Week</Text>
                <TextInput style={styles.input} placeholder="2026-W32" value={fastingWeek} onChangeText={setFastingWeek} />
                <Text style={styles.label}>Days</Text>
                <View style={styles.chipRow}>
                  {DAYS.map((day) => (
                    <TouchableOpacity key={day} onPress={() => toggleDay(day)} style={[styles.chip, fastingDays.includes(day) && styles.chipActive]}>
                      <Text style={[styles.chipText, fastingDays.includes(day) && styles.chipTextActive]}>{day.slice(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {activityType === 'prayer' && (
              <>
                <Text style={styles.label}>Prayer Type</Text>
                <ChipGroup options={PRAYER_TYPES} value={prayerType} onChange={setPrayerType} />
                <Text style={styles.label}>Count</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={prayerCount} onChangeText={setPrayerCount} />
                <Text style={styles.label}>Prayer Week</Text>
                <TextInput style={styles.input} placeholder="2026-W32" value={prayerWeek} onChangeText={setPrayerWeek} />
              </>
            )}

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
  hint: { fontSize: 12, color: '#6b7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#ea580c' },
  chipText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#ea580c', minWidth: 140, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
