'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { FiEdit, FiTrash, FiUserCheck, FiShield, FiX } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';

interface Admin {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  username?: string;
  role: string;
  isActive: boolean;
  churchId?: { _id: string; name: string } | string;
  unitId?: { _id: string; name: string } | string;
  bavanakutayimaId?: { _id: string; name: string } | string;
  permissions?: string[];
  createdAt: string;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [filters, setFilters] = useState({
    role: '',
    church: '',
    isActive: '',
  });
  const [formData, setFormData] = useState({
    memberId: '',
    role: '',
    churchId: '',
    unitId: '',
    bavanakutayimaId: '',
    permissions: [] as string[],
  });

  const api = createRoleApi('super_admin');

  const roleOptions = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'church_admin', label: 'Church Admin', description: 'Manage entire church' },
    { value: 'unit_admin', label: 'Unit Admin', description: 'Manage specific unit' },
    { value: 'kudumbakutayima_admin', label: 'Kutayima Admin', description: 'Manage bavanakutayima' },
  ];

  const permissionOptions = [
    'view_dashboard',
    'manage_members',
    'manage_users',
    'manage_transactions',
    'manage_campaigns',
    'view_reports',
    'manage_settings',
  ];

  useEffect(() => {
    fetchAdmins();
    fetchChurches();
  }, []);

  useEffect(() => {
    if (formData.churchId) {
      fetchUnits(formData.churchId);
    }
  }, [formData.churchId]);

  useEffect(() => {
    if (formData.unitId) {
      fetchBavanakutayimas(formData.unitId);
    }
  }, [formData.unitId]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await api.get('/members');
      // Filter only admin roles
      const adminUsers = (response.data.data || []).filter((user: Admin) =>
        ['super_admin', 'church_admin', 'unit_admin', 'kudumbakutayima_admin'].includes(user.role)
      );
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error fetching admins:', error);
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

  const handleUpdateRole = async (adminId: string) => {
    try {
      await api.put(`/members/${adminId}`, formData);
      setShowModal(false);
      setEditingAdmin(null);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update admin role');
    }
  };

  const handleDeactivate = async (adminId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this admin?`)) return;
    try {
      await api.put(`/members/${adminId}`, { isActive: !currentStatus });
      fetchAdmins();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      memberId: admin._id,
      role: admin.role,
      churchId: typeof admin.churchId === 'object' ? admin.churchId._id : admin.churchId || '',
      unitId: typeof admin.unitId === 'object' ? admin.unitId._id : admin.unitId || '',
      bavanakutayimaId: typeof admin.bavanakutayimaId === 'object' ? admin.bavanakutayimaId._id : admin.bavanakutayimaId || '',
      permissions: admin.permissions || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      role: '',
      churchId: '',
      unitId: '',
      bavanakutayimaId: '',
      permissions: [],
    });
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const columns: ColumnDef<Admin>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
          {row.original.username && (
            <div className="text-xs text-gray-400">@{row.original.username}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const roleColors: Record<string, string> = {
          super_admin: 'bg-purple-100 text-purple-800',
          church_admin: 'bg-green-100 text-green-800',
          unit_admin: 'bg-blue-100 text-blue-800',
          kudumbakutayima_admin: 'bg-orange-100 text-orange-800',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[row.original.role] || 'bg-gray-100 text-gray-800'}`}>
            {row.original.role.replace('_', ' ').toUpperCase()}
          </span>
        );
      },
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      cell: ({ row }) => {
        const churchId = row.original.churchId;
        const unitId = row.original.unitId;
        const bavanakutayimaId = row.original.bavanakutayimaId;

        let scope = 'System Wide';
        if (typeof churchId === 'object' && churchId) scope = churchId.name;
        if (typeof unitId === 'object' && unitId) scope = unitId.name;
        if (typeof bavanakutayimaId === 'object' && bavanakutayimaId) scope = bavanakutayimaId.name;

        return <div className="text-sm text-gray-700">{scope}</div>;
      },
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
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edit Role & Permissions"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeactivate(row.original._id, row.original.isActive)}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
            title={row.original.isActive ? 'Deactivate' : 'Activate'}
          >
            <FiShield className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredAdmins = admins.filter(admin => {
    if (filters.role && admin.role !== filters.role) return false;
    if (filters.isActive === 'active' && !admin.isActive) return false;
    if (filters.isActive === 'inactive' && admin.isActive) return false;
    if (filters.church) {
      const churchId = typeof admin.churchId === 'object' ? admin.churchId._id : admin.churchId;
      if (churchId !== filters.church) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin & Privilege Management</h1>
            <p className="text-gray-600 text-sm">Manage admin roles and permissions across the system</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-600 text-sm font-medium">Super Admins</div>
          <div className="text-2xl font-bold text-purple-900">
            {admins.filter(a => a.role === 'super_admin').length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Church Admins</div>
          <div className="text-2xl font-bold text-green-900">
            {admins.filter(a => a.role === 'church_admin').length}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Unit Admins</div>
          <div className="text-2xl font-bold text-blue-900">
            {admins.filter(a => a.role === 'unit_admin').length}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-orange-600 text-sm font-medium">Kutayima Admins</div>
          <div className="text-2xl font-bold text-orange-900">
            {admins.filter(a => a.role === 'kudumbakutayima_admin').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SearchableSelect
          label="Filter by Role"
          options={roleOptions.map(r => ({ value: r.value, label: r.label }))}
          value={filters.role}
          onChange={(value) => setFilters({ ...filters, role: value })}
          placeholder="All Roles"
        />
        <SearchableSelect
          label="Filter by Church"
          options={churches.map(c => ({ value: c._id, label: c.name }))}
          value={filters.church}
          onChange={(value) => setFilters({ ...filters, church: value })}
          placeholder="All Churches"
        />
        <SearchableSelect
          label="Filter by Status"
          options={[
            { value: 'active', label: 'Active Only' },
            { value: 'inactive', label: 'Inactive Only' },
          ]}
          value={filters.isActive}
          onChange={(value) => setFilters({ ...filters, isActive: value })}
          placeholder="All Status"
        />
      </div>

      <DataTable
        data={filteredAdmins}
        columns={columns}
        searchPlaceholder="Search admins by name or email..."
      />

      {/* Edit Modal */}
      {showModal && editingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Edit Admin Role & Permissions</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Admin Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900">{editingAdmin.firstName} {editingAdmin.lastName}</div>
                <div className="text-sm text-gray-600">{editingAdmin.email}</div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Role *</label>
                <div className="space-y-2">
                  {roleOptions.map(role => (
                    <label key={role.value} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{role.label}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scope Assignment */}
              {formData.role !== 'super_admin' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Assign Scope</h4>

                  {(formData.role === 'church_admin' || formData.role === 'unit_admin' || formData.role === 'kudumbakutayima_admin') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Church *</label>
                      <select
                        value={formData.churchId}
                        onChange={(e) => setFormData({ ...formData, churchId: e.target.value, unitId: '', bavanakutayimaId: '' })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                      >
                        <option value="">Select Church</option>
                        {churches.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {(formData.role === 'unit_admin' || formData.role === 'kudumbakutayima_admin') && formData.churchId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                      <select
                        value={formData.unitId}
                        onChange={(e) => setFormData({ ...formData, unitId: e.target.value, bavanakutayimaId: '' })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                      >
                        <option value="">Select Unit</option>
                        {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.role === 'kudumbakutayima_admin' && formData.unitId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bavanakutayima *</label>
                      <select
                        value={formData.bavanakutayimaId}
                        onChange={(e) => setFormData({ ...formData, bavanakutayimaId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                      >
                        <option value="">Select Bavanakutayima</option>
                        {bavanakutayimas.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Permissions (Optional)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {permissionOptions.map(permission => (
                    <label key={permission} className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{permission.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleUpdateRole(editingAdmin._id)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Update Role & Permissions
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
