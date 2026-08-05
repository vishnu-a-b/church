import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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
          label: week.amountType === 'per_member' ? `${e.firstName} ${e.lastName}` : e.familyName,
        }))
      );
    } catch (error) {
      setCurrent(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentWeek();
  }, [fetchCurrentWeek]);

  const entityLabel = (contributorId: string) => entities.find((e) => e._id === contributorId)?.label || contributorId;

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Week {current.weekNumber}, {current.year}</Text>
      </View>

      <DataList
        data={current.contributors || []}
        loading={false}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); fetchCurrentWeek(); }}
        keyExtractor={(c) => c._id}
        emptyText="No contributions marked yet"
        renderItem={(c) => {
          const status = STATUS_STYLE[c.approvalStatus] || STATUS_STYLE.approved;
          return (
            <View style={styles.rowTop}>
              <View>
                <Text style={styles.name}>{entityLabel(c.contributorId)}</Text>
                <Text style={styles.meta}>₹{c.amount.toLocaleString()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <MarkContributionModal
        visible={modalVisible}
        stothrakazhchaId={current._id}
        amountType={current.amountType}
        defaultAmount={current.defaultAmount}
        entities={entities}
        onClose={() => setModalVisible(false)}
        onSaved={fetchCurrentWeek}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#9ca3af', textAlign: 'center' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
