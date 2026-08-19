'use client';

import { useState, useEffect, useCallback } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Heart, Coins, Pencil } from 'lucide-react';

interface SpiritualActivity {
  _id: string;
  activityType: string;
  memberId: { firstName: string; lastName: string } | null;
  markedBy: { username: string; email: string } | null;
  createdAt: string;
}

interface PendingContribution {
  stothrakazhchaId: string;
  weekNumber: number;
  year: number;
  bavanakutayimaId: string | null;
  bavanakutayimaName: string | null;
  contributorName: string;
  contributor: {
    _id: string;
    contributorType: 'Member' | 'House';
    amount: number;
    contributedAt: string;
  };
}

interface BkGroup {
  bkId: string | null;
  bkName: string;
  stothrakazhchaId: string;
  weekNumber: number;
  year: number;
  entries: PendingContribution[];
}

// Per-entry local amount state (pre-edit before approving)
type AmountMap = Record<string, number>; // contributorSubId → amount

export default function ChurchAdminApprovalsPage() {
  const api = createRoleApi('church_admin');
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [bkGroups, setBkGroups] = useState<BkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  // Track locally edited amounts (contributorSubId → new amount string)
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});
  const [savingAmountId, setSavingAmountId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/approvals/pending');
      setActivities(response.data?.data?.spiritualActivities || []);
      const contributions: PendingContribution[] = response.data?.data?.stothrakazhchaContributions || [];

      // Group by bavanakutayima
      const grouped: Record<string, BkGroup> = {};
      for (const c of contributions) {
        const key = `${c.stothrakazhchaId}__${c.bavanakutayimaId || 'unknown'}`;
        if (!grouped[key]) {
          grouped[key] = {
            bkId: c.bavanakutayimaId,
            bkName: c.bavanakutayimaName || 'Unknown Group',
            stothrakazhchaId: c.stothrakazhchaId,
            weekNumber: c.weekNumber,
            year: c.year,
            entries: [],
          };
        }
        grouped[key].entries.push(c);
      }
      setBkGroups(Object.values(grouped));
      setEditAmounts({});
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleActivityDecision = async (id: string, decision: 'approve' | 'reject') => {
    setActingId(id);
    try {
      const reason = decision === 'reject' ? prompt('Reason for rejection (optional):') || undefined : undefined;
      await api.post(`/approvals/spiritual-activities/${id}/${decision}`, { rejectedReason: reason });
      toast.success(`Entry ${decision}d`);
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${decision}`);
    } finally {
      setActingId(null);
    }
  };

  const saveEditedAmount = async (stothrakazhchaId: string, contributorSubId: string, newAmountStr: string) => {
    const value = Number(newAmountStr);
    if (!value || value <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSavingAmountId(contributorSubId);
    try {
      await api.put(
        `/approvals/stothrakazhcha/${stothrakazhchaId}/contributors/${contributorSubId}`,
        { amount: value }
      );
      toast.success('Amount updated');
      // Update local state so UI reflects immediately
      setBkGroups((prev) =>
        prev.map((g) => ({
          ...g,
          entries: g.entries.map((e) =>
            e.contributor._id === contributorSubId
              ? { ...e, contributor: { ...e.contributor, amount: value } }
              : e
          ),
        }))
      );
      setEditAmounts((prev) => {
        const next = { ...prev };
        delete next[contributorSubId];
        return next;
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update amount');
    } finally {
      setSavingAmountId(null);
    }
  };

  const approveGroup = async (group: BkGroup) => {
    if (!group.bkId) {
      toast.error('Cannot identify bavanakutayima for this group');
      return;
    }
    const total = group.entries.reduce((s, e) => s + e.contributor.amount, 0);
    if (!confirm(`Approve all ${group.entries.length} contributions for ${group.bkName}?\n\nTotal: ₹${total.toLocaleString('en-IN')}`)) return;

    setActingId(`group_${group.bkId}`);
    try {
      await api.post(
        `/approvals/stothrakazhcha/${group.stothrakazhchaId}/bavanakutayima/${group.bkId}/approve-all`,
        {}
      );
      toast.success(`${group.entries.length} contribution(s) approved`);
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve group');
    } finally {
      setActingId(null);
    }
  };

  const totalPending = bkGroups.reduce((s, g) => s + g.entries.length, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
        <p className="text-gray-600">
          Entries marked by Kudumbakutayima Admins — counted only once approved
        </p>
      </div>

      {/* Spiritual Activities */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-rose-50 px-6 py-3 border-b border-rose-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-rose-900">Spiritual Activities ({activities.length})</h3>
        </div>
        {activities.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No pending spiritual activities</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((a) => (
              <div key={a._id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : 'Unknown member'}{' '}
                    — <span className="capitalize">{a.activityType.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Marked by {a.markedBy?.username || a.markedBy?.email || 'unknown'} on{' '}
                    {new Date(a.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleActivityDecision(a._id, 'approve')}
                    disabled={actingId === a._id}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleActivityDecision(a._id, 'reject')}
                    disabled={actingId === a._id}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stothrakazhcha grouped by BK */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">
            Sthothrakazhcha Contributions ({totalPending} pending)
          </h3>
        </div>
        {bkGroups.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No pending Sthothrakazhcha contributions</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {bkGroups.map((group) => {
              const total = group.entries.reduce((s, e) => s + e.contributor.amount, 0);
              const isActing = actingId === `group_${group.bkId}`;

              return (
                <div key={`${group.stothrakazhchaId}_${group.bkId}`} className="p-0">
                  {/* BK group header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-green-50 border-b border-green-100">
                    <div>
                      <p className="font-semibold text-gray-900">{group.bkName}</p>
                      <p className="text-sm text-gray-500">
                        Week {group.weekNumber}, {group.year} &middot; {group.entries.length} members &middot;{' '}
                        <span className="font-semibold text-green-700">₹{total.toLocaleString('en-IN')} total</span>
                      </p>
                    </div>
                    <button
                      onClick={() => approveGroup(group)}
                      disabled={isActing || !group.bkId}
                      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isActing ? 'Approving...' : 'Approve All'}
                    </button>
                  </div>

                  {/* Per-member rows */}
                  {group.entries.map((entry) => {
                    const subId = entry.contributor._id;
                    const isEditing = subId in editAmounts;
                    const displayAmount = isEditing ? editAmounts[subId] : String(entry.contributor.amount);

                    return (
                      <div
                        key={subId}
                        className="flex items-center justify-between px-6 py-3 border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{entry.contributorName}</p>
                          <p className="text-xs text-gray-500 capitalize">{entry.contributor.contributorType}</p>
                        </div>

                        {/* Editable amount */}
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <span className="text-sm text-gray-500">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={editAmounts[subId]}
                                onChange={(e) =>
                                  setEditAmounts((prev) => ({ ...prev, [subId]: e.target.value }))
                                }
                                className="w-24 border border-green-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  saveEditedAmount(entry.stothrakazhchaId, subId, editAmounts[subId])
                                }
                                disabled={savingAmountId === subId}
                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                {savingAmountId === subId ? '...' : 'Save'}
                              </button>
                              <button
                                onClick={() =>
                                  setEditAmounts((prev) => {
                                    const next = { ...prev };
                                    delete next[subId];
                                    return next;
                                  })
                                }
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-green-600">
                                ₹{entry.contributor.amount.toLocaleString('en-IN')}
                              </span>
                              <button
                                onClick={() =>
                                  setEditAmounts((prev) => ({
                                    ...prev,
                                    [subId]: String(entry.contributor.amount),
                                  }))
                                }
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                title="Edit amount"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
