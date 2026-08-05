'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Coins, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
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
  markedBy?: string;
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
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contributorId, setContributorId] = useState('');
  const [amount, setAmount] = useState('');

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
    } catch (error) {
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    const response = await api.get('/members');
    setMembers(response.data?.data || []);
  };

  const fetchHouses = async () => {
    const response = await api.get('/houses');
    setHouses(response.data?.data || []);
  };

  const contributorLabel = (c: Contributor) => {
    if (c.contributorType === 'Member') {
      const m = members.find((mm) => mm._id === c.contributorId);
      return m ? `${m.firstName} ${m.lastName}` : c.contributorId;
    }
    const h = houses.find((hh) => hh._id === c.contributorId);
    return h ? h.familyName : c.contributorId;
  };

  const handleSubmit = async () => {
    if (!current) return;
    if (!contributorId || !amount || Number(amount) <= 0) {
      toast.error('Select a member and enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/approvals/stothrakazhcha/${current._id}/mark-pending`, {
        contributorId,
        contributorType: current.amountType === 'per_member' ? 'Member' : 'House',
        amount: Number(amount),
      });
      toast.success('Marked as pending approval');
      setShowModal(false);
      setContributorId('');
      setAmount('');
      fetchCurrentWeek();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Approved</span>;
    if (status === 'rejected') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejected</span>;
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

  const groupContributors = current.contributors || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sthothrakazhcha — Week {current.weekNumber}, {current.year}</h2>
          <p className="text-gray-600">Mark contributions for your group — counted only once approved</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <Plus className="w-5 h-5" /> Mark Contribution
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupContributors.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No contributions marked yet</td></tr>
            ) : (
              groupContributors.map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{contributorLabel(c)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{c.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">{statusBadge(c.approvalStatus)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold">Mark Sthothrakazhcha Contribution</h3>
            <select value={contributorId} onChange={(e) => setContributorId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
              <option value="">
                {current.amountType === 'per_member' ? 'Select member...' : 'Select house...'}
              </option>
              {(current.amountType === 'per_member' ? members : houses).map((entity: any) => (
                <option key={entity._id} value={entity._id}>
                  {current.amountType === 'per_member' ? `${entity.firstName} ${entity.lastName}` : entity.familyName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={`Amount (default ₹${current.defaultAmount})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                {submitting ? 'Marking...' : 'Mark as Pending'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
