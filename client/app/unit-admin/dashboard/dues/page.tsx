'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { SearchableSelect } from '@/components/SearchableSelect';
import { AlertCircle, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface DueItem {
  _id: string;
  name: string;
  type: 'member' | 'house';
  campaignName?: string;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  hierarchicalNumber?: string;
}

export default function UnitAdminDuesPage() {
  const [dues, setDues] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    bavanakutayima: '',
    house: '',
    member: '',
  });

  const api = createRoleApi('unit_admin');

  useEffect(() => {
    fetchDues();
    fetchBavanakutayimas();
  }, []);

  useEffect(() => {
    if (filters.bavanakutayima) {
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  useEffect(() => {
    if (filters.house) {
      fetchMembers(filters.house);
    } else {
      setMembers([]);
    }
  }, [filters.house]);

  useEffect(() => {
    fetchDues();
  }, [filters]);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bavanakutayima) params.append('bavanakutayimaId', filters.bavanakutayima);
      if (filters.house) params.append('houseId', filters.house);
      if (filters.member) params.append('memberId', filters.member);

      const queryString = params.toString();
      const url = queryString ? `/dues?${queryString}` : '/dues';

      const response = await api.get(url);
      setDues(response.data.data || []);
    } catch (error) {
      console.error('Error fetching dues:', error);
      toast.error('Failed to load dues');
    } finally {
      setLoading(false);
    }
  };

  const fetchBavanakutayimas = async () => {
    try {
      const response = await api.get('/bavanakutayimas');
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

  const fetchMembers = async (houseId: string) => {
    try {
      const response = await api.get(`/members?houseId=${houseId}`);
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns: ColumnDef<DueItem>[] = [
    {
      header: 'Hierarchical ID',
      cell: ({ row }) => row.original.hierarchicalNumber || '-',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.type === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.original.type === 'member' ? 'Member' : 'House'}
        </span>
      ),
    },
    {
      accessorKey: 'campaignName',
      header: 'Campaign',
      cell: ({ row }) => row.original.campaignName || '-',
    },
    {
      accessorKey: 'dueAmount',
      header: 'Due Amount',
      cell: ({ row }) => `₹${row.original.dueAmount.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid Amount',
      cell: ({ row }) => `₹${row.original.paidAmount.toLocaleString('en-IN')}`,
    },
    {
      accessorKey: 'remainingAmount',
      header: 'Remaining',
      cell: ({ row }) => (
        <span className={row.original.remainingAmount > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          ₹{row.original.remainingAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  const totalDueAmount = dues.reduce((sum, due) => sum + due.dueAmount, 0);
  const totalPaidAmount = dues.reduce((sum, due) => sum + due.paidAmount, 0);
  const totalRemainingAmount = dues.reduce((sum, due) => sum + due.remainingAmount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dues (View Only)</h1>
              <p className="text-sm text-gray-500">View all pending and paid dues</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Read-Only Access</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Total Due Amount</p>
            <p className="text-2xl font-bold text-blue-900">₹{totalDueAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">Total Paid Amount</p>
            <p className="text-2xl font-bold text-green-900">₹{totalPaidAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-600 mb-1">Total Remaining</p>
            <p className="text-2xl font-bold text-orange-900">₹{totalRemainingAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SearchableSelect
            label="Bavanakutayima"
            options={bavanakutayimas.map(b => ({ value: b._id, label: b.name }))}
            value={filters.bavanakutayima}
            onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '', member: '' })}
            placeholder="All Bavanakutayimas"
          />
          <SearchableSelect
            label="House"
            options={houses.map(h => ({ value: h._id, label: h.familyName }))}
            value={filters.house}
            onChange={(value) => setFilters({ ...filters, house: value, member: '' })}
            placeholder="All Houses"
            disabled={!filters.bavanakutayima}
          />
          <SearchableSelect
            label="Member"
            options={members.map(m => ({ value: m._id, label: `${m.firstName} ${m.lastName}` }))}
            value={filters.member}
            onChange={(value) => setFilters({ ...filters, member: value })}
            placeholder="All Members"
            disabled={!filters.house}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={dues} searchPlaceholder="Search dues..." />
        )}
      </div>
    </div>
  );
}
