import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { createRoleApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

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
  totalCollected?: number;
  contributors: Contributor[];
}

const api = createRoleApi('member');

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
  approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

export default function MemberStothrakazhchaScreen() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<CurrentWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCurrentWeek = useCallback(async () => {
    try {
      const response = await api.get('/stothrakazhcha/current/week');
      setCurrent(response.data?.data || null);
    } catch {
      setCurrent(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCurrentWeek(); }, [fetchCurrentWeek]);

  const myContribution = current?.contributors?.find(
    (c) => c.contributorType === 'Member' && c.contributorId === (user as any)?._id
  );

  const totalCollected = current?.totalCollected
    ?? current?.contributors?.filter((c) => c.approvalStatus === 'approved').reduce((s, c) => s + c.amount, 0)
    ?? 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No active Stothrakazhcha for this week</Text>
      </View>
    );
  }

  const status = myContribution ? STATUS_STYLE[myContribution.approvalStatus] || STATUS_STYLE.approved : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCurrentWeek(); }} />}
    >
      <View style={styles.card}>
        <Text style={styles.weekLabel}>Week {current.weekNumber}, {current.year}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{current.defaultAmount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Amount</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{totalCollected.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Collected</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{current.contributors?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Contributors</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, myContribution ? styles.cardContributed : styles.cardPending]}>
        {myContribution ? (
          <>
            <Text style={styles.contributedTitle}>Your Contribution</Text>
            <Text style={styles.contributedAmount}>₹{myContribution.amount.toLocaleString()}</Text>
            {status && (
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.notYetText}>You have not contributed this week</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#9ca3af', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  weekLabel: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#059669' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  divider: { width: 1, height: 32, backgroundColor: '#f3f4f6' },
  cardContributed: { borderColor: '#bbf7d0' },
  cardPending: { borderColor: '#fecaca' },
  contributedTitle: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 4 },
  contributedAmount: { fontSize: 22, fontWeight: '700', color: '#059669', marginBottom: 10 },
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  notYetText: { color: '#6b7280', textAlign: 'center', paddingVertical: 4 },
});
