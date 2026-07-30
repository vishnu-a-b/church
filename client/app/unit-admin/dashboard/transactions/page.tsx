'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Transaction } from '@/types';
import { TrendingUp, FileDown } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export default function TransactionsPage() {
  const api = createRoleApi('unit_admin');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [allHouses, setAllHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    bavanakutayima: '',
    house: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchBavanakutayimas();
    fetchAllHouses();
  }, []);

  useEffect(() => {
    if (filters.bavanakutayima) {
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  const fetchTransactions = async () => {
    try {
      const [transactionsRes, membersRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/members'),
      ]);
      setTransactions(transactionsRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBavanakutayimas = async () => {
    try {
      // Unit admin will only see their own unit's bavanakutayimas (filtered by backend)
      const response = await api.get('/bavanakutayimas');
      setBavanakutayimas(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllHouses = async () => {
    try {
      const response = await api.get('/houses');
      setAllHouses(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMemberData = (memberId: string) => {
    return members.find((m) => m._id === memberId);
  };

  const getHouseData = (houseId: string) => {
    return allHouses.find((h) => h._id === houseId);
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredTransactions.map((transaction, index) => {
        let payerName = '-';
        if (transaction.memberId) {
          if (typeof transaction.memberId === 'object' && transaction.memberId !== null) {
            const member = transaction.memberId as { _id: string; firstName: string; lastName: string };
            payerName = `${member.firstName} ${member.lastName || ''}`;
          } else if (typeof transaction.memberId === 'string') {
            const member = getMemberData(transaction.memberId);
            payerName = member ? `${member.firstName} ${member.lastName || ''}` : '-';
          }
        } else if (transaction.houseId) {
          if (typeof transaction.houseId === 'object' && transaction.houseId !== null) {
            const house = transaction.houseId as { _id: string; familyName: string };
            payerName = house.familyName || '-';
          } else if (typeof transaction.houseId === 'string') {
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
          'Date': formatDate(transaction.paymentDate),
          'Campaign': (typeof transaction.campaignId === 'object' && transaction.campaignId !== null ? transaction.campaignId.name : null) || '-',
          'Notes': transaction.notes || '-',
        };
      });

      // Add summary row
      const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      excelData.push({
        '#': '',
        'Receipt Number': '',
        'Type': '',
        'Payer': '',
        'Amount (₹)': totalAmount,
        'Payment Method': 'Total:',
        'Date': '',
        'Campaign': '',
        'Notes': '',
      } as any);

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

  const filteredTransactions = transactions.filter((txn: any) => {
    // Extract house ID from transaction (might be object or string)
    const txnHouseId = typeof txn.houseId === 'object' && txn.houseId?._id
      ? txn.houseId._id
      : txn.houseId;

    // Filter by house if selected (direct match)
    if (filters.house) {
      if (txn.memberId) {
        // For member transactions, check the member's house
        const member = getMemberData(txn.memberId);
        if (!member) return false;
        const memberHouseId = typeof member.houseId === 'object' && member.houseId?._id
          ? member.houseId._id
          : member.houseId;
        if (memberHouseId !== filters.house) return false;
      } else if (txnHouseId) {
        // For house transactions, check directly
        if (txnHouseId !== filters.house) return false;
      } else {
        // Transaction has no house reference
        return false;
      }
    }

    // Filter by bavanakutayima if selected
    if (filters.bavanakutayima) {
      if (txn.memberId) {
        // For member transactions, check through member
        const member = getMemberData(txn.memberId);
        if (!member) return false;

        // Check if member has direct bavanakutayimaId
        if (member.bavanakutayimaId) {
          const memberBavId = typeof member.bavanakutayimaId === 'object' && member.bavanakutayimaId?._id
            ? member.bavanakutayimaId._id
            : member.bavanakutayimaId;
          if (memberBavId !== filters.bavanakutayima) return false;
        } else {
          // Check through member's house
          const memberHouseId = typeof member.houseId === 'object' && member.houseId?._id
            ? member.houseId._id
            : member.houseId;
          if (!memberHouseId) return false;
          const house = getHouseData(memberHouseId);
          if (!house) return false;
          const houseBavId = typeof (house as any).bavanakutayimaId === 'object' && (house as any).bavanakutayimaId?._id
            ? (house as any).bavanakutayimaId._id
            : (house as any).bavanakutayimaId;
          if (houseBavId !== filters.bavanakutayima) return false;
        }
      } else if (txnHouseId) {
        // For house transactions, check through house
        const house = getHouseData(txnHouseId);
        if (!house) return false;
        const houseBavId = typeof (house as any).bavanakutayimaId === 'object' && (house as any).bavanakutayimaId?._id
          ? (house as any).bavanakutayimaId._id
          : (house as any).bavanakutayimaId;
        if (houseBavId !== filters.bavanakutayima) return false;
      } else {
        // Transaction has no member or house reference
        return false;
      }
    }

    return true;
  });

  const getTotalAmount = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const getUnitTotalAmount = () => {
    return transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const hasActiveFilters = filters.bavanakutayima || filters.house;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
          <p className="text-gray-600">View all financial transactions</p>
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

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Bavanakutayima"
          options={bavanakutayimas.map((bk) => ({
            value: bk._id,
            label: bk.name,
          }))}
          value={filters.bavanakutayima}
          onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '' })}
          placeholder="All Bavanakutayimas"
        />
        <SearchableSelect
          label="House"
          options={houses.map((house) => ({
            value: house._id,
            label: house.familyName,
          }))}
          value={filters.house}
          onChange={(value) => setFilters({ ...filters, house: value })}
          placeholder="All Houses"
          disabled={!filters.bavanakutayima}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total: {transactions.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{hasActiveFilters ? 'Filtered Amount' : 'Total Amount (Unit)'}</p>
              <p className="text-2xl font-bold text-gray-800">₹{getTotalAmount().toLocaleString()}</p>
              {hasActiveFilters && (
                <p className="text-xs text-gray-500 mt-1">Unit Total: ₹{getUnitTotalAmount().toLocaleString()}</p>
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Amount</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{filteredTransactions.length ? Math.round(getTotalAmount() / filteredTransactions.length).toLocaleString() : 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{txn.receiptNumber}</div>
                      <div className="text-sm text-gray-500 md:hidden capitalize">
                        {txn.transactionType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                        {txn.transactionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₹{txn.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900 capitalize">{txn.paymentMethod.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900">{formatDate(txn.paymentDate)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
