'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';
import { ColumnDef } from '@tanstack/react-table';
import { FiTrash, FiEdit2, FiUsers, FiPlus, FiX } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

const addMemberSchema = z
  .object({
    church: z.string().min(1, 'Select a church first'),
    unitId: z.string().min(1, 'Select a unit'),
    bavanakutayimaId: z.string().min(1, 'Select a bavanakutayima'),
    houseId: z.string().min(1, 'Select a house'),
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().optional(),
    gender: z.enum(['male', 'female']),
    dateOfBirth: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    baptismName: z.string().optional(),
    relationToHead: z.enum(['head', 'spouse', 'child', 'parent', 'other']),
    username: z.string().optional(),
    password: z.string().optional(),
    role: z.string(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if ((data.username || data.password) && !data.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email is required when adding login credentials' });
    }
    if (data.password && data.password.length > 0 && data.password.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password must be at least 6 characters' });
    }
  });

interface Member {
  _id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  role: string;
  isActive: boolean;
  uniqueId?: string;
  hierarchicalNumber?: string;
  churchId?: { _id: string; name: string } | string;
  unitId?: { _id: string; name: string } | string;
  bavanakutayimaId?: { _id: string; name: string } | string;
  houseId?: { _id: string; familyName: string } | string;
  phone?: string;
}

const emptyMemberForm = {
  church: '',
  unitId: '',
  bavanakutayimaId: '',
  houseId: '',
  firstName: '',
  lastName: '',
  gender: 'male' as 'male' | 'female',
  dateOfBirth: '',
  phone: '',
  email: '',
  baptismName: '',
  relationToHead: 'head' as 'head' | 'spouse' | 'child' | 'parent' | 'other',
  username: '',
  password: '',
  role: 'member',
  isActive: true,
};

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyMemberForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [formUnits, setFormUnits] = useState<any[]>([]);
  const [formBavanakutayimas, setFormBavanakutayimas] = useState<any[]>([]);
  const [formHouses, setFormHouses] = useState<any[]>([]);
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

  const fetchFormUnits = async (churchId: string) => {
    try {
      const response = await api.get(`/units?churchId=${churchId}`);
      setFormUnits(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFormBavanakutayimas = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setFormBavanakutayimas(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchFormHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setFormHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetMemberForm = () => {
    setFormData(emptyMemberForm);
    setFormErrors({});
    setFormUnits([]);
    setFormBavanakutayimas([]);
    setFormHouses([]);
  };

  const openAddModal = () => {
    setEditingMember(null);
    resetMemberForm();
    setShowAddModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormErrors({});

    // houseId is deeply populated: houseId.bavanakutayimaId.unitId.churchId
    const houseObj = typeof member.houseId === 'object' && member.houseId ? (member.houseId as any) : null;
    const bkObj = houseObj?.bavanakutayimaId && typeof houseObj.bavanakutayimaId === 'object' ? houseObj.bavanakutayimaId : null;
    const unitObj = bkObj?.unitId && typeof bkObj.unitId === 'object' ? bkObj.unitId : null;
    const churchObj = unitObj?.churchId && typeof unitObj.churchId === 'object' ? unitObj.churchId : null;

    const houseId = houseObj?._id || (member.houseId as string) || '';
    const bavanakutayimaId = bkObj?._id || (typeof member.bavanakutayimaId === 'object' && member.bavanakutayimaId ? (member.bavanakutayimaId as any)._id : (member.bavanakutayimaId as string)) || '';
    const unitId = unitObj?._id || (typeof member.unitId === 'object' && member.unitId ? (member.unitId as any)._id : (member.unitId as string)) || '';
    const churchId = churchObj?._id || (typeof member.churchId === 'object' && member.churchId ? (member.churchId as any)._id : (member.churchId as string)) || '';

    // Pre-populate dropdown options immediately from nested data so selection shows before async fetches complete
    if (unitObj) setFormUnits([{ _id: unitObj._id, name: unitObj.name }]);
    if (bkObj) setFormBavanakutayimas([{ _id: bkObj._id, name: bkObj.name }]);
    if (houseObj) setFormHouses([{ _id: houseObj._id, familyName: houseObj.familyName }]);

    setFormData({
      church: churchId,
      unitId,
      bavanakutayimaId,
      houseId,
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      gender: (member as any).gender || 'male',
      dateOfBirth: (member as any).dateOfBirth ? new Date((member as any).dateOfBirth).toISOString().split('T')[0] : '',
      phone: member.phone || '',
      email: member.email || '',
      baptismName: (member as any).baptismName || '',
      relationToHead: (member as any).relationToHead || 'head',
      username: member.username || '',
      password: '',
      role: member.role || 'member',
      isActive: member.isActive,
    });

    // Fetch full lists in background for complete dropdowns
    if (churchId) fetchFormUnits(churchId);
    if (unitId) fetchFormBavanakutayimas(unitId);
    if (bavanakutayimaId) fetchFormHouses(bavanakutayimaId);
    setShowAddModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateForm(addMemberSchema, formData);
    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      if (editingMember) {
        const { church, password, ...rest } = result.data;
        const payload: any = { ...rest, churchId: church };
        if (password) payload.password = password;
        await api.put(`/members/${editingMember._id}`, payload);
        toast.success('Member updated successfully!');
      } else {
        const { church, ...rest } = result.data;
        await api.post('/members', { ...rest, churchId: church });
        toast.success('Member added successfully!');
      }
      setShowAddModal(false);
      setEditingMember(null);
      resetMemberForm();
      fetchMembers();
    } catch (error: any) {
      console.error('Error saving member:', error);
      toast.error(error.response?.data?.error || 'Failed to save member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}`);
        fetchMembers();
        toast.success('Member deleted successfully!');
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error('Failed to delete member');
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
      accessorKey: 'uniqueId',
      header: 'Unique ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-semibold text-blue-600">
          {row.original.uniqueId || row.original.hierarchicalNumber || '-'}
        </span>
      ),
    },
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
          <button onClick={() => openEditModal(row.original)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit member"><FiEdit2 /></button>
          <button onClick={() => handleDeleteMember(row.original._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete member"><FiTrash /></button>
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
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <FiPlus /> Add Member
        </button>
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
        searchPlaceholder="Search by name, unique ID, username..."
      />

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
              <button
                onClick={() => { setShowAddModal(false); resetMemberForm(); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6">
              {/* Hierarchy Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Hierarchy Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <SearchableSelect
                      label="Church"
                      required
                      options={churches.map(c => ({ value: c._id, label: c.name }))}
                      value={formData.church}
                      onChange={(value) => {
                        setFormData({ ...formData, church: value, unitId: '', bavanakutayimaId: '', houseId: '' });
                        setFormUnits([]);
                        setFormBavanakutayimas([]);
                        setFormHouses([]);
                        if (value) fetchFormUnits(value);
                      }}
                      placeholder="Search and select church..."
                    />
                    <FieldError message={formErrors.church} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <SearchableSelect
                      label="Unit"
                      required
                      options={formUnits.map(unit => ({ value: unit._id, label: unit.name }))}
                      value={formData.unitId}
                      onChange={(value) => {
                        setFormData({ ...formData, unitId: value, bavanakutayimaId: '', houseId: '' });
                        setFormBavanakutayimas([]);
                        setFormHouses([]);
                        if (value) fetchFormBavanakutayimas(value);
                      }}
                      placeholder={formData.church ? 'Search and select unit...' : 'Select church first'}
                      disabled={!formData.church}
                    />
                    <FieldError message={formErrors.unitId} />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Bavanakutayima"
                      required
                      options={formBavanakutayimas.map(bk => ({ value: bk._id, label: bk.name }))}
                      value={formData.bavanakutayimaId}
                      onChange={(value) => {
                        setFormData({ ...formData, bavanakutayimaId: value, houseId: '' });
                        setFormHouses([]);
                        if (value) fetchFormHouses(value);
                      }}
                      placeholder={formData.unitId ? 'Search and select bavanakutayima...' : 'Select unit first'}
                      disabled={!formData.unitId}
                    />
                    <FieldError message={formErrors.bavanakutayimaId} />
                  </div>

                  <div>
                    <SearchableSelect
                      label="House"
                      required
                      options={formHouses.map(house => ({ value: house._id, label: house.familyName }))}
                      value={formData.houseId}
                      onChange={(value) => setFormData({ ...formData, houseId: value })}
                      placeholder={formData.bavanakutayimaId ? 'Search and select house...' : 'Select bavanakutayima first'}
                      disabled={!formData.bavanakutayimaId}
                    />
                    <FieldError message={formErrors.houseId} />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formErrors.firstName ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <FieldError message={formErrors.firstName} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Gender"
                      required
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                      ]}
                      value={formData.gender}
                      onChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' })}
                      placeholder="Select gender..."
                    />
                    <FieldError message={formErrors.gender} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <FieldError message={formErrors.email} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baptism Name</label>
                    <input
                      type="text"
                      value={formData.baptismName}
                      onChange={(e) => setFormData({ ...formData, baptismName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Relation to Head"
                      required
                      options={[
                        { value: 'head', label: 'Head' },
                        { value: 'spouse', label: 'Spouse' },
                        { value: 'child', label: 'Child' },
                        { value: 'parent', label: 'Parent' },
                        { value: 'other', label: 'Other' },
                      ]}
                      value={formData.relationToHead}
                      onChange={(value) => setFormData({ ...formData, relationToHead: value as 'head' | 'spouse' | 'child' | 'parent' | 'other' })}
                      placeholder="Select relation..."
                    />
                    <FieldError message={formErrors.relationToHead} />
                  </div>
                </div>
              </div>

              {/* Login Credentials (Optional) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Credentials {editingMember ? '(leave password blank to keep unchanged)' : '(Optional)'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formErrors.password ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <FieldError message={formErrors.password} />
                  </div>

                  <SearchableSelect
                    label="Role"
                    options={[
                      { value: 'member', label: 'Member' },
                      { value: 'kudumbakutayima_admin', label: 'Kudumbakutayima Admin' },
                      { value: 'unit_admin', label: 'Unit Admin' },
                    ]}
                    value={formData.role}
                    onChange={(value) => setFormData({ ...formData, role: value })}
                    placeholder="Select role..."
                  />

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Active</label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetMemberForm(); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingMember ? 'Updating...' : 'Adding...') : (editingMember ? 'Update Member' : 'Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
