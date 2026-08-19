'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { CheckCircle, ArrowLeft, Pencil, Users, Clock, TrendingUp } from 'lucide-react';

interface BkEntry {
  _id: string;
  contributorType: 'Member' | 'House';
  amount: number;
  approvalStatus: 'pending_approval' | 'approved' | 'rejected';
  contributorName: string;
}

interface BkGroup {
  bavanakutayimaId: string | null;
  bavanakutayimaName: string;
  entries: BkEntry[];
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface WeekDetail {
  _id: string;
  weekNumber: number;
  year: number;
  status: 'active' | 'closed' | 'processed';
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  totalCollected: number;
  totalContributors: number;
  groups: BkGroup[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
  processed: 'bg-blue-100 text-blue-800',
};

export default function StothrakazhchaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const api = createRoleApi('church_admin');

  const [week, setWeek] = useState<WeekDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.get(`/stothrakazhcha/${id}/by-bavanakutayima`);
      setWeek(res.data?.data || null);
    } catch {
      toast.error('Failed to load week details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const saveAmount = async (stothrakazhchaId: string, entryId: string, newAmountStr: string) => {
    const value = Number(newAmountStr);
    if (!value || value <= 0) { toast.error('Enter a valid amount'); return; }
    setSavingId(entryId);
    try {
      await api.put(`/approvals/stothrakazhcha/${stothrakazhchaId}/contributors/${entryId}`, { amount: value });
      toast.success('Amount updated');
      setEditAmounts((prev) => { const n = { ...prev }; delete n[entryId]; return n; });
      fetchDetail();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update amount');
    } finally {
      setSavingId(null);
    }
  };

  const approveGroup = async (group: BkGroup) => {
    if (!week || !group.bavanakutayimaId) {
      toast.error('Cannot identify bavanakutayima for this group');
      return;
    }
    if (!confirm(`Approve all ${group.pendingCount} pending contribution(s) for ${group.bavanakutayimaName}?\n\nTotal: ₹${group.totalAmount.toLocaleString('en-IN')}`)) return;

    setActingId(`group_${group.bavanakutayimaId}`);
    try {
      await api.post(`/approvals/stothrakazhcha/${week._id}/bavanakutayima/${group.bavanakutayimaId}/approve-all`, {});
      toast.success(`${group.pendingCount} contribution(s) approved`);
      fetchDetail();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to approve group');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="text-center py-16 text-gray-500">Week not found.</div>
    );
  }

  const totalPending = week.groups.reduce((s, g) => s + g.pendingCount, 0);
  const totalApproved = week.groups.reduce((s, g) => s + g.approvedCount, 0);
  const grandTotal = week.groups.reduce((s, g) => s + g.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> All Weeks
        </button>
        <span className="text-gray-300">/</span>
        <h2 className="text-xl font-bold text-gray-800">
          Week {week.weekNumber}, {week.year}
        </h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[week.status] || 'bg-gray-100 text-gray-700'}`}>
          {week.status}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500">Total collected</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{totalPending}</p>
            <p className="text-xs text-gray-500">Pending approval</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{totalApproved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
        </div>
      </div>

      {/* BK groups */}
      {week.groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          No contributions recorded yet
        </div>
      ) : (
        week.groups.map((group) => {
          const isActing = actingId === `group_${group.bavanakutayimaId}`;
          return (
            <div key={group.bavanakutayimaId || 'unknown'} className="bg-white rounded-xl shadow overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-6 py-4 bg-green-50 border-b border-green-100">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{group.bavanakutayimaName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    ₹{group.totalAmount.toLocaleString('en-IN')} total &middot;{' '}
                    <span className="text-amber-600 font-medium">{group.pendingCount} pending</span>
                    {' '}&middot;{' '}
                    <span className="text-green-600 font-medium">{group.approvedCount} approved</span>
                    {group.rejectedCount > 0 && (
                      <> &middot; <span className="text-red-500 font-medium">{group.rejectedCount} rejected</span></>
                    )}
                  </p>
                </div>
                {group.pendingCount > 0 && (
                  <button
                    onClick={() => approveGroup(group)}
                    disabled={isActing || !group.bavanakutayimaId}
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isActing ? 'Approving...' : 'Approve All'}
                  </button>
                )}
              </div>

              {/* Per-member rows */}
              {group.entries.map((entry) => {
                const isEditing = entry._id in editAmounts;
                return (
                  <div key={entry._id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{entry.contributorName}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        entry.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        entry.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.approvalStatus === 'pending_approval' ? 'Pending' :
                         entry.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <span className="text-sm text-gray-500">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={editAmounts[entry._id]}
                            onChange={(e) => setEditAmounts((p) => ({ ...p, [entry._id]: e.target.value }))}
                            className="w-24 border border-green-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveAmount(week._id, entry._id, editAmounts[entry._id])}
                            disabled={savingId === entry._id}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {savingId === entry._id ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditAmounts((p) => { const n = { ...p }; delete n[entry._id]; return n; })}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-green-700">
                            ₹{entry.amount.toLocaleString('en-IN')}
                          </span>
                          {entry.approvalStatus === 'pending_approval' && (
                            <button
                              onClick={() => setEditAmounts((p) => ({ ...p, [entry._id]: String(entry.amount) }))}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              title="Edit amount"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
