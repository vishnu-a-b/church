'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';
import { MonthlySupportPlan, MonthlySupportMember } from '@/types';
import { ArrowLeft, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

const paySchema = z.object({
  entryId: z.string().min(1, 'Select a member/donor'),
  amount: z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Enter a valid amount'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'cheque']),
  referenceNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment date is required'),
  months: z.coerce.number().int().min(1, 'Must be between 1 and 36').max(36, 'Must be between 1 and 36'),
});

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

const planMemberJgcc = (m: MonthlySupportMember): string | null => {
  if (!m.donorId || typeof m.donorId === 'string') return null;
  const notes: string = (m.donorId as any).notes || '';
  const match = notes.match(/JGCC_NOS:([^|]+)/);
  return match ? match[1].trim() : null;
};

export default function MonthlySupportAddPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const api = createRoleApi('church_admin');

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<MonthlySupportPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const [entryIdInput, setEntryIdInput] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberStats, setMemberStats] = useState<{ totalPaid: number; paidTerms: number; dueBalance: number; lastPaidAmount: number; lastPaidDate: string | null } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
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

  const handleEntryChange = async (value: string) => {
    setEntryIdInput(value);
    const entry = plan?.members.find((m) => planMemberId(m) === value);
    setAmountInput(String(entry?.amount ?? plan?.defaultAmount ?? ''));
    setMemberStats(null);
    if (!planId || !value) return;
    setLoadingStats(true);
    try {
      const res = await api.get(`/monthly-support-plans/${planId}/dues`);
      const allDues: any[] = res.data?.data || [];
      const myDues = allDues.filter((d: any) => {
        const id = typeof d.dueForId === 'object' ? d.dueForId?._id : d.dueForId;
        return id === value;
      });
      const totalPaid = myDues.reduce((s: number, d: any) => s + (d.paidAmount || 0), 0);
      const dueBalance = myDues.filter((d: any) => !d.isPaid).reduce((s: number, d: any) => s + (d.balance || 0), 0);
      const lastPaid = myDues
        .filter((d: any) => d.isPaid && d.paidAt)
        .sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
      const memberAmount = entry?.amount ?? plan?.defaultAmount ?? 0;
      setMemberStats({
        totalPaid,
        paidTerms: memberAmount > 0 ? Math.floor(totalPaid / memberAmount) : 0,
        dueBalance,
        lastPaidAmount: lastPaid?.paidAmount ?? 0,
        lastPaidDate: lastPaid?.paidAt ?? null,
      });
    } catch {
      // non-critical — just don't show stats
    } finally {
      setLoadingStats(false);
    }
  };

  const clearEntry = () => {
    setEntryIdInput('');
    setAmountInput('');
    setMemberSearch('');
    setMemberStats(null);
  };

  const selectedMemberName = entryIdInput
    ? plan?.members.find((m) => planMemberId(m) === entryIdInput)
    : null;

  const filteredPlanMembers = (plan?.members || []).filter((m) => {
    const term = memberSearch.toLowerCase();
    if (!term) return true;
    const jgcc = planMemberJgcc(m) || '';
    return planMemberName(m).toLowerCase().includes(term) || jgcc.toLowerCase().includes(term);
  });

  const handleSubmit = async () => {
    if (!plan) return;

    const result = validateForm(paySchema, {
      entryId: entryIdInput,
      amount: amountInput,
      paymentMethod: methodInput,
      referenceNo,
      paymentDate: dateInput,
      months: monthsInput,
    });
    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});

    const entry = plan.members.find((m) => planMemberId(m) === result.data.entryId);
    if (!entry) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/monthly-support-plans/${plan._id}/pay`, {
        memberId: entry.memberId ? result.data.entryId : undefined,
        donorId: entry.donorId ? result.data.entryId : undefined,
        amount: result.data.amount,
        paymentMethod: result.data.paymentMethod,
        referenceNo: result.data.paymentMethod !== 'cash' ? (result.data.referenceNo?.trim() || undefined) : undefined,
        paymentDate: result.data.paymentDate,
        months: result.data.months,
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
            <div className="relative">
              {selectedMemberName ? (
                <div className="flex items-center gap-2 border border-green-400 bg-green-50 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm font-medium text-gray-800 flex flex-wrap items-center gap-1.5">
                    {planMemberName(selectedMemberName)}
                    {planMemberIsDonor(selectedMemberName) && (
                      <span className="text-xs text-amber-600 font-normal">Outside Donor</span>
                    )}
                    {planMemberJgcc(selectedMemberName) && (
                      <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                        {planMemberJgcc(selectedMemberName)}
                      </span>
                    )}
                  </span>
                  <button type="button" onClick={clearEntry} className="text-gray-400 hover:text-red-500 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search member or donor..."
                    value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setShowMemberDropdown(true); }}
                    onFocus={() => setShowMemberDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formErrors.entryId ? 'border-red-400' : 'border-gray-300'}`}
                  />
                </>
              )}
              {showMemberDropdown && !selectedMemberName && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
                  {filteredPlanMembers.length === 0 ? (
                    <p className="text-sm text-gray-400 p-3">No results</p>
                  ) : (
                    filteredPlanMembers.map((m) => (
                      <button
                        key={planMemberId(m)}
                        type="button"
                        onMouseDown={() => { handleEntryChange(planMemberId(m)); setMemberSearch(''); setShowMemberDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-purple-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-gray-800">{planMemberName(m)}</span>
                          {planMemberIsDonor(m) && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Outside Donor</span>
                          )}
                          {planMemberJgcc(m) && (
                            <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                              {planMemberJgcc(m)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <FieldError message={formErrors.entryId} />
          </div>

          {/* Member stats */}
          {selectedMemberName && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              {loadingStats ? (
                <p className="text-gray-400 text-xs">Loading payment history...</p>
              ) : memberStats ? (
                <div className="grid grid-cols-2 gap-3 text-center mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Paid</p>
                    <p className="font-bold text-green-700">₹{memberStats.totalPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Balance</p>
                    <p className={`font-bold ${memberStats.dueBalance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {memberStats.dueBalance > 0 ? `₹${memberStats.dueBalance.toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center border-t border-gray-200 pt-3">
                  <div>
                    <p className="text-xs text-gray-500">Terms Paid</p>
                    <p className="font-bold text-blue-700">{memberStats.paidTerms} month{memberStats.paidTerms !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Payment</p>
                    {memberStats.lastPaidDate ? (
                      <>
                        <p className="font-bold text-gray-700">₹{memberStats.lastPaidAmount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(memberStats.lastPaidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-400">—</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 ${formErrors.amount ? 'border-red-400' : 'border-gray-300'}`}
            />
            <FieldError message={formErrors.amount} />
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
              className={`w-full border rounded-lg px-4 py-2 ${formErrors.paymentDate ? 'border-red-400' : 'border-gray-300'}`}
            />
            <FieldError message={formErrors.paymentDate} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Months</label>
            <input
              type="number"
              min="1"
              max="36"
              value={monthsInput}
              onChange={(e) => setMonthsInput(e.target.value)}
              className={`w-full border rounded-lg px-4 py-2 ${formErrors.months ? 'border-red-400' : 'border-gray-300'}`}
            />
            <p className="text-xs text-gray-500 mt-1">For paying in advance — settles this many upcoming months at the amount above, one receipt each. Already-paid months are skipped automatically.</p>
            <FieldError message={formErrors.months} />
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
