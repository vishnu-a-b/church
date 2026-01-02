'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { createRoleApi } from '@/lib/roleApi';
import { TrendingUp, FileDown } from 'lucide-react';
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
  churchId?: string;
  unitId?: string;
  houseId?: string;
  memberId?: { _id: string; firstName: string; lastName: string; houseId?: string };
  notes?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [allHouses, setAllHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    unit: '',
    bavanakutayima: '',
    house: '',
    member: '',
    transactionType: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
  });
  const api = createRoleApi('church_admin');

  useEffect(() => {
    fetchTransactions();
    fetchUnits();
    fetchAllHouses();
    fetchMembers();
  }, []);

  // Refetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Fetch bavanakutayimas when unit changes
  useEffect(() => {
    if (filters.unit) {
      console.log('🔍 Fetching bavanakutayimas for unit:', filters.unit);
      fetchBavanakutayimas(filters.unit);
    } else {
      setBavanakutayimas([]);
      setHouses([]);
    }
  }, [filters.unit]);

  // Fetch houses when bavanakutayima changes
  useEffect(() => {
    if (filters.bavanakutayima) {
      console.log('🔍 Fetching houses for bavanakutayima:', filters.bavanakutayima);
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters.unit) params.append('unitId', filters.unit);
      if (filters.bavanakutayima) params.append('bavanakutayimaId', filters.bavanakutayima);
      if (filters.house) params.append('houseId', filters.house);
      if (filters.member) params.append('memberId', filters.member);
      if (filters.transactionType) params.append('transactionType', filters.transactionType);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const queryString = params.toString();
      const url = queryString ? `/transactions?${queryString}` : '/transactions';

      console.log('📡 Fetching transactions with filters:', url);
      const response = await api.get(url);
      console.log('✅ Received', response.data.data?.length, 'transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBavanakutayimas = async (unitId: string) => {
    try {
      console.log('📡 API call: /bavanakutayimas?unitId=' + unitId);
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      console.log('✅ Bavanakutayimas response:', response.data);
      const bavanakutayimasList = response.data.data || [];
      console.log('📊 Found', bavanakutayimasList.length, 'bavanakutayimas');
      setBavanakutayimas(bavanakutayimasList);

      if (bavanakutayimasList.length === 0) {
        console.warn('⚠️ No bavanakutayimas found for unit:', unitId);
      }
    } catch (error) {
      console.error('❌ Error fetching bavanakutayimas:', error);
      setBavanakutayimas([]);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    try {
      console.log('📡 API call: /houses?bavanakutayimaId=' + bavanakutayimaId);
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      console.log('✅ Houses response:', response.data);
      const housesList = response.data.data || [];
      console.log('📊 Found', housesList.length, 'houses');
      setHouses(housesList);

      if (housesList.length === 0) {
        console.warn('⚠️ No houses found for bavanakutayima:', bavanakutayimaId);
      }
    } catch (error) {
      console.error('❌ Error fetching houses:', error);
      setHouses([]);
    }
  };

  const fetchAllHouses = async () => {
    try {
      const response = await api.get('/houses');
      console.log('🏠 ALL HOUSES DATA:', response.data.data);
      console.log('🏠 SAMPLE HOUSE:', response.data.data?.[0]);
      setAllHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      console.log('👥 MEMBERS DATA:', response.data.data);
      console.log('👥 SAMPLE MEMBER:', response.data.data?.[0]);
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredTransactions.map((transaction, index) => {
        let payerName = '-';
        if (transaction.memberId) {
          if (typeof transaction.memberId === 'object') {
            payerName = `${transaction.memberId.firstName} ${transaction.memberId.lastName || ''}`;
          } else {
            const member = getMemberData(transaction.memberId);
            payerName = member ? `${member.firstName} ${member.lastName || ''}` : '-';
          }
        } else if (transaction.houseId) {
          if (typeof transaction.houseId === 'object') {
            payerName = transaction.houseId.familyName || '-';
          } else {
            const house = getHouseData(transaction.houseId);
            payerName = house?.familyName || '-';
          }
        }

        return {
          '#': index + 1,
          'Receipt Number': transaction.receiptNumber,
          'Type': transaction.transactionType,
          'Payer': payerName,
          'Amount (₹)': transaction.totalAmount,
          'Payment Method': transaction.paymentMethod,
          'Date': new Date(transaction.paymentDate).toLocaleDateString('en-IN'),
          'Campaign': transaction.campaignId?.name || '-',
          'Notes': transaction.notes || '-',
        };
      });

      // Add summary row
      excelData.push({
        '#': '',
        'Receipt Number': '',
        'Type': '',
        'Payer': '',
        'Amount (₹)': filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
        'Payment Method': 'Total:',
        'Date': '',
        'Campaign': '',
        'Notes': '',
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 15 }, // Receipt Number
        { wch: 20 }, // Type
        { wch: 25 }, // Payer
        { wch: 15 }, // Amount
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Date
        { wch: 20 }, // Campaign
        { wch: 30 }, // Notes
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Generate filename
      const filename = `Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download
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
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {row.original.transactionType}
        </span>
      ),
    },
    {
      header: 'Payer',
      cell: ({ row }) => {
        if (row.original.memberId) {
          return `${row.original.memberId.firstName} ${row.original.memberId.lastName || ''}`;
        }
        if (row.original.houseId) {
          return row.original.houseId.familyName;
        }
        return '-';
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => `₹${row.original.totalAmount.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium capitalize">
          {row.original.paymentMethod}
        </span>
      ),
    },
    {
      accessorKey: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.paymentDate).toLocaleDateString('en-IN'),
    },
    {
      header: 'Campaign',
      cell: ({ row }) => row.original.campaignId?.name || '-',
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => row.original.notes || '-',
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  const getMemberData = (memberId: string | { _id: string; firstName: string; lastName: string; houseId?: string }) => {
    if (typeof memberId === 'object') return memberId;
    return members.find((m) => m._id === memberId);
  };

  const getHouseData = (houseId: string) => {
    return allHouses.find((h) => h._id === houseId);
  };

  // All filtering is now done server-side, just use the transactions directly
  const filteredTransactions = transactions;

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const avgAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Transactions</h1>
          <p className="text-gray-600 text-sm">All financial transactions across the system</p>
        </div>
        <button
          onClick={handleExportToExcel}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-5 h-5" />
          Export to Excel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Transactions</p>
              <p className="text-3xl font-bold text-gray-800">{filteredTransactions.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {transactions.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-gray-800">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Amount</p>
              <p className="text-3xl font-bold text-gray-800">₹{Math.round(avgAmount).toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>

        {/* Section 1: Hierarchy Filters */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">Hierarchy</span>
            Select in order: Unit → Bavanakutayima → House → Member
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchableSelect
              label="1. Unit"
              options={[
                { value: '', label: 'All Units' },
                ...units.map((unit) => ({
                  value: unit._id,
                  label: unit.name,
                }))
              ]}
              value={filters.unit}
              onChange={(value) =>
                setFilters({ ...filters, unit: value, bavanakutayima: '', house: '', member: '' })
              }
              placeholder="Select Unit"
            />
            <SearchableSelect
              label="2. Bavanakutayima"
              options={[
                { value: '', label: 'All Bavanakutayimas' },
                ...bavanakutayimas.map((bk) => ({
                  value: bk._id,
                  label: bk.name,
                }))
              ]}
              value={filters.bavanakutayima}
              onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '', member: '' })}
              placeholder={filters.unit ? "Select Bavanakutayima" : "Select unit first"}
              disabled={!filters.unit}
            />
            <SearchableSelect
              label="3. House"
              options={[
                { value: '', label: 'All Houses' },
                ...houses.map((house) => ({
                  value: house._id,
                  label: house.familyName,
                }))
              ]}
              value={filters.house}
              onChange={(value) => setFilters({ ...filters, house: value, member: '' })}
              placeholder={filters.bavanakutayima ? "Select House" : "Select bavanakutayima first"}
              disabled={!filters.bavanakutayima}
            />
            <SearchableSelect
              label="4. Member (Optional)"
              options={[
                { value: '', label: 'All Members' },
                ...members
                  .filter(m => !filters.house || m.houseId === filters.house || (typeof m.houseId === 'object' && m.houseId?._id === filters.house))
                  .map((member) => ({
                    value: member._id,
                    label: `${member.firstName} ${member.lastName || ''}`,
                  }))
              ]}
              value={filters.member}
              onChange={(value) => setFilters({ ...filters, member: value })}
              placeholder={filters.house ? "Select Member (optional)" : "Select house first"}
              disabled={!filters.house}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Leave Member empty to see all house payments. Select a specific member to see only their transactions.
          </p>
        </div>

        {/* Section 2: Transaction Filters */}
        <div className="mb-6 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">Transaction Details</span>
            Filter by type and payment method
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableSelect
              label="Transaction Type"
              options={[
                { value: '', label: 'All Types' },
                { value: 'lelam', label: 'Lelam' },
                { value: 'thirunnaal_panam', label: 'Thirunnaal Panam' },
                { value: 'dashamansham', label: 'Dashamansham' },
                { value: 'spl_contribution', label: 'Special Contribution' },
                { value: 'stothrakazhcha', label: 'Stothrakazhcha' },
              ]}
              value={filters.transactionType}
              onChange={(value) => setFilters({ ...filters, transactionType: value })}
              placeholder="All Types"
            />
            <SearchableSelect
              label="Payment Method"
              options={[
                { value: '', label: 'All Methods' },
                { value: 'cash', label: 'Cash' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'upi', label: 'UPI' },
                { value: 'cheque', label: 'Cheque' },
              ]}
              value={filters.paymentMethod}
              onChange={(value) => setFilters({ ...filters, paymentMethod: value })}
              placeholder="All Methods"
            />
          </div>
        </div>

        {/* Section 3: Date Range */}
        <div className="mb-4 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">Date Range</span>
            Filter by time period
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setFilters({
              unit: '',
              bavanakutayima: '',
              house: '',
              member: '',
              transactionType: '',
              paymentMethod: '',
              dateFrom: '',
              dateTo: '',
            })}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        searchPlaceholder="Search transactions..."
      />
    </div>
  );
}
