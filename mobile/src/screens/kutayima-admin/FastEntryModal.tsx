import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        <Text style={s.countLabel} numberOfLines={1}>{label}</Text>
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
          underlineColorAndroid="transparent"
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

export interface Member { _id: string; firstName: string; lastName: string; uniqueId?: string; }

const shortId = (uid?: string) => uid ? uid.split('-').slice(1).map(s => String(+s.replace(/\D/g, ''))).join('-') : '';

export interface EditEntry {
  memberId: string;
  pendingActivityIds: string[];
  contributionId?: string;
  existingAmount?: number;
  existingEntryType?: 'normal' | 'absent' | 'offering';
  hasApprovedContribution?: boolean;
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
  enteredMemberIds?: string[];
  onClose: () => void;
  onSaved: () => void;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function FastEntryModal({ visible, week, members, editEntry, enteredMemberIds, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [memberId, setMemberId] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [isAbsent, setIsAbsent] = useState(false);
  const [isOffering, setIsOffering] = useState(false);
  const [kurubana, setKurubana] = useState(0);
  const [japamala, setJapamala] = useState(0);
  const [sukruthajapam, setSukruthajapam] = useState(0);
  const [upavasam, setUpavasam] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // tracks members handled in this session (saved or skipped) for auto-navigation
  const [localDoneIds, setLocalDoneIds] = useState<string[]>([]);

  const isEdit = !!editEntry;
  const weekStr = `${week.year}-W${String(week.weekNumber).padStart(2, '0')}`;

  // Reset session tracking when modal opens/closes
  useEffect(() => {
    if (!visible) setLocalDoneIds([]);
  }, [visible]);

  // Pre-fill when entering edit mode
  useEffect(() => {
    if (visible && editEntry) {
      setMemberId(editEntry.memberId);
      setKurubana(editEntry.kurubana);
      setJapamala(editEntry.japamala);
      setSukruthajapam(editEntry.sukruthajapam);
      setUpavasam(editEntry.upavasam);
      if (editEntry.contributionId !== undefined) {
        const et = editEntry.existingEntryType;
        setIsAbsent(et === 'absent');
        setIsOffering(et === 'offering');
        setAmount(et === 'normal' || et === undefined ? String(editEntry.existingAmount ?? '') : '');
      } else {
        setAmount('');
        setIsAbsent(false);
        setIsOffering(false);
      }
      setError('');
    }
  }, [visible, editEntry]);

  const selectedMember = members.find((m) => m._id === memberId);

  // Returns the next unentered member after currentId, or null if all done
  const getNextMember = (currentId: string, extraDoneIds: string[]): Member | null => {
    const allDone = new Set([...(enteredMemberIds || []), ...localDoneIds, ...extraDoneIds]);
    const idx = members.findIndex((m) => m._id === currentId);
    for (let i = idx + 1; i < members.length; i++) {
      if (!allDone.has(members[i]._id)) return members[i];
    }
    for (let i = 0; i < idx; i++) {
      if (!allDone.has(members[i]._id)) return members[i];
    }
    return null;
  };

  const resetFields = () => {
    setAmount('');
    setIsAbsent(false);
    setIsOffering(false);
    setKurubana(0);
    setJapamala(0);
    setSukruthajapam(0);
    setUpavasam(0);
    setError('');
  };

  const reset = () => {
    setMemberId('');
    resetFields();
  };

  // Advance to next member or close if all done
  const advanceTo = (next: Member | null) => {
    resetFields();
    if (next) {
      setMemberId(next._id);
    } else {
      reset();
      onClose();
    }
  };

  // Remaining count for display
  const allDoneSet = new Set([...(enteredMemberIds || []), ...localDoneIds]);
  const remainingCount = members.filter((m) => !allDoneSet.has(m._id)).length;

  const handleSubmit = async () => {
    if (!memberId) return setError('Select a member');

    const amt = amount.trim() ? Number(amount) : -1;
    if (amount.trim() && amt < 0) return setError('Enter a valid amount');
    const effectiveAmt = amt < 0 ? 0 : amt;

    const hasStothra = !!editEntry?.contributionId || isOffering || isAbsent || effectiveAmt > 0 || (amount.trim() !== '' && effectiveAmt === 0);
    const hasAny = hasStothra || kurubana > 0 || japamala > 0 || sukruthajapam > 0 || upavasam > 0;
    if (!hasAny) return setError('Enter at least one value');

    setError('');
    setSubmitting(true);

    try {
      // In edit mode, delete existing pending activities first
      if (isEdit && editEntry.pendingActivityIds.length > 0) {
        await Promise.all(
          editEntry.pendingActivityIds.map((id) =>
            api.delete(`/spiritual-activities/${id}`).catch((e: any) => {
              if (e?.response?.status !== 404) throw e;
            })
          )
        );
      }

      const calls: Promise<any>[] = [];

      // Stothrakazhcha contribution
      if (editEntry?.contributionId) {
        // Update existing pending contribution via PUT (kudumbakutayima_admin can edit pending amounts)
        const entryType: 'normal' | 'absent' | 'offering' = isOffering ? 'offering' : isAbsent ? 'absent' : 'normal';
        const newAmt = (isOffering || isAbsent) ? 0 : effectiveAmt;
        calls.push(api.put(`/approvals/stothrakazhcha/${week._id}/contributors/${editEntry.contributionId}`, {
          amount: newAmt, entryType,
        }));
      } else if (!editEntry?.hasApprovedContribution) {
        // Create new contribution (add mode or edit mode with no existing contribution)
        if (isOffering) {
          calls.push(api.post(`/approvals/stothrakazhcha/${week._id}/mark-pending`, {
            contributorId: memberId, contributorType: 'Member', amount: 0, entryType: 'offering',
          }));
        } else if (isAbsent || (amount.trim() !== '' && effectiveAmt === 0)) {
          calls.push(api.post(`/approvals/stothrakazhcha/${week._id}/mark-pending`, {
            contributorId: memberId, contributorType: 'Member', amount: 0, entryType: 'absent',
          }));
        } else if (effectiveAmt > 0) {
          calls.push(api.post(`/approvals/stothrakazhcha/${week._id}/mark-pending`, {
            contributorId: memberId, contributorType: 'Member', amount: effectiveAmt, entryType: 'normal',
          }));
        }
      }

      // Vishudha Kurubana (mass) — one record per attendance day
      if (kurubana > 0) {
        const monday = getWeekMonday(week.year, week.weekNumber);
        for (let i = 0; i < kurubana; i++) {
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

      onSaved();

      if (isEdit) {
        reset();
        onClose();
      } else {
        const next = getNextMember(memberId, [memberId]);
        setLocalDoneIds((prev) => [...prev, memberId]);
        advanceTo(next);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (!memberId) { onClose(); return; }
    const next = getNextMember(memberId, [memberId]);
    setLocalDoneIds((prev) => [...prev, memberId]);
    advanceTo(next);
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={s.header}>
              <View>
                <Text style={s.title}>{isEdit ? 'Edit Entry' : 'Weekly Entry'}</Text>
                <Text style={s.subtitle}>
                  Week {week.weekNumber}, {week.year}
                  {!isEdit && remainingCount > 0 ? `  ·  ${remainingCount} remaining` : ''}
                </Text>
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
                  {selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}${shortId(selectedMember.uniqueId) ? ` (${shortId(selectedMember.uniqueId)})` : ''}` : memberId}
                </Text>
              </View>
            ) : (
              <PickerField
                label={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}${shortId(selectedMember.uniqueId) ? ` (${shortId(selectedMember.uniqueId)})` : ''}` : ''}
                placeholder="Select member..."
                onPress={() => setPickerVisible(true)}
              />
            )}

            {/* Stothrakazhcha amount */}
            {!editEntry?.hasApprovedContribution ? (
              <>
                <Text style={s.label}>
                  Stothrakazhcha Amount{week.defaultAmount > 0 ? ` (default ₹${week.defaultAmount})` : ''}
                </Text>
                <TextInput
                  style={[s.input, (isAbsent || isOffering) && s.inputDisabled]}
                  placeholder={isAbsent ? '₹0 — Absent (due calculated)' : isOffering ? '₹0 — Offerings (no due)' : (week.defaultAmount > 0 ? `₹${week.defaultAmount}` : 'Amount (0 = due calculated)')}
                  keyboardType="numeric"
                  value={isAbsent || isOffering ? '' : amount}
                  onChangeText={setAmount}
                  editable={!isAbsent && !isOffering}
                />

                {/* Absent / Offerings checkboxes */}
                <View style={s.checkboxRow}>
                  <TouchableOpacity
                    style={s.checkboxItem}
                    onPress={() => { setIsAbsent(!isAbsent); setIsOffering(false); setAmount(''); }}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, isAbsent && s.checkboxChecked]}>
                      {isAbsent && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View>
                      <Text style={s.checkboxLabel}>Absent</Text>
                      <Text style={s.checkboxHint}>Due will be calculated</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={s.checkboxItem}
                    onPress={() => { setIsOffering(!isOffering); setIsAbsent(false); setAmount(''); }}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, isOffering && s.checkboxCheckedGreen]}>
                      {isOffering && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View>
                      <Text style={s.checkboxLabel}>Offerings</Text>
                      <Text style={s.checkboxHint}>No due calculation</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={s.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
                <Text style={[s.infoText, { color: '#059669' }]}>Contribution already approved</Text>
              </View>
            )}

            {/* Activity counts */}
            <Text style={s.sectionLabel}>Spiritual Activities</Text>
            <View style={s.activitiesCard}>
              <CountRow label="Vishudha Kurubana" icon="flame-outline" value={kurubana} onChange={setKurubana} />
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
              {!isEdit && memberId ? (
                <TouchableOpacity style={s.skipBtn} onPress={handleSkip} disabled={submitting}>
                  <Ionicons name="play-skip-forward-outline" size={15} color="#6b7280" />
                  <Text style={s.skipText}>Skip</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={s.saveBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveText}>{isEdit ? 'Update Entry' : 'Save & Next'}</Text>}
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
        options={members
          .filter((m) => !enteredMemberIds?.includes(m._id))
          .map((m) => ({ value: m._id, label: `${m.firstName} ${m.lastName}${shortId(m.uniqueId) ? ` (${shortId(m.uniqueId)})` : ''}` }))}
        onSelect={(id) => setMemberId(id)}
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
    padding: 20, maxHeight: '96%',
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
  inputDisabled: {
    backgroundColor: '#f9fafb', color: '#9ca3af',
  },
  checkboxRow: {
    flexDirection: 'row', gap: 12, marginTop: 10,
  },
  checkboxItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', padding: 10,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: '#d1d5db',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#ef4444', borderColor: '#ef4444',
  },
  checkboxCheckedGreen: {
    backgroundColor: '#059669', borderColor: '#059669',
  },
  checkboxLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  checkboxHint: { fontSize: 10, color: '#6b7280', marginTop: 1 },

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
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2, overflow: 'hidden' },
    }),
  },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  countRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  countLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  countIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  countLabel: { fontSize: 13, fontWeight: '600', color: '#111827', flexShrink: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  stepBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  stepBtnText: { fontSize: 22, fontWeight: '700', color: '#374151', lineHeight: 26 },
  stepInput: {
    width: 52, height: 36,
    textAlign: 'center', textAlignVertical: 'center',
    fontSize: 16, fontWeight: '700', color: '#111827',
    borderBottomWidth: 1.5, borderBottomColor: '#ea580c',
    marginHorizontal: 4,
    padding: 0,
  },

  error: { color: '#dc2626', marginTop: 12, fontSize: 13 },

  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20, marginBottom: 16 },
  cancelBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db',
  },
  cancelText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  skipText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  saveBtn: {
    paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: 10, backgroundColor: '#ea580c',
    minWidth: 110, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
