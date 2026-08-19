import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
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

const STATUS_COLOR: Record<string, string> = {
  active: '#059669',
  closed: '#6b7280',
  processed: '#2563eb',
};

export default function ChurchAdminStothrakazhchaScreen() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  // Edit amount modal
  const [editModal, setEditModal] = useState<{
    stothrakazhchaId: string;
    contributorSubId: string;
    current: number;
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
    if (!value || value <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
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
    const total = group.totalAmount;
    Alert.alert(
      'Approve All',
      `Approve ${group.pendingCount} pending contribution(s) for ${group.bavanakutayimaName}?\n\nTotal: ₹${total.toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: () => {
            setActingId(`group_${group.bavanakutayimaId}`);
            api
              .post(
                `/approvals/stothrakazhcha/${selectedWeek._id}/bavanakutayima/${group.bavanakutayimaId}/approve-all`,
                {}
              )
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
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWeeks(); }} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
      >
        <Text style={styles.pageTitle}>Sthothrakazhcha</Text>
        {weeks.length === 0 ? (
          <Text style={styles.emptyText}>No weeks found</Text>
        ) : (
          weeks.map((w) => {
            const sc = STATUS_COLOR[w.status] || '#6b7280';
            return (
              <TouchableOpacity
                key={w._id}
                style={styles.weekCard}
                onPress={() => openWeek(w)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.weekRow}>
                    <Text style={styles.weekTitle}>Week {w.weekNumber}, {w.year}</Text>
                    <View style={[styles.statusPill, { backgroundColor: sc + '20' }]}>
                      <Text style={[styles.statusText, { color: sc }]}>
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.weekMeta}>
                    ₹{w.totalCollected.toLocaleString('en-IN')} collected · {w.totalContributors} contributors
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
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
        <ActivityIndicator size="large" color="#059669" />
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
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        {/* Back + header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedWeek(null)}>
          <Text style={styles.backText}>‹ All Weeks</Text>
        </TouchableOpacity>

        {/* Week summary banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerWeek}>Week {week.weekNumber}, {week.year}</Text>
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

        {week.groups.length === 0 ? (
          <Text style={styles.emptyText}>No contributions recorded yet</Text>
        ) : (
          week.groups.map((group) => {
            const isActing = actingId === `group_${group.bavanakutayimaId}`;
            const hasPending = group.pendingCount > 0;

            return (
              <View key={group.bavanakutayimaId || 'unknown'} style={styles.groupCard}>
                {/* Group header */}
                <View style={styles.groupHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{group.bavanakutayimaName}</Text>
                    <Text style={styles.groupMeta}>
                      ₹{group.totalAmount.toLocaleString('en-IN')} · {group.pendingCount} pending · {group.approvedCount} approved
                    </Text>
                  </View>
                  {hasPending && (
                    <TouchableOpacity
                      style={[styles.approveAllBtn, isActing && styles.disabledBtn]}
                      disabled={isActing || !group.bavanakutayimaId}
                      onPress={() => approveGroup(group)}
                    >
                      {isActing
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.approveAllText}>Approve All</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>

                {/* Per-member rows */}
                {group.entries.map((entry) => (
                  <View key={entry._id} style={styles.entryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryName}>{entry.contributorName}</Text>
                      <View style={[
                        styles.entryStatusPill,
                        entry.approvalStatus === 'approved' && { backgroundColor: '#dcfce7' },
                        entry.approvalStatus === 'rejected' && { backgroundColor: '#fee2e2' },
                        entry.approvalStatus === 'pending_approval' && { backgroundColor: '#fef3c7' },
                      ]}>
                        <Text style={[
                          styles.entryStatusText,
                          entry.approvalStatus === 'approved' && { color: '#166534' },
                          entry.approvalStatus === 'rejected' && { color: '#991b1b' },
                          entry.approvalStatus === 'pending_approval' && { color: '#92400e' },
                        ]}>
                          {entry.approvalStatus === 'pending_approval' ? 'Pending' :
                           entry.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.amountPill}
                      onPress={() => entry.approvalStatus === 'pending_approval' &&
                        openEditModal(week._id, entry._id, entry.amount)}
                      disabled={entry.approvalStatus !== 'pending_approval'}
                    >
                      <Text style={styles.amountText}>₹{entry.amount.toLocaleString('en-IN')}</Text>
                      {entry.approvalStatus === 'pending_approval' && (
                        <Text style={styles.editIcon}> ✎</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit amount modal */}
      <Modal visible={!!editModal} animationType="fade" transparent onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Amount</Text>
            <Text style={styles.modalCurrent}>Current: ₹{editModal?.current.toLocaleString('en-IN')}</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={editAmount}
              onChangeText={setEditAmount}
              placeholder="New amount"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveAmount}>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  emptyText: { color: '#9ca3af', textAlign: 'center', marginTop: 20 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },

  // Week list
  weekCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#e5e7eb', padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  weekTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusPill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },
  weekMeta: { fontSize: 12, color: '#6b7280' },
  chevron: { fontSize: 22, color: '#9ca3af', marginLeft: 8 },

  // Back button
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: '#059669', fontWeight: '600' },

  // Banner
  banner: {
    backgroundColor: '#059669', borderRadius: 14, padding: 20, marginBottom: 16,
  },
  bannerWeek: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  bannerTotal: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 12 },
  bannerStats: { flexDirection: 'row', gap: 8 },
  bannerStat: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    padding: 8, alignItems: 'center',
  },
  bannerStatNum: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bannerStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  // BK group card
  groupCard: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#dcfce7',
  },
  groupName: { fontWeight: '700', color: '#111827', fontSize: 15 },
  groupMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  approveAllBtn: {
    backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 8, minWidth: 96, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  approveAllText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Entry row
  entryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  entryName: { fontSize: 14, color: '#374151', flex: 1, marginBottom: 4 },
  entryStatusPill: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999 },
  entryStatusText: { fontSize: 11, fontWeight: '600' },
  amountPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#bbf7d0',
  },
  amountText: { fontSize: 14, fontWeight: '600', color: '#059669' },
  editIcon: { fontSize: 13, color: '#059669' },

  // Edit modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalSheet: {
    backgroundColor: '#fff', borderRadius: 14, padding: 22,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalCurrent: { fontSize: 13, color: '#6b7280', marginBottom: 14 },
  modalInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    padding: 12, fontSize: 16, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalSave: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#059669' },
  modalSaveText: { color: '#fff', fontWeight: '600' },
});
