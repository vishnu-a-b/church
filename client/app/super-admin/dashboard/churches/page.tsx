'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { ChurchModal } from '@/components/ChurchModal';
import { ColumnDef } from '@tanstack/react-table';
import { FiPlus, FiEdit, FiTrash, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';

interface Church { _id: string; name: string; location: string; contactPerson?: string; phone?: string; email?: string; diocese?: string; }
interface Unit { _id: string; name: string; unitNumber?: string; churchId: string; }
interface Bavanakutayima { _id: string; name: string; leaderName?: string; unitId: string; }
interface House { _id: string; familyName: string; headOfFamily?: string; address?: string; phone?: string; bavanakutayimaId: string; }
interface Member { _id: string; firstName: string; lastName?: string; phone?: string; email?: string; relationToHead: string; houseId: string; }

export default function ChurchesPage() {
  const [view, setView] = useState<'churches' | 'units' | 'bavanakutayimas' | 'houses' | 'members'>('churches');
  const [churches, setChurches] = useState<Church[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState<{church?: string; unit?: string; bavanakutayima?: string; house?: string}>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<Church | null>(null);
  const api = createRoleApi('super_admin');

  useEffect(() => {
    if (view === 'churches') fetchChurches();
  }, [view]);

  const fetchChurches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/churches');
      setChurches(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChurch = async (churchData: any) => {
    if (editingChurch) {
      // Update existing church
      await api.put(`/churches/${editingChurch._id}`, churchData);
    } else {
      // Create new church
      await api.post('/churches', churchData);
    }
    fetchChurches();
    setIsModalOpen(false);
    setEditingChurch(null);
  };

  const handleEditChurch = (church: Church) => {
    setEditingChurch(church);
    setIsModalOpen(true);
  };

  const handleDeleteChurch = async (id: string) => {
    if (confirm('Are you sure you want to delete this church?')) {
      try {
        await api.delete(`/churches/${id}`);
        fetchChurches();
      } catch (error) {
        console.error('Error deleting church:', error);
        alert('Failed to delete church');
      }
    }
  };

  const fetchUnits = async (churchId: string, churchName: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/units?churchId=${churchId}`);
      setUnits(response.data.data || []);
      setBreadcrumb({ church: churchName });
      setView('units');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBavanakutayimas = async (unitId: string, unitName: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setBavanakutayimas(response.data.data || []);
      setBreadcrumb(prev => ({ ...prev, unit: unitName }));
      setView('bavanakutayimas');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string, bavanakutayimaName: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data.data || []);
      setBreadcrumb(prev => ({ ...prev, bavanakutayima: bavanakutayimaName }));
      setView('houses');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (houseId: string, houseName: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/members?houseId=${houseId}`);
      setMembers(response.data.data || []);
      setBreadcrumb(prev => ({ ...prev, house: houseName }));
      setView('members');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (view === 'members') setView('houses');
    else if (view === 'houses') setView('bavanakutayimas');
    else if (view === 'bavanakutayimas') setView('units');
    else if (view === 'units') setView('churches');
  };

  const churchColumns: ColumnDef<Church>[] = [
    { accessorKey: 'name', header: 'Church Name' },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'diocese', header: 'Diocese' },
    { accessorKey: 'contactPerson', header: 'Contact Person' },
    { accessorKey: 'phone', header: 'Phone' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => fetchUnits(row.original._id, row.original.name)} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
            View Units <FiChevronRight />
          </button>
          <button onClick={() => handleEditChurch(row.original)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit /></button>
          <button onClick={() => handleDeleteChurch(row.original._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash /></button>
        </div>
      ),
    },
  ];

  const unitColumns: ColumnDef<Unit>[] = [
    { accessorKey: 'name', header: 'Unit Name' },
    { accessorKey: 'unitNumber', header: 'Unit Number' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button onClick={() => fetchBavanakutayimas(row.original._id, row.original.name)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">
          View Bavanakutayimas <FiChevronRight />
        </button>
      ),
    },
  ];

  const bavanakutayimaColumns: ColumnDef<Bavanakutayima>[] = [
    { accessorKey: 'name', header: 'Bavanakutayima Name' },
    { accessorKey: 'leaderName', header: 'Leader' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button onClick={() => fetchHouses(row.original._id, row.original.name)} className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm">
          View Houses <FiChevronRight />
        </button>
      ),
    },
  ];

  const houseColumns: ColumnDef<House>[] = [
    { accessorKey: 'familyName', header: 'Family Name' },
    { accessorKey: 'headOfFamily', header: 'Head of Family' },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'phone', header: 'Phone' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button onClick={() => fetchMembers(row.original._id, row.original.familyName)} className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm">
          View Members <FiChevronRight />
        </button>
      ),
    },
  ];

  const memberColumns: ColumnDef<Member>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName || ''}`,
    },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'relationToHead', header: 'Relation' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  const titles = {
    churches: 'Churches',
    units: 'Units',
    bavanakutayimas: 'Bavanakutayimas',
    houses: 'Houses',
    members: 'Members',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {view !== 'churches' && (
              <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded"><FiArrowLeft /></button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{titles[view]}</h1>
          </div>
          {Object.keys(breadcrumb).length > 0 && (
            <p className="text-sm text-gray-600">
              {breadcrumb.church && `Church: ${breadcrumb.church}`}
              {breadcrumb.unit && ` → Unit: ${breadcrumb.unit}`}
              {breadcrumb.bavanakutayima && ` → Bavanakutayima: ${breadcrumb.bavanakutayima}`}
              {breadcrumb.house && ` → House: ${breadcrumb.house}`}
            </p>
          )}
        </div>
        {view === 'churches' && (
          <button
            onClick={() => {
              setEditingChurch(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FiPlus /> Add Church
          </button>
        )}
      </div>

      {view === 'churches' && <DataTable data={churches} columns={churchColumns} searchPlaceholder="Search churches..." />}
      {view === 'units' && <DataTable data={units} columns={unitColumns} searchPlaceholder="Search units..." />}
      {view === 'bavanakutayimas' && <DataTable data={bavanakutayimas} columns={bavanakutayimaColumns} searchPlaceholder="Search bavanakutayimas..." />}
      {view === 'houses' && <DataTable data={houses} columns={houseColumns} searchPlaceholder="Search houses..." />}
      {view === 'members' && <DataTable data={members} columns={memberColumns} searchPlaceholder="Search members..." />}

      <ChurchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingChurch(null);
        }}
        onSave={handleSaveChurch}
        church={editingChurch}
      />
    </div>
  );
}
