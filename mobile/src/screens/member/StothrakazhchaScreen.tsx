import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const STATUS_CONFIG = {
  pending_approval: { label: 'Pending Approval', color: '#d97706', bg: '#fffbeb', icon: 'time-outline'           as const },
  approved:         { label: 'Approved',          color: '#059669', bg: '#f0fdf4', icon: 'checkmark-circle-outline' as const },
  rejected:         { label: 'Rejected',          color: '#dc2626', bg: '#fef2f2', icon: 'close-circle-outline'    as const },
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
    (c) => c.contributorType === 'Member' && c.contributorId === user?.id
  );
  const totalCollected = current?.totalCollected
    ?? current?.contributors?.filter((c) => c.approvalStatus === 'approved').reduce((s, c) => s + c.amount, 0)
    ?? 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyCircle}>
          <Ionicons name="calendar-outline" size={36} color="#059669" />
        </View>
        <Text style={styles.emptyTitle}>No Active Week</Text>
        <Text style={styles.emptySub}>No Stothrakazhcha is active for this week</Text>
      </View>
    );
  }

  const scfg = myContribution ? STATUS_CONFIG[myContribution.approvalStatus] ?? STATUS_CONFIG.approved : null;
  const approvedCount = current.contributors?.filter(c => c.approvalStatus === 'approved').length ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCurrentWeek(); }} tintColor="#059669" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Week banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerWeek}>Week {current.weekNumber}</Text>
          <Text style={styles.bannerYear}>{current.year}</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerRight}>
          <Ionicons name="star-outline" size={28} color="rgba(255,255,255,0.5)" style={{ marginBottom: 4 }} />
          <Text style={styles.bannerLabel}>Stothrakazhcha</Text>
        </View>
      </View>

      {/* Stats tiles */}
      <View style={styles.tilesRow}>
        <View style={styles.tile}>
          <Ionicons name="cash-outline" size={20} color="#059669" />
          <Text style={styles.tileValue}>₹{current.defaultAmount.toLocaleString()}</Text>
          <Text style={styles.tileLabel}>{current.amountType === 'per_member' ? 'Per Member' : 'Per House'}</Text>
        </View>
        <View style={styles.tile}>
          <Ionicons name="wallet-outline" size={20} color="#059669" />
          <Text style={styles.tileValue}>₹{totalCollected.toLocaleString()}</Text>
          <Text style={styles.tileLabel}>Collected</Text>
        </View>
        <View style={styles.tile}>
          <Ionicons name="people-outline" size={20} color="#059669" />
          <Text style={styles.tileValue}>{approvedCount}</Text>
          <Text style={styles.tileLabel}>Contributors</Text>
        </View>
      </View>

      {/* My contribution */}
      <Text style={styles.sectionTitle}>My Contribution</Text>
      {myContribution && scfg ? (
        <View style={[styles.contribCard, { borderTopColor: scfg.color }]}>
          <View style={styles.contribTop}>
            <View style={[styles.contribIconWrap, { backgroundColor: scfg.bg }]}>
              <Ionicons name={scfg.icon} size={22} color={scfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contribAmountLabel}>Amount Contributed</Text>
              <Text style={[styles.contribAmount, { color: scfg.color }]}>
                ₹{myContribution.amount.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: scfg.bg }]}>
            <Text style={[styles.statusText, { color: scfg.color }]}>{scfg.label}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noContribCard}>
          <Ionicons name="alert-circle-outline" size={24} color="#9ca3af" />
          <Text style={styles.noContribText}>You have not contributed this week</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },

  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#059669', borderRadius: 20,
    padding: 20, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#059669', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerLeft: { alignItems: 'center', flex: 1 },
  bannerWeek: { fontSize: 28, fontWeight: '800', color: '#fff' },
  bannerYear: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  bannerDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 16 },
  bannerRight: { flex: 1, alignItems: 'center' },
  bannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },

  tilesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tile: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  tileValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  tileLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  contribCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderTopWidth: 3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  contribTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  contribIconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  contribAmountLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  contribAmount: { fontSize: 26, fontWeight: '800' },
  statusPill: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },

  noContribCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  noContribText: { color: '#6b7280', fontSize: 14, flex: 1 },
});
