'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Calendar, Users, TrendingUp, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Stothrakazhcha {
  _id: string;
  churchId: any;
  weekNumber: number;
  year: number;
  weekStartDate: Date;
  weekEndDate: Date;
  dueDate: Date;
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  status: 'active' | 'closed' | 'processed';
  contributors: Array<{
    contributorId: string;
    contributorType: 'Member' | 'House';
    amount: number;
    contributedAt: Date;
  }>;
  totalCollected: number;
  totalContributors: number;
  duesProcessed: boolean;
}

interface StothrakazhchaDue {
  _id: string;
  weekNumber: number;
  year: number;
  amount: number;
  isPaid: boolean;
  paidAmount: number;
  balance: number;
  dueDate: Date;
  stothrakazhchaId: any;
}

export default function MemberStothrakazhchaPage() {
  const [currentWeek, setCurrentWeek] = useState<Stothrakazhcha | null>(null);
  const [myDues, setMyDues] = useState<StothrakazhchaDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [processingDues, setProcessingDues] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('member_accessToken');
    const userStr = localStorage.getItem('member_user');

    if (!token || !userStr) return;

    const user = JSON.parse(userStr);
    setMemberId(user.memberId || user._id);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      // Fetch current week's Stothrakazhcha
      const weekResponse = await axios.get(`${apiUrl}/stothrakazhcha/current/week`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (weekResponse.data.success) {
        setCurrentWeek(weekResponse.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching current week:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load current week data');
      }
    }

    try {
      // Fetch my dues
      if (user.memberId || user._id) {
        const duesResponse = await axios.get(
          `${apiUrl}/stothrakazhcha-dues/entity/Member/${user.memberId || user._id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (duesResponse.data.success) {
          setMyDues(duesResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dues:', error);
    }

    setLoading(false);
  };

  const handleAddContribution = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!currentWeek) {
      toast.error('No active Stothrakazhcha for this week');
      return;
    }

    const token = localStorage.getItem('member_accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      await axios.post(
        `${apiUrl}/stothrakazhcha/${currentWeek._id}/contribute`,
        { amount: parseFloat(paymentAmount) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success('Contribution added successfully!');
      setShowPaymentModal(false);
      setPaymentAmount('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding contribution:', error);
      toast.error(error.response?.data?.error || 'Failed to add contribution');
    }
  };

  const handleProcessDues = async () => {
    if (!confirm('This will process dues for all overdue Stothrakazhchas. Continue?')) return;

    setProcessingDues(true);
    const token = localStorage.getItem('member_accessToken');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      const response = await axios.post(
        `${apiUrl}/stothrakazhcha-dues/process`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success(
        `Dues processed successfully! ${response.data?.data?.totalMembersProcessed || 0} members, ${response.data?.data?.totalHousesProcessed || 0} houses`
      );
      fetchData();
    } catch (error: any) {
      console.error('Error processing dues:', error);
      toast.error(error.response?.data?.error || 'Failed to process dues');
    } finally {
      setProcessingDues(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasContributed = currentWeek?.contributors?.some(
    (c) => String(c.contributorId) === String(memberId)
  );

  const myContribution = currentWeek?.contributors?.find(
    (c) => String(c.contributorId) === String(memberId)
  );

  const unpaidDues = myDues.filter((d) => !d.isPaid);
  const totalUnpaid = unpaidDues.reduce((sum, d) => sum + d.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stothrakazhcha</h2>
          <p className="text-gray-600">Weekly contributions and dues</p>
        </div>
      </div>

      {/* Current Week Section */}
      {currentWeek ? (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">Week {currentWeek.weekNumber}, {currentWeek.year}</h3>
              <p className="text-purple-100 text-sm">
                {formatDate(currentWeek.weekStartDate)} - {formatDate(currentWeek.weekEndDate)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <p className="text-xs uppercase tracking-wide">{currentWeek.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5" />
                <p className="text-sm text-purple-100">Total Collected</p>
              </div>
              <p className="text-2xl font-bold">₹{currentWeek.totalCollected}</p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <p className="text-sm text-purple-100">Contributors</p>
              </div>
              <p className="text-2xl font-bold">{currentWeek.totalContributors}</p>
            </div>

            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <p className="text-sm text-purple-100">Average Amount</p>
              </div>
              <p className="text-2xl font-bold">
                ₹{currentWeek.totalContributors > 0
                  ? (currentWeek.totalCollected / currentWeek.totalContributors).toFixed(2)
                  : '0'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {hasContributed ? (
              <div className="bg-green-500 bg-opacity-30 border border-green-300 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-sm font-medium">
                  ✓ You contributed ₹{myContribution?.amount}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Contribution
              </button>
            )}

            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm">Due Date: {formatDate(currentWeek.dueDate)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No active Stothrakazhcha for this week</p>
        </div>
      )}

      {/* My Dues Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">My Dues</h3>
            <p className="text-sm text-gray-600">Outstanding Stothrakazhcha payments</p>
          </div>
          {unpaidDues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-sm font-medium text-red-800">
                Total Unpaid: ₹{totalUnpaid}
              </p>
            </div>
          )}
        </div>

        {myDues.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No dues found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myDues.map((due) => (
                  <tr key={due._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Week {due.weekNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{due.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{due.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{due.paidAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ₹{due.balance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          due.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {due.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(due.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Contribution</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter amount"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <strong>Note:</strong> This is a variable payment. You can contribute any amount you wish.
                </p>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={handleProcessDues}
                  disabled={processingDues}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 mb-3"
                >
                  {processingDues ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing Dues...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Process Due
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  This will calculate and assign dues to non-contributors
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContribution}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Contribution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
