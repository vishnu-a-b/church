import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function CalendarPicker({
  value,
  onChange,
  color,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  color: string;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const canGoNext =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={calStyles.container}>
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{MONTH_FULL[viewMonth]} {viewYear}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={[calStyles.navBtn, !canGoNext && calStyles.navBtnOff]}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? '#374151' : '#d1d5db'} />
        </TouchableOpacity>
      </View>

      <View style={calStyles.weekRow}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <View key={d} style={calStyles.weekCol}>
            <Text style={[
              calStyles.weekDay,
              i === 5 && calStyles.satLabel,
              i === 6 && calStyles.sunLabel,
            ]}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((row, wi) => (
        <View key={wi} style={calStyles.row}>
          {row.map((day, di) => {
            if (!day) return <View key={di} style={calStyles.cell} />;
            const isSel =
              value != null &&
              value.getFullYear() === viewYear &&
              value.getMonth() === viewMonth &&
              value.getDate() === day;
            const isToday =
              today.getFullYear() === viewYear &&
              today.getMonth() === viewMonth &&
              today.getDate() === day;
            const isFuture = new Date(viewYear, viewMonth, day) > today;
            const weekendColor = di === 6 ? '#dc2626' : di === 5 ? '#2563eb' : null;

            return (
              <TouchableOpacity
                key={di}
                style={[
                  calStyles.cell,
                  isSel && [calStyles.cellSelected, { backgroundColor: color }],
                  isToday && !isSel && [calStyles.cellToday, { borderColor: color }],
                ]}
                onPress={() => !isFuture && onChange(new Date(viewYear, viewMonth, day))}
                disabled={isFuture}
              >
                <Text style={[
                  calStyles.dayText,
                  isSel && calStyles.daySelected,
                  isFuture && calStyles.dayFuture,
                  isToday && !isSel ? { color, fontWeight: '700' } : null,
                  !isSel && !isFuture && !isToday && weekendColor ? { color: weekendColor } : null,
                ]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface DatePickerFieldProps {
  value: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
  color?: string;
  modalTitle?: string;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Select date...',
  color = '#0d9488',
  modalTitle = 'Select Date',
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const formatted = value
    ? value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      <TouchableOpacity
        style={[fieldStyles.field, value && { borderColor: color + '80', backgroundColor: color + '08' }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Ionicons name="calendar-outline" size={16} color={value ? color : '#9ca3af'} />
        <Text style={[fieldStyles.fieldText, value ? { color: '#111827', fontWeight: '600' } : fieldStyles.placeholder]}>
          {formatted ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={fieldStyles.overlay}>
          <View style={fieldStyles.sheet}>
            <View style={fieldStyles.sheetHandle} />
            <View style={fieldStyles.sheetHeaderRow}>
              <Text style={fieldStyles.sheetTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={fieldStyles.closeBtn}>
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <CalendarPicker
              value={value}
              onChange={(d) => { onChange(d); setOpen(false); }}
              color={color}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Format a Date to YYYY-MM-DD string for API submission */
export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const calStyles = StyleSheet.create({
  container: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  navBtnOff: { opacity: 0.35 },
  monthLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekCol: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  weekDay: { fontSize: 11, fontWeight: '700', color: '#9ca3af' },
  satLabel: { color: '#2563eb' },
  sunLabel: { color: '#dc2626' },
  row: { flexDirection: 'row', marginBottom: 2 },
  cell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 999 },
  cellSelected: {},
  cellToday: { borderWidth: 1.5 },
  dayText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  daySelected: { color: '#fff', fontWeight: '700' },
  dayFuture: { color: '#e5e7eb' },
});

const fieldStyles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  fieldText: { flex: 1, fontSize: 14, color: '#111827' },
  placeholder: { color: '#9ca3af' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
});
