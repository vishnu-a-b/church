'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Heart, Coins } from 'lucide-react';

interface SpiritualActivity {
  _id: string;
  activityType: string;
  memberId: { firstName: string; lastName: string } | null;
  markedBy: { username: string; email: string } | null;
  createdAt: string;
}

interface StothrakazhchaContribution {
  stothrakazhchaId: string;
  weekNumber: number;
  year: number;
  contributor: {
    _id: string;
    contributorId: string;
    contributorType: 'Member' | 'House';
    amount: number;
    contributedAt: string;
  };
}

export default function ChurchAdminApprovalsPage() {
  const api = createRoleApi('church_admin');
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [contributions, setContributions] = useState<StothrakazhchaContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await api.get('/approvals/pending');
      setActivities(response.data?.data?.spiritualActivities || []);
      setContributions(response.data?.data?.stothrakazhchaContributions || []);
    } catch (error) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

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

  const handleContributionDecision = async (
    stothrakazhchaId: string,
    contributorId: string,
    decision: 'approve' | 'reject'
  ) => {
    setActingId(contributorId);
    try {
      const reason = decision === 'reject' ? prompt('Reason for rejection (optional):') || undefined : undefined;
      await api.post(
        `/approvals/stothrakazhcha/${stothrakazhchaId}/contributors/${contributorId}/${decision}`,
        { rejectedReason: reason }
      );
      toast.success(`Entry ${decision}d`);
      fetchPending();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${decision}`);
    } finally {
      setActingId(null);
    }
  };

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
          Entries marked by Kudumbakutayima Admins — only counted once approved
        </p>
      </div>

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
                    {a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : 'Unknown member'} — <span className="capitalize">{a.activityType}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Marked by {a.markedBy?.username || a.markedBy?.email || 'unknown'} on {new Date(a.createdAt).toLocaleDateString('en-IN')}
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">Sthothrakazhcha Contributions ({contributions.length})</h3>
        </div>
        {contributions.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No pending Sthothrakazhcha contributions</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {contributions.map((c) => (
              <div key={c.contributor._id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Week {c.weekNumber}, {c.year} — ₹{c.contributor.amount.toLocaleString()} ({c.contributor.contributorType})
                  </p>
                  <p className="text-xs text-gray-500">
                    Marked on {new Date(c.contributor.contributedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleContributionDecision(c.stothrakazhchaId, c.contributor._id, 'approve')}
                    disabled={actingId === c.contributor._id}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleContributionDecision(c.stothrakazhchaId, c.contributor._id, 'reject')}
                    disabled={actingId === c.contributor._id}
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
    </div>
  );
}
