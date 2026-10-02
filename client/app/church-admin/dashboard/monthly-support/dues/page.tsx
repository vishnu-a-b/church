'use client';

import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';
import { MonthlySupportPlan, MonthlySupportDue } from '@/types';
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign, RefreshCw, Search, X, Eye, Download, Printer, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

const paymentSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'cheque']),
});

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
};

function txField(due: MonthlySupportDue, field: 'paymentMethod' | 'referenceNo' | 'paymentDate' | 'receiptNumber' | '_id') {
  const tx = due.transactionId;
  if (!tx || typeof tx === 'string') return undefined;
  return (tx as any)[field];
}

export default function MonthlySupportDuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const api = createRoleApi('church_admin');

  const [plan, setPlan] = useState<MonthlySupportPlan | null>(null);
  const [dues, setDues] = useState<MonthlySupportDue[]>([]);
  const [registeredNames, setRegisteredNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('');
  const [contributorFilter, setContributorFilter] = useState('');
  const [contributorSearch, setContributorSearch] = useState('');
  const [showContributorDropdown, setShowContributorDropdown] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState<MonthlySupportDue | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [generatingDues, setGeneratingDues] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<FieldErrors>({});

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDue, setViewDue] = useState<MonthlySupportDue | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  // Fetch full contributor list once per plan (independent of period/unpaid filters)
  useEffect(() => {
    if (!planId) return;
    api.get(`/monthly-support-plans/${planId}/dues`).then((res) => {
      const data: MonthlySupportDue[] = res.data?.data || [];
      setRegisteredNames(Array.from(new Set(data.map((d) => d.dueForName))).sort() as string[]);
    }).catch(() => {});
  }, [planId]);

  useEffect(() => {
    if (planId) fetchData();
  }, [planId, unpaidOnly, periodFilter]);

  const fetchData = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (unpaidOnly) params.set('unpaidOnly', 'true');
      if (periodFilter) params.set('periodMonth', periodFilter);
      const [planRes, duesRes] = await Promise.all([
        api.get(`/monthly-support-plans/${planId}`),
        api.get(`/monthly-support-plans/${planId}/dues?${params}`),
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
      toast.error(error.response?.data?.error || 'Failed to generate dues');
    } finally {
      setGeneratingDues(false);
    }
  };

  const openViewModal = (due: MonthlySupportDue) => {
    setViewDue(due);
    setShowViewModal(true);
  };

  const handleDownloadReceipt = async (transactionId: string, receiptNumber: string) => {
    setDownloadingReceipt(true);
    try {
      const response = await api.get(`/transactions/${transactionId}/receipt`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handlePrintReceipt = async (transactionId: string) => {
    try {
      const response = await api.get(`/transactions/${transactionId}/receipt`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const win = window.open(url, '_blank');
      if (win) win.onload = () => win.print();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Failed to print receipt');
    }
  };

  const openPaymentModal = (due: MonthlySupportDue) => {
    setSelectedDue(due);
    setPaymentAmount(String(due.balance));
    setPaymentMethod('cash');
    setPaymentErrors({});
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedDue) return;
    const result = validateForm(paymentSchema, { amount: paymentAmount, paymentMethod });
    if (!result.success) { setPaymentErrors(result.errors); return; }
    if (result.data.amount > selectedDue.balance) {
      setPaymentErrors({ amount: 'Payment amount cannot exceed remaining balance' });
      return;
    }
    setPaymentErrors({});
    setProcessingPayment(true);
    try {
      await api.post('/dues/pay', {
        dueId: selectedDue._id,
        dueType: 'monthly_support',
        amount: result.data.amount,
        paymentMethod: result.data.paymentMethod,
      });
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedDue(null);
      setPaymentAmount('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const isDonorDue = (due: MonthlySupportDue) => due.dueForModel === 'Donor';

  const allPeriods = useMemo(() => {
    const set = new Set(dues.map((d) => d.periodMonth));
    return Array.from(set).sort().reverse();
  }, [dues]);


  const filtered = useMemo(() => {
    if (!contributorFilter) return dues;
    return dues.filter((d) => d.dueForName === contributorFilter);
  }, [dues, contributorFilter]);

  const filteredContributorNames = registeredNames.filter((n) =>
    !contributorSearch || n.toLowerCase().includes(contributorSearch.toLowerCase())
  );

  const totalOutstanding = filtered.reduce((s, d) => s + (d.isPaid ? 0 : d.balance), 0);
  const totalPaid = filtered.reduce((s, d) => s + d.paidAmount, 0);
  const paidCount = filtered.filter((d) => d.isPaid).length;
  const unpaidCount = filtered.filter((d) => !d.isPaid).length;

  if (!planId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No plan selected.</p>
        <button onClick={() => router.push('/church-admin/dashboard/monthly-support')} className="text-teal-600 hover:underline mt-2">
          Back to Monthly Support
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.push('/church-admin/dashboard/monthly-support')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Monthly Support
          </button>
          <h2 className="text-2xl font-bold text-gray-800">{plan ? plan.name : 'Monthly Support Dues'}</h2>
          {plan?.description && <p className="text-gray-600">{plan.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              const data = filtered.map((d, i) => ({
                '#': i + 1,
                'Contributor': d.dueForName,
                'Period': d.periodMonth,
                'Due Amount (₹)': d.dueAmount,
                'Paid Amount (₹)': d.paidAmount,
                'Balance (₹)': d.balance,
                'Status': d.isPaid ? 'Paid' : 'Unpaid',
                'Receipt #': (d.transactionId as any)?.receiptNumber || '',
              }));
              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Monthly Support Dues');
              XLSX.writeFile(wb, `MonthlySupport_${new Date().toISOString().split('T')[0]}.xlsx`);
            }}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            <FileDown className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handleGenerateDues}
            disabled={generatingDues}
            title="Dues are otherwise only created by a daily 7am job"
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${generatingDues ? 'animate-spin' : ''}`} />
            {generatingDues ? 'Generating...' : "Generate This Month's Dues"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Collected</p>
            <p className="text-xl font-extrabold text-green-700">₹{totalPaid.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400">{paidCount} entries</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-xl font-extrabold text-red-600">₹{totalOutstanding.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400">{unpaidCount} entries</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 col-span-2 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Month:</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All months</option>
              {allPeriods.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={unpaidOnly}
              onChange={(e) => setUnpaidOnly(e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            Unpaid only
          </label>
        </div>
      </div>

      {/* Contributor filter — search picker */}
      <div className="bg-white rounded-lg shadow p-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Member:</label>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          {contributorFilter ? (
            <div className="flex items-center gap-2 border border-teal-400 bg-teal-50 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm font-medium text-gray-800">{contributorFilter}</span>
              <button type="button" onClick={() => { setContributorFilter(''); setContributorSearch(''); }} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contributor..."
                value={contributorSearch}
                onChange={(e) => { setContributorSearch(e.target.value); setShowContributorDropdown(true); }}
                onFocus={() => setShowContributorDropdown(true)}
                onBlur={() => setTimeout(() => setShowContributorDropdown(false), 150)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </>
          )}
          {showContributorDropdown && !contributorFilter && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
              {filteredContributorNames.length === 0 ? (
                <p className="text-sm text-gray-400 p-3">No results</p>
              ) : (
                filteredContributorNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={() => { setContributorFilter(name); setContributorSearch(''); setShowContributorDropdown(false); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-teal-50 text-sm border-b border-gray-50 last:border-0 text-gray-800"
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>
              ) : (
                filtered.map((due) => {
                  const mode = txField(due, 'paymentMethod');
                  const ref  = txField(due, 'referenceNo');
                  const pd   = txField(due, 'paymentDate') || due.paidAt;
                  return (
                    <tr key={due._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700">{due.periodMonth}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {due.dueForName}
                        {isDonorDue(due) && (
                          <span className="ml-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Donor</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">₹{due.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">
                        {due.paidAmount > 0 ? `₹${due.paidAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {pd ? new Date(pd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {mode ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            mode === 'cash' ? 'bg-green-50 text-green-700' :
                            mode === 'bank_transfer' ? 'bg-blue-50 text-blue-700' :
                            mode === 'upi' ? 'bg-violet-50 text-violet-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {METHOD_LABELS[mode] ?? mode}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{ref || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[160px]">
                        {due.notes ? <span className="line-clamp-2">{due.notes}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          due.isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {due.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {due.isPaid ? (
                          <button
                            onClick={() => openViewModal(due)}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        ) : (
                          <button
                            onClick={() => openPaymentModal(due)}
                            className="flex items-center gap-1 bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 text-xs font-medium"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Payment Modal */}
      {showViewModal && viewDue && (() => {
        const txId   = txField(viewDue, '_id');
        const txRcpt = txField(viewDue, 'receiptNumber');
        const mode   = txField(viewDue, 'paymentMethod');
        const ref    = txField(viewDue, 'referenceNo');
        const pd     = txField(viewDue, 'paymentDate') || viewDue.paidAt;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Payment Details</h3>
                <button onClick={() => { setShowViewModal(false); setViewDue(null); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-5">{viewDue.dueForName} · {viewDue.periodMonth}</p>
              <div className="space-y-3 text-sm">
                {txRcpt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt No.</span>
                    <span className="font-medium text-gray-800">{txRcpt}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-semibold text-green-700">₹{viewDue.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                {pd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Date</span>
                    <span className="font-medium text-gray-800">{new Date(pd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {mode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Mode</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      mode === 'cash' ? 'bg-green-50 text-green-700' :
                      mode === 'bank_transfer' ? 'bg-blue-50 text-blue-700' :
                      mode === 'upi' ? 'bg-violet-50 text-violet-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {METHOD_LABELS[mode] ?? mode}
                    </span>
                  </div>
                )}
                {ref && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference No.</span>
                    <span className="font-medium text-gray-800">{ref}</span>
                  </div>
                )}
                {viewDue.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Notes</span>
                    <span className="font-medium text-gray-800 text-right max-w-[60%]">{viewDue.notes}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowViewModal(false); setViewDue(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Close</button>
                {txId && (
                  <>
                    <button
                      onClick={() => handlePrintReceipt(txId)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Print Receipt
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(txId, txRcpt || txId)}
                      disabled={downloadingReceipt}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Modal */}
      {showPaymentModal && selectedDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Collect Payment — {selectedDue.dueForName}</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedDue.periodMonth} · Balance ₹{selectedDue.balance.toLocaleString('en-IN')}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number" min="0" max={selectedDue.balance} step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-2 ${paymentErrors.amount ? 'border-red-400' : 'border-gray-300'}`}
                />
                <FieldError message={paymentErrors.amount} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowPaymentModal(false); setSelectedDue(null); }} disabled={processingPayment} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button onClick={handlePaymentSubmit} disabled={processingPayment} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
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
