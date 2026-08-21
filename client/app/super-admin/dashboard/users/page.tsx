'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';
import { ColumnDef } from '@tanstack/react-table';
import { FiTrash, FiEdit2, FiUserCheck, FiShield, FiPlus, FiX } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

const addUserSchema = z.object({
  church: z.string().min(1, 'Select a church first'),
  memberId: z.string().min(1, 'Select a member to grant login access to'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['member', 'kudumbakutayima_admin', 'unit_admin', 'church_admin']),
  isActive: z.boolean(),
});

interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  username: string;
  email?: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  churchId?: { _id: string; name: string } | string;
  unitId?: { _id: string; name: string } | string;
  phone?: string;
}

const emptyAddUserForm = {
  church: '',
  memberId: '',
  username: '',
  password: '',
  role: 'member',
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    church: '',
    role: '',
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', password: '', role: 'member', isActive: true });
  const [addUserForm, setAddUserForm] = useState(emptyAddUserForm);
  const [addUserErrors, setAddUserErrors] = useState<FieldErrors>({});
  const [membersWithoutLogin, setMembersWithoutLogin] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const api = createRoleApi('super_admin');

  useEffect(() => {
    fetchUsers();
    fetchChurches();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all members and filter only those with username (login access)
      const response = await api.get('/members');
      const allMembers = response.data.data || [];
      // Filter to show only members with login credentials
      const usersOnly = allMembers.filter((member: any) => member.username);
      setUsers(usersOnly);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
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

  const fetchCandidateMembers = async (churchId: string) => {
    setLoadingCandidates(true);
    try {
      const response = await api.get(`/members?churchId=${churchId}`);
      const allMembers = response.data.data || [];
      setMembersWithoutLogin(allMembers.filter((m: any) => !m.username));
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setEditForm({ username: user.username, password: '', role: user.role, isActive: user.isActive });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: any = { username: editForm.username, role: editForm.role, isActive: editForm.isActive };
    if (editForm.password) payload.password = editForm.password;
    try {
      await api.put(`/members/${editingUser._id}`, payload);
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const openAddUserModal = () => {
    setAddUserForm(emptyAddUserForm);
    setAddUserErrors({});
    setMembersWithoutLogin([]);
    setShowAddUserModal(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateForm(addUserSchema, addUserForm);
    if (!result.success) {
      setAddUserErrors(result.errors);
      return;
    }
    setAddUserErrors({});

    setSubmittingUser(true);
    try {
      await api.put(`/members/${result.data.memberId}`, {
        username: result.data.username,
        password: result.data.password,
        role: result.data.role,
        isActive: result.data.isActive,
      });
      toast.success('Login access granted!');
      setShowAddUserModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error granting user access:', error);
      toast.error(error.response?.data?.error || 'Failed to grant login access');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to remove login access for this member?')) {
      try {
        // Update member to remove login credentials
        await api.put(`/members/${id}`, {
          username: null,
          password: null,
          role: 'member',
        });
        fetchUsers();
        toast.success('Login access removed');
      } catch (error) {
        console.error('Error removing user access:', error);
        toast.error('Failed to remove user access');
      }
    }
  };

  const getChurchId = (user: User): string | undefined => {
    if (typeof user.churchId === 'object' && user.churchId) {
      return user.churchId._id;
    }
    return user.churchId as string;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'church_admin':
        return 'bg-purple-100 text-purple-800';
      case 'unit_admin':
        return 'bg-blue-100 text-blue-800';
      case 'kudumbakutayima_admin':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.username}</div>
          <div className="text-xs text-gray-500">{`${row.original.firstName} ${row.original.lastName || ''}`}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email / Phone',
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{row.original.email || '-'}</div>
          <div className="text-xs text-gray-500">{row.original.phone || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Church',
      cell: ({ row }) => {
        const churchId = row.original.churchId;
        if (typeof churchId === 'object' && churchId) {
          return churchId.name;
        }
        const church = churches.find(c => c._id === churchId);
        return church?.name || '-';
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(row.original.role)}`}>
          {row.original.role.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Login',
      cell: ({ row }) => {
        if (!row.original.lastLogin) return <span className="text-gray-400 text-xs">Never</span>;
        const date = new Date(row.original.lastLogin);
        return (
          <div className="text-xs">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-gray-500">{date.toLocaleTimeString()}</div>
          </div>
        );
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
          <button onClick={() => openEditUserModal(row.original)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit user">
            <FiEdit2 />
          </button>
          <button
            onClick={() => handleDeleteUser(row.original._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Remove Login Access"
          >
            <FiTrash />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    if (filters.church && getChurchId(user) !== filters.church) return false;
    if (filters.role && user.role !== filters.role) return false;
    return true;
  });

  const roleStats = {
    super_admin: users.filter(u => u.role === 'super_admin').length,
    church_admin: users.filter(u => u.role === 'church_admin').length,
    unit_admin: users.filter(u => u.role === 'unit_admin').length,
    kudumbakutayima_admin: users.filter(u => u.role === 'kudumbakutayima_admin').length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Access Management</h1>
          <p className="text-gray-600 text-sm">Manage members with login credentials and system roles</p>
        </div>
        <button
          onClick={openAddUserModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <FiPlus /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            </div>
            <FiUserCheck className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-3xl font-bold text-gray-800">{roleStats.super_admin}</p>
            </div>
            <FiShield className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Church Admins</p>
              <p className="text-3xl font-bold text-gray-800">{roleStats.church_admin}</p>
            </div>
            <FiShield className="w-10 h-10 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unit Admins</p>
              <p className="text-3xl font-bold text-gray-800">{roleStats.unit_admin}</p>
            </div>
            <FiShield className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SearchableSelect
          label="Church"
          options={churches.map((church) => ({
            value: church._id,
            label: church.name,
          }))}
          value={filters.church}
          onChange={(value) => setFilters({ ...filters, church: value })}
          placeholder="All Churches"
        />
        <SearchableSelect
          label="Role"
          options={[
            { value: 'super_admin', label: 'Super Admin' },
            { value: 'church_admin', label: 'Church Admin' },
            { value: 'unit_admin', label: 'Unit Admin' },
            { value: 'kudumbakutayima_admin', label: 'Kutayima Admin' },
          ]}
          value={filters.role}
          onChange={(value) => setFilters({ ...filters, role: value })}
          placeholder="All Roles"
        />
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search users by username or name..."
      />

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep unchanged)</span></label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="min 6 characters"
                />
              </div>
              <SearchableSelect
                label="Role"
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'kudumbakutayima_admin', label: 'Kudumbakutayima Admin' },
                  { value: 'unit_admin', label: 'Unit Admin' },
                  { value: 'church_admin', label: 'Church Admin' },
                ]}
                value={editForm.role}
                onChange={(value) => setEditForm({ ...editForm, role: value })}
                placeholder="Select role..."
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                />
                <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add User</h2>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <SearchableSelect
                  label="Church"
                  required
                  options={churches.map((church) => ({ value: church._id, label: church.name }))}
                  value={addUserForm.church}
                  onChange={(value) => {
                    setAddUserForm({ ...addUserForm, church: value, memberId: '' });
                    setMembersWithoutLogin([]);
                    if (value) fetchCandidateMembers(value);
                  }}
                  placeholder="Search and select church..."
                />
                <FieldError message={addUserErrors.church} />
              </div>

              <div>
                <SearchableSelect
                  label="Member"
                  required
                  options={membersWithoutLogin.map((m) => ({
                    value: m._id,
                    label: `${m.firstName} ${m.lastName || ''}`.trim(),
                  }))}
                  value={addUserForm.memberId}
                  onChange={(value) => setAddUserForm({ ...addUserForm, memberId: value })}
                  placeholder={
                    !addUserForm.church
                      ? 'Select a church first'
                      : loadingCandidates
                      ? 'Loading members...'
                      : membersWithoutLogin.length
                      ? 'Search and select member...'
                      : 'No members without login found'
                  }
                  disabled={!addUserForm.church}
                />
                <FieldError message={addUserErrors.memberId} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={addUserForm.username}
                  onChange={(e) => setAddUserForm({ ...addUserForm, username: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    addUserErrors.username ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <FieldError message={addUserErrors.username} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={addUserForm.password}
                  onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    addUserErrors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="min 6 characters"
                />
                <FieldError message={addUserErrors.password} />
              </div>

              <SearchableSelect
                label="Role"
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'kudumbakutayima_admin', label: 'Kudumbakutayima Admin' },
                  { value: 'unit_admin', label: 'Unit Admin' },
                  { value: 'church_admin', label: 'Church Admin' },
                ]}
                value={addUserForm.role}
                onChange={(value) => setAddUserForm({ ...addUserForm, role: value })}
                placeholder="Select role..."
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="addUserIsActive"
                  checked={addUserForm.isActive}
                  onChange={(e) => setAddUserForm({ ...addUserForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="addUserIsActive" className="ml-2 block text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingUser ? 'Granting...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
