import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Option {
  value: string;
  label: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: Option[];
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function PickerModal({ visible, title, options, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            style={{ maxHeight: 350 }}
            ListEmptyComponent={<Text style={styles.empty}>No options available</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// A simple text-input-styled trigger that opens a PickerModal — mimics a <select>.
export function PickerField({ label, placeholder, onPress }: { label?: string; placeholder: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.field} onPress={onPress}>
      <Text style={label ? styles.fieldValue : styles.fieldPlaceholder} numberOfLines={1}>{label || placeholder}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4, textAlign: 'center' },
  option: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 15, color: '#111827', flex: 1 },
  empty: { color: '#9ca3af', paddingVertical: 20, textAlign: 'center' },
  cancelButton: { marginTop: 8, paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  cancelText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10, backgroundColor: '#fff' },
  fieldValue: { color: '#111827', flex: 1, fontSize: 15 },
  fieldPlaceholder: { color: '#9ca3af', flex: 1, fontSize: 15 },
  chevron: { color: '#9ca3af', fontSize: 20, marginLeft: 4 },
});
