import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, Alert, TextInput, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Week {
  _id: string;
  weekNumber: number;
  year: number;
  status: 'active' | 'closed' | 'processed';
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  totalCollected: number;
  totalContributors: number;
}

interface BkEntry {
  _id: string;
  contributorType: 'Member' | 'House';
  amount: number;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
  contributorName: string;
}

interface BkGroup {
  bavanakutayimaId: string | null;
  bavanakutayimaName: string;
  entries: BkEntry[];
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface WeekDetail extends Week {
  groups: BkGroup[];
}

const api = createRoleApi('church_admin');
const COLOR = '#059669';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  active:    { color: '#059669', bg: '#f0fdf4', icon: 'radio-button-on-outline' },
  closed:    { color: '#6b7280', bg: '#f9fafb', icon: 'lock-closed-outline' },
  processed: { color: '#2563eb', bg: '#eff6ff', icon: 'checkmark-circle-outline' },
};

const ENTRY_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  pending_approval: { color: '#d97706', bg: '#fffbeb', label: 'Pending' },
  approved:         { color: '#059669', bg: '#f0fdf4', label: 'Approved' },
  rejected:         { color: '#dc2626', bg: '#fef2f2', label: 'Rejected' },
};

export default function ChurchAdminStothrakazhchaScreen() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [editModal, setEditModal] = useState<{
    stothrakazhchaId: string; contributorSubId: string; current: number;
  } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const fetchWeeks = useCallback(async () => {
    try {
      const res = await api.get('/stothrakazhcha');
      const list: Week[] = (res.data?.data || []).sort(
        (a: Week, b: Week) => b.year - a.year || b.weekNumber - a.weekNumber
      );
      setWeeks(list);
    } catch {
      setWeeks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchWeeks(); }, [fetchWeeks]);

  const openWeek = async (week: Week) => {
    setDetailLoading(true);
    setSelectedWeek(null);
    try {
      const res = await api.get(`/stothrakazhcha/${week._id}/by-bavanakutayima`);
      setSelectedWeek(res.data?.data || null);
    } catch {
      Alert.alert('Error', 'Failed to load week details');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedWeek) return;
    try {
      const res = await api.get(`/stothrakazhcha/${selectedWeek._id}/by-bavanakutayima`);
      setSelectedWeek(res.data?.data || null);
    } catch {}
  };

  const openEditModal = (stothrakazhchaId: string, contributorSubId: string, current: number) => {
    setEditModal({ stothrakazhchaId, contributorSubId, current });
    setEditAmount(String(current));
  };

  const saveAmount = async () => {
    if (!editModal) return;
    const value = Number(editAmount);
    if (!value || value <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    try {
      await api.put(
        `/approvals/stothrakazhcha/${editModal.stothrakazhchaId}/contributors/${editModal.contributorSubId}`,
        { amount: value }
      );
      setEditModal(null);
      refreshDetail();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update amount');
    }
  };

  const approveGroup = (group: BkGroup) => {
    if (!selectedWeek || !group.bavanakutayimaId) return;
    Alert.alert(
      'Approve All',
      `Approve ${group.pendingCount} pending contribution(s) for ${group.bavanakutayimaName}?\n\nTotal: ₹${group.totalAmount.toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: () => {
            setActingId(`group_${group.bavanakutayimaId}`);
            api
              .post(`/approvals/stothrakazhcha/${selectedWeek._id}/bavanakutayima/${group.bavanakutayimaId}/approve-all`, {})
              .then(refreshDetail)
              .catch((e) => Alert.alert('Error', e.response?.data?.error || 'Failed to approve'))
              .finally(() => setActingId(null));
          },
        },
      ]
    );
  };

  // ---- Week list view ----
  if (!selectedWeek && !detailLoading) {
    if (loading) {
      return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWeeks(); }} tintColor={COLOR} />}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Stothrakazhcha</Text>
            <Text style={styles.bannerSub}>{weeks.length} week{weeks.length !== 1 ? 's' : ''} recorded</Text>
          </View>
          <View style={styles.bannerIcon}>
            <Ionicons name="star-outline" size={28} color="#fff" />
          </View>
        </View>

        {weeks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="star-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No weeks yet</Text>
            <Text style={styles.emptySub}>Stothrakazhcha weeks will appear here</Text>
          </View>
        ) : (
          weeks.map((w) => {
            const sc = STATUS_CONFIG[w.status] || STATUS_CONFIG.closed;
            return (
              <TouchableOpacity
                key={w._id}
                style={styles.weekCard}
                onPress={() => openWeek(w)}
                activeOpacity={0.7}
              >
                <View style={styles.weekLeft}>
                  <Text style={styles.weekNum}>W{w.weekNumber}</Text>
                  <Text style={styles.weekYear}>{w.year}</Text>
                </View>
                <View style={styles.weekBody}>
                  <View style={styles.weekTopRow}>
                    <Text style={styles.weekTitle}>Week {w.weekNumber}, {w.year}</Text>
                    <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon} size={10} color={sc.color} />
                      <Text style={[styles.statusText, { color: sc.color }]}>
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.weekMeta}>
                    ₹{w.totalCollected.toLocaleString('en-IN')} · {w.totalContributors} contributors
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    );
  }

  // ---- Loading detail ----
  if (detailLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLOR} />
        <Text style={styles.loadingText}>Loading week details...</Text>
      </View>
    );
  }

  // ---- Detail view ----
  const week = selectedWeek!;
  const totalPending = week.groups.reduce((s, g) => s + g.pendingCount, 0);
  const totalApproved = week.groups.reduce((s, g) => s + g.approvedCount, 0);
  const totalAmt = week.groups.reduce((s, g) => s + g.totalAmount, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedWeek(null)}>
          <Ionicons name="chevron-back" size={18} color={COLOR} />
          <Text style={styles.backText}>All Weeks</Text>
        </TouchableOpacity>

        {/* Week summary banner */}
        <View style={styles.banner}>
          <View style={styles.bannerWeekBox}>
            <Text style={styles.bannerWeekNum}>W{week.weekNumber}</Text>
            <Text style={styles.bannerWeekYear}>{week.year}</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTotal}>₹{totalAmt.toLocaleString('en-IN')}</Text>
            <View style={styles.bannerStats}>
              <View style={styles.bannerStat}>
                <Text style={styles.bannerStatNum}>{totalPending}</Text>
                <Text style={styles.bannerStatLabel}>pending</Text>
              </View>
              <View style={styles.bannerStat}>
                <Text style={styles.bannerStatNum}>{totalApproved}</Text>
                <Text style={styles.bannerStatLabel}>approved</Text>
              </View>
              <View style={styles.bannerStat}>
                <Text style={styles.bannerStatNum}>{week.groups.length}</Text>
                <Text style={styles.bannerStatLabel}>groups</Text>
              </View>
            </View>
          </View>
        </View>

        {week.groups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Ionicons name="people-outline" size={36} color={COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No contributions yet</Text>
            <Text style={styles.emptySub}>Contributions will appear here once submitted</Text>
          </View>
        ) : (
          week.groups.map((group) => {
            const isActing = actingId === `group_${group.bavanakutayimaId}`;
            const hasPending = group.pendingCount > 0;
            return (
              <View key={group.bavanakutayimaId || 'unknown'} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupIconWrap}>
                    <Ionicons name="people-outline" size={18} color={COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{group.bavanakutayimaName}</Text>
                    <Text style={styles.groupMeta}>
                      ₹{group.totalAmount.toLocaleString('en-IN')} · {group.pendingCount} pending · {group.approvedCount} approved
                    </Text>
                  </View>
                  {hasPending && (
                    <TouchableOpacity
                      style={[styles.approveAllBtn, isActing && { opacity: 0.6 }]}
                      disabled={isActing || !group.bavanakutayimaId}
                      onPress={() => approveGroup(group)}
                    >
                      {isActing
                        ? <ActivityIndicator size="small" color="#fff" />
                        : (
                          <>
                            <Ionicons name="checkmark-done" size={13} color="#fff" />
                            <Text style={styles.approveAllText}>Approve All</Text>
                          </>
                        )
                      }
                    </TouchableOpacity>
                  )}
                </View>

                {group.entries.map((entry) => {
                  const es = ENTRY_STATUS[entry.approvalStatus] || ENTRY_STATUS.approved;
                  const isPending = entry.approvalStatus === 'pending_approval';
                  return (
                    <View key={entry._id} style={styles.entryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryName}>{entry.contributorName}</Text>
                        <View style={[styles.entryStatusPill, { backgroundColor: es.bg }]}>
                          <Text style={[styles.entryStatusText, { color: es.color }]}>{es.label}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.amountPill, !isPending && { opacity: 0.6 }]}
                        onPress={() => isPending && openEditModal(week._id, entry._id, entry.amount)}
                        disabled={!isPending}
                      >
                        <Text style={styles.amountText}>₹{entry.amount.toLocaleString('en-IN')}</Text>
                        {isPending && <Ionicons name="create-outline" size={12} color={COLOR} style={{ marginLeft: 4 }} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit amount modal */}
      <Modal visible={!!editModal} animationType="fade" transparent onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={20} color={COLOR} />
              <Text style={styles.modalTitle}>Edit Amount</Text>
            </View>
            <Text style={styles.modalCurrent}>Current: ₹{editModal?.current.toLocaleString('en-IN')}</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>₹</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="New amount"
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveAmount}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14 },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bannerWeekBox: { alignItems: 'center', marginRight: 16 },
  bannerWeekNum: { fontSize: 32, fontWeight: '800', color: '#fff' },
  bannerWeekYear: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.25)', marginRight: 16 },
  bannerTotal: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  bannerStats: { flexDirection: 'row', gap: 8 },
  bannerStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 6, alignItems: 'center' },
  bannerStatNum: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bannerStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 1 },

  // Week list cards
  weekCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  weekLeft: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center',
  },
  weekNum: { fontSize: 14, fontWeight: '800', color: '#059669' },
  weekYear: { fontSize: 10, color: '#6b7280' },
  weekBody: { flex: 1 },
  weekTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  weekTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  weekMeta: { fontSize: 12, color: '#6b7280' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Back button
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14 },
  backText: { fontSize: 15, color: '#059669', fontWeight: '600' },

  // BK group card
  groupCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: '#f0fdf4',
    borderBottomWidth: 1, borderBottomColor: '#dcfce7',
  },
  groupIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  groupName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  groupMeta: { fontSize: 11, color: '#6b7280' },
  approveAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#059669', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 10,
  },
  approveAllText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  entryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  entryName: { fontSize: 14, color: '#374151', fontWeight: '500', marginBottom: 4 },
  entryStatusPill: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  entryStatusText: { fontSize: 10, fontWeight: '600' },
  amountPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#bbf7d0',
  },
  amountText: { fontSize: 14, fontWeight: '700', color: '#059669' },

  // Empty state
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  // Edit modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalSheet: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
    }),
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  modalCurrent: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    paddingHorizontal: 14, marginBottom: 20,
  },
  modalCurrency: { fontSize: 20, fontWeight: '700', color: '#059669', marginRight: 6 },
  modalInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', paddingVertical: 12 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalSave: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#059669' },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
