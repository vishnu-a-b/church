'use client';

import { useState, useEffect, useMemo } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Coins, Plus, Clock, CheckCircle, XCircle, Send, Pencil } from 'lucide-react';

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
  entryType?: 'normal' | 'absent' | 'offering';
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

export default function KutayimaAdminStothrakazhchaPage() {
  const api = createRoleApi('kudumbakutayima_admin');
  const [current, setCurrent] = useState<CurrentWeek | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contributorId, setContributorId] = useState('');
  const [amount, setAmount] = useState('');
  const [isAbsent, setIsAbsent] = useState(false);
  const [isOffering, setIsOffering] = useState(false);

  // Edit state
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editIsAbsent, setEditIsAbsent] = useState(false);
  const [editIsOffering, setEditIsOffering] = useState(false);

  useEffect(() => {
    fetchCurrentWeek();
    fetchMembers();
    fetchHouses();
  }, []);

  const fetchCurrentWeek = async () => {
    setLoading(true);
    try {
      const response = await api.get('/stothrakazhcha/current/week');
      setCurrent(response.data?.data || null);
    } catch {
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data?.data || []);
    } catch {}
  };

  const fetchHouses = async () => {
    try {
      const response = await api.get('/houses');
      setHouses(response.data?.data || []);
    } catch {}
  };

  // Only show MY group's contributions (those whose contributorId is in my entities)
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

  const pendingEntries = myContributions.filter((c) => c.approvalStatus === 'pending_approval');
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

  const handleAdd = async () => {
    if (!current) return;
    if (!contributorId) {
      toast.error('Select a member/house');
      return;
    }
    const amt = Number(amount);
    if (!isAbsent && !isOffering && !amount) {
      toast.error('Enter an amount, or select Absent / Offerings');
      return;
    }
    if (!isAbsent && !isOffering && amount && amt < 0) {
      toast.error('Enter a valid amount');
      return;
    }

    let entryType: 'normal' | 'absent' | 'offering' = 'normal';
    let finalAmount = amt;
    if (isOffering) { entryType = 'offering'; finalAmount = 0; }
    else if (isAbsent || amt === 0) { entryType = 'absent'; finalAmount = 0; }

    setSubmitting(true);
    try {
      await api.post(`/approvals/stothrakazhcha/${current._id}/mark-pending`, {
        contributorId,
        contributorType: current.amountType === 'per_member' ? 'Member' : 'House',
        amount: finalAmount,
        entryType,
      });
      toast.success('Contribution marked as pending approval');
      setShowAddModal(false);
      setContributorId('');
      setAmount('');
      setIsAbsent(false);
      setIsOffering(false);
      fetchCurrentWeek();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: Contributor) => {
    setEditingContributor(c);
    setEditIsAbsent(c.entryType === 'absent');
    setEditIsOffering(c.entryType === 'offering');
    setEditAmount(c.entryType === 'normal' || !c.entryType ? String(c.amount) : '');
  };

  const handleEdit = async () => {
    if (!current || !editingContributor) return;
    const amt = Number(editAmount);
    if (!editIsAbsent && !editIsOffering && editAmount && amt < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    let entryType: 'normal' | 'absent' | 'offering' = 'normal';
    let finalAmount = amt;
    if (editIsOffering) { entryType = 'offering'; finalAmount = 0; }
    else if (editIsAbsent || amt === 0) { entryType = 'absent'; finalAmount = 0; }

    setSubmitting(true);
    try {
      await api.put(`/approvals/stothrakazhcha/${current._id}/contributors/${editingContributor._id}`, {
        amount: finalAmount,
        entryType,
      });
      toast.success('Amount updated');
      setEditingContributor(null);
      fetchCurrentWeek();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update amount');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved')
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Approved</span>;
    if (status === 'rejected')
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No active Sthothrakazhcha for the current week.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-orange-600 rounded-xl p-6 text-white">
        <p className="text-orange-200 text-sm mb-1">Week {current.weekNumber}, {current.year}</p>
        <p className="text-4xl font-extrabold mb-4">₹{totalCollected.toLocaleString('en-IN')}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{myContributions.filter(c => c.approvalStatus !== 'rejected').length}/{totalEntities}</p>
            <p className="text-orange-200 text-xs mt-1">entered</p>
          </div>
          <div className="bg-amber-100/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{pendingEntries.length}</p>
            <p className="text-orange-200 text-xs mt-1">pending</p>
          </div>
          <div className="bg-green-100/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{approvedCount}</p>
            <p className="text-orange-200 text-xs mt-1">approved</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Your Group&apos;s Contributions</h2>
        <div className="flex gap-3">
          {pendingEntries.length > 0 && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 border-2 border-orange-600 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 font-semibold"
            >
              <Send className="w-4 h-4" /> Submit Cash ({pendingEntries.length})
            </button>
          )}
          <button
            onClick={() => { setContributorId(''); setAmount(''); setIsAbsent(false); setIsOffering(false); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" /> Add Contribution
          </button>
        </div>
      </div>

      {/* Contributions table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {current.amountType === 'per_member' ? 'Member' : 'House'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {myContributions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No contributions marked yet — click &ldquo;Add Contribution&rdquo; to start
                </td>
              </tr>
            ) : (
              myContributions.map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{contributorLabel(c)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ₹{c.amount.toLocaleString('en-IN')}
                    {c.entryType && c.entryType !== 'normal' && (
                      <span className="ml-2 text-xs font-normal text-gray-400">({c.entryType})</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{statusBadge(c.approvalStatus)}</td>
                  <td className="px-6 py-4 text-right">
                    {c.approvalStatus === 'pending_approval' && (
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add contribution modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">Add Contribution</h3>
            <p className="text-sm text-gray-500">Counted only after church admin approves</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {current.amountType === 'per_member' ? 'Member' : 'House'}
              </label>
              <select
                value={contributorId}
                onChange={(e) => setContributorId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">
                  {current.amountType === 'per_member' ? 'Select member...' : 'Select house...'}
                </option>
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
                step="1"
                placeholder={
                  isAbsent ? '₹0 — Absent (due calculated)' :
                  isOffering ? '₹0 — Offerings (no due)' :
                  `₹${current.defaultAmount} (enter 0 = due calculated)`
                }
                value={isAbsent || isOffering ? '' : amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isAbsent || isOffering}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 ${isAbsent || isOffering ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowAddModal(false); setContributorId(''); setAmount(''); setIsAbsent(false); setIsOffering(false); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? 'Marking...' : 'Mark as Pending'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit contribution modal */}
      {editingContributor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">Edit Contribution</h3>
            <p className="text-sm text-gray-500">{contributorLabel(editingContributor)} — pending approval</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (default ₹{current.defaultAmount})
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder={
                  editIsAbsent ? '₹0 — Absent (due calculated)' :
                  editIsOffering ? '₹0 — Offerings (no due)' :
                  `₹${current.defaultAmount}`
                }
                value={editIsAbsent || editIsOffering ? '' : editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                disabled={editIsAbsent || editIsOffering}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 ${editIsAbsent || editIsOffering ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${editIsAbsent ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={editIsAbsent}
                  onChange={(e) => { setEditIsAbsent(e.target.checked); if (e.target.checked) { setEditIsOffering(false); setEditAmount(''); } }}
                  className="mt-0.5 accent-red-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Absent</p>
                  <p className="text-xs text-gray-500">Due will be calculated</p>
                </div>
              </label>
              <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${editIsOffering ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={editIsOffering}
                  onChange={(e) => { setEditIsOffering(e.target.checked); if (e.target.checked) { setEditIsAbsent(false); setEditAmount(''); } }}
                  className="mt-0.5 accent-green-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Offerings</p>
                  <p className="text-xs text-gray-500">No due calculation</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingContributor(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit cash modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">Submit Cash to Church Admin</h3>
            <p className="text-gray-600">
              Please physically hand over{' '}
              <span className="font-bold text-orange-600">
                ₹{pendingEntries.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
              </span>{' '}
              to the Church Admin.
            </p>
            <p className="text-sm text-gray-500">
              Your {pendingEntries.length} pending {pendingEntries.length === 1 ? 'entry' : 'entries'} will be
              counted only after the church admin reviews and approves them.
            </p>
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Pending Entries</div>
              {pendingEntries.map((c) => (
                <div key={c._id} className="flex justify-between px-4 py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-700">{contributorLabel(c)}</span>
                  <span className="text-sm font-semibold text-gray-900">₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
