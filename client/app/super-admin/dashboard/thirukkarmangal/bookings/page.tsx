'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import {
  ArrowLeft, CalendarPlus, Receipt, X, ChevronLeft, ChevronRight,
  Bell, ListFilter, Calendar, Flame, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

interface Church { _id: string; name: string; }
interface RiteRef { _id: string; nameMalayalam: string; nameEnglish: string; amount: number; }
interface MemberRef { _id: string; firstName: string; lastName: string; uniqueId: string; }
interface HouseRef { _id: string; familyName: string; houseCode?: string; }
interface UnitRef { _id: string; name: string; }
interface TxRef { _id: string; receiptNumber: string; totalAmount: number; paymentMethod: string; paymentDate: string; }

interface Booking {
  _id: string;
  scheduledDate: string;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  riteId: RiteRef | null;
  memberId: MemberRef | null;
  houseId: HouseRef | null;
  unitId: UnitRef | null;
  transactionId?: TxRef | null;
}

interface RiteMaster { _id: string; nameEnglish: string; }

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  paid: <CheckCircle2 className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function BookingsContent() {
  const searchParams = useSearchParams();
  const api = createRoleApi('super_admin');

  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurchId, setSelectedChurchId] = useState(searchParams.get('churchId') || '');

  const [tab, setTab] = useState<'list' | 'calendar'>('list');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rites, setRites] = useState<RiteMaster[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRite, setFilterRite] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Calendar
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Payment modal
  const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.get('/churches').then(r => setChurches(r.data?.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setFilterRite('');
    setRites([]);
    setBookings([]);
    if (!selectedChurchId) return;
    api.get(`/thirukkarmangal/rites?churchId=${selectedChurchId}`)
      .then(r => setRites(r.data?.data || []))
      .catch(console.error);
    fetchBookings(selectedChurchId, '', '', '', '');
  }, [selectedChurchId]);

  const fetchBookings = async (churchId: string, status: string, riteId: string, from: string, to: string) => {
    if (!churchId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ churchId });
      if (status) params.set('status', status);
      if (riteId) params.set('riteId', riteId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get(`/thirukkarmangal/scheduled-bookings?${params.toString()}`);
      setBookings(res.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(selectedChurchId, filterStatus, filterRite, filterFrom, filterTo);
  };

  const clearFilters = () => {
    setFilterStatus(''); setFilterRite(''); setFilterFrom(''); setFilterTo('');
    fetchBookings(selectedChurchId, '', '', '', '');
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.put(`/thirukkarmangal/scheduled-bookings/${id}/cancel`, {});
      toast.success('Booking cancelled');
      fetchBookings(selectedChurchId, filterStatus, filterRite, filterFrom, filterTo);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const openPayModal = (b: Booking) => {
    setPayModalBooking(b);
    setPayAmount(b.riteId?.amount?.toString() || '');
    setPayMethod('cash');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayRef('');
    setPayNotes('');
  };

  const handlePay = async () => {
    if (!payModalBooking) return;
    if (!payAmount || Number(payAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    setPaying(true);
    try {
      await api.put(`/thirukkarmangal/scheduled-bookings/${payModalBooking._id}/payment`, {
        totalAmount: Number(payAmount),
        paymentMethod: payMethod,
        paymentDate: payDate,
        referenceNo: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });
      toast.success('Payment recorded');
      setPayModalBooking(null);
      fetchBookings(selectedChurchId, filterStatus, filterRite, filterFrom, filterTo);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  // Reminders: pending bookings in next 14 days
  const upcomingPending = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 14);
    return bookings.filter(b => {
      if (b.status !== 'pending') return false;
      const d = new Date(b.scheduledDate);
      return d >= now && d <= cutoff;
    }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [bookings]);

  // Calendar data
  const calBookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      const d = new Date(b.scheduledDate);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(b);
      }
    });
    return map;
  }, [bookings, calYear, calMonth]);

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calYear, calMonth]);

  const selectedDayBookings = useMemo(() => {
    if (!selectedDay) return [];
    return calBookingsByDay[selectedDay] || [];
  }, [selectedDay, calBookingsByDay]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const newBookingHref = selectedChurchId
    ? `/super-admin/dashboard/thirukkarmangal/bookings/new?churchId=${selectedChurchId}`
    : '/super-admin/dashboard/thirukkarmangal/bookings/new';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/dashboard/thirukkarmangal" className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Thirukkarmangal Bookings</h2>
            <p className="text-gray-500 text-sm">Schedule rites and record payments</p>
          </div>
        </div>
        <Link
          href={newBookingHref}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <CalendarPlus className="w-4 h-4" /> New Booking
        </Link>
      </div>

      {/* Church selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Church *</label>
        <select
          value={selectedChurchId}
          onChange={(e) => setSelectedChurchId(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Choose a church...</option>
          {churches.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedChurchId ? (
        <div className="bg-white rounded-lg shadow flex flex-col items-center py-16 gap-2 text-gray-400">
          <Flame className="w-10 h-10" />
          <p className="text-sm">Select a church to view bookings</p>
        </div>
      ) : (
        <>
          {/* Reminders */}
          {upcomingPending.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">
                  {upcomingPending.length} upcoming booking{upcomingPending.length > 1 ? 's' : ''} awaiting payment (next 14 days)
                </span>
              </div>
              <div className="space-y-2">
                {upcomingPending.map(b => {
                  const daysLeft = Math.round((new Date(b.scheduledDate).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={b._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-amber-100">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{b.riteId?.nameEnglish || '—'}</span>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-600">{b.memberId?.firstName} {b.memberId?.lastName}</span>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-500">{formatDate(b.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${daysLeft === 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-amber-600'}`}>
                          {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                        </span>
                        <button
                          onClick={() => openPayModal(b)}
                          className="flex items-center gap-1 text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700"
                        >
                          <Receipt className="w-3 h-3" /> Pay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'list' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ListFilter className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'calendar' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </button>
          </div>

          {/* ── LIST TAB ── */}
          {tab === 'list' && (
            <>
              <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rite</label>
                  <select value={filterRite} onChange={(e) => setFilterRite(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">All rites</option>
                    {rites.map(r => <option key={r._id} value={r._id}>{r.nameEnglish}</option>)}
                  </select>
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                {(filterStatus || filterRite || filterFrom || filterTo) && (
                  <button type="button" onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">Search</button>
              </form>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                  <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" /></div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-2 text-gray-400">
                    <Flame className="w-10 h-10" />
                    <p className="font-medium text-gray-500">No bookings found</p>
                    <Link href={newBookingHref} className="text-sm text-purple-600 hover:underline">
                      Create the first booking
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rite</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">House</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bookings.map((b) => (
                          <tr key={b._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(b.scheduledDate)}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{b.riteId?.nameEnglish ?? '—'}</div>
                              {b.riteId?.nameMalayalam && <div className="text-xs text-gray-500">{b.riteId.nameMalayalam}</div>}
                            </td>
                            <td className="px-4 py-3">
                              {b.memberId ? (
                                <>
                                  <div className="text-sm font-medium text-gray-900">{b.memberId.firstName} {b.memberId.lastName}</div>
                                  <div className="text-xs text-gray-500">{b.memberId.uniqueId}</div>
                                </>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              {b.houseId ? b.houseId.familyName : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[b.status]}`}>
                                {STATUS_ICON[b.status]}
                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-600">
                              {b.transactionId ? (
                                <div>
                                  <div>{b.transactionId.receiptNumber}</div>
                                  <div className="text-gray-500">₹{b.transactionId.totalAmount}</div>
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openPayModal(b)}
                                    className="inline-flex items-center gap-1 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 mr-2"
                                  >
                                    <Receipt className="w-3 h-3" /> Add Payment
                                  </button>
                                  <button
                                    onClick={() => handleCancel(b._id)}
                                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1.5 rounded-lg hover:bg-red-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CALENDAR TAB ── */}
          {tab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                  <h3 className="font-semibold text-gray-800">{MONTH_NAMES[calMonth]} {calYear}</h3>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 bg-gray-50">
                  {DAY_NAMES.map(d => <div key={d} className="py-2">{d}</div>)}
                </div>

                <div className="grid grid-cols-7">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={i} className="h-14 border-t border-r border-gray-100" />;
                    const key = day.toString();
                    const dayBookings = calBookingsByDay[key] || [];
                    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
                    const isSelected = selectedDay === key;
                    const hasPending = dayBookings.some(b => b.status === 'pending');
                    const hasPaid = dayBookings.some(b => b.status === 'paid');

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDay(isSelected ? null : key)}
                        className={`h-14 border-t border-r border-gray-100 p-1 cursor-pointer hover:bg-purple-50 transition-colors ${
                          isSelected ? 'bg-purple-50 ring-2 ring-inset ring-purple-400' : ''
                        }`}
                      >
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-purple-600 text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        {dayBookings.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5 flex-wrap">
                            {hasPending && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
                            {hasPaid && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                            {dayBookings.length > 2 && (
                              <span className="text-[9px] text-gray-500 leading-none mt-0.5">+{dayBookings.length}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-3 border-t bg-gray-50 flex gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Pending</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Paid</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                {!selectedDay ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400 gap-2">
                    <Calendar className="w-8 h-8" />
                    <p className="text-sm">Click a day to see bookings</p>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {selectedDay} {MONTH_NAMES[calMonth]} {calYear}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''})
                      </span>
                    </h4>
                    {selectedDayBookings.length === 0 ? (
                      <p className="text-sm text-gray-400">No bookings on this day</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayBookings.map(b => (
                          <div key={b._id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{b.riteId?.nameEnglish || '—'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{b.memberId?.firstName} {b.memberId?.lastName}</p>
                                <p className="text-xs text-gray-500">{b.houseId?.familyName}</p>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_BADGE[b.status]}`}>
                                {STATUS_ICON[b.status]}
                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                              </span>
                            </div>
                            {b.status === 'pending' && (
                              <button
                                onClick={() => openPayModal(b)}
                                className="mt-2 w-full flex items-center justify-center gap-1 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700"
                              >
                                <Receipt className="w-3 h-3" /> Add Payment
                              </button>
                            )}
                            {b.transactionId && (
                              <p className="mt-1.5 text-xs text-green-700 font-mono">{b.transactionId.receiptNumber} · ₹{b.transactionId.totalAmount}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PAYMENT MODAL ── */}
      {payModalBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Record Payment</h3>
                <p className="text-sm text-gray-500">{payModalBooking.riteId?.nameEnglish} · {formatDate(payModalBooking.scheduledDate)}</p>
              </div>
              <button onClick={() => setPayModalBooking(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <p><span className="text-gray-500">Member:</span> <span className="font-medium">{payModalBooking.memberId?.firstName} {payModalBooking.memberId?.lastName}</span></p>
                <p><span className="text-gray-500">House:</span> <span className="font-medium">{payModalBooking.houseId?.familyName}</span></p>
                <p><span className="text-gray-500">Rite fee:</span> <span className="font-medium">₹{payModalBooking.riteId?.amount}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {payMethod !== 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Transaction / cheque reference"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setPayModalBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Receipt className="w-4 h-4" />
                  {paying ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
