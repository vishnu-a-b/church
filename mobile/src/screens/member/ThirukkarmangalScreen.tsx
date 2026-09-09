import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';

interface Rite {
  nameMalayalam: string;
  nameEnglish: string;
  code: string;
  category: string;
  amount: number;
}

interface Booking {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  riteId: Rite | null;
}

const api = createRoleApi('member');
const COLOR = '#059669';

const PAYMENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  cash:          'cash-outline',
  bank_transfer: 'swap-horizontal-outline',
  upi:           'phone-portrait-outline',
  cheque:        'document-text-outline',
};

function BookingCard({ item }: { item: Booking }) {
  const d = new Date(item.paymentDate);
  const icon = PAYMENT_ICON[item.paymentMethod] ?? 'receipt-outline';
  const riteName = item.riteId?.nameEnglish ?? 'Sacred Rite';

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.riteIcon}>
            <Ionicons name="flame-outline" size={16} color={COLOR} />
          </View>
          <View style={styles.cardMain}>
            <Text style={styles.riteName}>{riteName}</Text>
            {item.riteId?.nameMalayalam ? (
              <Text style={styles.riteNameML}>{item.riteId.nameMalayalam}</Text>
            ) : null}
          </View>
          <Text style={styles.amount}>₹{item.totalAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name={icon} size={11} color="#9ca3af" />
            <Text style={styles.metaText}>{item.paymentMethod.replace(/_/g, ' ')}</Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>
            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.receipt}>{item.receiptNumber}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MemberThirukkarmangalScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/members/me/thirukkarmangal');
      setBookings(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(b) => b._id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor={COLOR} />
      }
      ListHeaderComponent={
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerLabel}>Total Paid</Text>
            <Text style={styles.bannerAmount}>₹{total.toLocaleString()}</Text>
            <Text style={styles.bannerSub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.bannerIcon}>
            <Ionicons name="flame-outline" size={28} color="#fff" />
          </View>
        </View>
      }
      renderItem={({ item }) => <BookingCard item={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="flame-outline" size={36} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>Your Thirukkarmangal bookings will appear here</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLOR, borderRadius: 20, padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: COLOR, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 8 },
    }),
  },
  bannerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  bannerAmount: { fontSize: 28, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardAccent: { width: 4, backgroundColor: COLOR },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  riteIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  cardMain: { flex: 1 },
  riteName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  riteNameML: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800', color: COLOR },

  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' },
  metaDot: { fontSize: 11, color: '#d1d5db' },
  receipt: { fontSize: 11, color: '#9ca3af' },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },
});
