import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { createRoleApi } from '../../lib/api';

interface SpiritualActivity {
  _id: string;
  activityType: string;
  memberId: { firstName: string; lastName: string } | null;
  markedBy: { username: string; email: string } | null;
  createdAt: string;
}

interface StothrakazhchaContribution {
  stothrakazhchaId: string;
  weekNumber: number;
  year: number;
  contributor: {
    _id: string;
    contributorType: 'Member' | 'House';
    amount: number;
    contributedAt: string;
  };
}

const api = createRoleApi('church_admin');

export default function ChurchAdminApprovalsScreen() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [contributions, setContributions] = useState<StothrakazhchaContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const response = await api.get('/approvals/pending');
      setActivities(response.data?.data?.spiritualActivities || []);
      setContributions(response.data?.data?.stothrakazhchaContributions || []);
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

  const decideContribution = (stothrakazhchaId: string, contributorId: string, decision: 'approve' | 'reject') => {
    setActingId(contributorId);
    api
      .post(`/approvals/stothrakazhcha/${stothrakazhchaId}/contributors/${contributorId}/${decision}`, {})
      .then(fetchPending)
      .catch((e) => Alert.alert('Error', e.response?.data?.error || `Failed to ${decision}`))
      .finally(() => setActingId(null));
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
                style={[styles.actionButton, styles.approveButton]}
                disabled={actingId === a._id}
                onPress={() => decideActivity(a._id, 'approve')}
              >
                <Text style={styles.actionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                disabled={actingId === a._id}
                onPress={() => decideActivity(a._id, 'reject')}
              >
                <Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Sthothrakazhcha Contributions ({contributions.length})</Text>
      {contributions.length === 0 ? (
        <Text style={styles.empty}>No pending contributions</Text>
      ) : (
        contributions.map((c) => (
          <View key={c.contributor._id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                Week {c.weekNumber}, {c.year} — ₹{c.contributor.amount.toLocaleString()}
              </Text>
              <Text style={styles.meta}>{c.contributor.contributorType}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                disabled={actingId === c.contributor._id}
                onPress={() => decideContribution(c.stothrakazhchaId, c.contributor._id, 'approve')}
              >
                <Text style={styles.actionText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                disabled={actingId === c.contributor._id}
                onPress={() => decideContribution(c.stothrakazhchaId, c.contributor._id, 'reject')}
              >
                <Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  empty: { color: '#9ca3af', fontSize: 13 },
  row: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  approveButton: { backgroundColor: '#059669' },
  rejectButton: { backgroundColor: '#dc2626' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
