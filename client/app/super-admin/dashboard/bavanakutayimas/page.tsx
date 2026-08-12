'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { createRoleApi } from '@/lib/roleApi';
import { toastService } from '@/lib/toastService';
import { Bavanakutayima, Unit, Church } from '@/types';
import { Plus, Edit2, Trash2, Search, X, UserPlus } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';

const bavanakutayimaSchema = z
  .object({
    unitId: z.string().min(1, 'Select a unit'),
    name: z.string().trim().min(1, 'Name is required'),
    leaderName: z.string().optional(),
    createAdmin: z.boolean(),
    adminFirstName: z.string().optional(),
    adminLastName: z.string().optional(),
    adminUsername: z.string().optional(),
    adminEmail: z.string().optional(),
    adminPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.createAdmin) return;
    if (!data.adminFirstName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminFirstName'], message: 'First name is required' });
    }
    if (!data.adminLastName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminLastName'], message: 'Last name is required' });
    }
    if (!data.adminUsername?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminUsername'], message: 'Username is required' });
    }
    if (!data.adminEmail?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminEmail'], message: 'Email is required' });
    }
    if (!data.adminPassword || data.adminPassword.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['adminPassword'], message: 'Password must be at least 6 characters' });
    }
  });

const initialFormState = {
  unitId: '',
  name: '',
  leaderName: '',
  createAdmin: false,
  adminUsername: '',
  adminEmail: '',
  adminPassword: '',
  adminFirstName: '',
  adminLastName: '',
};

