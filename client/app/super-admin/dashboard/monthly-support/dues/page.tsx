'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { MonthlySupportPlan, MonthlySupportDue } from '@/types';
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SuperAdminMonthlySupportDuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const api = createRoleApi('super_admin');

  const [plan, setPlan] = useState<MonthlySupportPlan | null>(null);
  const [dues, setDues] = useState<MonthlySupportDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [unpaidOnly, setUnpaidOnly] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState<MonthlySupportDue | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [generatingDues, setGeneratingDues] = useState(false);

  useEffect(() => {
    if (planId) {
      fetchData();
    }
  }, [planId, unpaidOnly]);

  const fetchData = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const [planRes, duesRes] = await Promise.all([
        api.get(`/monthly-support-plans/${planId}`),
        api.get(`/monthly-support-plans/${planId}/dues${unpaidOnly ? '?unpaidOnly=true' : ''}`),
      ]);
      setPlan(planRes.data?.data || null);
      setDues(duesRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching monthly support dues:', error);
      toast.error('Failed to load dues');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDues = async () => {
    if (!planId) return;
    setGeneratingDues(true);
    try {
      const response = await api.post(`/monthly-support-plans/${planId}/generate-dues`);
      toast.success(response.data?.message || 'Dues generated');
      fetchData();
    } catch (error: any) {
      console.error('Error generating dues:', error);
      toast.error(error.response?.data?.error || 'Failed to generate dues');
    } finally {
      setGeneratingDues(false);
    }
  };

  const openPaymentModal = (due: MonthlySupportDue) => {
    setSelectedDue(due);
    setPaymentAmount(String(due.balance));
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedDue || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedDue.balance) {
      toast.error('Payment amount cannot exceed remaining balance');
      return;
    }

    setProcessingPayment(true);
    try {
      await api.post('/dues/pay', {
        dueId: selectedDue._id,
        dueType: 'monthly_support',
        amount,
        paymentMethod,
      });

      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedDue(null);
      setPaymentAmount('');
      fetchData();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const contributorName = (due: MonthlySupportDue) => due.dueForName;
  const isDonorDue = (due: MonthlySupportDue) => due.dueForModel === 'Donor';

  const totalOutstanding = dues.reduce((sum, d) => sum + (d.isPaid ? 0 : d.balance), 0);
  const totalPaid = dues.reduce((sum, d) => sum + d.paidAmount, 0);

  if (!planId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No plan selected.</p>
        <button onClick={() => router.push('/super-admin/dashboard/monthly-support')} className="text-purple-600 hover:underline mt-2">
          Back to Monthly Support
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/super-admin/dashboard/monthly-support')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Monthly Support
          </button>
          <h2 className="text-2xl font-bold text-gray-800">{plan ? plan.name : 'Monthly Support Dues'}</h2>
          {plan?.description && <p className="text-gray-600">{plan.description}</p>}
        </div>
        <button
          onClick={handleGenerateDues}
          disabled={generatingDues}
          title="Dues are otherwise only created by a daily 7am job — use this if a plan or its members changed today"
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${generatingDues ? 'animate-spin' : ''}`} />
          {generatingDues ? 'Generating...' : 'Generate This Month\'s Dues'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={unpaidOnly}
              onChange={(e) => setUnpaidOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            Show unpaid dues only
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {unpaidOnly ? 'No unpaid dues — everything is collected' : 'No dues generated yet for this plan'}
                  </td>
                </tr>
              ) : (
                dues.map((due) => (
                  <tr key={due._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{due.periodMonth}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contributorName(due)}
                      {isDonorDue(due) && (
                        <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Outside Donor</span>
                      )}
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!due.isPaid && (
                        <button
                          onClick={() => openPaymentModal(due)}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <DollarSign className="w-4 h-4" />
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Collect Payment — {contributorName(selectedDue)}</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedDue.periodMonth} · Balance ₹{selectedDue.balance.toLocaleString('en-IN')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  max={selectedDue.balance}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This records a transaction for {isDonorDue(selectedDue) ? 'this donor' : "this member and updates their wallet balance"}.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedDue(null);
                  }}
                  disabled={processingPayment}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={processingPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
