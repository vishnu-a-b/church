'use client';

import { useState, useEffect } from 'react';
import { Receipt, Calendar, DollarSign, CreditCard, FileText, Filter, X, FileDown } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

interface Transaction {
  _id: string;
  receiptNumber: string;
  transactionType: string;
  totalAmount: number;
  memberAmount?: number;
  houseAmount?: number;
  paymentMethod: string;
  paymentDate: string;
  campaignId?: { _id: string; name: string };
  notes?: string;
  createdAt: string;
}

export default function MemberTransactionsPage() {
  const api = createRoleApi('member');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    transactionType: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/members/me/transactions');

      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.transactionType) {
      filtered = filtered.filter(t => t.transactionType === filters.transactionType);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.paymentDate) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.paymentDate) <= new Date(filters.dateTo));
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setFilters({
      transactionType: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      lelam: 'Lelam',
      thirunnaal_panam: 'Thirunnaal Panam',
      dashamansham: 'Dashamansham',
      spl_contribution: 'Special Contribution',
      stothrakazhcha: 'Stothrakazhcha',
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      upi: 'UPI',
      cheque: 'Cheque',
    };
    return labels[method] || method;
  };

  const totalContributions = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  const handleExportToExcel = () => {
    try {
      const excelData = filteredTransactions.map((transaction, index) => ({
        '#': index + 1,
        'Receipt Number': transaction.receiptNumber,
        'Type': getTransactionTypeLabel(transaction.transactionType),
        'Total Amount (₹)': transaction.totalAmount,
        'Member Amount (₹)': transaction.memberAmount || 0,
        'House Amount (₹)': transaction.houseAmount || 0,
        'Payment Method': getPaymentMethodLabel(transaction.paymentMethod),
        'Date': formatDate(transaction.paymentDate),
        'Campaign': transaction.campaignId?.name || '-',
        'Notes': transaction.notes || '-',
      }));

      excelData.push({
        '#': '' as any,
        'Receipt Number': 'Total:',
        'Type': '',
        'Total Amount (₹)': filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
        'Member Amount (₹)': filteredTransactions.reduce((sum, t) => sum + (t.memberAmount || 0), 0),
        'House Amount (₹)': filteredTransactions.reduce((sum, t) => sum + (t.houseAmount || 0), 0),
        'Payment Method': '',
        'Date': '',
        'Campaign': '',
        'Notes': '',
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 5 },  { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'My Transactions');

      const filename = `My_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt #',
      cell: ({ row }) => (
        <span className="font-semibold text-teal-700">{row.original.receiptNumber}</span>
      ),
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {getTransactionTypeLabel(row.original.transactionType)}
        </span>
      ),
    },
    {
      header: 'Campaign',
      cell: ({ row }) =>
        row.original.campaignId ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            <FileText className="w-3 h-3" />
            {row.original.campaignId.name}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-bold text-green-700 text-lg">
          {formatAmount(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'memberAmount',
      header: 'Member Amount',
      cell: ({ row }) =>
        row.original.memberAmount !== undefined && row.original.memberAmount > 0 ? (
          <span className="text-gray-700">{formatAmount(row.original.memberAmount)}</span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      accessorKey: 'houseAmount',
      header: 'House Amount',
      cell: ({ row }) =>
        row.original.houseAmount !== undefined && row.original.houseAmount > 0 ? (
          <span className="text-gray-700">{formatAmount(row.original.houseAmount)}</span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <CreditCard className="w-3 h-3" />
          {getPaymentMethodLabel(row.original.paymentMethod)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-gray-700">
          <Calendar className="w-3 h-3" />
          {formatDate(row.original.paymentDate)}
        </span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => row.original.notes ? (
        <span className="text-gray-600 italic text-sm">{row.original.notes}</span>
      ) : (
        <span className="text-gray-400">-</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Transactions</h1>
            <p className="text-teal-100">View your payment history and contributions</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <Receipt className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Total Contributions</p>
              <p className="text-3xl font-bold text-green-900">{formatAmount(totalContributions)}</p>
              <p className="text-xs text-green-600 mt-1">From {filteredTransactions.length} transactions</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 rounded-full p-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-900">{filteredTransactions.length}</p>
              <p className="text-xs text-blue-600 mt-1">All payment records</p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 rounded-full p-4">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Latest Payment</p>
              <p className="text-xl font-bold text-purple-900">
                {filteredTransactions.length > 0 ? formatDate(filteredTransactions[0].paymentDate) : 'N/A'}
              </p>
              <p className="text-xs text-purple-600 mt-1">Most recent transaction</p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 rounded-full p-4">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-600" />
            Filters
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filters.transactionType}
                onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="lelam">Lelam</option>
                <option value="thirunnaal_panam">Thirunnaal Panam</option>
                <option value="dashamansham">Dashamansham</option>
                <option value="spl_contribution">Special Contribution</option>
                <option value="stothrakazhcha">Stothrakazhcha</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>

              {/* Summary in Filters */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Filtered Total:</span>
                  <span className="font-bold text-green-700 text-lg">{formatAmount(totalContributions)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Count:</span>
                  <span className="font-bold text-blue-700">{filteredTransactions.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions DataTable */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-teal-600 to-cyan-600 rounded-full"></div>
            Transaction History
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-4">
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={filteredTransactions}
          searchPlaceholder="Search by receipt number, type, or notes..."
        />
      </div>
    </div>
  );
}
