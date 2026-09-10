'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { ArrowLeft, Flame, Receipt, Search, X } from 'lucide-react';

interface Rite { _id: string; nameMalayalam: string; nameEnglish: string; code: string; category: string; amount: number; }
interface MemberRef { _id: string; firstName: string; lastName: string; uniqueId: string; }
interface HouseRef { _id: string; familyName: string; houseCode: string; }
interface UnitRef { _id: string; name: string; }

interface Booking {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  splitBreakdown?: Array<{ recipientLabel: string; percent: number; amount: number }>;
  riteId: Rite | null;
  memberId: MemberRef | null;
  houseId: HouseRef | null;
  unitId: UnitRef | null;
}

interface RiteMaster { _id: string; nameEnglish: string; }

export default function ThirukkarmangalBookingsPage() {
  const api = createRoleApi('church_admin');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rites, setRites] = useState<RiteMaster[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterRite, setFilterRite] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const fetchRites = async () => {
    try {
      const res = await api.get('/thirukkarmangal/rites');
      setRites(res.data?.data || []);
    } catch {
      // non-fatal
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRite) params.set('riteId', filterRite);
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo) params.set('to', filterTo);
      const res = await api.get(`/thirukkarmangal/bookings?${params.toString()}`);
      setBookings(res.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRites();
    fetchBookings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const hasFilters = !!(filterRite || filterFrom || filterTo);

  const clearFilters = () => {
    setFilterRite('');
    setFilterFrom('');
    setFilterTo('');
    // re-fetch with no filters
    setLoading(true);
    api.get('/thirukkarmangal/bookings')
      .then((res) => setBookings(res.data?.data || []))
      .catch((err: any) => toast.error(err.response?.data?.error || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/church-admin/dashboard/thirukkarmangal/rites" className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Thirukkarmangal Bookings</h2>
            <p className="text-gray-500 text-sm">All rite payments recorded against members</p>
          </div>
        </div>
        <Link
          href="/church-admin/dashboard/thirukkarmangal/record-payment"
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm"
        >
          <Receipt className="w-4 h-4" /> Record Payment
        </Link>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Rite</label>
          <select
            value={filterRite}
            onChange={(e) => setFilterRite(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All rites</option>
            {rites.map((r) => <option key={r._id} value={r._id}>{r.nameEnglish}</option>)}
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <button type="submit" className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      {/* Summary */}
      {!loading && bookings.length > 0 && (
        <div className="bg-teal-600 text-white rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-teal-100">Total collected</p>
            <p className="text-2xl font-bold">₹{total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-100">Bookings</p>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
            <Flame className="w-10 h-10" />
            <p className="font-medium text-gray-500">No bookings found</p>
            {hasFilters ? (
              <button onClick={clearFilters} className="text-sm text-teal-600 hover:underline">
                Clear filters
              </button>
            ) : (
              <p className="text-sm">No Thirukkarmangal payments have been recorded yet</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rite</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">House</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{b.receiptNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{b.riteId?.nameEnglish ?? '—'}</div>
                      {b.riteId?.nameMalayalam && (
                        <div className="text-xs text-gray-500">{b.riteId.nameMalayalam}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.memberId ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{b.memberId.firstName} {b.memberId.lastName}</div>
                          <div className="text-xs text-gray-500">{b.memberId.uniqueId}</div>
                        </>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {b.houseId ? `${b.houseId.familyName}${b.houseId.houseCode ? ` (${b.houseId.houseCode})` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-700">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{b.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(b.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
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
