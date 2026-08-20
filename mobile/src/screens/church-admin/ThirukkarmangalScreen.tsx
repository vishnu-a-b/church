import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SectionList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createRoleApi } from '../../lib/api';
import SplitEditorModal from './SplitEditorModal';
import RecordRitePaymentModal from './RecordRitePaymentModal';

interface Rite {
  _id: string;
  category: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  sortOrder: number;
  splitConfigured: boolean;
  split: Array<{ recipientLabel: string; percent: number }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  holy_masses:    'Holy Masses',
  feast_day_rites: 'Feast Day Rites',
  blessings:      'Blessings',
  deceased_rites: 'Rites for the Deceased',
  other_rites:    'Other Sacred Rites',
};
const CATEGORY_ORDER = ['holy_masses', 'feast_day_rites', 'blessings', 'deceased_rites', 'other_rites'];
const CATEGORY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  holy_masses:     'flame-outline',
  feast_day_rites: 'sunny-outline',
  blessings:       'heart-outline',
  deceased_rites:  'flower-outline',
  other_rites:     'star-outline',
};

const api = createRoleApi('church_admin');
const COLOR = '#059669';

export default function ChurchAdminThirukkarmangalScreen() {
  const [rites, setRites] = useState<Rite[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [splitTarget, setSplitTarget] = useState<Rite | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<Rite | null>(null);

  const fetchRites = useCallback(async () => {
    try {
      const response = await api.get('/thirukkarmangal/rites');
      setRites(response.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRites(); }, [fetchRites]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/thirukkarmangal/rites/seed-defaults', {});
      fetchRites();
    } catch (error) {
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLOR} /></View>;
  }

  if (rites.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyCircle}>
          <Ionicons name="flame-outline" size={36} color={COLOR} />
        </View>
        <Text style={styles.emptyTitle}>No rites configured</Text>
        <Text style={styles.emptySub}>Seed the default rites to get started</Text>
        <TouchableOpacity style={styles.seedButton} onPress={handleSeed} disabled={seeding}>
          {seeding
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="download-outline" size={16} color="#fff" /><Text style={styles.seedText}>Seed Default Rites</Text></>
          }
        </TouchableOpacity>
      </View>
    );
  }

  const sections = CATEGORY_ORDER.map((category) => ({
    title: CATEGORY_LABELS[category],
    icon: CATEGORY_ICON[category] ?? 'star-outline',
    data: rites.filter((r) => r.category === category).sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={14} color={COLOR} />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{item.nameEnglish}</Text>
                <Text style={styles.cardAmount}>₹{item.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.cardBottomRow}>
                <View style={[styles.splitPill, { backgroundColor: item.splitConfigured ? '#f0fdf4' : '#f9fafb' }]}>
                  <Ionicons
                    name={item.splitConfigured ? 'checkmark-circle' : 'ellipse-outline'}
                    size={12}
                    color={item.splitConfigured ? COLOR : '#9ca3af'}
                  />
                  <Text style={[styles.splitText, { color: item.splitConfigured ? COLOR : '#9ca3af' }]}>
                    {item.splitConfigured ? 'Split configured' : 'Split not set'}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.splitBtn} onPress={() => setSplitTarget(item)}>
                    <Ionicons name="git-branch-outline" size={13} color="#374151" />
                    <Text style={styles.splitBtnText}>Split</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recordBtn} onPress={() => setPaymentTarget(item)}>
                    <Ionicons name="add" size={13} color="#fff" />
                    <Text style={styles.recordBtnText}>Record</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      <SplitEditorModal visible={!!splitTarget} rite={splitTarget} onClose={() => setSplitTarget(null)} onSaved={fetchRites} />
      <RecordRitePaymentModal visible={!!paymentTarget} rite={paymentTarget} onClose={() => setPaymentTarget(null)} onSaved={fetchRites} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  list: { padding: 16, paddingBottom: 40 },

  emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  seedButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#059669', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginTop: 8,
  },
  seedText: { color: '#fff', fontWeight: '700' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardAccent: { width: 4, backgroundColor: '#059669' },
  cardBody: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  cardAmount: { fontSize: 15, fontWeight: '800', color: '#059669' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  splitPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  splitText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  splitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  splitBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  recordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#059669', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
  },
  recordBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
});
