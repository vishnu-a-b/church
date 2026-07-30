'use client';

import { useState, useEffect } from 'react';
import { Repeat, CheckCircle, AlertCircle } from 'lucide-react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

interface MonthlySupportDue {
  _id: string;
  planId: { _id: string; name: string } | string;
  planName: string;
  periodMonth: string;
  amount: number;
  isPaid: boolean;
  paidAmount: number;
  balance: number;
  dueDate: string;
  paidAt?: string;
}

export default function MemberMonthlySupportPage() {
  const api = createRoleApi('member');
  const [dues, setDues] = useState<MonthlySupportDue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const response = await api.get('/monthly-support-dues/mine');
      setDues(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching monthly support dues:', error);
      toast.error('Failed to load monthly support dues');
    } finally {
      setLoading(false);
    }
  };

  const planName = (due: MonthlySupportDue) =>
    typeof due.planId === 'object' && due.planId?.name ? due.planId.name : due.planName;

  const totalOutstanding = dues.reduce((sum, d) => sum + (d.isPaid ? 0 : d.balance), 0);
  const totalPaid = dues.reduce((sum, d) => sum + d.paidAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Monthly Support</h2>
        <p className="text-gray-600">Your recurring monthly pledge history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">₹{totalOutstanding.toLocaleString('en-IN')}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Contributed</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    You're not currently on any monthly support plan.
                  </td>
                </tr>
              ) : (
                dues.map((due) => (
                  <tr key={due._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">{planName(due)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{due.periodMonth}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{due.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">₹{due.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">₹{due.balance.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          due.isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {due.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Payments are recorded by your church office when received — this page is for tracking only.
      </p>
    </div>
  );
}
