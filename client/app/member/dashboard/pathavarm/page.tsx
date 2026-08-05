'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Gift } from 'lucide-react';

interface Transaction {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
}

export default function MemberPathavarmPage() {
  const api = createRoleApi('member');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/members/me/pathavarm');
      setHistory(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load Pathavarm history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/members/me/pathavarm', { amount: Number(amount), paymentMethod });
      toast.success('Thank you for your Pathavarm contribution!');
      setAmount('');
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const total = history.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pathavarm (Tithe)</h2>
        <p className="text-gray-600">A one-time, optional contribution — no recurring schedule</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-teal-600" />
          <h3 className="font-semibold text-gray-800">Make a Contribution</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Enter amount"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Contribute'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">My Contribution History</h3>
          <p className="text-sm text-gray-500">Total: <span className="font-semibold text-teal-700">₹{total.toLocaleString()}</span></p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500 text-sm">No contributions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{t.receiptNumber}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-green-600">₹{t.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 capitalize">{t.paymentMethod.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(t.paymentDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
