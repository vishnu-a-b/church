'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { FiEdit, FiTrash, FiUsers } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';

interface Member {
  _id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  role: string;
  isActive: boolean;
  churchId?: { _id: string; name: string } | string;
  unitId?: { _id: string; name: string } | string;
  bavanakutayimaId?: { _id: string; name: string } | string;
  houseId?: { _id: string; familyName: string } | string;
  phone?: string;
}

export default function SuperAdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    church: '',
    unit: '',
    bavanakutayima: '',
    house: '',
    role: '',
    hasLogin: '',
  });
  const api = createRoleApi('super_admin');

  useEffect(() => {
    fetchMembers();
    fetchChurches();
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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/members');
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
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

  const handleDeleteMember = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}`);
        fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member');
      }
    }
  };

  const getChurchId = (member: Member): string | undefined => {
    if (typeof member.churchId === 'object' && member.churchId) {
      return member.churchId._id;
    }
    return member.churchId as string;
  };

  const getUnitId = (member: Member): string | undefined => {
    if (typeof member.unitId === 'object' && member.unitId) {
      return member.unitId._id;
    }
    return member.unitId as string;
  };

  const getBavanakutayimaId = (member: Member): string | undefined => {
    if (typeof member.bavanakutayimaId === 'object' && member.bavanakutayimaId) {
      return member.bavanakutayimaId._id;
    }
    return member.bavanakutayimaId as string;
  };

  const getHouseId = (member: Member): string | undefined => {
    if (typeof member.houseId === 'object' && member.houseId) {
      return member.houseId._id;
    }
    return member.houseId as string;
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{`${row.original.firstName} ${row.original.lastName || ''}`}</div>
          <div className="text-xs text-gray-500">{row.original.email || row.original.phone || '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => row.original.username || <span className="text-gray-400 italic text-xs">No login</span>,
    },
    {
      header: 'Church / House',
      cell: ({ row }) => {
        const churchId = row.original.churchId;
        const houseId = row.original.houseId;
        let churchName = '-';
        let houseName = '-';

        if (typeof churchId === 'object' && churchId) {
          churchName = churchId.name;
        } else {
          const church = churches.find(c => c._id === churchId);
          churchName = church?.name || '-';
        }

        if (typeof houseId === 'object' && houseId) {
          houseName = houseId.familyName;
        }

        return (
          <div>
            <div className="text-sm">{churchName}</div>
            <div className="text-xs text-gray-500">{houseName}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          {row.original.role.replace('_', ' ')}
        </span>
      ),
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
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit /></button>
          <button onClick={() => handleDeleteMember(row.original._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash /></button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  // Filtering logic for members
  const filteredMembers = members.filter(member => {
    if (filters.church && getChurchId(member) !== filters.church) return false;
    if (filters.unit && getUnitId(member) !== filters.unit) return false;
    if (filters.bavanakutayima && getBavanakutayimaId(member) !== filters.bavanakutayima) return false;
    if (filters.house && getHouseId(member) !== filters.house) return false;
    if (filters.role && member.role !== filters.role) return false;
    if (filters.hasLogin === 'yes' && !member.username) return false;
    if (filters.hasLogin === 'no' && member.username) return false;
    return true;
  });

  const membersWithLogin = members.filter(m => m.username).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Members Management</h1>
          <p className="text-gray-600 text-sm">Manage all members and their login credentials</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-800">{members.length}</p>
            </div>
            <FiUsers className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Login Access</p>
              <p className="text-3xl font-bold text-gray-800">{membersWithLogin}</p>
            </div>
            <FiUsers className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered Results</p>
              <p className="text-3xl font-bold text-gray-800">{filteredMembers.length}</p>
            </div>
            <FiUsers className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <SearchableSelect
          label="Church"
          options={churches.map((church) => ({
            value: church._id,
            label: church.name,
          }))}
          value={filters.church}
          onChange={(value) => setFilters({ ...filters, church: value, unit: '', bavanakutayima: '', house: '' })}
          placeholder="All Churches"
        />
        <SearchableSelect
          label="Unit"
          options={units.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }))}
          value={filters.unit}
          onChange={(value) => setFilters({ ...filters, unit: value, bavanakutayima: '', house: '' })}
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
        <SearchableSelect
          label="Role"
          options={[
            { value: 'super_admin', label: 'Super Admin' },
            { value: 'church_admin', label: 'Church Admin' },
            { value: 'unit_admin', label: 'Unit Admin' },
            { value: 'kudumbakutayima_admin', label: 'Kutayima Admin' },
            { value: 'member', label: 'Member' },
          ]}
          value={filters.role}
          onChange={(value) => setFilters({ ...filters, role: value })}
          placeholder="All Roles"
        />
        <SearchableSelect
          label="Login Access"
          options={[
            { value: 'yes', label: 'Has Login' },
            { value: 'no', label: 'No Login' },
          ]}
          value={filters.hasLogin}
          onChange={(value) => setFilters({ ...filters, hasLogin: value })}
          placeholder="All"
        />
      </div>

      <DataTable
        data={filteredMembers}
        columns={columns}
        searchPlaceholder="Search members..."
      />
    </div>
  );
}
