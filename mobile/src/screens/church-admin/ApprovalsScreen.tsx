import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, Alert, TextInput, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
const COLOR = '#059669';

export default function ChurchAdminApprovalsScreen() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [bkGroups, setBkGroups] = useState<BkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [editModal, setEditModal] = useState<{ contributorSubId: string; stothrakazhchaId: string; current: number } | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      const response = await api.get('/approvals/pending');
      setActivities(response.data?.data?.spiritualActivities || []);
      const contributions: PendingContribution[] = response.data?.data?.stothrakazhchaContributions || [];
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

  useEffect(() => { fetchPending(); }, [fetchPending]);

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
    if (!value || value <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
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
    if (!group.bkId) { Alert.alert('Error', 'Cannot identify bavanakutayima'); return; }
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
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  const totalPending = activities.length + bkGroups.reduce((s, g) => s + g.entries.length, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} tintColor={COLOR} />}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Pending Approvals</Text>
          <Text style={styles.bannerSub}>
            {totalPending} item{totalPending !== 1 ? 's' : ''} awaiting review
          </Text>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons name="checkmark-done-outline" size={28} color="#fff" />
        </View>
      </View>

      {/* Spiritual Activities */}
      <Text style={styles.sectionLabel}>SPIRITUAL ACTIVITIES ({activities.length})</Text>
      {activities.length === 0 ? (
        <View style={styles.emptySection}>
          <Ionicons name="leaf-outline" size={22} color="#d1d5db" />
          <Text style={styles.emptyText}>No pending activities</Text>
        </View>
      ) : (
        activities.map((a) => (
          <View key={a._id} style={styles.actCard}>
            <View style={styles.actIconWrap}>
              <Ionicons name="leaf-outline" size={18} color={COLOR} />
            </View>
            <View style={styles.actBody}>
              <Text style={styles.actName}>
                {a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : 'Unknown'}
              </Text>
              <Text style={styles.actType}>{a.activityType.replace(/_/g, ' ')}</Text>
              <Text style={styles.actMeta}>
                Marked by {a.markedBy?.username || a.markedBy?.email || 'unknown'}
              </Text>
            </View>
            <View style={styles.actActions}>
              <TouchableOpacity
                style={styles.rejectBtn}
                disabled={actingId === a._id}
                onPress={() => decideActivity(a._id, 'reject')}
              >
                <Ionicons name="close" size={16} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveBtn, actingId === a._id && { opacity: 0.6 }]}
                disabled={actingId === a._id}
                onPress={() => decideActivity(a._id, 'approve')}
              >
                {actingId === a._id
                  ? <ActivityIndicator size="small" color="#fff" />
                  : (
                    <>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Stothrakazhcha by BK group */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
        STOTHRAKAZHCHA ({bkGroups.reduce((s, g) => s + g.entries.length, 0)})
      </Text>
      {bkGroups.length === 0 ? (
        <View style={styles.emptySection}>
          <Ionicons name="star-outline" size={22} color="#d1d5db" />
          <Text style={styles.emptyText}>No pending contributions</Text>
        </View>
      ) : (
        bkGroups.map((group) => {
          const total = group.entries.reduce((s, e) => s + e.contributor.amount, 0);
          const isActing = actingId === `group_${group.bkId}`;
          return (
            <View key={`${group.stothrakazhchaId}_${group.bkId}`} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIconWrap}>
                  <Ionicons name="people-outline" size={18} color={COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupName}>{group.bkName}</Text>
                  <Text style={styles.groupMeta}>
                    Week {group.weekNumber}, {group.year} · {group.entries.length} entries · ₹{total.toLocaleString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.approveAllBtn, isActing && { opacity: 0.6 }]}
                  disabled={isActing}
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
              </View>
              {group.entries.map((entry) => (
                <View key={entry.contributor._id} style={styles.entryRow}>
                  <Text style={styles.entryName}>{entry.contributorName}</Text>
                  <TouchableOpacity
                    style={styles.amountPill}
                    onPress={() => openEditModal(entry.stothrakazhchaId, entry.contributor._id, entry.contributor.amount)}
                  >
                    <Text style={styles.amountText}>₹{entry.contributor.amount.toLocaleString('en-IN')}</Text>
                    <Ionicons name="create-outline" size={12} color={COLOR} style={{ marginLeft: 4 }} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 20, padding: 20, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  emptySection: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
  },
  emptyText: { color: '#9ca3af', fontSize: 13 },

  // Activity card
  actCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: '#059669',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  actIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  actBody: { flex: 1 },
  actName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  actType: { fontSize: 12, color: '#059669', fontWeight: '600', textTransform: 'capitalize', marginBottom: 2 },
  actMeta: { fontSize: 11, color: '#9ca3af' },
  actActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rejectBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca',
    justifyContent: 'center', alignItems: 'center',
  },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#059669', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    minWidth: 80, justifyContent: 'center',
  },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

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
  entryName: { fontSize: 14, color: '#374151', fontWeight: '500' },
  amountPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: '#bbf7d0',
  },
  amountText: { fontSize: 14, fontWeight: '700', color: '#059669' },

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
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalSave: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12, backgroundColor: '#059669',
  },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
