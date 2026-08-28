'use client';

import { useState, useEffect, useCallback } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { CheckCircle, Coins, Pencil } from 'lucide-react';

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
    entryType?: 'normal' | 'absent' | 'offering';
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

  const saveEditedAmount = async (stothrakazhchaId: string, contributorSubId: string, newAmountStr: string) => {
    const value = Number(newAmountStr);
    if (isNaN(value) || value < 0) {
      toast.error('Amount cannot be negative');
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

  const entryTypeBadge = (type?: string) => {
    if (type === 'absent')
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Absent · Due calculated</span>;
    if (type === 'offering')
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Offerings · No due</span>;
    return null;
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
        <p className="text-gray-600">Stothrakazhcha entries marked by Kudumbakutayima Admins</p>
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
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-gray-800">{entry.contributorName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 capitalize">{entry.contributor.contributorType}</p>
                            {entryTypeBadge(entry.contributor.entryType)}
                          </div>
                        </div>

                        {/* Editable amount — hidden for absent/offering */}
                        <div className="flex items-center gap-2">
                          {entry.contributor.entryType && entry.contributor.entryType !== 'normal' ? (
                            <span className="text-sm font-semibold text-gray-400">₹0</span>
                          ) : isEditing ? (
                            <>
                              <span className="text-sm text-gray-500">₹</span>
                              <input
                                type="number"
                                min="0"
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
