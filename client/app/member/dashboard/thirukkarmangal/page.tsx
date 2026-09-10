'use client';

import { useState, useEffect, useMemo } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Flame, X } from 'lucide-react';

interface Rite { _id: string; nameMalayalam: string; nameEnglish: string; }

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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterRiteId, setFilterRiteId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/members/me/thirukkarmangal');
        setAllBookings(res.data?.data || []);
      } catch {
        toast.error('Failed to load Thirukkarmangal history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Unique rites derived from bookings
  const riteOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: Array<{ id: string; name: string }> = [];
    for (const b of allBookings) {
      if (b.riteId?._id && !seen.has(b.riteId._id)) {
        seen.add(b.riteId._id);
        opts.push({ id: b.riteId._id, name: b.riteId.nameEnglish });
      }
    }
    return opts;
  }, [allBookings]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return allBookings.filter((b) => {
      if (filterRiteId && b.riteId?._id !== filterRiteId) return false;
      const d = new Date(b.paymentDate);
      if (fromDate && d < new Date(fromDate)) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [allBookings, filterRiteId, fromDate, toDate]);

  const total = filtered.reduce((sum, b) => sum + b.totalAmount, 0);
  const hasFilters = !!(filterRiteId || fromDate || toDate);

  const clearFilters = () => {
    setFilterRiteId('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Thirukkarmangal</h2>
        <p className="text-gray-600">Your sacred rite booking history</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Rite</label>
          <select
            value={filterRiteId}
            onChange={(e) => setFilterRiteId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All rites</option>
            {riteOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Summary banner */}
      {!loading && allBookings.length > 0 && (
        <div className="bg-teal-600 text-white rounded-lg p-5 flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-100">Total Paid</p>
            <p className="text-3xl font-bold">₹{total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-100">Bookings{hasFilters ? ' (filtered)' : ''}</p>
            <p className="text-3xl font-bold">{filtered.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-800">My Bookings</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
            <Flame className="w-10 h-10" />
            <p className="text-sm font-medium text-gray-500">
              {hasFilters ? 'No matching bookings' : 'No Thirukkarmangal bookings yet'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-teal-600 hover:underline">
                Clear filters
              </button>
            )}
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
                {filtered.map((b) => (
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
