'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { ArrowLeft, Flame, Search } from 'lucide-react';

interface Church { _id: string; name: string; }
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

function BookingsContent() {
  const searchParams = useSearchParams();
  const api = createRoleApi('super_admin');

  const [churches, setChurches] = useState<Church[]>([]);
  const [rites, setRites] = useState<Rite[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedChurchId, setSelectedChurchId] = useState(searchParams.get('churchId') || '');
  const [filterRite, setFilterRite] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Load churches on mount
  useEffect(() => {
    api.get('/churches').then((r) => setChurches(r.data?.data || [])).catch(console.error);
  }, []);

  // When church changes, reload rites and fetch bookings
  useEffect(() => {
    setFilterRite('');
    setRites([]);
    setBookings([]);
    if (!selectedChurchId) return;

    api.get(`/thirukkarmangal/rites?churchId=${selectedChurchId}`)
      .then((r) => setRites(r.data?.data || []))
      .catch(console.error);

    fetchBookings(selectedChurchId, '', '', '');
  }, [selectedChurchId]);

  const fetchBookings = async (churchId: string, riteId: string, from: string, to: string) => {
    if (!churchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ churchId });
      if (riteId) params.set('riteId', riteId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get(`/thirukkarmangal/bookings?${params.toString()}`);
      setBookings(res.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(selectedChurchId, filterRite, filterFrom, filterTo);
  };

  const total = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/dashboard/thirukkarmangal" className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Thirukkarmangal Bookings</h2>
            <p className="text-gray-500 text-sm">View rite payment bookings across churches</p>
          </div>
        </div>
      </div>

      {/* Church + Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Church *</label>
          <select
            value={selectedChurchId}
            onChange={(e) => setSelectedChurchId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Choose a church...</option>
            {churches.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Rite</label>
          <select
            value={filterRite}
            onChange={(e) => setFilterRite(e.target.value)}
            disabled={!selectedChurchId}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
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
        <button
          type="submit"
          disabled={!selectedChurchId}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      {/* Summary */}
      {!loading && selectedChurchId && bookings.length > 0 && (
        <div className="bg-purple-600 text-white rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-purple-100">Total collected</p>
            <p className="text-2xl font-bold">₹{total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-100">Bookings</p>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!selectedChurchId ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
            <Flame className="w-10 h-10" />
            <p className="text-sm">Select a church to view bookings</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
            <Flame className="w-10 h-10" />
            <p className="font-medium text-gray-500">No bookings found</p>
            <p className="text-sm">Try adjusting the filters</p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
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
                    <td className="px-4 py-3 text-sm text-gray-700">{b.unitId?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-purple-700">₹{b.totalAmount.toLocaleString()}</td>
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

export default function SuperAdminThirukkarmangalBookingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" /></div>}>
      <BookingsContent />
    </Suspense>
  );
}
