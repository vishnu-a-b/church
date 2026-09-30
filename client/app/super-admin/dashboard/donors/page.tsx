'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { DataTable } from '@/components/DataTable';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';
import { ColumnDef } from '@tanstack/react-table';
import { FiEdit2, FiUserPlus, FiPlus, FiX } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

const donorSchema = z.object({
  churchId: z.string().min(1, 'Church is required'),
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

interface Donor {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  churchId: { _id: string; name: string } | string;
  createdAt: string;
}

const emptyForm = {
  churchId: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChurch, setFilterChurch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Donor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const api = createRoleApi('super_admin');

  useEffect(() => {
    fetchDonors();
    fetchChurches();
  }, []);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donors');
      setDonors(res.data.data || []);
    } catch {
      toast.error('Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    try {
      const res = await api.get('/churches');
      setChurches(res.data.data || []);
    } catch {
      console.error('Failed to load churches');
    }
  };

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (donor: Donor) => {
    setEditing(donor);
    setForm({
      churchId: resolveId(donor.churchId),
      name: donor.name,
      phone: donor.phone,
      email: donor.email || '',
      address: donor.address || '',
      notes: donor.notes || '',
      isActive: donor.isActive,
    });
    setErrors({});
    setShowModal(true);
  };

  const resolveId = (val: any): string =>
    typeof val === 'object' && val !== null ? val._id : val ?? '';

  const getChurchName = (churchId: any) => {
    if (typeof churchId === 'object' && churchId !== null) return churchId.name || '-';
    return churches.find((c) => c._id === churchId)?.name || '-';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateForm(donorSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/donors/${editing._id}`, {
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address || undefined,
          notes: form.notes || undefined,
          isActive: form.isActive,
        });
        toast.success('Donor updated');
      } else {
        await api.post('/donors', result.data);
        toast.success('Donor created');
      }
      setShowModal(false);
      fetchDonors();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDonors = donors.filter((d) => {
    if (!filterChurch) return true;
    return resolveId(d.churchId) === filterChurch;
  });

  const columns: ColumnDef<Donor>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-gray-500">{row.original.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-sm">{row.original.email || '-'}</span>,
    },
    {
      header: 'Church',
      cell: ({ row }) => <span className="text-sm">{getChurchName(row.original.churchId)}</span>,
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 truncate max-w-xs block">{row.original.notes || '-'}</span>
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
        <button
          onClick={() => openEditModal(row.original)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit donor"
        >
          <FiEdit2 />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Outside Supporters</h1>
          <p className="text-gray-600 text-sm">Manage donors who are not part of the church membership</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <FiPlus /> Add Donor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Donors</p>
            <p className="text-3xl font-bold text-gray-800">{donors.length}</p>
          </div>
          <FiUserPlus className="w-10 h-10 text-purple-600" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-3xl font-bold text-green-700">{donors.filter((d) => d.isActive).length}</p>
          </div>
          <FiUserPlus className="w-10 h-10 text-green-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-3xl font-bold text-red-600">{donors.filter((d) => !d.isActive).length}</p>
          </div>
          <FiUserPlus className="w-10 h-10 text-red-400" />
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 max-w-xs">
        <SearchableSelect
          label="Filter by Church"
          options={churches.map((c) => ({ value: c._id, label: c.name }))}
          value={filterChurch}
          onChange={setFilterChurch}
          placeholder="All Churches"
        />
      </div>

      <DataTable
        data={filteredDonors}
        columns={columns}
        searchPlaceholder="Search donors by name or phone..."
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editing ? 'Edit Donor' : 'Add Donor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editing && (
                <div>
                  <SearchableSelect
                    label="Church *"
                    required
                    options={churches.map((c) => ({ value: c._id, label: c.name }))}
                    value={form.churchId}
                    onChange={(v) => setForm({ ...form, churchId: v })}
                    placeholder="Select church..."
                  />
                  <FieldError message={errors.churchId} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                />
                <FieldError message={errors.name} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                />
                <FieldError message={errors.phone} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
