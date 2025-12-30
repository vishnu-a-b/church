'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ColumnDef } from '@tanstack/react-table';
import { FiEdit, FiTrash, FiUserCheck, FiShield } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    church: '',
    role: '',
  });
  const api = createRoleApi('unit_admin');

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
      } catch (error) {
        console.error('Error removing user access:', error);
        alert('Failed to remove user access');
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
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit User">
            <FiEdit />
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
    </div>
  );
}
