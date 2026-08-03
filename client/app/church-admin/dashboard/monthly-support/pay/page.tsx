'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { MonthlySupportPlan, MonthlySupportMember } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const planMemberId = (m: MonthlySupportMember): string => {
  if (m.memberId) return typeof m.memberId === 'string' ? m.memberId : m.memberId._id;
  return typeof m.donorId === 'string' ? m.donorId! : m.donorId!._id;
};

const planMemberName = (m: MonthlySupportMember): string => {
  if (m.memberId) {
    if (typeof m.memberId === 'string') return 'Member';
    return `${m.memberId.firstName} ${m.memberId.lastName || ''}`.trim();
  }
  if (m.donorId) {
    return typeof m.donorId === 'string' ? 'Donor' : m.donorId.name;
  }
  return 'Unknown';
};

const planMemberIsDonor = (m: MonthlySupportMember): boolean => !!m.donorId;

export default function MonthlySupportAddPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const api = createRoleApi('church_admin');

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<MonthlySupportPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entryIdInput, setEntryIdInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [methodInput, setMethodInput] = useState('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [monthsInput, setMonthsInput] = useState('1');

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    if (!planId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/monthly-support-plans/${planId}`);
      setPlan(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryChange = (value: string) => {
    setEntryIdInput(value);
    const entry = plan?.members.find((m) => planMemberId(m) === value);
    setAmountInput(String(entry?.amount ?? plan?.defaultAmount ?? ''));
  };

  const handleSubmit = async () => {
    if (!plan || !entryIdInput) {
      toast.error('Select a member/donor');
      return;
    }
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const entry = plan.members.find((m) => planMemberId(m) === entryIdInput);
    if (!entry) return;

    const months = Math.max(1, parseInt(monthsInput) || 1);

    setSubmitting(true);
    try {
      const response = await api.post(`/monthly-support-plans/${plan._id}/pay`, {
        memberId: entry.memberId ? entryIdInput : undefined,
        donorId: entry.donorId ? entryIdInput : undefined,
        amount,
        paymentMethod: methodInput,
        referenceNo: methodInput !== 'cash' ? (referenceNo.trim() || undefined) : undefined,
        paymentDate: dateInput || undefined,
        months,
      });
      const message = response.data?.message || 'Payment recorded successfully';
      if (response.data?.success) {
        toast.success(message);
        router.push('/church-admin/dashboard/monthly-support');
      } else {
        toast.error(message);
      }
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!planId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No plan selected.</p>
        <button onClick={() => router.push('/church-admin/dashboard/monthly-support')} className="text-purple-600 hover:underline mt-2">
          Back to Monthly Support
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Plan not found.</p>
        <button onClick={() => router.push('/church-admin/dashboard/monthly-support')} className="text-purple-600 hover:underline mt-2">
          Back to Monthly Support
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/church-admin/dashboard/monthly-support')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monthly Support
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Add Payment</h2>
        <p className="text-gray-600">{plan.name}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member / Donor *</label>
            <select
              value={entryIdInput}
              onChange={(e) => handleEntryChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Choose...</option>
              {plan.members.map((m) => (
                <option key={planMemberId(m)} value={planMemberId(m)}>
                  {planMemberName(m)}{planMemberIsDonor(m) ? ' (Outside Donor)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select
              value={methodInput}
              onChange={(e) => setMethodInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {methodInput !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference No (optional)</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Bank ref / UPI txn ID / cheque no."
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Months</label>
            <input
              type="number"
              min="1"
              max="36"
              value={monthsInput}
              onChange={(e) => setMonthsInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">For paying in advance — settles this many upcoming months at the amount above, one receipt each. Already-paid months are skipped automatically.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This creates each month&apos;s due for this member if it doesn&apos;t exist yet, records the payment against it, and syncs to EDV.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push('/church-admin/dashboard/monthly-support')}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || plan.members.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
