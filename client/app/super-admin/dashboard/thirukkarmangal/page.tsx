'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { BookOpen, Sparkles, Settings, CheckCircle, AlertTriangle } from 'lucide-react';

interface Church { _id: string; name: string; }
interface Rite {
  _id: string;
  category: string;
  code: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  sortOrder: number;
  splitConfigured: boolean;
  split: Array<{ recipientLabel: string; percent: number }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  holy_masses: 'I. കുർബ്ബാനകൾ — Holy Masses',
  feast_day_rites: 'II. തിരുനാൾ കർമ്മങ്ങൾ — Feast Day Rites',
  blessings: 'III. വെഞ്ചിരിപ്പുകൾ — Blessings',
  deceased_rites: 'IV. പരേതർക്കുവേണ്ടിയുള്ള തിരുക്കർമ്മങ്ങൾ — Rites for the Deceased',
  other_rites: 'V. മറ്റ് തിരുക്കർമ്മങ്ങൾ — Other Sacred Rites',
};
const CATEGORY_ORDER = ['holy_masses', 'feast_day_rites', 'blessings', 'deceased_rites', 'other_rites'];

export default function SuperAdminThirukkarmangalPage() {
  const api = createRoleApi('super_admin');

  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [rites, setRites] = useState<Rite[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/churches').then((r) => setChurches(r.data?.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedChurchId) { setRites([]); return; }
    fetchRites();
  }, [selectedChurchId]);

  const fetchRites = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/thirukkarmangal/rites?churchId=${selectedChurchId}`);
      setRites(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load rites');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const response = await api.post('/thirukkarmangal/rites/seed-defaults', { churchId: selectedChurchId });
      toast.success(response.data?.message || 'Default rites seeded');
      fetchRites();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to seed default rites');
    } finally {
      setSeeding(false);
    }
  };

  const startEdit = (rite: Rite) => {
    setEditingId(rite._id);
    setEditAmount(rite.amount.toString());
  };

  const saveAmount = async (id: string) => {
    const amount = Number(editAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await api.put(`/thirukkarmangal/rites/${id}`, { amount });
      toast.success('Amount updated');
      setEditingId(null);
      fetchRites();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update amount');
    } finally {
      setSaving(false);
    }
  };

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    rites: rites.filter((r) => r.category === category).sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((g) => g.rites.length > 0);

  const configuredCount = rites.filter((r) => r.splitConfigured).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Thirukkarmangal — Master Rate List</h2>
          <p className="text-gray-600">Sacred rites fee schedule and recipient split configuration</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Church</label>
        <select
          value={selectedChurchId}
          onChange={(e) => setSelectedChurchId(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="">Choose a church...</option>
          {churches.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedChurchId && !loading && rites.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No rites configured yet for this church.</p>
          <p className="text-sm text-gray-400 mt-1">Seed the default 23-rite rate list to get started.</p>
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="mt-4 flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            {seeding ? 'Seeding...' : 'Seed Default Rites'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      )}

      {rites.length > 0 && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <span className="font-semibold">{configuredCount} of {rites.length} rites</span> have a configured
              recipient split. Rites without one still accept payments — configure splits once church management
              confirms the recipient breakdown.
            </div>
          </div>

          {grouped.map(({ category, rites: catRites }) => (
            <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-teal-50 px-6 py-3 border-b border-teal-100">
                <h3 className="font-semibold text-teal-900">{CATEGORY_LABELS[category] || category}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Split</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {catRites.map((rite) => (
                      <tr key={rite._id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{rite.nameMalayalam}</div>
                          <div className="text-xs text-gray-500">{rite.nameEnglish}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === rite._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                              <button
                                onClick={() => saveAmount(rite._id)}
                                disabled={saving}
                                className="text-teal-600 text-xs font-medium hover:underline"
                              >
                                Save
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-gray-500 text-xs hover:underline">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(rite)}
                              className="text-sm font-semibold text-gray-900 hover:text-teal-600"
                            >
                              ₹{rite.amount.toLocaleString()}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rite.splitConfigured ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" /> Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Not set
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/super-admin/dashboard/thirukkarmangal/split?id=${rite._id}&churchId=${selectedChurchId}`}
                            className="flex items-center gap-1 text-teal-600 hover:text-teal-900 font-medium"
                          >
                            <Settings className="w-4 h-4" /> Split
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
