import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import { PickerModal, PickerField } from '../../components/PickerModal';
import { DatePickerField, formatDateISO } from '../../components/DatePickerField';

const api = createRoleApi('super_admin');
const COLOR = '#7c3aed';

interface Church { _id: string; name: string; }
interface RiteMaster { _id: string; nameEnglish: string; }
interface Booking {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  splitBreakdown?: Array<{ recipientLabel: string; percent: number; amount: number }>;
  riteId: { nameMalayalam: string; nameEnglish: string; } | null;
  memberId: { firstName: string; lastName: string; uniqueId: string; } | null;
  houseId: { familyName: string; houseCode: string; } | null;
  unitId: { name: string; } | null;
}

const PAYMENT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  cash: 'cash-outline',
  bank_transfer: 'swap-horizontal-outline',
  upi: 'phone-portrait-outline',
  cheque: 'document-text-outline',
};

function BookingCard({ item }: { item: Booking }) {
  const d = new Date(item.paymentDate);
  const icon = PAYMENT_ICON[item.paymentMethod] ?? 'receipt-outline';

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        {/* Rite + Amount */}
        <View style={styles.cardTop}>
          <View style={styles.riteIcon}>
            <Ionicons name="flame-outline" size={16} color={COLOR} />
          </View>
          <View style={styles.cardMain}>
            <Text style={styles.riteName}>{item.riteId?.nameEnglish ?? 'Sacred Rite'}</Text>
            {item.riteId?.nameMalayalam ? (
              <Text style={styles.riteNameML}>{item.riteId.nameMalayalam}</Text>
            ) : null}
          </View>
          <Text style={styles.amount}>₹{item.totalAmount.toLocaleString()}</Text>
        </View>

        {/* Member + House */}
        {(item.memberId || item.houseId) && (
          <View style={styles.memberRow}>
            <Ionicons name="person-outline" size={12} color="#9ca3af" />
            <Text style={styles.memberText} numberOfLines={1}>
              {item.memberId ? `${item.memberId.firstName} ${item.memberId.lastName}` : '—'}
              {item.memberId?.uniqueId ? ` · ${item.memberId.uniqueId}` : ''}
            </Text>
            {item.houseId && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="home-outline" size={12} color="#9ca3af" />
                <Text style={styles.memberText} numberOfLines={1}>{item.houseId.familyName}</Text>
              </>
            )}
          </View>
        )}

        {/* Meta row */}
        <View style={styles.metaRow}>
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

        {/* Split breakdown (collapsed) */}
        {item.splitBreakdown && item.splitBreakdown.length > 0 && (
          <View style={styles.splitRow}>
            {item.splitBreakdown.map((s, i) => (
              <Text key={i} style={styles.splitItem}>
                {s.recipientLabel}: ₹{s.amount}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function SuperAdminThirukkarmangalBookingsScreen() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [rites, setRites] = useState<RiteMaster[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [churchPickerVisible, setChurchPickerVisible] = useState(false);
  const [ritePickerVisible, setRitePickerVisible] = useState(false);

  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [selectedChurchName, setSelectedChurchName] = useState('');
  const [filterRiteId, setFilterRiteId] = useState('');
  const [filterRiteName, setFilterRiteName] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.get('/churches').then((r) => setChurches(r.data?.data || [])).catch(console.error);
  }, []);

  const fetchBookings = useCallback(async (churchId: string, riteId: string, from: Date | null, to: Date | null) => {
    if (!churchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ churchId });
      if (riteId) params.set('riteId', riteId);
      if (from) params.set('from', formatDateISO(from));
      if (to) params.set('to', formatDateISO(to));
      const r = await api.get(`/thirukkarmangal/bookings?${params.toString()}`);
      setBookings(r.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleChurchSelect = async (id: string) => {
    const church = churches.find((c) => c._id === id);
    setSelectedChurchId(id);
    setSelectedChurchName(church?.name || '');
    setFilterRiteId('');
    setFilterRiteName('');
    setFromDate(null);
    setToDate(null);
    setBookings([]);
    // load rites for filter
    try {
      const r = await api.get(`/thirukkarmangal/rites?churchId=${id}`);
      setRites(r.data?.data || []);
    } catch {
      setRites([]);
    }
    fetchBookings(id, '', null, null);
  };

  const handleSearch = () => fetchBookings(selectedChurchId, filterRiteId, fromDate, toDate);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(selectedChurchId, filterRiteId, fromDate, toDate);
  };

  const clearFilters = () => {
    setFilterRiteId('');
    setFilterRiteName('');
    setFromDate(null);
    setToDate(null);
    fetchBookings(selectedChurchId, '', null, null);
  };

  const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const hasFilters = !!(filterRiteId || fromDate || toDate);

  return (
    <View style={styles.container}>
      {/* Church picker bar */}
      <View style={styles.churchBar}>
        <Text style={styles.sectionLabel}>Church</Text>
        <PickerField
          label={selectedChurchName}
          placeholder="Select a church..."
          onPress={() => setChurchPickerVisible(true)}
        />
      </View>

      {!selectedChurchId ? (
        <View style={styles.center}>
          <Ionicons name="business-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Select a church</Text>
          <Text style={styles.emptySub}>Choose a church above to view its bookings</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLOR} />
          }
          ListHeaderComponent={
            <>
              {/* Filters */}
              <View style={styles.filtersCard}>
                <Text style={styles.sectionLabel}>Rite</Text>
                <PickerField
                  label={filterRiteName}
                  placeholder="All rites"
                  onPress={() => setRitePickerVisible(true)}
                />
                <View style={styles.dateRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.sectionLabel}>From</Text>
                    <DatePickerField value={fromDate} onChange={setFromDate} placeholder="Start date" color={COLOR} modalTitle="From Date" />
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.sectionLabel}>To</Text>
                    <DatePickerField value={toDate} onChange={setToDate} placeholder="End date" color={COLOR} modalTitle="To Date" />
                  </View>
                </View>
                <View style={styles.filterActions}>
                  {hasFilters && (
                    <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                      <Ionicons name="close-circle-outline" size={15} color="#6b7280" />
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Ionicons name="search" size={15} color="#fff" />
                    <Text style={styles.searchText}>Search</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Summary banner */}
              {!loading && bookings.length > 0 && (
                <View style={styles.banner}>
                  <View>
                    <Text style={styles.bannerLabel}>Total Collected</Text>
                    <Text style={styles.bannerAmount}>₹{total.toLocaleString()}</Text>
                    <Text style={styles.bannerSub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.bannerIcon}>
                    <Ionicons name="flame-outline" size={28} color="#fff" />
                  </View>
                </View>
              )}

              {loading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLOR} />
                  <Text style={styles.loadingText}>Loading bookings…</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item }) => <BookingCard item={item} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons name="flame-outline" size={36} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No bookings found</Text>
                {hasFilters ? (
                  <TouchableOpacity onPress={clearFilters}>
                    <Text style={styles.emptyLink}>Clear filters</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.emptySub}>No Thirukkarmangal payments have been recorded for this church yet</Text>
                )}
              </View>
            ) : null
          }
        />
      )}

      <PickerModal
        visible={churchPickerVisible}
        title="Select Church"
        options={churches.map((c) => ({ value: c._id, label: c.name }))}
        onSelect={handleChurchSelect}
        onClose={() => setChurchPickerVisible(false)}
      />
      <PickerModal
        visible={ritePickerVisible}
        title="Filter by Rite"
        options={[
          { value: '', label: 'All rites' },
          ...rites.map((r) => ({ value: r._id, label: r.nameEnglish })),
        ]}
        onSelect={(id) => {
          setFilterRiteId(id);
          setFilterRiteName(rites.find((r) => r._id === id)?.nameEnglish || '');
        }}
        onClose={() => setRitePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  churchBar: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  list: { padding: 16, paddingBottom: 40 },

  filtersCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateCol: { flex: 1 },
  filterActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  clearText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLOR, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10,
  },
  searchText: { color: '#fff', fontWeight: '700', fontSize: 13 },

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

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 20 },
  loadingText: { fontSize: 13, color: '#9ca3af' },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardAccent: { width: 4, backgroundColor: COLOR },
  cardBody: { flex: 1, padding: 14 },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  riteIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  cardMain: { flex: 1 },
  riteName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  riteNameML: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  amount: { fontSize: 15, fontWeight: '800', color: COLOR },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  memberText: { fontSize: 12, color: '#4b5563', flex: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' },
  metaDot: { fontSize: 11, color: '#d1d5db' },
  receipt: { fontSize: 11, color: '#9ca3af', fontVariant: ['tabular-nums'] },

  splitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  splitItem: { fontSize: 11, color: '#7c3aed', backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyLink: { fontSize: 13, color: COLOR, fontWeight: '600' },
});
