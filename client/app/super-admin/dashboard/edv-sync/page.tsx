'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
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

export default function SuperAdminEdvSyncPage() {
  const api = createRoleApi('super_admin');
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                      <button
                        onClick={() => handleRetry(t._id)}
                        disabled={retryingId === t._id}
                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${retryingId === t._id ? 'animate-spin' : ''}`} />
                        Retry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
