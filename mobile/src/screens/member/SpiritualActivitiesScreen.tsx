import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SectionList,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import AddActivityModal from './AddActivityModal';

interface Activity {
  _id: string;
  activityType: 'mass' | 'fasting' | 'prayer';
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  massDate?: string;
  fastingWeek?: string;
  fastingDays?: string[];
  prayerType?: string;
  prayerCount?: number;
  prayerWeek?: string;
}

const api = createRoleApi('member');

const TYPE_CONFIG = {
  mass:    { label: 'Holy Mass', icon: 'flame'  as const, color: '#7c3aed', bg: '#f5f3ff' },
  fasting: { label: 'Fasting',   icon: 'moon'   as const, color: '#b45309', bg: '#fffbeb' },
  prayer:  { label: 'Prayer',    icon: 'heart'  as const, color: '#0d9488', bg: '#f0fdfa' },
};

const STATUS_CONFIG = {
  pending_approval: { label: 'Pending',  color: '#d97706', bg: '#fffbeb' },
  approved:         { label: 'Approved', color: '#059669', bg: '#f0fdf4' },
  rejected:         { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
};

function getSubtitle(a: Activity): string {
  if (a.activityType === 'mass' && a.massDate) {
    const d = new Date(a.massDate);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (a.activityType === 'fasting') {
    const parts: string[] = [];
    if (a.fastingWeek) parts.push(a.fastingWeek);
    if (a.fastingDays?.length) parts.push(`${a.fastingDays.length} day${a.fastingDays.length > 1 ? 's' : ''} fasted`);
    return parts.join(' · ') || '';
  }
  if (a.activityType === 'prayer') {
    const parts: string[] = [];
    if (a.prayerType) parts.push(a.prayerType.replace(/_/g, ' '));
    if (a.prayerCount) parts.push(`${a.prayerCount} time${a.prayerCount > 1 ? 's' : ''}`);
    if (a.prayerWeek) parts.push(a.prayerWeek);
    return parts.join(' · ') || '';
  }
  return '';
}

// ── Activity Card ─────────────────────────────────────────────────────────────

function ActivityCard({ a }: { a: Activity }) {
  const tcfg = TYPE_CONFIG[a.activityType];
  const status = a.approvalStatus ?? 'approved';
  const scfg = STATUS_CONFIG[status];
  const subtitle = getSubtitle(a);
  const addedDate = new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={cardStyles.card}>
      {/* Left colored accent strip */}
      <View style={[cardStyles.accent, { backgroundColor: tcfg.color }]} />

      <View style={cardStyles.body}>
        {/* Top row: icon + label + status badge */}
        <View style={cardStyles.topRow}>
          <View style={cardStyles.labelGroup}>
            <View style={[cardStyles.iconWrap, { backgroundColor: tcfg.bg }]}>
              <Ionicons name={tcfg.icon} size={15} color={tcfg.color} />
            </View>
            <Text style={[cardStyles.typeLabel, { color: tcfg.color }]}>{tcfg.label}</Text>
          </View>
          <View style={[cardStyles.badge, { backgroundColor: scfg.bg }]}>
            <Text style={[cardStyles.badgeText, { color: scfg.color }]}>{scfg.label}</Text>
          </View>
        </View>

        {/* Subtitle (date / week / prayer info) */}
        {!!subtitle && (
          <Text style={cardStyles.subtitle} numberOfLines={2}>{subtitle}</Text>
        )}

        {/* Footer */}
        <View style={cardStyles.footer}>
          <Ionicons name="time-outline" size={11} color="#9ca3af" />
          <Text style={cardStyles.meta}>Added {addedDate}</Text>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  accent: { width: 4 },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap: { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontSize: 13, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#1f2937', fontWeight: '500', marginBottom: 6, textTransform: 'capitalize' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 11, color: '#9ca3af' },
});

// ── Stats Banner ──────────────────────────────────────────────────────────────

function StatsHeader({ activities }: { activities: Activity[] }) {
  const counts = useMemo(() => ({
    mass:    activities.filter(a => a.activityType === 'mass').length,
    fasting: activities.filter(a => a.activityType === 'fasting').length,
    prayer:  activities.filter(a => a.activityType === 'prayer').length,
  }), [activities]);

  const total = activities.length;

  return (
    <View style={hdrStyles.wrapper}>
      {/* Main banner */}
      <View style={hdrStyles.banner}>
        <View>
          <Text style={hdrStyles.bannerTitle}>Spiritual Activities</Text>
          <Text style={hdrStyles.bannerSub}>
            {total === 0 ? 'Nothing logged yet — start today!' : `${total} ${total === 1 ? 'activity' : 'activities'} recorded`}
          </Text>
        </View>
        <Ionicons name="star-outline" size={30} color="rgba(255,255,255,0.35)" />
      </View>

      {/* Stat tiles */}
      <View style={hdrStyles.tilesRow}>
        {(['mass', 'fasting', 'prayer'] as const).map(type => {
          const cfg = TYPE_CONFIG[type];
          return (
            <View key={type} style={hdrStyles.tile}>
              <View style={[hdrStyles.tileIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={18} color={cfg.color} />
              </View>
              <Text style={[hdrStyles.tileCount, { color: cfg.color }]}>{counts[type]}</Text>
              <Text style={hdrStyles.tileLabel}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const hdrStyles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  banner: {
    backgroundColor: '#0d9488',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 7 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  bannerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  tilesRow: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  tileIcon:  { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tileCount: { fontSize: 22, fontWeight: '800' },
  tileLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
});

// ── Section header (month divider) ────────────────────────────────────────────

function MonthHeader({ title }: { title: string }) {
  return (
    <View style={secStyles.row}>
      <View style={secStyles.line} />
      <Text style={secStyles.text}>{title}</Text>
      <View style={secStyles.line} />
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 10 },
  line: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  text: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MemberSpiritualActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await api.get('/members/me/spiritual-activities');
      setActivities(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  const onRefresh = () => { setRefreshing(true); fetchActivities(); };

  // Group activities by month (newest first)
  const sections = useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    activities.forEach(a => {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => {
        const [y, m] = key.split('-');
        const d = new Date(Number(y), Number(m) - 1, 1);
        return {
          title: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          data,
        };
      });
  }, [activities]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d9488" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={a => a._id}
          renderItem={({ item }) => <ActivityCard a={item} />}
          renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<StatsHeader activities={activities} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Ionicons name="leaf-outline" size={44} color="#0d9488" />
              </View>
              <Text style={styles.emptyTitle}>Start your journey</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to log your first spiritual activity
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={fetchActivities}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent:    { padding: 16, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 32, gap: 10 },
  emptyCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#f0fdfa', borderWidth: 2, borderColor: '#ccfbf1',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0d9488',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#0d9488', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
});
