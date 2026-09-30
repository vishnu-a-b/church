'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Download, Phone, ChevronLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface DonorInfo {
  name: string;
  phone: string;
  church: { _id: string; name: string } | null;
}

interface SupportTransaction {
  _id: string;
  receiptNumber: string;
  transactionType: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  monthlySupportPlanId?: { _id: string; name: string } | null;
  createdAt: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function printReceipt(tx: SupportTransaction, donor: DonorInfo) {
  const churchName = donor.church?.name || 'St. Mary\'s Church';
  const planName = tx.monthlySupportPlanId?.name || 'Monthly Support';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${tx.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .receipt { max-width: 480px; margin: 0 auto; border: 1px solid #ddd; padding: 32px; }
    .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; color: #1e40af; font-weight: bold; }
    .header p { font-size: 13px; color: #666; margin-top: 4px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .row .label { color: #6b7280; }
    .row .value { font-weight: 500; text-align: right; }
    .amount-row { padding: 14px 0; border-top: 2px solid #1e40af; border-bottom: 2px solid #1e40af; margin: 16px 0; }
    .amount-row .label { font-size: 15px; font-weight: bold; }
    .amount-row .value { font-size: 22px; font-weight: bold; color: #1e40af; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
    @media print { body { padding: 0; } .receipt { border: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${churchName}</h1>
      <p>Payment Receipt</p>
      <span class="badge">Monthly Support</span>
    </div>
    <div class="row"><span class="label">Receipt No.</span><span class="value">${tx.receiptNumber}</span></div>
    <div class="row"><span class="label">Supporter Name</span><span class="value">${donor.name}</span></div>
    <div class="row"><span class="label">Support Plan</span><span class="value">${planName}</span></div>
    <div class="row"><span class="label">Payment Date</span><span class="value">${formatDate(tx.paymentDate)}</span></div>
    <div class="row"><span class="label">Payment Method</span><span class="value">${PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod}</span></div>
    ${tx.notes ? `<div class="row"><span class="label">Notes</span><span class="value">${tx.notes}</span></div>` : ''}
    <div class="row amount-row"><span class="label">Amount Paid</span><span class="value">${formatAmount(tx.totalAmount)}</span></div>
    <div class="footer">
      <p>Thank you for your generous support!</p>
      <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export default function SupporterPortal() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [donor, setDonor] = useState<DonorInfo | null>(null);
  const [transactions, setTransactions] = useState<SupportTransaction[]>([]);

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
      doLookup(phoneParam);
    }
  }, []);

  const doLookup = async (phoneNumber: string) => {
    setError('');
    setDonor(null);
    setTransactions([]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/donor-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Not found');
        return;
      }
      setDonor(json.data.donor);
      setTransactions(json.data.transactions);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    doLookup(phone);
  };

  const handleReset = () => {
    setDonor(null);
    setTransactions([]);
    setError('');
    setPhone('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Supporter Portal</h1>
            <p className="text-xs text-gray-500">View your contribution receipts</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-10">
        {!donor ? (
          /* Lookup form */
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Find Your Receipts</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Enter the phone number you registered with to view your monthly support transactions.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registered Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {loading ? 'Searching...' : 'Find My Receipts'}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              No login required. Your phone number is used only to find your records.
            </p>
          </div>
        ) : (
          /* Results */
          <div className="w-full max-w-2xl">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Search again
            </button>

            {/* Donor card */}
            <div className="bg-white rounded-xl shadow p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                  {donor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{donor.name}</h2>
                  {donor.church && (
                    <p className="text-sm text-gray-500">{donor.church.name}</p>
                  )}
                  <p className="text-xs text-gray-400">{donor.phone}</p>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <h3 className="text-base font-semibold text-gray-700 mb-3">
              {transactions.length > 0
                ? `${transactions.length} Transaction${transactions.length !== 1 ? 's' : ''}`
                : 'No Transactions Found'}
            </h3>

            {transactions.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
                No monthly support payments found for this account.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {tx.monthlySupportPlanId?.name || 'Monthly Support'}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Paid
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(tx.paymentDate)}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {tx.receiptNumber} · {PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-bold text-blue-700">
                        {formatAmount(tx.totalAmount)}
                      </span>
                      <button
                        onClick={() => printReceipt(tx, donor)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        Church Management System &mdash; Supporter Portal
      </footer>
    </div>
  );
}
