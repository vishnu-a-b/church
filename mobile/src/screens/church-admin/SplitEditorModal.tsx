import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createRoleApi } from '../../lib/api';

const api = createRoleApi('church_admin');

interface Rite {
  _id: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  split: Array<{ recipientLabel: string; percent: number }>;
}

interface SplitEntry { recipientLabel: string; percent: string; }

interface Props {
  visible: boolean;
  rite: Rite | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SplitEditorModal({ visible, rite, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<SplitEntry[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rite) {
      setEntries(
        rite.split.length > 0
          ? rite.split.map((s) => ({ recipientLabel: s.recipientLabel, percent: String(s.percent) }))
          : [{ recipientLabel: '', percent: '' }]
      );
      setError('');
    }
  }, [rite, visible]);

  if (!rite) return null;

  const total = entries.reduce((sum, e) => sum + (Number(e.percent) || 0), 0);

  const updateEntry = (index: number, field: keyof SplitEntry, value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const addRow = () => setEntries((prev) => [...prev, { recipientLabel: '', percent: '' }]);
  const removeRow = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const valid = entries.filter((e) => e.recipientLabel.trim() && e.percent !== '');
    if (valid.length > 0 && valid.length !== entries.length) {
      return setError('Every row needs both a label and a percent, or remove the empty row');
    }
    if (valid.length > 0 && Math.round(total * 100) / 100 !== 100) {
      return setError(`Percentages must sum to exactly 100 (currently ${total})`);
    }

    setError('');
    setSaving(true);
    try {
      await api.put(`/thirukkarmangal/rites/${rite._id}/split`, {
        split: valid.map((e) => ({ recipientLabel: e.recipientLabel.trim(), percent: Number(e.percent) })),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save split');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{rite.nameEnglish}</Text>
            <Text style={styles.hint}>₹{rite.amount.toLocaleString()} — recipient split</Text>

            {entries.map((entry, index) => (
              <View key={index} style={styles.entryRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Recipient"
                  value={entry.recipientLabel}
                  onChangeText={(v) => updateEntry(index, 'recipientLabel', v)}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: 8 }]}
                  placeholder="%"
                  keyboardType="numeric"
                  value={entry.percent}
                  onChangeText={(v) => updateEntry(index, 'percent', v)}
                />
                <TouchableOpacity onPress={() => removeRow(index)} style={styles.removeButton}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={addRow} style={styles.addRow}>
              <Text style={styles.addRowText}>+ Add recipient</Text>
            </TouchableOpacity>

            <Text style={[styles.total, { color: total === 100 ? '#059669' : '#d97706' }]}>Total: {total}%</Text>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  hint: { fontSize: 12, color: '#6b7280', marginBottom: 16 },
  entryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, color: '#111827' },
  removeButton: { marginLeft: 8, padding: 8 },
  removeText: { color: '#dc2626', fontSize: 16 },
  addRow: { paddingVertical: 8 },
  addRowText: { color: '#059669', fontWeight: '600' },
  total: { fontWeight: '700', marginTop: 8 },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, marginBottom: 8 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#059669', minWidth: 80, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
