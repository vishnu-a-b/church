import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';

const api = createRoleApi('kudumbakutayima_admin');

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function getWeekMonday(year: number, weekNumber: number): Date {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const weekOneMonday = new Date(jan4.getTime() - (day - 1) * 86400000);
  return new Date(weekOneMonday.getTime() + (weekNumber - 1) * 7 * 86400000);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Stepper + inline text input ──────────────────────────────────────────────

interface CountRowProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

function CountRow({ label, icon, value, onChange, max }: CountRowProps) {
  const [draft, setDraft] = useState(String(value));

  // Sync from parent (edit pre-fill or reset)
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = (n: number) => {
    const v = Math.max(0, max !== undefined ? Math.min(max, n) : n);
    setDraft(String(v));
    onChange(v);
  };

  const handleChange = (text: string) => {
    setDraft(text);
    const n = parseInt(text, 10);
    if (!isNaN(n) && n >= 0) commit(n);
  };

  const handleBlur = () => {
    const n = parseInt(draft, 10);
    commit(isNaN(n) || n < 0 ? 0 : n);
  };

  return (
    <View style={s.countRow}>
      <View style={s.countLeft}>
        <View style={s.countIcon}>
          <Ionicons name={icon} size={16} color="#ea580c" />
        </View>
        <Text style={s.countLabel}>{label}</Text>
      </View>
      <View style={s.stepper}>
        <TouchableOpacity style={s.stepBtn} activeOpacity={0.7}
          onPress={() => commit(value - 1)}>
          <Text style={s.stepBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={s.stepInput}
          value={draft}
          onChangeText={handleChange}
          onBlur={handleBlur}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <TouchableOpacity style={s.stepBtn} activeOpacity={0.7}
          onPress={() => commit(value + 1)}>
          <Text style={s.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Member { _id: string; firstName: string; lastName: string; }

export interface EditEntry {
  memberId: string;
  pendingActivityIds: string[];  // pending activity IDs to delete before re-saving
  hasContribution: boolean;      // true = amount field disabled (already submitted)
  kurubana: number;
  japamala: number;
  sukruthajapam: number;
  upavasam: number;
}

interface Week {
  _id: string;
  weekNumber: number;
  year: number;
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
}

interface Props {
  visible: boolean;
  week: Week;
  members: Member[];
  editEntry?: EditEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function FastEntryModal({ visible, week, members, editEntry, onClose, onSaved }: Props) {
  const [memberId, setMemberId] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [kurubana, setKurubana] = useState(0);
  const [japamala, setJapamala] = useState(0);
  const [sukruthajapam, setSukruthajapam] = useState(0);
  const [upavasam, setUpavasam] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editEntry;
  const weekStr = `${week.year}-W${String(week.weekNumber).padStart(2, '0')}`;

  // Pre-fill when entering edit mode
  useEffect(() => {
    if (visible && editEntry) {
      setMemberId(editEntry.memberId);
      setKurubana(editEntry.kurubana);
      setJapamala(editEntry.japamala);
      setSukruthajapam(editEntry.sukruthajapam);
      setUpavasam(editEntry.upavasam);
      setAmount('');
      setError('');
    }
  }, [visible, editEntry]);

  const selectedMember = members.find((m) => m._id === memberId);

  const reset = () => {
    setMemberId('');
    setAmount('');
    setKurubana(0);
    setJapamala(0);
    setSukruthajapam(0);
    setUpavasam(0);
    setError('');
  };

  const handleSubmit = async () => {
    if (!memberId) return setError('Select a member');

    const amt = amount.trim() ? Number(amount) : 0;
    if (amount.trim() && amt <= 0) return setError('Enter a valid amount');

    const hasAny = amt > 0 || kurubana > 0 || japamala > 0 || sukruthajapam > 0 || upavasam > 0;
    if (!hasAny) return setError('Enter at least one value');

    setError('');
    setSubmitting(true);

    try {
      // In edit mode, delete existing pending activities first
      if (isEdit && editEntry.pendingActivityIds.length > 0) {
        await Promise.all(
          editEntry.pendingActivityIds.map((id) => api.delete(`/spiritual-activities/${id}`))
        );
      }

      const calls: Promise<any>[] = [];

      // Stothrakazhcha contribution (skip if editing and already has contribution)
      if (amt > 0 && (!isEdit || !editEntry?.hasContribution)) {
        calls.push(
          api.post(`/approvals/stothrakazhcha/${week._id}/mark-pending`, {
            contributorId: memberId,
            contributorType: 'Member',
            amount: amt,
          }),
        );
      }

      // Vishudha Kurubana (mass) — one record per attendance day
      if (kurubana > 0) {
        const monday = getWeekMonday(week.year, week.weekNumber);
        for (let i = 0; i < Math.min(kurubana, 7); i++) {
          const massDate = new Date(monday.getTime() + i * 86400000);
          calls.push(
            api.post('/approvals/spiritual-activities/mark-pending', {
              memberId,
              activityType: 'mass',
              massDate: toISODate(massDate),
              massAttended: true,
            }),
          );
        }
      }

      // Japamala (rosary)
      if (japamala > 0) {
        calls.push(
          api.post('/approvals/spiritual-activities/mark-pending', {
            memberId,
            activityType: 'prayer',
            prayerType: 'rosary',
            prayerCount: japamala,
            prayerWeek: weekStr,
          }),
        );
      }

      // Sukruthajapam (divine mercy)
      if (sukruthajapam > 0) {
        calls.push(
          api.post('/approvals/spiritual-activities/mark-pending', {
            memberId,
            activityType: 'prayer',
            prayerType: 'divine_mercy',
            prayerCount: sukruthajapam,
            prayerWeek: weekStr,
          }),
        );
      }

      // Upavasam (fasting)
      if (upavasam > 0) {
        calls.push(
          api.post('/approvals/spiritual-activities/mark-pending', {
            memberId,
            activityType: 'fasting',
            fastingWeek: weekStr,
            fastingDays: WEEKDAYS.slice(0, upavasam),
          }),
        );
      }

      if (calls.length > 0) await Promise.all(calls);

      reset();
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={s.header}>
              <View>
                <Text style={s.title}>{isEdit ? 'Edit Entry' : 'Weekly Entry'}</Text>
                <Text style={s.subtitle}>Week {week.weekNumber}, {week.year}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={() => { reset(); onClose(); }}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Member picker — locked in edit mode */}
            <Text style={s.label}>Member</Text>
            {isEdit ? (
              <View style={s.lockedMember}>
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <Text style={s.lockedMemberText}>
                  {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : memberId}
                </Text>
              </View>
            ) : (
              <PickerField
                label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : ''}
                placeholder="Select member..."
                onPress={() => setPickerVisible(true)}
              />
            )}

            {/* Stothrakazhcha amount — hidden in edit when contribution already exists */}
            {(!isEdit || !editEntry?.hasContribution) && (
              <>
                <Text style={s.label}>
                  Stothrakazhcha Amount{week.defaultAmount > 0 ? ` (default ₹${week.defaultAmount})` : ''}
                </Text>
                <TextInput
                  style={s.input}
                  placeholder={week.defaultAmount > 0 ? `₹${week.defaultAmount}` : 'Amount'}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </>
            )}
            {isEdit && editEntry?.hasContribution && (
              <View style={s.infoRow}>
                <Ionicons name="information-circle-outline" size={15} color="#6b7280" />
                <Text style={s.infoText}>Stothrakazhcha contribution already submitted</Text>
              </View>
            )}

            {/* Activity counts */}
            <Text style={s.sectionLabel}>Spiritual Activities</Text>
            <View style={s.activitiesCard}>
              <CountRow label="Vishudha Kurubana" icon="flame-outline" value={kurubana} onChange={setKurubana} max={7} />
              <View style={s.divider} />
              <CountRow label="Japamala" icon="sync-outline" value={japamala} onChange={setJapamala} />
              <View style={s.divider} />
              <CountRow label="Sukruthajapam" icon="heart-outline" value={sukruthajapam} onChange={setSukruthajapam} />
              <View style={s.divider} />
              <CountRow label="Upavasam" icon="moon-outline" value={upavasam} onChange={setUpavasam} max={7} />
            </View>

            {!!error && <Text style={s.error}>{error}</Text>}

            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveText}>{isEdit ? 'Update Entry' : 'Save Entry'}</Text>}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {!isEdit && (
      <PickerModal
        visible={pickerVisible}
        title="Select Member"
        options={members.map((m) => ({ value: m._id, label: `${m.firstName} ${m.lastName}` }))}
        onSelect={setMemberId}
        onClose={() => setPickerVisible(false)}
      />
    )}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 8, maxHeight: '92%',
  },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  closeBtn: { padding: 4, marginTop: 2 },

  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    padding: 13, color: '#111827', fontSize: 15,
  },

  lockedMember: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
    padding: 13,
  },
  lockedMemberText: { fontSize: 15, color: '#374151', fontWeight: '600' },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: '#f9fafb',
    borderRadius: 8, padding: 10,
  },
  infoText: { fontSize: 12, color: '#6b7280' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af',
    marginTop: 20, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  activitiesCard: {
    borderRadius: 14, borderWidth: 1, borderColor: '#f3f4f6',
    overflow: 'hidden', backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  countLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  countIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center',
  },
  countLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  stepBtnText: { fontSize: 20, fontWeight: '700', color: '#374151', lineHeight: 24 },
  stepInput: {
    width: 46, height: 34,
    textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111827',
    borderBottomWidth: 1.5, borderBottomColor: '#ea580c',
    marginHorizontal: 2,
  },

  error: { color: '#dc2626', marginTop: 12, fontSize: 13 },

  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 16 },
  cancelBtn: {
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db',
  },
  cancelText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  saveBtn: {
    paddingVertical: 12, paddingHorizontal: 28,
    borderRadius: 10, backgroundColor: '#ea580c',
    minWidth: 120, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
