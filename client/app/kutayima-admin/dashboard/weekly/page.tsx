'use client';

import { useState, useEffect, useMemo } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Coins, Heart, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  uniqueId?: string;
}

interface House {
  _id: string;
  familyName: string;
}

interface Contributor {
  _id: string;
  contributorId: string;
  contributorType: 'Member' | 'House';
  amount: number;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
}

interface CurrentWeek {
  _id: string;
  weekNumber: number;
  year: number;
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  contributors: Contributor[];
}

interface Activity {
  _id: string;
  memberId: { firstName: string; lastName: string } | null;
  activityType: string;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'approved')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Approved</span>;
  if (status === 'rejected')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejected</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
};

export default function KutayimaAdminWeeklyPage() {
  const api = createRoleApi('kudumbakutayima_admin');

  // Stothrakazhcha state
  const [current, setCurrent] = useState<CurrentWeek | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [showContribModal, setShowContribModal] = useState(false);
  const [contribSubmitting, setContribSubmitting] = useState(false);
  const [contributorId, setContributorId] = useState('');
  const [amount, setAmount] = useState('');
  const [isAbsent, setIsAbsent] = useState(false);
  const [isOffering, setIsOffering] = useState(false);

  // Spiritual activity state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [actSubmitting, setActSubmitting] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [activityType, setActivityType] = useState<'mass' | 'fasting' | 'prayer'>('mass');
  const [massDate, setMassDate] = useState('');
  const [fastingWeek, setFastingWeek] = useState('');
  const [fastingDays, setFastingDays] = useState<string[]>([]);
  const [prayerType, setPrayerType] = useState('rosary');
  const [prayerCount, setPrayerCount] = useState('');
  const [prayerWeek, setPrayerWeek] = useState('');

  useEffect(() => {
    fetchCurrentWeek();
    fetchMembers();
    fetchHouses();
    fetchActivities();
  }, []);

  const fetchCurrentWeek = async () => {
    setLoadingWeek(true);
    try {
      const res = await api.get('/stothrakazhcha/current/week');
      setCurrent(res.data?.data || null);
    } catch {
      setCurrent(null);
    } finally {
      setLoadingWeek(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data?.data || []);
    } catch {}
  };

  const fetchHouses = async () => {
    try {
      const res = await api.get('/houses');
      setHouses(res.data?.data || []);
    } catch {}
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await api.get('/spiritual-activities?includeAllStatuses=true');
      setActivities(res.data?.data || []);
    } catch {
      toast.error('Failed to load activities');
    } finally {
      setLoadingActivities(false);
    }
  };

  // Stothrakazhcha helpers
  const entityIds = useMemo(() => {
    const entities = current?.amountType === 'per_member' ? members : houses;
    return new Set(entities.map((e) => e._id));
  }, [current, members, houses]);

  const myContributions = useMemo(
    () => (current?.contributors || []).filter((c) => entityIds.has(c.contributorId)),
    [current, entityIds]
  );

  const totalCollected = myContributions
    .filter((c) => c.approvalStatus !== 'rejected')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingCount = myContributions.filter((c) => c.approvalStatus === 'pending_approval').length;
  const approvedCount = myContributions.filter((c) => c.approvalStatus === 'approved').length;
  const totalEntities = (current?.amountType === 'per_member' ? members : houses).length;

  const contributorLabel = (c: Contributor) => {
    if (c.contributorType === 'Member') {
      const m = members.find((mm) => mm._id === c.contributorId);
      return m ? `${m.firstName} ${m.lastName}` : c.contributorId;
    }
    const h = houses.find((hh) => hh._id === c.contributorId);
    return h ? h.familyName : c.contributorId;
  };

  const handleAddContribution = async () => {
    if (!current) return;
    if (!contributorId) {
      toast.error('Select a member/house');
      return;
    }
    const amt = Number(amount);
    if (!isAbsent && !isOffering && amount && amt < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!isAbsent && !isOffering && !amount) {
      toast.error('Enter an amount, or select Absent / Offerings');
      return;
    }

    let entryType: 'normal' | 'absent' | 'offering' = 'normal';
    let finalAmount = amt;
    if (isOffering) { entryType = 'offering'; finalAmount = 0; }
    else if (isAbsent || amt === 0) { entryType = 'absent'; finalAmount = 0; }

    setContribSubmitting(true);
    try {
      await api.post(`/approvals/stothrakazhcha/${current._id}/mark-pending`, {
        contributorId,
        contributorType: current.amountType === 'per_member' ? 'Member' : 'House',
        amount: finalAmount,
        entryType,
      });
      toast.success('Contribution marked as pending approval');
      setShowContribModal(false);
      setContributorId('');
      setAmount('');
      setIsAbsent(false);
      setIsOffering(false);
      fetchCurrentWeek();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark contribution');
    } finally {
      setContribSubmitting(false);
    }
  };

  const resetActivityForm = () => {
    setMemberId('');
    setActivityType('mass');
    setMassDate('');
    setFastingWeek('');
    setFastingDays([]);
    setPrayerType('rosary');
    setPrayerCount('');
    setPrayerWeek('');
  };

  const toggleDay = (day: string) =>
    setFastingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleAddActivity = async () => {
    if (!memberId) { toast.error('Select a member'); return; }
    const body: any = { memberId, activityType };
    if (activityType === 'mass') {
      if (!massDate) { toast.error('Select a mass date'); return; }
      body.massDate = massDate;
      body.massAttended = true;
    } else if (activityType === 'fasting') {
      if (!fastingWeek) { toast.error('Enter the fasting week'); return; }
      body.fastingWeek = fastingWeek;
      body.fastingDays = fastingDays;
    } else {
      if (!prayerWeek) { toast.error('Enter the prayer week'); return; }
      body.prayerType = prayerType;
      body.prayerCount = Number(prayerCount) || 0;
      body.prayerWeek = prayerWeek;
    }
    setActSubmitting(true);
    try {
      await api.post('/approvals/spiritual-activities/mark-pending', body);
      toast.success('Activity marked as pending approval');
      setShowActivityModal(false);
      resetActivityForm();
      fetchActivities();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark activity');
    } finally {
      setActSubmitting(false);
    }
  };

  const weekLabel = current ? `Week ${current.weekNumber}, ${current.year}` : 'No active week';

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Weekly Entry</h1>
        <p className="text-gray-500 text-sm">{weekLabel} — Mark stothrakazhcha and spiritual activities for your group</p>
      </div>

      {/* ── SECTION 1: STOTHRAKAZHCHA ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-800">Stothrakazhcha</h2>
          </div>
          {current && (
            <button
              onClick={() => { setContributorId(''); setAmount(''); setIsAbsent(false); setIsOffering(false); setShowContribModal(true); }}
              className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Contribution
            </button>
          )}
        </div>

        {loadingWeek ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
        ) : !current ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No active Stothrakazhcha for the current week
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">₹{totalCollected.toLocaleString('en-IN')}</p>
                <p className="text-xs text-orange-500 mt-0.5">collected</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{myContributions.filter(c => c.approvalStatus !== 'rejected').length}/{totalEntities}</p>
                <p className="text-xs text-amber-500 mt-0.5">entered / total</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
                <p className="text-xs text-green-500 mt-0.5">approved</p>
              </div>
            </div>

            {/* Contributions list */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {current.amountType === 'per_member' ? 'Member' : 'House'}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myContributions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-gray-400 text-sm">
                        No contributions marked yet
                      </td>
                    </tr>
                  ) : (
                    myContributions.map((c) => (
                      <tr key={c._id}>
                        <td className="px-5 py-3 text-sm text-gray-900">{contributorLabel(c)}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-orange-600">₹{c.amount.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3"><StatusBadge status={c.approvalStatus} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── SECTION 2: SPIRITUAL ACTIVITIES ────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Spiritual Activities</h2>
          </div>
          <button
            onClick={() => { resetActivityForm(); setShowActivityModal(true); }}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Mark Activity
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingActivities ? (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400 text-sm">Loading...</td></tr>
              ) : activities.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400 text-sm">No activities marked yet</td></tr>
              ) : (
                activities.map((a) => (
                  <tr key={a._id}>
                    <td className="px-5 py-3 text-sm text-gray-900">
                      {a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{a.activityType}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.approvalStatus} /></td>
                    <td className="px-5 py-3 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD CONTRIBUTION MODAL ──────────────────────────── */}
      {showContribModal && current && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Add Contribution</h3>
            </div>
            <p className="text-xs text-gray-500">Counted only after church admin approves</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {current.amountType === 'per_member' ? 'Member' : 'House'}
              </label>
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{current.amountType === 'per_member' ? 'Select member...' : 'Select house...'}</option>
                {(current.amountType === 'per_member' ? members : houses).map((entity: any) => (
                  <option key={entity._id} value={entity._id}>
                    {current.amountType === 'per_member'
                      ? `${entity.firstName} ${entity.lastName}${entity.uniqueId ? ` (${entity.uniqueId})` : ''}`
                      : entity.familyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (default ₹{current.defaultAmount})
              </label>
              <input
                type="number"
                min="0"
                placeholder={
                  isAbsent ? '₹0 — Absent (due calculated)' :
                  isOffering ? '₹0 — Offerings (no due)' :
                  `₹${current.defaultAmount} (enter 0 = due calculated)`
                }
                value={isAbsent || isOffering ? '' : amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isAbsent || isOffering}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${isAbsent || isOffering ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Absent / Offerings checkboxes */}
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${isAbsent ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={isAbsent}
                  onChange={(e) => { setIsAbsent(e.target.checked); if (e.target.checked) { setIsOffering(false); setAmount(''); } }}
                  className="mt-0.5 accent-red-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Absent</p>
                  <p className="text-xs text-gray-500">Due will be calculated</p>
                </div>
              </label>
              <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${isOffering ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={isOffering}
                  onChange={(e) => { setIsOffering(e.target.checked); if (e.target.checked) { setIsAbsent(false); setAmount(''); } }}
                  className="mt-0.5 accent-green-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Offerings</p>
                  <p className="text-xs text-gray-500">No due calculation</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => { setShowContribModal(false); setIsAbsent(false); setIsOffering(false); setAmount(''); setContributorId(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContribution}
                disabled={contribSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                {contribSubmitting ? 'Marking...' : 'Mark Pending'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MARK ACTIVITY MODAL ─────────────────────────────── */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Mark Spiritual Activity</h3>
            </div>

            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select member...</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}{m.uniqueId ? ` (${m.uniqueId})` : ''}</option>)}
            </select>

            <select value={activityType} onChange={(e) => setActivityType(e.target.value as any)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="mass">Mass</option>
              <option value="fasting">Fasting</option>
              <option value="prayer">Prayer</option>
            </select>

            {activityType === 'mass' && (
              <input type="date" value={massDate} onChange={(e) => setMassDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            )}

            {activityType === 'fasting' && (
              <div className="space-y-2">
                <input type="text" placeholder="Fasting week (e.g. 2026-W32)" value={fastingWeek} onChange={(e) => setFastingWeek(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((day) => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${fastingDays.includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activityType === 'prayer' && (
              <div className="space-y-2">
                <select value={prayerType} onChange={(e) => setPrayerType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="rosary">Rosary</option>
                  <option value="divine_mercy">Divine Mercy</option>
                  <option value="stations">Stations</option>
                  <option value="other">Other</option>
                </select>
                <input type="number" min="0" placeholder="Count" value={prayerCount} onChange={(e) => setPrayerCount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="text" placeholder="Prayer week (e.g. 2026-W32)" value={prayerWeek} onChange={(e) => setPrayerWeek(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => { setShowActivityModal(false); resetActivityForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddActivity} disabled={actSubmitting} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                {actSubmitting ? 'Marking...' : 'Mark Pending'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
