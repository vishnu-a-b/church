import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, Alert, ScrollView,
} from 'react-native';
import { DataList } from '../../components/DataList';
import { createRoleApi } from '../../lib/api';
import MarkContributionModal from './MarkContributionModal';

interface Contributor {
  _id: string;
  contributorId: string;
  contributorType: 'Member' | 'House';
  amount: number;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
}

interface CurrentWeek {
  _id: string;
  weekNumber: number;
  year: number;
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  contributors: Contributor[];
}

interface Entity { _id: string; label: string; }

const api = createRoleApi('kudumbakutayima_admin');

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

export default function KutayimaAdminStothrakazhchaScreen() {
  const [current, setCurrent] = useState<CurrentWeek | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

  const fetchCurrentWeek = useCallback(async () => {
    try {
      const response = await api.get('/stothrakazhcha/current/week');
      const week: CurrentWeek = response.data?.data;
      setCurrent(week);

      const entityResponse = await api.get(week.amountType === 'per_member' ? '/members' : '/houses');
      const list = entityResponse.data?.data || [];
      setEntities(
        list.map((e: any) => ({
          _id: e._id,
          label: week.amountType === 'per_member' ? `${e.firstName} ${e.lastName || ''}`.trim() : e.familyName,
        }))
      );
    } catch {
      setCurrent(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentWeek();
  }, [fetchCurrentWeek]);

  // Only show MY group's contributions (those whose contributorId is in my entities)
  const entityIdSet = new Set(entities.map((e) => e._id));
  const myContributions = (current?.contributors || []).filter(
    (c) => entityIdSet.has(c.contributorId)
  );

  const entityLabel = (contributorId: string) =>
    entities.find((e) => e._id === contributorId)?.label || contributorId;

  const totalCollected = myContributions
    .filter((c) => c.approvalStatus !== 'rejected')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingCount = myContributions.filter((c) => c.approvalStatus === 'pending_approval').length;
  const approvedCount = myContributions.filter((c) => c.approvalStatus === 'approved').length;
  const enteredCount = myContributions.filter((c) => c.approvalStatus !== 'rejected').length;
  const totalEntities = entities.length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No active Sthothrakazhcha for the current week</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryWeek}>Week {current.weekNumber}, {current.year}</Text>
        <Text style={styles.summaryTotal}>₹{totalCollected.toLocaleString('en-IN')} collected</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeNum}>{enteredCount}/{totalEntities}</Text>
            <Text style={styles.summaryBadgeLabel}>entered</Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: '#fef9c3' }]}>
            <Text style={[styles.summaryBadgeNum, { color: '#854d0e' }]}>{pendingCount}</Text>
            <Text style={[styles.summaryBadgeLabel, { color: '#92400e' }]}>pending</Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.summaryBadgeNum, { color: '#166534' }]}>{approvedCount}</Text>
            <Text style={[styles.summaryBadgeLabel, { color: '#166534' }]}>approved</Text>
          </View>
        </View>
      </View>

      <DataList
        data={myContributions}
        loading={false}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchCurrentWeek(); }}
        keyExtractor={(c) => c._id}
        emptyText="No contributions marked yet — tap + to add"
        renderItem={(c) => {
          const status = STATUS_STYLE[c.approvalStatus] || STATUS_STYLE.approved;
          return (
            <View style={styles.rowTop}>
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{entityLabel(c.contributorId)}</Text>
                <Text style={styles.meta}>₹{c.amount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Submit Cash button — shown only when there are pending entries */}
      {pendingCount > 0 && (
        <TouchableOpacity style={styles.submitButton} onPress={() => setSubmitModalVisible(true)}>
          <Text style={styles.submitButtonText}>
            Submit Cash to Church Admin ({pendingCount} pending)
          </Text>
        </TouchableOpacity>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Mark contribution modal */}
      <MarkContributionModal
        visible={modalVisible}
        stothrakazhchaId={current._id}
        amountType={current.amountType}
        defaultAmount={current.defaultAmount}
        entities={entities}
        onClose={() => setModalVisible(false)}
        onSaved={fetchCurrentWeek}
      />

      {/* Submit cash confirmation modal */}
      <Modal visible={submitModalVisible} animationType="fade" transparent onRequestClose={() => setSubmitModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Submit Cash to Church Admin</Text>
            <Text style={styles.confirmBody}>
              Please physically hand over{' '}
              <Text style={styles.confirmAmount}>₹{totalCollected.toLocaleString('en-IN')}</Text>
              {' '}to the Church Admin.
            </Text>
            <Text style={styles.confirmBody}>
              Your {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'} will be
              counted only after the church admin reviews and approves them.
            </Text>
            <View style={styles.confirmMemberList}>
              {myContributions
                .filter((c) => c.approvalStatus === 'pending_approval')
                .map((c) => (
                  <View key={c._id} style={styles.confirmMemberRow}>
                    <Text style={styles.confirmMemberName}>{entityLabel(c.contributorId)}</Text>
                    <Text style={styles.confirmMemberAmt}>₹{c.amount.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
            </View>
            <TouchableOpacity
              style={styles.confirmClose}
              onPress={() => setSubmitModalVisible(false)}
            >
              <Text style={styles.confirmCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#9ca3af', textAlign: 'center' },

  summaryCard: {
    backgroundColor: '#ea580c',
    padding: 20,
    margin: 12,
    borderRadius: 14,
  },
  summaryWeek: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  summaryTotal: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryBadge: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    padding: 8, alignItems: 'center',
  },
  summaryBadgeNum: { color: '#fff', fontSize: 18, fontWeight: '700' },
  summaryBadgeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInfo: { flex: 1 },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  submitButton: {
    margin: 12,
    marginBottom: 84,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ea580c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: { color: '#ea580c', fontWeight: '700', fontSize: 15 },

  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  confirmSheet: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  confirmBody: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
  confirmAmount: { fontWeight: '700', color: '#ea580c' },
  confirmMemberList: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  confirmMemberRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  confirmMemberName: { fontSize: 14, color: '#374151' },
  confirmMemberAmt: { fontSize: 14, fontWeight: '600', color: '#111827' },
  confirmClose: {
    marginTop: 20, backgroundColor: '#ea580c', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  confirmCloseText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
