'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface House {
  _id: string;
  familyName: string;
  headOfFamily?: string;
  address?: string;
  phone?: string;
  houseNumber?: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  bavanakutayimaId?: any;
}

export default function UnitAdminHousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const api = createRoleApi('unit_admin');

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/houses');
      setHouses(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<House>[] = [
    {
      header: 'Hierarchical ID',
      cell: ({ row }) => row.original.hierarchicalNumber || row.original.uniqueId || '-',
    },
    {
      accessorKey: 'familyName',
      header: 'Family Name',
    },
    {
      accessorKey: 'houseNumber',
      header: 'House Number',
      cell: ({ row }) => row.original.houseNumber || '-',
    },
    {
      accessorKey: 'headOfFamily',
      header: 'Head of Family',
      cell: ({ row }) => row.original.headOfFamily || '-',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => row.original.address || '-',
    },
    {
      header: 'Bavanakutayima',
      cell: ({ row }) => typeof row.original.bavanakutayimaId === 'object' ? row.original.bavanakutayimaId?.name || '-' : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Houses (View Only)</h2>
            <p className="text-sm text-gray-500">View all houses in your unit</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Read-Only Access</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={houses}
            searchPlaceholder="Search houses..."
          />
        )}
      </div>
    </div>
  );
}
