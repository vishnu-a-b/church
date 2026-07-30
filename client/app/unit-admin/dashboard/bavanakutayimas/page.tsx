'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface Bavanakutayima {
  _id: string;
  name: string;
  bavanakutayimaCode?: string;
  uniqueId?: string;
  hierarchicalNumber?: string;
  leaderName?: string;
  unitId?: any;
}

export default function UnitAdminBavanakutayimasPage() {
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [loading, setLoading] = useState(true);
  const api = createRoleApi('unit_admin');

  useEffect(() => {
    fetchBavanakutayimas();
  }, []);

  const fetchBavanakutayimas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bavanakutayimas');
      setBavanakutayimas(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching bavanakutayimas:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Bavanakutayima>[] = [
    {
      header: 'Hierarchical ID',
      cell: ({ row }) => row.original.hierarchicalNumber || row.original.uniqueId || '-',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'bavanakutayimaCode',
      header: 'Code',
      cell: ({ row }) => row.original.bavanakutayimaCode || '-',
    },
    {
      accessorKey: 'leaderName',
      header: 'Leader Name',
      cell: ({ row }) => row.original.leaderName || '-',
    },
    {
      header: 'Unit',
      cell: ({ row }) => typeof row.original.unitId === 'object' ? row.original.unitId?.name || '-' : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bavanakutayimas (View Only)</h2>
            <p className="text-sm text-gray-500">View all bavanakutayimas in your unit</p>
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
            data={bavanakutayimas}
            searchPlaceholder="Search bavanakutayimas..."
          />
        )}
      </div>
    </div>
  );
}
