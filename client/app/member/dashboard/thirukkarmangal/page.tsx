'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Flame } from 'lucide-react';

interface Rite { nameMalayalam: string; nameEnglish: string; code: string; category: string; amount: number; }

interface Booking {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  riteId: Rite | null;
}

export default function MemberThirukkarmangalPage() {
  const api = createRoleApi('member');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/members/me/thirukkarmangal');
        setBookings(res.data?.data || []);
      } catch (error) {
        toast.error('Failed to load Thirukkarmangal history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Thirukkarmangal</h2>
        <p className="text-gray-600">Your sacred rite booking history</p>
      </div>

      {/* Summary banner */}
      {!loading && bookings.length > 0 && (
        <div className="bg-teal-600 text-white rounded-lg p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-100">Total Paid</p>
            <p className="text-3xl font-bold">₹{total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-100">Bookings</p>
            <p className="text-3xl font-bold">{bookings.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-800">My Bookings</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
            <Flame className="w-10 h-10" />
            <p className="text-sm">No Thirukkarmangal bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rite</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{b.riteId?.nameEnglish ?? '—'}</div>
                      {b.riteId?.nameMalayalam && (
                        <div className="text-xs text-gray-500">{b.riteId.nameMalayalam}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-700">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{b.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(b.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{b.receiptNumber}</td>
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
