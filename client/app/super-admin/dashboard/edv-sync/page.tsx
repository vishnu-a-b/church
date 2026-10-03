'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { RefreshCw, AlertCircle, CheckCircle, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface Church {
  _id: string;
  name: string;
}

interface PendingTransaction {
  _id: string;
  receiptNumber: string;
  transactionType: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  edvSyncError?: string;
  createdAt: string;
}

interface EditForm {
  totalAmount: string;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
}

export default function SuperAdminEdvSyncPage() {
  const api = createRoleApi('super_admin');
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [editingTxn, setEditingTxn] = useState<PendingTransaction | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ totalAmount: '', paymentMethod: 'cash', paymentDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchChurches();
  }, []);

  useEffect(() => {
    if (selectedChurch) fetchPending();
    else setPending([]);
  }, [selectedChurch]);

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      setChurches(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
      toast.error('Failed to load churches');
    }
  };

  const fetchPending = async () => {
    if (!selectedChurch) return;
    setLoading(true);
    try {
      const response = await api.get(`/edv-sync/pending?churchId=${selectedChurch}`);
      setPending(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching pending EDV syncs:', error);
      toast.error('Failed to load pending syncs');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await api.post(`/edv-sync/${id}/retry`);
      toast.success('Synced successfully');
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Retry failed');
      fetchPending();
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    if (!selectedChurch) return;
    setRetryingAll(true);
    try {
      const response = await api.post('/edv-sync/retry-all', { churchId: selectedChurch });
      const { ok, failed } = response.data?.data || { ok: 0, failed: 0 };
      if (failed === 0) {
        toast.success(`All ${ok} transaction(s) synced successfully`);
      } else {
        toast.warning(`${ok} synced, ${failed} still failing`);
      }
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Retry all failed');
    } finally {
      setRetryingAll(false);
    }
  };

  const openEdit = (txn: PendingTransaction) => {
    setEditingTxn(txn);
    setEditForm({
      totalAmount: String(txn.totalAmount),
      paymentMethod: txn.paymentMethod,
      paymentDate: txn.paymentDate.split('T')[0],
      notes: txn.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTxn) return;
    const amount = Number(editForm.totalAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/transactions/${editingTxn._id}`, {
        totalAmount: amount,
        paymentMethod: editForm.paymentMethod,
        paymentDate: editForm.paymentDate,
        notes: editForm.notes || undefined,
      });
      toast.success('Transaction updated');
      setEditingTxn(null);
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, receiptNumber: string) => {
    if (!confirm(`Delete transaction ${receiptNumber}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Church Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Church *</label>
        <select
          value={selectedChurch}
          onChange={(e) => setSelectedChurch(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">-- Select a Church --</option>
          {churches.map((church) => (
            <option key={church._id} value={church._id}>
              {church.name}
            </option>
          ))}
        </select>
        {!selectedChurch && (
          <p className="text-sm text-orange-600 mt-2">Please select a church to view pending EDV syncs</p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">EDV Sync</h2>
          <p className="text-gray-600">Transactions that haven't synced to EDV yet — retry individually or all at once</p>
        </div>
        <button
          onClick={handleRetryAll}
          disabled={!selectedChurch || retryingAll || pending.length === 0}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${retryingAll ? 'animate-spin' : ''}`} />
          {retryingAll ? 'Retrying All...' : 'Retry All'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!selectedChurch ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Select a church to view pending syncs</td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      Everything is synced.
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.receiptNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.transactionType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{t.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.paymentDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate" title={t.edvSyncError}>
                      {t.edvSyncError ? (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {t.edvSyncError}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not yet attempted</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRetry(t._id)}
                          disabled={retryingId === t._id}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${retryingId === t._id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit voucher"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id, t.receiptNumber)}
                          disabled={deletingId === t._id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Voucher Modal */}
      {editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Voucher</h3>
              <button onClick={() => setEditingTxn(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {editingTxn.receiptNumber} — {editingTxn.transactionType}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.totalAmount}
                  onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={editForm.paymentDate}
                  onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTxn(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
