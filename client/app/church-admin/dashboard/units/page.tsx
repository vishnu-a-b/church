'use client';

import { useState, useEffect } from 'react';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { createRoleApi } from '@/lib/roleApi';
import { toastService } from '@/lib/toastService';
import { Unit, Church } from '@/types';
import { Plus, Edit2, Trash2, Search, X, UserPlus } from 'lucide-react';

const initialFormState = {
  name: '',
  unitNumber: '',
  createAdmin: false,
  adminUsername: '',
  adminEmail: '',
  adminPassword: '',
  adminFirstName: '',
  adminLastName: '',
};

export default function UnitsPage() {
  const { user, loading: authLoading } = useRoleAuth();
  const api = createRoleApi('church_admin');
  const [units, setUnits] = useState<Unit[]>([]);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Extract churchId - it might be an object or string
      const churchId = typeof user?.churchId === 'object' && user.churchId !== null
        ? (user.churchId as any)._id || (user.churchId as any).id
        : user?.churchId;

      const [unitsRes, churchRes] = await Promise.all([
        api.get('/units'),
        churchId ? api.get(`/churches/${churchId}`) : Promise.resolve({ data: { data: null } }),
      ]);
      setUnits(unitsRes.data?.data || []);
      setChurch(churchRes.data?.data || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toastService.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.churchId) {
      toastService.error('Church ID not found. Please contact administrator.');
      return;
    }

    const toastId = toastService.info(editingUnit ? 'Updating unit...' : 'Creating unit...');

    try {
      const submitData = { ...formData, churchId: user.churchId };

      if (editingUnit) {
        await api.put(`/units/${editingUnit._id}`, submitData);
        toastService.modify(toastId, 'Unit updated successfully!', { type: 'success' });
      } else {
        const response = await api.post('/units', submitData);

        // If creating admin, create the member with admin role
        if (formData.createAdmin && response.data.data) {
          try {
            const unitId = response.data.data._id;

            await api.post('/members', {
              churchId: user.churchId,
              unitId: unitId,
              bavanakutayimaId: null, // Will be assigned later
              houseId: null, // Will be assigned later
              firstName: formData.adminFirstName,
              lastName: formData.adminLastName,
              username: formData.adminUsername,
              email: formData.adminEmail,
              password: formData.adminPassword,
              role: 'unit_admin',
              gender: 'male', // Default, can be changed later
            });

            toastService.modify(toastId, 'Unit and Unit Admin created successfully!', { type: 'success' });
          } catch (adminError: any) {
            console.error('Error creating admin:', adminError);
            toastService.modify(toastId, 'Unit created but failed to create admin: ' + (adminError.response?.data?.error || 'Unknown error'), { type: 'warning' });
          }
        } else {
          toastService.modify(toastId, 'Unit created successfully!', { type: 'success' });
        }
      }

      setShowModal(false);
      setEditingUnit(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Operation failed';
      toastService.modify(toastId, errorMsg, { type: 'error' });
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      unitNumber: unit.unitNumber || '',
      createAdmin: false,
      adminUsername: '',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
    });
    setShowModal(true);
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    const toastId = toastService.info('Deleting unit...');

    try {
      await api.delete(`/units/${id}`);
      toastService.modify(toastId, 'Unit deleted successfully!', { type: 'success' });
      fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Delete failed';
      toastService.modify(toastId, errorMsg, { type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const getChurchName = () => {
    return church?.name || 'Unknown';
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Units</h2>
          <p className="text-gray-600">Manage church units</p>
        </div>
        <button
          onClick={() => {
            setEditingUnit(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Unit
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search units..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Unit Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Church</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredUnits.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No units found</td></tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{unit.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{unit.unitNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{getChurchName()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(unit)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteUnit(unit._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
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
              <h3 className="text-lg font-semibold">{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Unit Details */}
              <div className="border-b pb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Unit Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                    <input
                      type="text"
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Unit Admin Section - Only show when creating new unit */}
              {!editingUnit && (
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
                      Create Unit Admin Account
                    </label>
                  </div>

                  {formData.createAdmin && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                      <h4 className="text-md font-semibold text-blue-900">Unit Admin Details</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            required={formData.createAdmin}
                            value={formData.adminFirstName}
                            onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            required={formData.createAdmin}
                            value={formData.adminLastName}
                            onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                          type="text"
                          required={formData.createAdmin}
                          value={formData.adminUsername}
                          onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="username for login"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          required={formData.createAdmin}
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          required={formData.createAdmin}
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          minLength={6}
                          placeholder="min 6 characters"
                        />
                      </div>

                      <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs text-blue-800">
                        <strong>Note:</strong> The Unit Admin will be created as a member with unit_admin role and can log in using the credentials above.
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingUnit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
