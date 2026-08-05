import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';

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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
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
      <Text style={label ? styles.fieldValue : styles.fieldPlaceholder}>{label || placeholder}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  optionText: { fontSize: 15, color: '#111827' },
  empty: { color: '#9ca3af', paddingVertical: 20, textAlign: 'center' },
  cancelButton: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontWeight: '600' },
  field: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 10 },
  fieldValue: { color: '#111827' },
  fieldPlaceholder: { color: '#9ca3af' },
});