export default function BavanakutayimasPage() {
  const { user, loading: authLoading } = useRoleAuth();
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<string>('');
  const api = createRoleApi('super_admin');
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    unit: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Bavanakutayima | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!authLoading && user) {
      fetchChurches();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (selectedChurch) {
      fetchData();
    } else {
      setBavanakutayimas([]);
      setUnits([]);
    }
  }, [selectedChurch]);

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      setChurches(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
      toastService.error('Failed to load churches');
    }
  };

  const fetchData = async () => {
    if (!selectedChurch) return;
    setLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([
        api.get(`/bavanakutayimas?churchId=${selectedChurch}`),
        api.get(`/units?churchId=${selectedChurch}`)
      ]);
      setBavanakutayimas(bRes.data?.data || []);
      setUnits(uRes.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
      toastService.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateForm(bavanakutayimaSchema, formData);
    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);

    const toastId = toastService.info(editing ? 'Updating bavanakutayima...' : 'Creating bavanakutayima...');

    try {
      if (editing) {
        await api.put(`/bavanakutayimas/${editing._id}`, result.data);
        toastService.modify(toastId, 'Bavanakutayima updated successfully!', { type: 'success' });
      } else {
        const response = await api.post('/bavanakutayimas', result.data);

        // If creating admin, create the member with admin role
        if (result.data.createAdmin && response.data.data && selectedChurch) {
          try {
            const bavanakutayimaId = response.data.data._id;

            await api.post('/members', {
              churchId: selectedChurch,
              unitId: result.data.unitId,
              bavanakutayimaId: bavanakutayimaId,
              houseId: null, // Will be assigned later
              firstName: result.data.adminFirstName,
              lastName: result.data.adminLastName,
              username: result.data.adminUsername,
              email: result.data.adminEmail,
              password: result.data.adminPassword,
              role: 'kudumbakutayima_admin',
              gender: 'male', // Default, can be changed later
            });

            toastService.modify(toastId, 'Bavanakutayima and Admin created successfully!', { type: 'success' });
          } catch (adminError: any) {
            console.error('Error creating admin:', adminError);
            toastService.modify(toastId, 'Bavanakutayima created but failed to create admin: ' + (adminError.response?.data?.error || 'Unknown error'), { type: 'warning' });
          }
        } else {
          toastService.modify(toastId, 'Bavanakutayima created successfully!', { type: 'success' });
        }
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Operation failed';
      toastService.modify(toastId, errorMsg, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Bavanakutayima) => {
    setEditing(item);
    setFormErrors({});
    setFormData({
      unitId: resolveUnitId(item.unitId),
      name: item.name,
      leaderName: item.leaderName || '',
      createAdmin: false,
      adminUsername: '',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bavanakutayima?')) return;
    setDeletingId(id);

    const toastId = toastService.info('Deleting bavanakutayima...');

    try {
      await api.delete(`/bavanakutayimas/${id}`);
      toastService.modify(toastId, 'Bavanakutayima deleted successfully!', { type: 'success' });
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Delete failed';
      toastService.modify(toastId, errorMsg, { type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormErrors({});
    setFormData(initialFormState);
  };

  // unitId comes back populated (object) from the API
  const resolveUnitId = (unitId: any): string =>
    typeof unitId === 'object' && unitId !== null ? unitId._id : unitId;

  const getUnitName = (unitId: any): string => {
    if (typeof unitId === 'object' && unitId !== null) return unitId.name || 'Unknown';
    return units.find((u) => u._id === unitId)?.name || 'Unknown';
  };

  const filtered = bavanakutayimas.filter((b) => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(b.hierarchicalNumber && b.hierarchicalNumber.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    if (filters.unit && resolveUnitId(b.unitId) !== filters.unit) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Church Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Church *</label>
        <select
          value={selectedChurch}
          onChange={(e) => setSelectedChurch(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Select a Church --</option>
          {churches.map((ch) => (
            <option key={ch._id} value={ch._id}>
              {ch.name}
            </option>
          ))}
        </select>
        {!selectedChurch && (
          <p className="text-sm text-orange-600 mt-2">Please select a church to view and manage bavanakutayimas</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bavanakutayimas</h2>
          <p className="text-gray-600">Manage prayer groups</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowModal(true);
          }}
          disabled={!selectedChurch}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Bavanakutayima
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <SearchableSelect
          label="Filter by Unit"
          options={units.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }))}
          value={filters.unit}
          onChange={(value) => setFilters({ ...filters, unit: value })}
          placeholder="All Units"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hierarchical ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Leader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No records found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">{item.hierarchicalNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{item.leaderName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{getUnitName(item.unitId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === item._id ? <div className="animate-spin text-sm">⏳</div> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} Bavanakutayima</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Bavanakutayima Details */}
              <div className="border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Bavanakutayima Details</h4>
                <div className="space-y-4">
                  <div>
                    <SearchableSelect
                      label="Unit"
                      required
                      options={units.map((u) => ({ value: u._id, label: u.name }))}
                      value={formData.unitId}
                      onChange={(value) => setFormData({ ...formData, unitId: value })}
                      placeholder="Search and select unit..."
                    />
                    <FieldError message={formErrors.unitId} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                        formErrors.name ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <FieldError message={formErrors.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leader Name</label>
                    <input
                      type="text"
                      value={formData.leaderName}
                      onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Kudumbakutayima Admin Section - Only show when creating new bavanakutayima */}
              {!editing && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="createAdmin"
                      checked={formData.createAdmin}
                      onChange={(e) => setFormData({ ...formData, createAdmin: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="createAdmin" className="text-sm font-medium text-gray-700 flex items-center">
                      <UserPlus className="w-4 h-4 mr-1" />
                      Create Kudumbakutayima Admin Account
                    </label>
                  </div>

                  {formData.createAdmin && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                      <h4 className="text-md font-semibold text-purple-900">Kudumbakutayima Admin Details</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            value={formData.adminFirstName}
                            onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                              formErrors.adminFirstName ? 'border-red-400' : 'border-gray-300'
                            }`}
                          />
                          <FieldError message={formErrors.adminFirstName} />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            value={formData.adminLastName}
                            onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                              formErrors.adminLastName ? 'border-red-400' : 'border-gray-300'
                            }`}
                          />
                          <FieldError message={formErrors.adminLastName} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                          type="text"
                          value={formData.adminUsername}
                          onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                            formErrors.adminUsername ? 'border-red-400' : 'border-gray-300'
                          }`}
                          placeholder="username for login"
                        />
                        <FieldError message={formErrors.adminUsername} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                            formErrors.adminEmail ? 'border-red-400' : 'border-gray-300'
                          }`}
                        />
                        <FieldError message={formErrors.adminEmail} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${
                            formErrors.adminPassword ? 'border-red-400' : 'border-gray-300'
                          }`}
                          placeholder="min 6 characters"
                        />
                        <FieldError message={formErrors.adminPassword} />
                      </div>

                      <div className="bg-purple-100 border border-purple-300 rounded p-2 text-xs text-purple-800">
                        <strong>Note:</strong> The Kudumbakutayima Admin will be created as a member with kudumbakutayima_admin role and can log in using the credentials above.
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editing ? 'Updating...' : 'Creating...') : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
