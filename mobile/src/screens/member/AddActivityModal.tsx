import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

const api = createRoleApi('member');

type ActivityType = 'mass' | 'fasting' | 'prayer';
type PrayerType = 'rosary' | 'divine_mercy' | 'stations' | 'other';

const ACTIVITY_TYPES: ActivityType[] = ['mass', 'fasting', 'prayer'];
const PRAYER_TYPES: PrayerType[] = ['rosary', 'divine_mercy', 'stations', 'other'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ACTIVITY_CONFIG = {
  mass:    { label: 'Holy Mass', desc: 'Log mass attendance',   icon: 'flame'  as const, color: '#7c3aed' },
  fasting: { label: 'Fasting',   desc: 'Record fasting days',   icon: 'moon'   as const, color: '#b45309' },
  prayer:  { label: 'Prayer',    desc: 'Track your prayers',    icon: 'heart'  as const, color: '#0d9488' },
};

const PRAYER_CONFIG = {
  rosary:       { label: 'Rosary',            icon: 'radio-button-on'           as const },
  divine_mercy: { label: 'Divine Mercy',      icon: 'infinite'                  as const },
  stations:     { label: 'Stations of Cross', icon: 'git-network'               as const },
  other:        { label: 'Other',             icon: 'ellipsis-horizontal-circle' as const },
};

// ── ISO Week helpers ──────────────────────────────────────────────────────────

interface WeekValue { year: number; week: number; }

function getISOWeek(date: Date): WeekValue {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) };
}

function shiftWeeks(year: number, week: number, delta: number): WeekValue {
  const jan4 = new Date(year, 0, 4);
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(mon);
  start.setDate(mon.getDate() + (week - 1) * 7 + delta * 7);
  return getISOWeek(start);
}

