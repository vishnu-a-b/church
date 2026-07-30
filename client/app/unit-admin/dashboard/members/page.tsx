'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Eye, User } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { SearchableSelect } from '@/components/SearchableSelect';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  baptismName?: string;
  relationToHead?: string;
  isActive?: boolean;
  houseId?: any;
  bavanakutayimaId?: any;
  unitId?: any;
}

export default function UnitAdminMembersPage() {
  const api = createRoleApi('unit_admin');
  const [members, setMembers] = useState<Member[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    bavanakutayima: '',
    house: '',
  });

  useEffect(() => {
    fetchMembers();
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
    fetchMembers();
  }, [filters]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bavanakutayima) params.append('bavanakutayimaId', filters.bavanakutayima);
      if (filters.house) params.append('houseId', filters.house);

      const queryString = params.toString();
      const url = queryString ? `/members?${queryString}` : '/members';

      const response = await api.get(url);
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBavanakutayimas = async () => {
    try {
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

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: ColumnDef<Member>[] = [
    {
      header: 'Hierarchical ID',
      cell: ({ row }) => (
        <span className="font-semibold text-blue-700">
          {row.original.hierarchicalNumber || row.original.uniqueId || '-'}
        </span>
      ),
    },
    {
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-gray-900">
            {row.original.firstName} {row.original.lastName}
          </div>
          {row.original.baptismName && (
            <div className="text-xs text-gray-500">Baptism: {row.original.baptismName}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => row.original.gender ? (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
        }`}>
          {row.original.gender === 'male' ? 'Male' : 'Female'}
        </span>
      ) : '-',
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Date of Birth',
      cell: ({ row }) => formatDate(row.original.dateOfBirth),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'relationToHead',
      header: 'Relation',
      cell: ({ row }) => row.original.relationToHead ? (
        <span className="capitalize">{row.original.relationToHead}</span>
      ) : '-',
    },
    {
      header: 'House',
      cell: ({ row }) => typeof row.original.houseId === 'object' ? row.original.houseId?.familyName || '-' : '-',
    },
    {
      header: 'Bavanakutayima',
      cell: ({ row }) => typeof row.original.bavanakutayimaId === 'object' ? row.original.bavanakutayimaId?.name || '-' : '-',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Members (View Only)</h2>
              <p className="text-sm text-gray-500">View all members in your unit</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Read-Only Access</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SearchableSelect
            label="Bavanakutayima"
            options={bavanakutayimas.map(b => ({ value: b._id, label: b.name }))}
            value={filters.bavanakutayima}
            onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '' })}
            placeholder="All Bavanakutayimas"
          />
          <SearchableSelect
            label="House"
            options={houses.map(h => ({ value: h._id, label: h.familyName }))}
            value={filters.house}
            onChange={(value) => setFilters({ ...filters, house: value })}
            placeholder="All Houses"
            disabled={!filters.bavanakutayima}
          />
        </div>

        {/* Member Count */}
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Total Members: <span className="text-blue-700 font-bold">{members.length}</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={members}
            searchPlaceholder="Search members by name, phone, or email..."
          />
        )}
      </div>
    </div>
  );
}
