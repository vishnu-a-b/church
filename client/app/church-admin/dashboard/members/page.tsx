'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { FiEdit, FiTrash, FiUsers, FiPlus, FiX } from 'react-icons/fi';
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
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  baptismName?: string;
  relationToHead?: 'head' | 'spouse' | 'child' | 'parent' | 'other';
  hierarchicalNumber?: string;
}

export default function ChurchAdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLoadingId, setEditingLoadingId] = useState<string | null>(null);
  const [allBavanakutayimas, setAllBavanakutayimas] = useState<any[]>([]);
  const [allHouses, setAllHouses] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    unit: '',
    bavanakutayima: '',
    house: '',
    role: '',
    hasLogin: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male' as 'male' | 'female',
    dateOfBirth: '',
    phone: '',
    email: '',
    baptismName: '',
    relationToHead: 'head' as 'head' | 'spouse' | 'child' | 'parent' | 'other',
    unitId: '',
    bavanakutayimaId: '',
    houseId: '',
    username: '',
    password: '',
    role: 'member',
    isActive: true,
    smsPreferences: {
      enabled: true,
      paymentNotifications: true,
      receiptNotifications: true,
    },
  });
  const api = createRoleApi('church_admin');

  useEffect(() => {
    fetchMembers();
    fetchUnits();
  }, []);

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

  const fetchAllBavanakutayimas = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setAllBavanakutayimas(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAllHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setAllHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'unitId') {
      setFormData({ ...formData, [name]: value, bavanakutayimaId: '', houseId: '' });
      setAllBavanakutayimas([]);
      setAllHouses([]);
      if (value) {
        fetchAllBavanakutayimas(value);
      }
    } else if (name === 'bavanakutayimaId') {
      setFormData({ ...formData, [name]: value, houseId: '' });
      setAllHouses([]);
      if (value) {
        fetchAllHouses(value);
      }
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'male',
      dateOfBirth: '',
      phone: '',
      email: '',
      baptismName: '',
      relationToHead: 'head',
      unitId: '',
      bavanakutayimaId: '',
      houseId: '',
      username: '',
      password: '',
      role: 'member',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });
    setAllBavanakutayimas([]);
    setAllHouses([]);
  };

  const handleEdit = async (member: Member) => {
    setEditingLoadingId(member._id);
    try {
      setEditingId(member._id);

      // Extract IDs from populated fields
      const unitId = typeof member.unitId === 'object' ? member.unitId._id : member.unitId || '';
      const bavanakutayimaId = typeof member.bavanakutayimaId === 'object' ? member.bavanakutayimaId._id : member.bavanakutayimaId || '';
      const houseId = typeof member.houseId === 'object' ? member.houseId._id : member.houseId || '';

      // Load cascading data
      if (unitId) {
        await fetchAllBavanakutayimas(unitId);
      }
      if (bavanakutayimaId) {
        await fetchAllHouses(bavanakutayimaId);
      }

      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        gender: member.gender || 'male',
        dateOfBirth: member.dateOfBirth || '',
        phone: member.phone || '',
        email: member.email || '',
        baptismName: member.baptismName || '',
        relationToHead: member.relationToHead || 'head',
        unitId,
        bavanakutayimaId,
        houseId,
        username: member.username || '',
        password: '',
        role: member.role || 'member',
        isActive: member.isActive !== undefined ? member.isActive : true,
        smsPreferences: {
          enabled: true,
          paymentNotifications: true,
          receiptNotifications: true,
        },
      });
      setShowAddModal(true);
    } finally {
      setEditingLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.houseId) {
      alert('Please fill in all required fields (First Name and House)');
      return;
    }

    // If login credentials are provided, email is required
    if ((formData.username || formData.password) && !formData.email) {
      alert('Email is required when adding login credentials (username/password)');
      return;
    }

    setFormLoading(true);
    try {
      // Get churchId from the first unit (church admin has access to only their church)
      const unit = units.find(u => u._id === formData.unitId);
      const churchId = unit?.churchId?._id || unit?.churchId;

      const memberData = {
        ...formData,
        churchId,
      };

      if (editingId) {
        // Update existing member
        await api.put(`/members/${editingId}`, memberData);
        alert('Member updated successfully!');
      } else {
        // Create new member
        await api.post('/members', memberData);
        alert('Member added successfully!');
      }

      setShowAddModal(false);
      resetForm();
      fetchMembers();
    } catch (error: any) {
      console.error('Error saving member:', error);
      alert(error.response?.data?.error || 'Failed to save member');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      setDeletingId(id);
      try {
        await api.delete(`/members/${id}`);
        fetchMembers();
        alert('Member deleted successfully!');
      } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member');
      } finally {
        setDeletingId(null);
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
      accessorKey: 'hierarchicalNumber',
      header: 'Hierarchical ID',
      cell: ({ row }) => (
        <div className="text-sm font-semibold text-blue-600">{row.original.hierarchicalNumber || '-'}</div>
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
        } else if (churchId) {
          churchName = 'Church';
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
          <button
            onClick={() => handleEdit(row.original)}
            disabled={editingLoadingId === row.original._id || deletingId === row.original._id}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingLoadingId === row.original._id ? <div className="animate-spin">⏳</div> : <FiEdit />}
          </button>
          <button
            onClick={() => handleDeleteMember(row.original._id)}
            disabled={deletingId === row.original._id || editingLoadingId === row.original._id}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingId === row.original._id ? <div className="animate-spin">⏳</div> : <FiTrash />}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  // Filtering logic for members
  const filteredMembers = members.filter(member => {
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
          onClick={() => setShowAddModal(true)}
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <SearchableSelect
          label="Unit"
          options={units.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }))}
          value={filters.unit}
          onChange={(value) => setFilters({ ...filters, unit: value, bavanakutayima: '', house: '' })}
          placeholder="All Units"
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

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Member' : 'Add New Member'}</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
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
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Baptism Name</label>
                    <input
                      type="text"
                      name="baptismName"
                      value={formData.baptismName}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

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
                </div>
              </div>

              {/* Hierarchy Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Hierarchy Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SearchableSelect
                    label="Unit"
                    required
                    options={units.map(unit => ({ value: unit._id, label: unit.name }))}
                    value={formData.unitId}
                    onChange={(value) => {
                      setFormData({ ...formData, unitId: value, bavanakutayimaId: '', houseId: '' });
                      setAllBavanakutayimas([]);
                      setAllHouses([]);
                      if (value) {
                        fetchAllBavanakutayimas(value);
                      }
                    }}
                    placeholder="Search and select unit..."
                  />

                  <SearchableSelect
                    label="Bavanakutayima"
                    required
                    options={allBavanakutayimas.map(bk => ({ value: bk._id, label: bk.name }))}
                    value={formData.bavanakutayimaId}
                    onChange={(value) => {
                      setFormData({ ...formData, bavanakutayimaId: value, houseId: '' });
                      setAllHouses([]);
                      if (value) {
                        fetchAllHouses(value);
                      }
                    }}
                    placeholder={formData.unitId ? "Search and select bavanakutayima..." : "Select unit first"}
                    disabled={!formData.unitId}
                  />

                  <SearchableSelect
                    label="House"
                    required
                    options={allHouses.map(house => ({ value: house._id, label: house.familyName }))}
                    value={formData.houseId}
                    onChange={(value) => setFormData({ ...formData, houseId: value })}
                    placeholder={formData.bavanakutayimaId ? "Search and select house..." : "Select bavanakutayima first"}
                    disabled={!formData.bavanakutayimaId}
                  />
                </div>
              </div>

              {/* Login Credentials (Optional) */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Credentials (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
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
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleFormChange}
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
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Member' : 'Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
