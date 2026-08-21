import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import FastEntryModal, { Member, EditEntry } from './FastEntryModal';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Contributor {
  _id: string;
  contributorId: string;
  contributorType: 'Member' | 'House';
  amount: number;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
}

interface Week {
  _id: string;
  weekNumber: number;
  year: number;
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  status: 'active' | 'closed' | 'processed';
  contributors: Contributor[];
}

interface SpiritualActivity {
  _id: string;
  memberId: { _id: string; firstName: string; lastName: string } | null;
  activityType: 'mass' | 'fasting' | 'prayer';
  massDate?: string;
  fastingWeek?: string;
  fastingDays?: string[];
  prayerType?: string;
  prayerCount?: number;
  prayerWeek?: string;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
}

interface ActivityCount {
  total: number;
  pendingIds: string[];
}

interface MemberWeekSummary {
  memberId: string;
  memberName: string;
  contribution: { amount: number; status: 'pending_approval' | 'approved' | 'rejected' } | null;
  kurubana: ActivityCount;
  japamala: ActivityCount;
  sukruthajapam: ActivityCount;
  upavasam: ActivityCount;
  hasPending: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const api = createRoleApi('kudumbakutayima_admin');

function getWeekMonday(year: number, weekNumber: number): Date {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() === 0 ? 7 : jan4.getDay();
  const weekOneMonday = new Date(jan4.getTime() - (day - 1) * 86400000);
  return new Date(weekOneMonday.getTime() + (weekNumber - 1) * 7 * 86400000);
}

function buildSummaries(
  myContributions: Contributor[],
  activities: SpiritualActivity[],
  members: Member[],
  weekStr: string,
  weekStart: Date,
  weekEnd: Date,
): MemberWeekSummary[] {
  const map = new Map<string, MemberWeekSummary>();

  const ensure = (id: string) => {
    if (!map.has(id)) {
      const m = members.find((x) => x._id === id);
      map.set(id, {
        memberId: id,
        memberName: m ? `${m.firstName} ${m.lastName}`.trim() : id,
        contribution: null,
        kurubana:     { total: 0, pendingIds: [] },
        japamala:     { total: 0, pendingIds: [] },
        sukruthajapam:{ total: 0, pendingIds: [] },
        upavasam:     { total: 0, pendingIds: [] },
        hasPending: false,
      });
    }
    return map.get(id)!;
  };

  // Contributions
  for (const c of myContributions) {
    if (c.contributorType !== 'Member') continue;
    const s = ensure(c.contributorId);
    s.contribution = { amount: c.amount, status: c.approvalStatus };
    if (c.approvalStatus === 'pending_approval') s.hasPending = true;
  }

  // Activities — filter by current week
  for (const act of activities) {
    if (!act.memberId) continue;
    const mid = act.memberId._id;

    let inWeek = false;
    if (act.activityType === 'mass' && act.massDate) {
      const d = new Date(act.massDate);
      inWeek = d >= weekStart && d <= weekEnd;
    } else if (act.activityType === 'prayer') {
      inWeek = act.prayerWeek === weekStr
        || act.prayerWeek === `${weekStr.split('-W')[0]}-W${parseInt(weekStr.split('-W')[1], 10)}`;
    } else if (act.activityType === 'fasting') {
      inWeek = act.fastingWeek === weekStr
        || act.fastingWeek === `${weekStr.split('-W')[0]}-W${parseInt(weekStr.split('-W')[1], 10)}`;
    }
    if (!inWeek) continue;

    const s = ensure(mid);
    const isPending = act.approvalStatus === 'pending_approval';
    if (isPending) s.hasPending = true;

    if (act.activityType === 'mass') {
      s.kurubana.total += 1;
      if (isPending) s.kurubana.pendingIds.push(act._id);
    } else if (act.activityType === 'prayer') {
      const count = act.prayerCount || 0;
      if (act.prayerType === 'rosary') {
        s.japamala.total += count;
        if (isPending) s.japamala.pendingIds.push(act._id);
      } else if (act.prayerType === 'divine_mercy') {
        s.sukruthajapam.total += count;
        if (isPending) s.sukruthajapam.pendingIds.push(act._id);
      }
    } else if (act.activityType === 'fasting') {
      const count = (act.fastingDays || []).length;
      s.upavasam.total += count;
      if (isPending) s.upavasam.pendingIds.push(act._id);
    }
  }

  return Array.from(map.values());
}

// ── Sub-components ────────────────────────────────────────────────────────────

const STATUS_CONTRIB: Record<string, { color: string; bg: string; label: string }> = {
  pending_approval: { color: '#d97706', bg: '#fffbeb', label: 'Pending' },
  approved:         { color: '#059669', bg: '#f0fdf4', label: 'Approved' },
  rejected:         { color: '#dc2626', bg: '#fef2f2', label: 'Rejected' },
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ACT_PILLS: { key: keyof Pick<MemberWeekSummary, 'kurubana'|'japamala'|'sukruthajapam'|'upavasam'>; icon: IconName; label: string }[] = [
  { key: 'kurubana',      icon: 'flame-outline',     label: 'Kurubana' },
  { key: 'japamala',      icon: 'sync-outline',      label: 'Japamala' },
  { key: 'sukruthajapam', icon: 'heart-outline',     label: 'Sukruthajapam' },
  { key: 'upavasam',      icon: 'moon-outline',      label: 'Upavasam' },
];

function MemberCard({ item, weekActive, onEdit }: {
  item: MemberWeekSummary;
  weekActive: boolean;
  onEdit: () => void;
}) {
  const anyActivity = ACT_PILLS.some((p) => item[p.key].total > 0);

  return (
    <View style={c.card}>
      <View style={c.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={c.memberName}>{item.memberName}</Text>
          {item.contribution && (
            <View style={c.amtRow}>
              <Text style={c.amtText}>₹{item.contribution.amount.toLocaleString('en-IN')}</Text>
              <View style={[c.badge, { backgroundColor: STATUS_CONTRIB[item.contribution.status].bg }]}>
                <Text style={[c.badgeText, { color: STATUS_CONTRIB[item.contribution.status].color }]}>
                  {STATUS_CONTRIB[item.contribution.status].label}
                </Text>
              </View>
            </View>
          )}
        </View>
        {weekActive && item.hasPending && (
          <TouchableOpacity style={c.editBtn} onPress={onEdit} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={14} color="#ea580c" />
            <Text style={c.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {anyActivity && (
        <View style={c.pillsRow}>
          {ACT_PILLS.map((p) =>
            item[p.key].total > 0 ? (
              <View key={p.key} style={c.pill}>
                <Ionicons name={p.icon} size={12} color="#ea580c" />
                <Text style={c.pillText}>{item[p.key].total}</Text>
                <Text style={c.pillLabel}> {p.label}</Text>
              </View>
            ) : null,
          )}
        </View>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function KutayimaAdminWeeklyScreen() {
  const [week, setWeek] = useState<Week | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberIdSet, setMemberIdSet] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [editEntry, setEditEntry] = useState<EditEntry | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [weeksRes, membersRes, activitiesRes] = await Promise.all([
        api.get('/stothrakazhcha'),
        api.get('/members'),
        api.get('/spiritual-activities?includeAllStatuses=true'),
      ]);

      const allWeeks: Week[] = weeksRes.data?.data || [];
      const activeWeek = allWeeks.find((w) => w.status === 'active') || null;
      setWeek(activeWeek);

      const list: Member[] = (membersRes.data?.data || []).map((m: any) => ({
        _id: m._id,
        firstName: m.firstName,
        lastName: m.lastName || '',
      }));
      setMembers(list);
      setMemberIdSet(new Set(list.map((m) => m._id)));

      setActivities(activitiesRes.data?.data || []);
    } catch {
      setWeek(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build member week summaries
  const weekStr = week ? `${week.year}-W${String(week.weekNumber).padStart(2, '0')}` : '';
  const weekStart = week ? getWeekMonday(week.year, week.weekNumber) : new Date(0);
  const weekEnd = week ? new Date(weekStart.getTime() + 6 * 86400000 + 86399999) : new Date(0);

  const myContributions = week
    ? week.contributors.filter((c) => memberIdSet.has(c.contributorId))
    : [];

  const summaries = week
    ? buildSummaries(myContributions, activities, members, weekStr, weekStart, weekEnd)
    : [];

  const totalCollected = myContributions
    .filter((c) => c.approvalStatus !== 'rejected')
    .reduce((s, c) => s + c.amount, 0);
  const pendingCount = myContributions.filter((c) => c.approvalStatus === 'pending_approval').length;
  const approvedCount = myContributions.filter((c) => c.approvalStatus === 'approved').length;

  const openEdit = (item: MemberWeekSummary) => {
    const pendingActivityIds = [
      ...item.kurubana.pendingIds,
      ...item.japamala.pendingIds,
      ...item.sukruthajapam.pendingIds,
      ...item.upavasam.pendingIds,
    ];
    setEditEntry({
      memberId: item.memberId,
      pendingActivityIds,
      hasContribution: !!item.contribution && item.contribution.status !== 'rejected',
      kurubana:      item.kurubana.pendingIds.length,     // pending counts only
      japamala:      item.japamala.pendingIds.length > 0
                       ? activities.filter(a => item.japamala.pendingIds.includes(a._id))
                           .reduce((s, a) => s + (a.prayerCount || 0), 0)
                       : 0,
      sukruthajapam: item.sukruthajapam.pendingIds.length > 0
                       ? activities.filter(a => item.sukruthajapam.pendingIds.includes(a._id))
                           .reduce((s, a) => s + (a.prayerCount || 0), 0)
                       : 0,
      upavasam:      item.upavasam.pendingIds.length > 0
                       ? activities.filter(a => item.upavasam.pendingIds.includes(a._id))
                           .reduce((s, a) => s + (a.fastingDays?.length || 0), 0)
                       : 0,
    });
    setShowEntry(true);
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#ea580c" /></View>;
  }

  return (
    <View style={s.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            tintColor="#ea580c"
          />
        }
        contentContainerStyle={s.content}
      >
        {/* Page header */}
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Weekly Entry</Text>
            <Text style={s.pageSubtitle}>
              {week ? `Week ${week.weekNumber}, ${week.year}` : 'No active week'}
            </Text>
          </View>
          {week?.status === 'active' && (
            <TouchableOpacity style={s.addBtn} activeOpacity={0.8}
              onPress={() => { setEditEntry(null); setShowEntry(true); }}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.addBtnText}>Add Entry</Text>
            </TouchableOpacity>
          )}
        </View>

        {week ? (
          <>
            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={[s.statBox, { backgroundColor: '#fff7ed' }]}>
                <Text style={[s.statValue, { color: '#ea580c' }]}>₹{totalCollected.toLocaleString('en-IN')}</Text>
                <Text style={s.statLabel}>collected</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: '#fffbeb' }]}>
                <Text style={[s.statValue, { color: '#d97706' }]}>{pendingCount}</Text>
                <Text style={s.statLabel}>pending</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[s.statValue, { color: '#059669' }]}>{approvedCount}</Text>
                <Text style={s.statLabel}>approved</Text>
              </View>
            </View>

            {/* Members this week */}
            {summaries.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="add-circle-outline" size={32} color="#d1d5db" />
                <Text style={s.emptyText}>No entries yet — tap Add Entry to begin</Text>
              </View>
            ) : (
              <>
                <Text style={s.listTitle}>Members this week · {summaries.length}</Text>
                {summaries.map((item) => (
                  <MemberCard
                    key={item.memberId}
                    item={item}
                    weekActive={week.status === 'active'}
                    onEdit={() => openEdit(item)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <View style={s.emptyCard}>
            <Ionicons name="star-outline" size={32} color="#d1d5db" />
            <Text style={s.emptyText}>No active Stothrakazhcha this week</Text>
          </View>
        )}
      </ScrollView>

      {week && (
        <FastEntryModal
          visible={showEntry}
          week={week}
          members={members}
          editEntry={editEntry}
          onClose={() => { setShowEntry(false); setEditEntry(null); }}
          onSaved={() => { setShowEntry(false); setEditEntry(null); fetchAll(); }}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ea580c', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  listTitle: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  emptyText: { color: '#9ca3af', fontSize: 13, textAlign: 'center' },
});

// Member card styles
const c = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  memberName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },

  amtRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amtText: { fontSize: 14, fontWeight: '700', color: '#ea580c' },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#ea580c', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  editText: { fontSize: 12, fontWeight: '700', color: '#ea580c' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#fff7ed', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 9,
  },
  pillText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  pillLabel: { fontSize: 12, color: '#6b7280' },
});
