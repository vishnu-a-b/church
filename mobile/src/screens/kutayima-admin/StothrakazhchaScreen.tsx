import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, ScrollView, RefreshControl, Platform, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import MarkContributionModal from './MarkContributionModal';

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface RawMember {
  _id: string;
  firstName: string;
  lastName: string;
  uniqueId?: string;
  houseId?: string | { _id: string };
}

const shortId = (uid?: string) => uid ? uid.split('-').slice(1).map(s => String(+s.replace(/\D/g, ''))).join('-') : '';

interface RawHouse {
  _id: string;
  familyName: string;
}

interface Contributor {
  _id: string;
  contributorId: string;
  contributorType: 'Member' | 'House';
  amount: number;
  entryType?: 'normal' | 'absent' | 'offering';
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

interface Entity { _id: string; label: string; }

interface HouseGroup {
  houseId: string;
  houseName: string;
  entries: (Contributor & { memberLabel: string })[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const api = createRoleApi('kudumbakutayima_admin');
const COLOR = '#ea580c';
const COLOR_LIGHT = '#fff7ed';
const COLOR_DARK = '#c2410c';

const STATUS_CFG = {
  pending_approval: { color: '#d97706', bg: '#fef3c7', label: 'Pending' },
  approved:         { color: '#059669', bg: '#dcfce7', label: 'Approved' },
  rejected:         { color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
} as const;

const WEEK_STATUS_CFG = {
  active:    { color: '#059669', bg: '#dcfce7', dot: '#22c55e', label: 'Active' },
  closed:    { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af', label: 'Closed' },
  processed: { color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6', label: 'Processed' },
} as const;

// ── Main Component ─────────────────────────────────────────────────────────────

export default function KutayimaAdminStothrakazhchaScreen() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [rawMembers, setRawMembers] = useState<RawMember[]>([]);
  const [rawHouses, setRawHouses] = useState<RawHouse[]>([]);
  const [entityIdSet, setEntityIdSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View navigation
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Inline edit
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [weeksRes, membersRes, housesRes] = await Promise.all([
        api.get('/stothrakazhcha'),
        api.get('/members'),
        api.get('/houses'),
      ]);

      const allWeeks: Week[] = (weeksRes.data?.data || []).sort(
        (a: Week, b: Week) => b.year - a.year || b.weekNumber - a.weekNumber
      );
      setWeeks(allWeeks);

      const members: RawMember[] = membersRes.data?.data || [];
      const houses: RawHouse[] = housesRes.data?.data || [];
      setRawMembers(members);
      setRawHouses(houses);

      const active = allWeeks.find((w) => w.status === 'active') || allWeeks[0];
      const useMember = !active || active.amountType === 'per_member';
      setEntityIdSet(new Set(useMember ? members.map((m) => m._id) : houses.map((h) => h._id)));
    } catch {
      setWeeks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Keep selected week in sync after refresh
  useEffect(() => {
    if (selectedWeek) {
      const updated = weeks.find((w) => w._id === selectedWeek._id);
      if (updated) setSelectedWeek(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const myContributions = (week: Week) =>
    week.contributors.filter((c) => entityIdSet.has(c.contributorId));

  const getEntityLabel = (c: Contributor): string => {
    if (c.contributorType === 'House') {
      return rawHouses.find((h) => h._id === c.contributorId)?.familyName || 'House';
    }
    const m = rawMembers.find((r) => r._id === c.contributorId);
    return m ? `${m.firstName} ${m.lastName || ''}`.trim() : c.contributorId;
  };

  const buildHouseGroups = (week: Week): HouseGroup[] => {
    const memberMap = new Map(rawMembers.map((m) => [m._id, m]));
    const houseMap = new Map(rawHouses.map((h) => [h._id, h]));
    const mine = myContributions(week).filter((c) => c.approvalStatus !== 'rejected');

    if (week.amountType === 'per_house') {
      return mine.map((c) => ({
        houseId: c.contributorId,
        houseName: houseMap.get(c.contributorId)?.familyName || 'House',
        entries: [{ ...c, memberLabel: houseMap.get(c.contributorId)?.familyName || 'House' }],
      }));
    }

    // per_member → group by houseId
    const groups = new Map<string, HouseGroup>();
    for (const c of mine) {
      const member = memberMap.get(c.contributorId);
      const rawHid = member?.houseId;
      const houseId =
        typeof rawHid === 'object' && rawHid !== null
          ? (rawHid as { _id: string })._id
          : (rawHid as string) || 'unknown';
      const houseName = houseMap.get(houseId)?.familyName || 'Unknown House';
      if (!groups.has(houseId)) groups.set(houseId, { houseId, houseName, entries: [] });
      groups.get(houseId)!.entries.push({
        ...c,
        memberLabel: member
          ? `${member.firstName} ${member.lastName || ''}`.trim()
          : c.contributorId,
      });
    }
    return Array.from(groups.values());
  };

  const getWeekEntities = (week: Week): Entity[] =>
    week.amountType === 'per_member'
      ? rawMembers.map((m) => ({
          _id: m._id,
          label: `${m.firstName} ${m.lastName || ''}${shortId(m.uniqueId) ? ` (${shortId(m.uniqueId)})` : ''}`.trim(),
        }))
      : rawHouses.map((h) => ({ _id: h._id, label: h.familyName }));

  const saveEdit = async (weekId: string, entryId: string, newAmountStr: string) => {
    const value = Number(newAmountStr);
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid amount', 'Amount cannot be negative.');
      return;
    }
    setSavingId(entryId);
    try {
      await api.put(`/approvals/stothrakazhcha/${weekId}/contributors/${entryId}`, { amount: value });
      setEditAmounts((p) => { const n = { ...p }; delete n[entryId]; return n; });
      fetchAll();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update amount');
    } finally {
      setSavingId(null);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: '#f3f4f6' }]} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DETAIL SCREEN — entries for a selected week, grouped by house
  // ════════════════════════════════════════════════════════════════════════════
  if (selectedWeek) {
    const week = selectedWeek;
    const mine = myContributions(week);
    const pending = mine.filter((c) => c.approvalStatus === 'pending_approval');
    const approved = mine.filter((c) => c.approvalStatus === 'approved');
    const entered = mine.filter((c) => c.approvalStatus !== 'rejected');
    const total = entered.reduce((s, c) => s + c.amount, 0);
    const pendingTotal = pending.reduce((s, c) => s + c.amount, 0);
    const houseGroups = buildHouseGroups(week);
    const ws = WEEK_STATUS_CFG[week.status] || WEEK_STATUS_CFG.closed;
    const weekEntities = getWeekEntities(week);

    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: COLOR }]} edges={['top']}>
        <View style={s.container}>
          {/* ── Header bar ── */}
          <View style={s.detailBar}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => { setSelectedWeek(null); setEditAmounts({}); }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
              <Text style={s.backBtnText}>Weeks</Text>
            </TouchableOpacity>

            <View style={s.detailBarCenter}>
              <Text style={s.detailBarTitle}>Week {week.weekNumber}, {week.year}</Text>
              <View style={s.weekStatusRow}>
                <View style={[s.statusDot, { backgroundColor: ws.dot }]} />
                <Text style={s.weekStatusText}>{ws.label}</Text>
              </View>
            </View>

            {/* Spacer to centre title */}
            <View style={{ width: 70 }} />
          </View>

          {/* ── Stats strip ── */}
          <View style={s.statsStrip}>
            {[
              { label: 'Total',    value: `₹${total.toLocaleString('en-IN')}`, color: COLOR },
              { label: 'Entries',  value: String(entered.length),              color: '#111827' },
              { label: 'Pending',  value: String(pending.length),              color: '#d97706' },
              { label: 'Approved', value: String(approved.length),             color: '#059669' },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <View style={s.statCell}>
                  <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Scrollable content ── */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.detailContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR} />}
            keyboardShouldPersistTaps="handled"
          >
            {houseGroups.length === 0 ? (
              <View style={s.emptyCard}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="home-outline" size={34} color={COLOR} />
                </View>
                <Text style={s.emptyTitle}>No entries yet</Text>
                <Text style={s.emptySub}>
                  {week.status === 'active'
                    ? 'Tap "Add Entry" below to mark contributions.'
                    : 'No contributions were recorded for this week.'}
                </Text>
              </View>
            ) : (
              houseGroups.map((group) => {
                const groupTotal = group.entries.reduce((s, e) => s + e.amount, 0);
                return (
                  <View key={group.houseId} style={s.houseCard}>
                    {/* House header */}
                    <View style={s.houseHeader}>
                      <View style={s.houseIconBadge}>
                        <Ionicons name="home" size={15} color={COLOR} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.houseName}>{group.houseName}</Text>
                        <Text style={s.houseSubtitle}>
                          {group.entries.length} {group.entries.length === 1 ? 'member' : 'members'}
                        </Text>
                      </View>
                      <View style={s.houseTotalBadge}>
                        <Text style={s.houseTotalText}>₹{groupTotal.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {/* Member rows */}
                    {group.entries.map((entry, idx) => {
                      const st = STATUS_CFG[entry.approvalStatus] || STATUS_CFG.approved;
                      const isLast = idx === group.entries.length - 1;

                      return (
                        <View key={entry._id} style={[s.memberRow, isLast && s.memberRowLast]}>
                          {/* Avatar initial */}
                          <View style={s.memberAvatar}>
                            <Text style={s.memberAvatarText}>
                              {entry.memberLabel.charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          {/* Name + amount */}
                          <View style={{ flex: 1 }}>
                            <Text style={s.memberName} numberOfLines={1}>{entry.memberLabel}</Text>
                            <View style={s.amountRow}>
                              <Text style={[s.memberAmt, entry.amount === 0 && s.memberAmtZero]}>
                                ₹{entry.amount.toLocaleString('en-IN')}
                              </Text>
                              {entry.entryType && entry.entryType !== 'normal' && (
                                <View
                                  style={[
                                    s.typePill,
                                    entry.entryType === 'absent'
                                      ? s.typePillAbsent
                                      : s.typePillOffering,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      s.typePillText,
                                      entry.entryType === 'absent'
                                        ? s.typePillTextAbsent
                                        : s.typePillTextOffering,
                                    ]}
                                  >
                                    {entry.entryType}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Status badge + lock button */}
                          <View style={s.memberRight}>
                            <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                              <Text style={[s.statusPillText, { color: st.color }]}>
                                {st.label}
                              </Text>
                            </View>
                            {entry.approvalStatus === 'pending_approval' && (
                              <TouchableOpacity
                                style={s.editIconBtn}
                                onPress={() =>
                                  Alert.alert(
                                    'Edit Restricted',
                                    'Only the church admin can edit contributor amounts.',
                                  )
                                }
                              >
                                <Ionicons name="lock-closed-outline" size={13} color="#9ca3af" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}

            {/* Submit cash CTA */}
            {pending.length > 0 && (
              <TouchableOpacity
                style={s.submitCashBtn}
                onPress={() => setShowSubmitModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={s.submitCashText}>
                  Submit Cash to Church Admin ({pending.length})
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 110 }} />
          </ScrollView>

          {/* FAB — Add Entry */}
          {week.status === 'active' && (
            <TouchableOpacity
              style={s.fab}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={s.fabLabel}>Add Entry</Text>
            </TouchableOpacity>
          )}

          {/* Add contribution modal */}
          {showAddModal && (
            <MarkContributionModal
              visible
              stothrakazhchaId={week._id}
              amountType={week.amountType}
              defaultAmount={week.defaultAmount}
              entities={weekEntities}
              onClose={() => setShowAddModal(false)}
              onSaved={() => {
                setShowAddModal(false);
                setRefreshing(true);
                fetchAll();
              }}
            />
          )}

          {/* Submit cash info modal */}
          {showSubmitModal && (
            <Modal
              visible
              animationType="fade"
              transparent
              onRequestClose={() => setShowSubmitModal(false)}
            >
              <SafeAreaView style={s.overlay}>
                <View style={s.confirmSheet}>
                  <View style={s.confirmIconWrap}>
                    <Ionicons name="send-outline" size={26} color={COLOR} />
                  </View>
                  <Text style={s.confirmTitle}>Submit Cash to Church Admin</Text>
                  <Text style={s.confirmBody}>
                    Week {week.weekNumber}, {week.year} — please hand over{'\n'}
                    <Text style={{ fontWeight: '800', color: COLOR }}>
                      ₹{pendingTotal.toLocaleString('en-IN')}
                    </Text>
                    {' '}in cash to the Church Admin.
                  </Text>
                  <Text style={s.confirmNote}>
                    {pending.length} pending {pending.length === 1 ? 'entry' : 'entries'} will be
                    counted only after church admin approval.
                  </Text>
                  <ScrollView
                    style={s.confirmListScroll}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <View style={s.confirmList}>
                      {pending.map((c) => (
                        <View key={c._id} style={s.confirmRow}>
                          <Text style={s.confirmName} numberOfLines={1}>
                            {getEntityLabel(c)}
                          </Text>
                          <Text style={s.confirmAmt}>₹{c.amount.toLocaleString('en-IN')}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <TouchableOpacity
                    style={s.confirmCloseBtn}
                    onPress={() => setShowSubmitModal(false)}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={s.confirmCloseText}>Got it</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Modal>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIST SCREEN — all weeks
  // ════════════════════════════════════════════════════════════════════════════

  if (weeks.length === 0) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: '#f3f4f6' }]} edges={['top']}>
        <View style={s.center}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="star-outline" size={36} color={COLOR} />
          </View>
          <Text style={s.emptyTitle}>No weeks found</Text>
          <Text style={s.emptySub}>
            Stothrakazhcha weeks will appear here once the church admin creates them.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: COLOR }]} edges={['top']}>
      <View style={s.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR} />
          }
          contentContainerStyle={s.listContent}
        >
          {/* Banner */}
          <View style={s.banner}>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Stothrakazhcha</Text>
              <Text style={s.bannerSub}>
                {weeks.length} week{weeks.length !== 1 ? 's' : ''} available
              </Text>
            </View>
            <View style={s.bannerIconWrap}>
              <Ionicons name="star" size={26} color="rgba(255,255,255,0.9)" />
            </View>
          </View>

          {weeks.map((week) => {
            const mine = myContributions(week);
            const pending = mine.filter((c) => c.approvalStatus === 'pending_approval');
            const approved = mine.filter((c) => c.approvalStatus === 'approved');
            const entered = mine.filter((c) => c.approvalStatus !== 'rejected');
            const total = entered.reduce((s, c) => s + c.amount, 0);
            const ws = WEEK_STATUS_CFG[week.status] || WEEK_STATUS_CFG.closed;
            const progress =
              entityIdSet.size > 0
                ? Math.min(entered.length / entityIdSet.size, 1)
                : 0;

            return (
              <View key={week._id} style={s.weekCard}>
                {/* Top row: badge + info */}
                <View style={s.weekCardTop}>
                  <View style={[s.weekBadge, { backgroundColor: ws.bg }]}>
                    <Text style={[s.weekBadgeNum, { color: ws.color }]}>W{week.weekNumber}</Text>
                    <Text style={[s.weekBadgeYear, { color: ws.color }]}>{week.year}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.weekTitleRow}>
                      <Text style={s.weekTitle}>Week {week.weekNumber}, {week.year}</Text>
                      <View style={s.weekStatusChip}>
                        <View style={[s.weekStatusDot, { backgroundColor: ws.dot }]} />
                        <Text style={[s.weekStatusLabel, { color: ws.color }]}>
                          {ws.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.weekSubtitle}>
                      ₹{week.defaultAmount}/person ·{' '}
                      {week.amountType === 'per_member' ? 'Per member' : 'Per house'}
                    </Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={s.weekStatsRow}>
                  {[
                    { label: 'Collected', value: `₹${total.toLocaleString('en-IN')}`, color: COLOR },
                    { label: 'Entered',   value: String(entered.length),               color: '#111827' },
                    { label: 'Pending',   value: String(pending.length),               color: '#d97706' },
                    { label: 'Approved',  value: String(approved.length),              color: '#059669' },
                  ].map((stat, i, arr) => (
                    <React.Fragment key={stat.label}>
                      <View style={s.weekStat}>
                        <Text style={[s.weekStatVal, { color: stat.color }]}>{stat.value}</Text>
                        <Text style={s.weekStatLbl}>{stat.label}</Text>
                      </View>
                      {i < arr.length - 1 && <View style={s.weekStatDiv} />}
                    </React.Fragment>
                  ))}
                </View>

                {/* Coverage progress bar */}
                {entityIdSet.size > 0 && (
                  <View style={s.progressRow}>
                    <View style={s.progressTrack}>
                      <View
                        style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]}
                      />
                    </View>
                    <Text style={s.progressPct}>{Math.round(progress * 100)}%</Text>
                  </View>
                )}

                <View style={s.cardDivider} />

                {/* Action button */}
                <TouchableOpacity
                  style={s.viewBtn}
                  onPress={() => setSelectedWeek(week)}
                  activeOpacity={0.7}
                >
                  <View style={s.viewBtnLeft}>
                    <View style={s.viewBtnIconWrap}>
                      <Ionicons
                        name={week.status === 'active' ? 'add-circle' : 'eye'}
                        size={20}
                        color={COLOR}
                      />
                    </View>
                    <Text style={s.viewBtnText}>
                      {week.status === 'active' ? 'Add / View Entries' : 'View Entries'}
                    </Text>
                  </View>
                  {pending.length > 0 && (
                    <View style={s.pendingPill}>
                      <Text style={s.pendingPillText}>{pending.length} pending</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={COLOR} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 4 },
});

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 12,
  },

  // ── List view ───────────────────────────────────────────────────────────────
  listContent: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLOR, borderRadius: 20, padding: 20, marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: COLOR, shadowOpacity: 0.4,
        shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  weekCard: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden',
    ...cardShadow,
  },
  weekCardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  weekBadge: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  weekBadgeNum: { fontSize: 15, fontWeight: '800' },
  weekBadgeYear: { fontSize: 10, fontWeight: '600' },

  weekTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  weekTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  weekStatusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  weekStatusDot: { width: 6, height: 6, borderRadius: 3 },
  weekStatusLabel: { fontSize: 11, fontWeight: '600' },
  weekSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 3 },

  weekStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatVal: { fontSize: 16, fontWeight: '800', color: '#111827' },
  weekStatLbl: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  weekStatDiv: { width: 1, height: 32, backgroundColor: '#f3f4f6' },

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 8, marginBottom: 14,
  },
  progressTrack: {
    flex: 1, height: 6, backgroundColor: '#f3f4f6',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: COLOR, borderRadius: 3 },
  progressPct: { fontSize: 11, fontWeight: '700', color: COLOR, width: 34, textAlign: 'right' },

  cardDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  viewBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  viewBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  viewBtnIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLOR_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  viewBtnText: { fontSize: 14, fontWeight: '700', color: COLOR },
  pendingPill: {
    backgroundColor: '#fef3c7', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pendingPillText: { fontSize: 11, fontWeight: '600', color: '#d97706' },

  // ── Empty states ────────────────────────────────────────────────────────────
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLOR_LIGHT, borderWidth: 2, borderColor: '#fed7aa',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', textAlign: 'center' },
  emptySub: {
    fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20, maxWidth: 260,
  },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 36,
    alignItems: 'center', ...cardShadow,
  },

  // ── Detail screen ───────────────────────────────────────────────────────────
  detailBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLOR,
    paddingHorizontal: 10, paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLOR, shadowOpacity: 0.3,
        shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingVertical: 6, paddingHorizontal: 4, minWidth: 70,
  },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  detailBarCenter: { flex: 1, alignItems: 'center' },
  detailBarTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  weekStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  weekStatusText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  statsStrip: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.05,
        shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  statCell: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },

  detailContent: { padding: 14, paddingBottom: 40 },

  // House cards
  houseCard: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, overflow: 'hidden',
    ...cardShadow,
  },
  houseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, backgroundColor: '#fafafa',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  houseIconBadge: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLOR_LIGHT, justifyContent: 'center', alignItems: 'center',
  },
  houseName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  houseSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  houseTotalBadge: {
    backgroundColor: COLOR_LIGHT, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  houseTotalText: { fontSize: 13, fontWeight: '800', color: COLOR },

  // Member rows
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  memberRowLast: { borderBottomWidth: 0 },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  memberAvatarText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 3 },

  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberAmt: { fontSize: 13, fontWeight: '700', color: COLOR },
  memberAmtZero: { color: '#9ca3af' },

  typePill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typePillAbsent: { backgroundColor: '#fee2e2' },
  typePillOffering: { backgroundColor: '#dcfce7' },
  typePillText: { fontSize: 10, fontWeight: '600' },
  typePillTextAbsent: { color: '#b91c1c' },
  typePillTextOffering: { color: '#15803d' },

  memberRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  editIconBtn: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#f9fafb',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
  },

  // Inline edit
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editPrefix: { fontSize: 14, color: '#374151', fontWeight: '600' },
  editInput: {
    width: 80, height: 34, borderWidth: 1.5, borderColor: COLOR,
    borderRadius: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827',
  },
  editSaveBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: COLOR,
    justifyContent: 'center', alignItems: 'center',
  },
  editCancelBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },

  // Submit cash
  submitCashBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLOR_DARK, borderRadius: 16, padding: 16, marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: COLOR_DARK, shadowOpacity: 0.35,
        shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  submitCashText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLOR, borderRadius: 22,
    paddingVertical: 14, paddingHorizontal: 22,
    ...Platform.select({
      ios: {
        shadowColor: COLOR, shadowOpacity: 0.5,
        shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 12 },
    }),
  },
  fabLabel: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Modal / overlay
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center', padding: 20,
  },
  confirmSheet: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', maxHeight: '88%',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOpacity: 0.25,
        shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
    }),
  },
  confirmIconWrap: {
    width: 62, height: 62, borderRadius: 20,
    backgroundColor: COLOR_LIGHT, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18, fontWeight: '800', color: '#111827',
    marginBottom: 10, textAlign: 'center',
  },
  confirmBody: {
    fontSize: 14, color: '#374151', lineHeight: 22,
    textAlign: 'center', marginBottom: 6,
  },
  confirmNote: {
    fontSize: 12, color: '#9ca3af',
    textAlign: 'center', marginBottom: 16, lineHeight: 18,
  },
  confirmListScroll: { maxHeight: 220, width: '100%' },
  confirmList: {
    width: '100%', borderTopWidth: 1, borderTopColor: '#f3f4f6',
    paddingTop: 12, marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7,
  },
  confirmName: { fontSize: 14, color: '#374151', flex: 1, marginRight: 8 },
  confirmAmt: { fontSize: 14, fontWeight: '700', color: '#111827' },
  confirmCloseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '100%', backgroundColor: COLOR, borderRadius: 14,
    padding: 14, justifyContent: 'center',
  },
  confirmCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
