import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { createRoleApi } from '../../lib/api';

interface SpiritualActivity {
  _id: string;
  activityType: string;
  memberId: { firstName: string; lastName: string } | null;
  markedBy: { username: string; email: string } | null;
  createdAt: string;
}

interface PendingContribution {
  stothrakazhchaId: string;
  weekNumber: number;
  year: number;
  bavanakutayimaId: string | null;
  bavanakutayimaName: string | null;
  contributorName: string;
  contributor: {
    _id: string;
    contributorType: 'Member' | 'House';
    amount: number;
    contributedAt: string;
  };
}

interface BkGroup {
  bkId: string | null;
  bkName: string;
  stothrakazhchaId: string;
  weekNumber: number;
  year: number;
  entries: PendingContribution[];
}

const api = createRoleApi('church_admin');

export default function ChurchAdminApprovalsScreen() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [bkGroups, setBkGroups] = useState<BkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  // Edit amount state
  const [editModal, setEditModal] = useState<{ contributorSubId: string; stothrakazhchaId: string; current: number } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      const response = await api.get('/approvals/pending');
      setActivities(response.data?.data?.spiritualActivities || []);
      const contributions: PendingContribution[] = response.data?.data?.stothrakazhchaContributions || [];

      // Group by bavanakutayima
      const grouped: Record<string, BkGroup> = {};
      for (const c of contributions) {
        const key = `${c.stothrakazhchaId}__${c.bavanakutayimaId || 'unknown'}`;
        if (!grouped[key]) {
          grouped[key] = {
            bkId: c.bavanakutayimaId,
            bkName: c.bavanakutayimaName || 'Unknown Group',
            stothrakazhchaId: c.stothrakazhchaId,
            weekNumber: c.weekNumber,
            year: c.year,
            entries: [],
          };
        }
        grouped[key].entries.push(c);
      }
      setBkGroups(Object.values(grouped));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const decideActivity = (id: string, decision: 'approve' | 'reject') => {
    setActingId(id);
    api
      .post(`/approvals/spiritual-activities/${id}/${decision}`, {})
      .then(fetchPending)
      .catch((e) => Alert.alert('Error', e.response?.data?.error || `Failed to ${decision}`))
      .finally(() => setActingId(null));
  };

  const openEditModal = (stothrakazhchaId: string, contributorSubId: string, current: number) => {
    setEditModal({ contributorSubId, stothrakazhchaId, current });
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
      fetchPending();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update amount');
    }
  };

  const approveGroup = (group: BkGroup) => {
    if (!group.bkId) {
      Alert.alert('Error', 'Cannot identify bavanakutayima for this group');
      return;
    }
    const total = group.entries.reduce((s, e) => s + e.contributor.amount, 0);
    Alert.alert(
      'Approve All',
      `Approve ${group.entries.length} contribution(s) for ${group.bkName}?\n\nTotal: ₹${total.toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: () => {
            setActingId(`group_${group.bkId}`);
            api
              .post(`/approvals/stothrakazhcha/${group.stothrakazhchaId}/bavanakutayima/${group.bkId}/approve-all`, {})
              .then(fetchPending)
              .catch((e) => Alert.alert('Error', e.response?.data?.error || 'Failed to approve'))
              .finally(() => setActingId(null));
          },
        },
      ]
    );
  };

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} />}
    >
      {/* Spiritual Activities */}
      <Text style={styles.sectionTitle}>Spiritual Activities ({activities.length})</Text>
      {activities.length === 0 ? (
        <Text style={styles.empty}>No pending spiritual activities</Text>
      ) : (
        activities.map((a) => (
          <View key={a._id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : 'Unknown'} — {a.activityType.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.meta}>Marked by {a.markedBy?.username || a.markedBy?.email || 'unknown'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                disabled={actingId === a._id}
                onPress={() => decideActivity(a._id, 'approve')}
              >
                <Text style={styles.actionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                disabled={actingId === a._id}
                onPress={() => decideActivity(a._id, 'reject')}
              >
                <Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Stothrakazhcha by BK group */}
      <Text style={styles.sectionTitle}>
        Sthothrakazhcha Contributions ({bkGroups.reduce((s, g) => s + g.entries.length, 0)})
      </Text>
      {bkGroups.length === 0 ? (
        <Text style={styles.empty}>No pending contributions</Text>
      ) : (
        bkGroups.map((group) => {
          const total = group.entries.reduce((s, e) => s + e.contributor.amount, 0);
          const isActing = actingId === `group_${group.bkId}`;
          return (
            <View key={`${group.stothrakazhchaId}_${group.bkId}`} style={styles.groupCard}>
              {/* Group header */}
              <View style={styles.groupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName}>{group.bkName}</Text>
                  <Text style={styles.groupMeta}>
                    Week {group.weekNumber}, {group.year} · {group.entries.length} entries · ₹{total.toLocaleString('en-IN')} total
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.approveAllBtn, isActing && styles.disabledBtn]}
                  disabled={isActing}
                  onPress={() => approveGroup(group)}
                >
                  {isActing
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.approveAllText}>Approve All</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Per-member rows */}
              {group.entries.map((entry) => (
                <View key={entry.contributor._id} style={styles.entryRow}>
                  <Text style={styles.entryName}>{entry.contributorName}</Text>
                  <TouchableOpacity
                    style={styles.amountPill}
                    onPress={() => openEditModal(entry.stothrakazhchaId, entry.contributor._id, entry.contributor.amount)}
                  >
                    <Text style={styles.amountText}>₹{entry.contributor.amount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.editIcon}> ✎</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })
      )}

      <View style={{ height: 32 }} />

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  empty: { color: '#9ca3af', fontSize: 13 },

  // Spiritual activity row
  row: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center',
  },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  approveBtn: { backgroundColor: '#059669' },
  rejectBtn: { backgroundColor: '#dc2626' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },

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

  // Per-member entry row
  entryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  entryName: { fontSize: 14, color: '#374151', flex: 1 },
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
