'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { createRoleApi } from '@/lib/roleApi';
import { TrendingUp } from 'lucide-react';

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
  const [churches, setChurches] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [allHouses, setAllHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    church: '',
    unit: '',
    bavanakutayima: '',
    house: '',
  });
  const api = createRoleApi('super_admin');

  useEffect(() => {
    fetchTransactions();
    fetchChurches();
    fetchAllHouses();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (filters.church) {
      fetchUnits(filters.church);
    } else {
      setUnits([]);
    }
  }, [filters.church]);

  useEffect(() => {
    if (filters.unit) {
      fetchBavanakutayimas(filters.unit);
    } else {
      setBavanakutayimas([]);
    }
  }, [filters.unit]);

  useEffect(() => {
    if (filters.bavanakutayima) {
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      console.log('📊 TRANSACTIONS API RESPONSE:', response.data);
      console.log('📊 TRANSACTIONS DATA:', response.data.data);
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      console.log('⛪ CHURCHES DATA:', response.data.data);
      setChurches(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUnits = async (churchId: string) => {
    try {
      const response = await api.get(`/units?churchId=${churchId}`);
      setUnits(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBavanakutayimas = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setBavanakutayimas(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
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

  // Filter transactions based on hierarchy
  console.log('🔍 CURRENT FILTERS:', filters);
  console.log('📊 TOTAL TRANSACTIONS:', transactions.length);

  const filteredTransactions = transactions.filter((txn, index) => {
    if (index === 0) {
      console.log('📊 SAMPLE TRANSACTION:', txn);
      console.log('📊 Transaction properties:', {
        _id: txn._id,
        churchId: txn.churchId,
        unitId: txn.unitId,
        houseId: txn.houseId,
        memberId: txn.memberId,
        receiptNumber: txn.receiptNumber,
      });
    }

    // Extract IDs from transaction (might be objects or strings)
    const txnChurchId = typeof txn.churchId === 'object' && txn.churchId?._id
      ? txn.churchId._id
      : txn.churchId;
    const txnUnitId = typeof txn.unitId === 'object' && txn.unitId?._id
      ? txn.unitId._id
      : txn.unitId;
    const txnHouseId = typeof txn.houseId === 'object' && txn.houseId?._id
      ? txn.houseId._id
      : txn.houseId;

    if (index === 0) {
      console.log('📊 Extracted IDs:', {
        churchId: txnChurchId,
        unitId: txnUnitId,
        houseId: txnHouseId,
      });
    }

    // Try direct properties first
    if (filters.church && txnChurchId && txnChurchId !== filters.church) return false;
    if (filters.unit && txnUnitId && txnUnitId !== filters.unit) return false;
    if (filters.house && txnHouseId && txnHouseId !== filters.house) return false;

    // If transaction has memberId, filter through member's hierarchy
    if (txn.memberId) {
      const member = getMemberData(txn.memberId);
      if (index === 0) console.log('👤 MEMBER FOR TRANSACTION:', member);

      if (!member) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

      // Extract houseId as string (might be object or string)
      const memberHouseId = typeof member.houseId === 'object' && member.houseId?._id
        ? member.houseId._id
        : member.houseId;

      if (!memberHouseId) return !filters.church && !filters.unit && !filters.bavanakutayima && !filters.house;

      // Filter by house first (direct comparison)
      if (filters.house && memberHouseId !== filters.house) return false;

      // Check if member has direct hierarchy properties
      if (filters.church && member.churchId && member.churchId !== filters.church) return false;
      if (filters.unit && member.unitId && member.unitId !== filters.unit) return false;
      if (filters.bavanakutayima && member.bavanakutayimaId && member.bavanakutayimaId !== filters.bavanakutayima) return false;

      // If member doesn't have direct hierarchy properties, check through house
      if (!member.churchId || !member.unitId || !member.bavanakutayimaId) {
        const house = getHouseData(memberHouseId);
        if (index === 0) console.log('🏠 HOUSE FOR MEMBER:', house);

        if (!house) return !filters.church && !filters.unit && !filters.bavanakutayima;

        // Filter by bavanakutayima
        if (filters.bavanakutayima && (house as any).bavanakutayimaId !== filters.bavanakutayima) return false;

        // Filter by unit
        if (filters.unit && (house as any).unitId !== filters.unit) return false;

        // Filter by church
        if (filters.church && (house as any).churchId !== filters.church) return false;
      }
    }

    // If we need to filter by bavanakutayima and transaction doesn't have it directly
    if (filters.bavanakutayima && txnHouseId) {
      const house = getHouseData(txnHouseId);
      if (index === 0) console.log('🏠 HOUSE FOR TRANSACTION (for bavanakutayima):', house);

      if (!house || (house as any).bavanakutayimaId !== filters.bavanakutayima) {
        return false;
      }
    }

    return true;
  });

  console.log('✅ FILTERED TRANSACTIONS COUNT:', filteredTransactions.length);

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const avgAmount = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Transactions</h1>
          <p className="text-gray-600 text-sm">All financial transactions across the system</p>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SearchableSelect
          label="Church"
          options={churches.map((church) => ({
            value: church._id,
            label: church.name,
          }))}
          value={filters.church}
          onChange={(value) =>
            setFilters({ ...filters, church: value, unit: '', bavanakutayima: '', house: '' })
          }
          placeholder="All Churches"
        />
        <SearchableSelect
          label="Unit"
          options={units.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }))}
          value={filters.unit}
          onChange={(value) =>
            setFilters({ ...filters, unit: value, bavanakutayima: '', house: '' })
          }
          placeholder="All Units"
          disabled={!filters.church}
        />
        <SearchableSelect
          label="Bavanakutayima"
          options={bavanakutayimas.map((bk) => ({
            value: bk._id,
            label: bk.name,
          }))}
          value={filters.bavanakutayima}
          onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '' })}
          placeholder="All Bavanakutayimas"
          disabled={!filters.unit}
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

      <DataTable
        data={filteredTransactions}
        columns={columns}
        searchPlaceholder="Search transactions..."
      />
    </div>
  );
}
