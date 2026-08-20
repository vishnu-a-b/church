import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, ScrollView, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import MarkContributionModal from './MarkContributionModal';

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

interface Entity { _id: string; label: string; }

const api = createRoleApi('kudumbakutayima_admin');
const COLOR = '#ea580c';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending_approval: { color: '#d97706', bg: '#fffbeb', label: 'Pending' },
  approved:         { color: '#059669', bg: '#f0fdf4', label: 'Approved' },
  rejected:         { color: '#dc2626', bg: '#fef2f2', label: 'Rejected' },
};

const WEEK_STATUS: Record<string, { color: string; bg: string }> = {
  active:    { color: '#059669', bg: '#f0fdf4' },
  closed:    { color: '#6b7280', bg: '#f9fafb' },
  processed: { color: '#2563eb', bg: '#eff6ff' },
};

export default function KutayimaAdminStothrakazhchaScreen() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityIdSet, setEntityIdSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<Week | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Week | null>(null);

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

      const active = allWeeks.find((w) => w.status === 'active') || allWeeks[0];
      const useMember = !active || active.amountType === 'per_member';
      const list = useMember
        ? (membersRes.data?.data || []).map((m: any) => ({ _id: m._id, label: `${m.firstName} ${m.lastName || ''}`.trim() }))
        : (housesRes.data?.data || []).map((h: any) => ({ _id: h._id, label: h.familyName }));
      setEntities(list);
      setEntityIdSet(new Set(list.map((e: Entity) => e._id)));

      if (active) setExpandedId((prev) => prev ?? active._id);
    } catch {
      setWeeks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const entityLabel = (id: string) => entities.find((e) => e._id === id)?.label || id;

  const myContributions = (week: Week) =>
    week.contributors.filter((c) => entityIdSet.has(c.contributorId));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  if (weeks.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyCircle}>
          <Ionicons name="star-outline" size={36} color={COLOR} />
        </View>
        <Text style={styles.emptyTitle}>No weeks found</Text>
        <Text style={styles.emptySub}>Stothrakazhcha weeks will appear here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={COLOR} />}
        contentContainerStyle={styles.content}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Stothrakazhcha</Text>
            <Text style={styles.bannerSub}>{weeks.length} week{weeks.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.bannerIcon}>
            <Ionicons name="star-outline" size={28} color="#fff" />
          </View>
        </View>

        {weeks.map((week) => {
          const mine = myContributions(week);
          const pending = mine.filter((c) => c.approvalStatus === 'pending_approval');
          const approved = mine.filter((c) => c.approvalStatus === 'approved');
          const entered = mine.filter((c) => c.approvalStatus !== 'rejected');
          const total = entered.reduce((s, c) => s + c.amount, 0);
          const isExpanded = expandedId === week._id;
          const ws = WEEK_STATUS[week.status] || WEEK_STATUS.closed;

          return (
            <View key={week._id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(isExpanded ? null : week._id)}
                activeOpacity={0.7}
              >
                <View style={styles.weekNumBox}>
                  <Text style={styles.weekNumText}>W{week.weekNumber}</Text>
                  <Text style={styles.weekYearText}>{week.year}</Text>
                </View>
                <View style={styles.headerBody}>
                  <View style={styles.headerTopRow}>
                    <Text style={styles.weekLabel}>Week {week.weekNumber}, {week.year}</Text>
                    <View style={[styles.statusPill, { backgroundColor: ws.bg }]}>
                      <Text style={[styles.statusText, { color: ws.color }]}>
                        {week.status.charAt(0).toUpperCase() + week.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.totalText}>
                    ₹{total.toLocaleString('en-IN')} · {entered.length} entered · {pending.length} pending
                  </Text>
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardBody}>
                  {mine.length === 0 ? (
                    <View style={styles.emptySmall}>
                      <Ionicons name="alert-circle-outline" size={18} color="#d1d5db" />
                      <Text style={styles.emptySmallText}>No contributions marked yet</Text>
                    </View>
                  ) : (
                    mine.map((c) => {
                      const s = STATUS_CONFIG[c.approvalStatus] || STATUS_CONFIG.approved;
                      return (
                        <View key={c._id} style={styles.entryRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.entryName}>{entityLabel(c.contributorId)}</Text>
                            <Text style={styles.entryAmt}>₹{c.amount.toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={[styles.entryBadge, { backgroundColor: s.bg }]}>
                            <Text style={[styles.entryBadgeText, { color: s.color }]}>{s.label}</Text>
                          </View>
                        </View>
                      );
                    })
                  )}

                  <View style={styles.actionRow}>
                    {pending.length > 0 && (
                      <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitTarget(week)}>
                        <Ionicons name="send-outline" size={14} color={COLOR} />
                        <Text style={styles.submitBtnText}>Submit Cash ({pending.length})</Text>
                      </TouchableOpacity>
                    )}
                    {week.status === 'active' && (
                      <TouchableOpacity style={styles.addBtn} onPress={() => setAddTarget(week)}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {addTarget && (
        <MarkContributionModal
          visible={true}
          stothrakazhchaId={addTarget._id}
          amountType={addTarget.amountType}
          defaultAmount={addTarget.defaultAmount}
          entities={entities}
          onClose={() => setAddTarget(null)}
          onSaved={() => { setAddTarget(null); fetchAll(); }}
        />
      )}

      {submitTarget && (() => {
        const mine = myContributions(submitTarget);
        const pending = mine.filter((c) => c.approvalStatus === 'pending_approval');
        const pendingTotal = pending.reduce((s, c) => s + c.amount, 0);
        return (
          <Modal visible animationType="fade" transparent onRequestClose={() => setSubmitTarget(null)}>
            <View style={styles.overlay}>
              <View style={styles.confirmSheet}>
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="send-outline" size={24} color={COLOR} />
                </View>
                <Text style={styles.confirmTitle}>Submit Cash to Church Admin</Text>
                <Text style={styles.confirmBody}>
                  Week {submitTarget.weekNumber}, {submitTarget.year} — please hand over{' '}
                  <Text style={[styles.confirmBody, { fontWeight: '800', color: COLOR }]}>
                    ₹{pendingTotal.toLocaleString('en-IN')}
                  </Text>
                  {' '}to the Church Admin.
                </Text>
                <Text style={styles.confirmNote}>
                  {pending.length} pending {pending.length === 1 ? 'entry' : 'entries'} will be counted only after approval.
                </Text>
                <View style={styles.confirmList}>
                  {pending.map((c) => (
                    <View key={c._id} style={styles.confirmRow}>
                      <Text style={styles.confirmName}>{entityLabel(c.contributorId)}</Text>
                      <Text style={styles.confirmAmt}>₹{c.amount.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.confirmClose} onPress={() => setSubmitTarget(null)}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.confirmCloseText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },

  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff7ed', borderWidth: 2, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ea580c', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#ea580c', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  weekNumBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' },
  weekNumText: { fontSize: 14, fontWeight: '800', color: '#ea580c' },
  weekYearText: { fontSize: 10, color: '#6b7280' },
  headerBody: { flex: 1 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  weekLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusPill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },
  totalText: { fontSize: 12, color: '#6b7280' },

  cardBody: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingHorizontal: 16, paddingBottom: 14 },

  emptySmall: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptySmallText: { color: '#9ca3af', fontSize: 13 },

  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  entryName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  entryAmt: { fontSize: 13, color: '#ea580c', fontWeight: '700' },
  entryBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  entryBadgeText: { fontSize: 11, fontWeight: '600' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#ea580c', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  submitBtnText: { color: '#ea580c', fontWeight: '700', fontSize: 13 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ea580c', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  confirmSheet: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
    }),
  },
  confirmIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  confirmBody: { fontSize: 14, color: '#374151', lineHeight: 22, textAlign: 'center', marginBottom: 6 },
  confirmNote: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 16 },
  confirmList: { width: '100%', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginBottom: 16 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  confirmName: { fontSize: 14, color: '#374151' },
  confirmAmt: { fontSize: 14, fontWeight: '700', color: '#111827' },
  confirmClose: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '100%', backgroundColor: '#ea580c', borderRadius: 14, padding: 14, justifyContent: 'center',
  },
  confirmCloseText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
