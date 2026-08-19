import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, ScrollView, RefreshControl,
} from 'react-native';
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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

const WEEK_STATUS_COLOR: Record<string, string> = {
  active: '#059669',
  closed: '#6b7280',
  processed: '#2563eb',
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

      // Build entity list — use members or houses depending on first active week's amountType
      const active = allWeeks.find((w) => w.status === 'active') || allWeeks[0];
      const useMember = !active || active.amountType === 'per_member';
      const list = useMember
        ? (membersRes.data?.data || []).map((m: any) => ({ _id: m._id, label: `${m.firstName} ${m.lastName || ''}`.trim() }))
        : (housesRes.data?.data || []).map((h: any) => ({ _id: h._id, label: h.familyName }));
      setEntities(list);
      setEntityIdSet(new Set(list.map((e: Entity) => e._id)));

      // Auto-expand active week
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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (weeks.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No Sthothrakazhcha weeks found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
      >
        {weeks.map((week) => {
          const mine = myContributions(week);
          const pending = mine.filter((c) => c.approvalStatus === 'pending_approval');
          const approved = mine.filter((c) => c.approvalStatus === 'approved');
          const entered = mine.filter((c) => c.approvalStatus !== 'rejected');
          const total = entered.reduce((s, c) => s + c.amount, 0);
          const isExpanded = expandedId === week._id;
          const statusColor = WEEK_STATUS_COLOR[week.status] || '#6b7280';

          return (
            <View key={week._id} style={styles.card}>
              {/* Week header — tap to expand */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(isExpanded ? null : week._id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.headerRow}>
                    <Text style={styles.weekLabel}>Week {week.weekNumber}, {week.year}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {week.status.charAt(0).toUpperCase() + week.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.totalText}>
                    ₹{total.toLocaleString('en-IN')} · {entered.length} entered · {pending.length} pending · {approved.length} approved
                  </Text>
                </View>
                <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardBody}>
                  {mine.length === 0 ? (
                    <Text style={styles.emptySmall}>No contributions marked yet</Text>
                  ) : (
                    mine.map((c) => {
                      const s = STATUS_STYLE[c.approvalStatus] || STATUS_STYLE.approved;
                      return (
                        <View key={c._id} style={styles.entryRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.entryName}>{entityLabel(c.contributorId)}</Text>
                            <Text style={styles.entryAmt}>₹{c.amount.toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={[styles.badge, { backgroundColor: s.bg }]}>
                            <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                          </View>
                        </View>
                      );
                    })
                  )}

                  <View style={styles.actionRow}>
                    {pending.length > 0 && (
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={() => setSubmitTarget(week)}
                      >
                        <Text style={styles.submitBtnText}>Submit Cash ({pending.length})</Text>
                      </TouchableOpacity>
                    )}
                    {week.status === 'active' && (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setAddTarget(week)}
                      >
                        <Text style={styles.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Mark contribution modal */}
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

      {/* Submit cash confirmation modal */}
      {submitTarget && (() => {
        const mine = myContributions(submitTarget);
        const pending = mine.filter((c) => c.approvalStatus === 'pending_approval');
        const pendingTotal = pending.reduce((s, c) => s + c.amount, 0);
        return (
          <Modal visible animationType="fade" transparent onRequestClose={() => setSubmitTarget(null)}>
            <View style={styles.overlay}>
              <View style={styles.confirmSheet}>
                <Text style={styles.confirmTitle}>Submit Cash to Church Admin</Text>
                <Text style={styles.confirmBody}>
                  Week {submitTarget.weekNumber}, {submitTarget.year} — please hand over{' '}
                  <Text style={styles.confirmAmount}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
                  {' '}to the Church Admin.
                </Text>
                <Text style={styles.confirmBody}>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#9ca3af', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  weekLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusPill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },
  totalText: { fontSize: 12, color: '#6b7280' },
  chevron: { fontSize: 12, color: '#9ca3af', marginLeft: 8 },

  cardBody: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingHorizontal: 16, paddingBottom: 12 },
  emptySmall: { color: '#9ca3af', fontSize: 13, paddingVertical: 12 },

  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  entryName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  entryAmt: { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 1 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  submitBtn: {
    borderWidth: 2, borderColor: '#ea580c', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  submitBtnText: { color: '#ea580c', fontWeight: '700', fontSize: 13 },
  addBtn: {
    backgroundColor: '#ea580c', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  confirmSheet: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  confirmBody: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
  confirmAmount: { fontWeight: '700', color: '#ea580c' },
  confirmList: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  confirmName: { fontSize: 14, color: '#374151' },
  confirmAmt: { fontSize: 14, fontWeight: '600', color: '#111827' },
  confirmClose: {
    marginTop: 20, backgroundColor: '#ea580c', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  confirmCloseText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