function weekDateRange(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4);
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const start = new Date(mon);
  start.setDate(mon.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function fmtShortDate(d: Date) { return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`; }
function fmtISOWeek(year: number, week: number) { return `${year}-W${String(week).padStart(2, '0')}`; }

// ── WeekPicker ────────────────────────────────────────────────────────────────

function WeekPicker({ value, onChange, color }: { value: WeekValue | null; onChange: (v: WeekValue) => void; color: string }) {
  const todayWeek = useMemo(() => getISOWeek(new Date()), []);
  const [displayed, setDisplayed] = useState<WeekValue>(value ?? todayWeek);

  useEffect(() => {
    setDisplayed(value ?? todayWeek);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const { start, end } = useMemo(() => weekDateRange(displayed.year, displayed.week), [displayed]);
  const isSelected = value != null && value.year === displayed.year && value.week === displayed.week;

  const canGoNext = useMemo(() => {
    const next = shiftWeeks(displayed.year, displayed.week, 1);
    return next.year < todayWeek.year || (next.year === todayWeek.year && next.week <= todayWeek.week);
  }, [displayed, todayWeek]);

  const navigate = (delta: number) => {
    const next = shiftWeeks(displayed.year, displayed.week, delta);
    setDisplayed(next);
    onChange(next);
  };

  return (
    <View style={wpStyles.container}>
      <View style={wpStyles.row}>
        <TouchableOpacity onPress={() => navigate(-1)} style={wpStyles.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#374151" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChange(displayed)}
          style={[wpStyles.center, isSelected && { borderColor: color, backgroundColor: color + '10' }]}
        >
          <Text style={[wpStyles.weekCode, isSelected && { color }]}>
            {fmtISOWeek(displayed.year, displayed.week)}
          </Text>
          <Text style={[wpStyles.range, isSelected && { color }]}>
            {fmtShortDate(start)} – {fmtShortDate(end)}
          </Text>
          {!isSelected && <Text style={wpStyles.tapHint}>Tap to select</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => canGoNext && navigate(1)}
          style={[wpStyles.navBtn, !canGoNext && wpStyles.navBtnOff]}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? '#374151' : '#d1d5db'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const wpStyles = StyleSheet.create({
  container: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  navBtnOff: { opacity: 0.3 },
  center: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  weekCode: { fontSize: 16, fontWeight: '700', color: '#374151' },
  range: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  tapHint: { fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: '500' },
});

// ── CalendarPicker ────────────────────────────────────────────────────────────

function CalendarPicker({ value, onChange, color }: { value: Date | null; onChange: (d: Date) => void; color: string }) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());

  useEffect(() => {
    setViewYear(value?.getFullYear() ?? today.getFullYear());
    setViewMonth(value?.getMonth() ?? today.getMonth());
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const canGoNext = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth());
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={calStyles.container}>
      {/* Month navigation */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Ionicons name="chevron-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{MONTH_FULL[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={[calStyles.navBtn, !canGoNext && calStyles.navBtnOff]} disabled={!canGoNext}>
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? '#374151' : '#d1d5db'} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week header (Mon–Sun, Sat/Sun tinted) */}
      <View style={calStyles.weekRow}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <View key={d} style={calStyles.weekCol}>
            <Text style={[calStyles.weekDay, i === 5 && calStyles.satLabel, i === 6 && calStyles.sunLabel]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((row, wi) => (
        <View key={wi} style={calStyles.row}>
          {row.map((day, di) => {
            if (!day) return <View key={di} style={calStyles.cell} />;
            const cellDate = new Date(viewYear, viewMonth, day);
            const isSel = value != null && value.getFullYear() === viewYear && value.getMonth() === viewMonth && value.getDate() === day;
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
            const isFuture = cellDate > today;
            const isSat = di === 5;
            const isSun = di === 6;
            const weekendColor = isSun ? '#dc2626' : (isSat ? '#2563eb' : null);

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
                  isToday && !isSel && { color, fontWeight: '700' },
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

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={stepStyles.row}>
      <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} style={stepStyles.btn}>
        <Ionicons name="remove" size={22} color="#374151" />
      </TouchableOpacity>
      <View style={[stepStyles.valueBox, { borderColor: color + '40' }]}>
        <Text style={[stepStyles.value, { color }]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={() => onChange(value + 1)} style={stepStyles.btn}>
        <Ionicons name="add" size={22} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'center' },
  btn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  valueBox: { width: 70, height: 54, borderRadius: 14, borderWidth: 2, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 26, fontWeight: '800' },
});

// ── Main Modal ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddActivityModal({ visible, onClose, onSaved }: Props) {
  const [activityType, setActivityType] = useState<ActivityType>('mass');
  const [massDate, setMassDate] = useState<Date | null>(null);
  const [fastingWeek, setFastingWeek] = useState<WeekValue | null>(null);
  const [fastingDays, setFastingDays] = useState<string[]>([]);
  const [prayerType, setPrayerType] = useState<PrayerType>('rosary');
  const [prayerCount, setPrayerCount] = useState(1);
  const [prayerWeek, setPrayerWeek] = useState<WeekValue | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = useCallback((day: string) => {
    setFastingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }, []);

  const reset = () => {
    setActivityType('mass');
    setMassDate(null);
    setFastingWeek(null);
    setFastingDays([]);
    setPrayerType('rosary');
    setPrayerCount(1);
    setPrayerWeek(null);
    setError('');
  };

  const handleSubmit = async () => {
    const body: Record<string, unknown> = { activityType };

    if (activityType === 'mass') {
      if (!massDate) return setError('Please select the mass date');
      const y = massDate.getFullYear();
      const m = String(massDate.getMonth() + 1).padStart(2, '0');
      const d = String(massDate.getDate()).padStart(2, '0');
      body.massDate = `${y}-${m}-${d}`;
      body.massAttended = true;
    } else if (activityType === 'fasting') {
      if (!fastingWeek) return setError('Please select the fasting week');
      body.fastingWeek = fmtISOWeek(fastingWeek.year, fastingWeek.week);
      body.fastingDays = fastingDays;
    } else {
      if (!prayerWeek) return setError('Please select the prayer week');
      body.prayerType = prayerType;
      body.prayerCount = prayerCount;
      body.prayerWeek = fmtISOWeek(prayerWeek.year, prayerWeek.week);
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/members/me/spiritual-activities', body);
      reset();
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save activity');
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = ACTIVITY_CONFIG[activityType];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Colored header band */}
          <View style={[styles.headerBand, { backgroundColor: cfg.color + '18' }]}>
            <View style={[styles.iconBadge, { backgroundColor: cfg.color }]}>
              <Ionicons name={cfg.icon} size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Log Spiritual Activity</Text>
              <Text style={[styles.headerSub, { color: cfg.color }]}>{cfg.label} · {cfg.desc}</Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Activity type selector */}
            <Text style={styles.secLabel}>Activity Type</Text>
            <View style={styles.typeRow}>
              {ACTIVITY_TYPES.map(t => {
                const c = ACTIVITY_CONFIG[t];
                const active = activityType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => { setActivityType(t); setError(''); }}
                    style={[styles.typeCard, active && { borderColor: c.color, backgroundColor: c.color + '10' }]}
                  >
                    <View style={[styles.typeIconWrap, { backgroundColor: active ? c.color : '#f3f4f6' }]}>
                      <Ionicons name={c.icon} size={20} color={active ? '#fff' : '#9ca3af'} />
                    </View>
                    <Text style={[styles.typeCardLabel, active && { color: c.color }]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Holy Mass ── */}
            {activityType === 'mass' && (
              <>
                <Text style={styles.secLabel}>Select Date</Text>
                {/* Selected date display */}
                <View style={[
                  styles.datePill,
                  massDate ? { backgroundColor: cfg.color + '10', borderColor: cfg.color + '40' } : {},
                ]}>
                  <Ionicons
                    name={massDate ? 'checkmark-circle' : 'calendar-outline'}
                    size={16}
                    color={massDate ? cfg.color : '#9ca3af'}
                  />
                  <Text style={[styles.datePillText, massDate && { color: cfg.color, fontWeight: '600' }]}>
                    {massDate
                      ? massDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : 'No date selected — tap a day below'}
                  </Text>
                </View>
                <CalendarPicker value={massDate} onChange={setMassDate} color={cfg.color} />
              </>
            )}

            {/* ── Fasting ── */}
            {activityType === 'fasting' && (
              <>
                <Text style={styles.secLabel}>Fasting Week</Text>
                <WeekPicker value={fastingWeek} onChange={setFastingWeek} color={cfg.color} />

                <Text style={styles.secLabel}>Days Fasted</Text>
                <View style={styles.dayGrid}>
                  {DAYS.map((day, i) => {
                    const active = fastingDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(day)}
                        style={[styles.dayChip, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{DAY_SHORT[i]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── Prayer ── */}
            {activityType === 'prayer' && (
              <>
                <Text style={styles.secLabel}>Prayer Type</Text>
                <View style={styles.prayerGrid}>
                  {PRAYER_TYPES.map(t => {
                    const c = PRAYER_CONFIG[t];
                    const active = prayerType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setPrayerType(t)}
                        style={[styles.prayerCard, active && { borderColor: cfg.color, backgroundColor: cfg.color + '10' }]}
                      >
                        <Ionicons name={c.icon} size={16} color={active ? cfg.color : '#9ca3af'} />
                        <Text style={[styles.prayerLabel, active && { color: cfg.color, fontWeight: '600' }]}>{c.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.secLabel}>Times Completed</Text>
                <Stepper value={prayerCount} onChange={setPrayerCount} color={cfg.color} />

                <Text style={styles.secLabel}>Prayer Week</Text>
                <WeekPicker value={prayerWeek} onChange={setPrayerWeek} color={cfg.color} />
              </>
            )}

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: cfg.color }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark" size={19} color="#fff" /><Text style={styles.saveText}>Save Activity</Text></>
                }
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%' },
  handle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },

  headerBand: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  iconBadge: { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },

  body: { paddingHorizontal: 18 },
  secLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.9,
    marginTop: 20, marginBottom: 10,
  },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1, alignItems: 'center', paddingVertical: 16, gap: 8,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  typeIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeCardLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textAlign: 'center' },

  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10,
  },
  datePillText: { fontSize: 13, color: '#9ca3af', flex: 1 },

  dayGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dayChip: {
    paddingVertical: 9, paddingHorizontal: 12,
    borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb',
  },
  dayChipText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  dayChipTextActive: { color: '#fff' },

  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prayerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  prayerLabel: { fontSize: 13, color: '#9ca3af' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginTop: 16,
  },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 30 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  cancelText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
