import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SectionList } from 'react-native';
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
  holy_masses: 'Holy Masses',
  feast_day_rites: 'Feast Day Rites',
  blessings: 'Blessings',
  deceased_rites: 'Rites for the Deceased',
  other_rites: 'Other Sacred Rites',
};
const CATEGORY_ORDER = ['holy_masses', 'feast_day_rites', 'blessings', 'deceased_rites', 'other_rites'];

const api = createRoleApi('church_admin');

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

  useEffect(() => {
    fetchRites();
  }, [fetchRites]);

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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (rites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No rites configured yet for your church.</Text>
        <TouchableOpacity style={styles.seedButton} onPress={handleSeed} disabled={seeding}>
          <Text style={styles.seedText}>{seeding ? 'Seeding...' : 'Seed Default Rites'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sections = CATEGORY_ORDER.map((category) => ({
    title: CATEGORY_LABELS[category],
    data: rites.filter((r) => r.category === category).sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.nameEnglish}</Text>
              <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
              <Text style={item.splitConfigured ? styles.configured : styles.unconfigured}>
                {item.splitConfigured ? 'Split configured' : 'Split not set'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setSplitTarget(item)}>
                <Text style={styles.actionText}>Split</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.payButton]} onPress={() => setPaymentTarget(item)}>
                <Text style={styles.payButtonText}>Record</Text>
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#9ca3af', marginBottom: 16, textAlign: 'center' },
  seedButton: { backgroundColor: '#059669', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  seedText: { color: '#fff', fontWeight: '600' },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#059669', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  row: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '600', color: '#111827' },
  amount: { fontSize: 13, color: '#374151', marginTop: 2 },
  configured: { fontSize: 11, color: '#059669', marginTop: 2 },
  unconfigured: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  actions: { gap: 6 },
  actionButton: { backgroundColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  payButton: { backgroundColor: '#059669' },
  actionText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  payButtonText: { fontSize: 11, fontWeight: '600', color: '#fff' },
});
