'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Trash2, Save, Eraser } from 'lucide-react';

interface SplitEntry {
  recipientLabel: string;
  percent: number | '';
}

interface Rite {
  _id: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  split: Array<{ recipientLabel: string; percent: number }>;
  splitConfigured: boolean;
}

const SOLEMN_MASS_REFERENCE = [
  { recipientLabel: 'കാർമ്മികൻ (Celebrant)', percent: 55 },
  { recipientLabel: 'ദൈവാലയ ശുശ്രൂഷി (Church Minister)', percent: 15 },
  { recipientLabel: 'ഗായകസംഘം (Choir)', percent: 10 },
  { recipientLabel: 'അൾത്താരസംഘം (Altar Servers)', percent: 10 },
  { recipientLabel: 'പള്ളി (Church)', percent: 10 },
];

export default function SuperAdminRiteSplitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const churchId = searchParams.get('churchId');
  const api = createRoleApi('super_admin');

  const [rite, setRite] = useState<Rite | null>(null);
  const [entries, setEntries] = useState<SplitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchRite();
  }, [id]);

  const fetchRite = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/thirukkarmangal/rites/${id}`);
      const data: Rite = response.data.data;
      setRite(data);
      setEntries(
        data.split.length > 0
          ? data.split.map((s) => ({ recipientLabel: s.recipientLabel, percent: s.percent }))
          : [{ recipientLabel: '', percent: '' }]
      );
    } catch (error) {
      toast.error('Failed to load rite');
    } finally {
      setLoading(false);
    }
  };

  const total = entries.reduce((sum, e) => sum + (Number(e.percent) || 0), 0);

  const updateEntry = (index: number, field: keyof SplitEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: field === 'percent' ? (value === '' ? '' : Number(value)) : value } : e))
    );
  };

  const addRow = () => setEntries((prev) => [...prev, { recipientLabel: '', percent: '' }]);
  const removeRow = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!id) return;
    const validEntries = entries.filter((e) => e.recipientLabel.trim() && e.percent !== '');
    if (validEntries.length > 0 && validEntries.length !== entries.length) {
      toast.error('Every row needs both a recipient label and a percent, or remove the empty row');
      return;
    }
    if (validEntries.length > 0 && Math.round(total * 100) / 100 !== 100) {
      toast.error(`Percentages must sum to exactly 100 (currently ${total})`);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/thirukkarmangal/rites/${id}/split`, {
        split: validEntries.map((e) => ({ recipientLabel: e.recipientLabel.trim(), percent: Number(e.percent) })),
      });
      toast.success(validEntries.length > 0 ? 'Split configured' : 'Split cleared');
      router.push(`/super-admin/dashboard/thirukkarmangal${churchId ? `?churchId=${churchId}` : ''}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save split');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => setEntries([{ recipientLabel: '', percent: '' }]);

  const backHref = `/super-admin/dashboard/thirukkarmangal${churchId ? `?churchId=${churchId}` : ''}`;

  if (!id) return <p className="text-gray-500">No rite selected.</p>;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!rite) return null;

  const remaining = Math.round((100 - total) * 100) / 100;

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to rate list
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800">{rite.nameMalayalam}</h2>
        <p className="text-gray-600 mb-1">{rite.nameEnglish} — ₹{rite.amount.toLocaleString()}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Reference: confirmed split for Solemn Mass (₹300)</p>
          <p>{SOLEMN_MASS_REFERENCE.map((r) => `${r.recipientLabel} ${r.percent}%`).join(' · ')}</p>
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Recipient label (e.g. Celebrant)"
                value={entry.recipientLabel}
                onChange={(e) => updateEntry(index, 'recipientLabel', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="%"
                value={entry.percent}
                onChange={(e) => updateEntry(index, 'percent', e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <button onClick={addRow} className="flex items-center gap-1 text-teal-600 text-sm font-medium hover:underline">
            <Plus className="w-4 h-4" /> Add recipient
          </button>
          <div className={`text-sm font-semibold ${remaining === 0 ? 'text-green-600' : 'text-amber-600'}`}>
            Total: {total}% {remaining !== 0 && `(${remaining > 0 ? remaining : `${remaining}`}% remaining)`}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Eraser className="w-4 h-4" /> Clear (leave unconfigured)
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Split'}
          </button>
        </div>
      </div>
    </div>
  );
}
