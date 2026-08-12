'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { createRoleApi } from '@/lib/roleApi';
import { SearchableSelect } from '@/components/SearchableSelect';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';
import { House, Bavanakutayima } from '@/types';
import { Plus, Edit2, Trash2, Search, X, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Church {
  _id: string;
  name: string;
}

const houseSchema = z.object({
  unitId: z.string().optional(),
  bavanakutayimaId: z.string().min(1, 'Select a bavanakutayima'),
  familyName: z.string().trim().min(1, 'Family name is required'),
  headOfFamily: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  houseNumber: z.string().optional(),
});

export default function HousesPage() {
  const { user, loading: authLoading } = useRoleAuth();
  const api = createRoleApi('super_admin');
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState('');
  const [houses, setHouses] = useState<House[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [allBavanakutayimas, setAllBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    unit: '',
    bavanakutayima: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    unitId: '',
    bavanakutayimaId: '',
    familyName: '',
    headOfFamily: '',
    address: '',
    phone: '',
    houseNumber: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchChurches();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (selectedChurch) {
      fetchData();
    } else {
      setHouses([]);
      setUnits([]);
      setBavanakutayimas([]);
      setAllBavanakutayimas([]);
    }
  }, [selectedChurch]);

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      setChurches(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
    }
  };

  const fetchData = async () => {
    if (!selectedChurch) return;
    setLoading(true);
    try {
      const [housesRes, unitsRes, bavanakutayimasRes] = await Promise.all([
        api.get(`/houses?churchId=${selectedChurch}`),
        api.get(`/units?churchId=${selectedChurch}`),
        api.get(`/bavanakutayimas?churchId=${selectedChurch}`),
      ]);
      setHouses(housesRes.data?.data || []);
      setUnits(unitsRes.data?.data || []);
      setBavanakutayimas(bavanakutayimasRes.data?.data || []);
      setAllBavanakutayimas(bavanakutayimasRes.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = validateForm(houseSchema, formData);
    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      if (editingHouse) {
        await api.put(`/houses/${editingHouse._id}`, result.data);
        toast.success('House updated successfully!');
      } else {
        await api.post('/houses', result.data);
        toast.success('House added successfully!');
      }
      setShowModal(false);
      setEditingHouse(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    setFormErrors({});
    // Find the unit for this house's bavanakutayima
    const bkId = resolveId(house.bavanakutayimaId);
    const bavanakutayima = allBavanakutayimas.find(bk => bk._id === bkId);
    const unitId = resolveId(bavanakutayima?.unitId) || '';

    setFormData({
      unitId: unitId,
      bavanakutayimaId: bkId,
      familyName: house.familyName,
      headOfFamily: house.headOfFamily || '',
      address: house.address || '',
      phone: house.phone || '',
      houseNumber: house.houseNumber || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/houses/${id}`);
      fetchData();
      toast.success('House deleted successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormErrors({});
    setFormData({
      unitId: '',
      bavanakutayimaId: '',
      familyName: '',
      headOfFamily: '',
      address: '',
      phone: '',
      houseNumber: '',
    });
  };

  const resolveId = (val: any): string =>
    typeof val === 'object' && val !== null ? val._id : val ?? '';

  const getBavanakutayimaName = (id: any) => {
    if (typeof id === 'object' && id !== null) return id.name || 'Unknown';
    return allBavanakutayimas.find((b) => b._id === id)?.name || 'Unknown';
  };

  const filteredHouses = houses.filter((house) => {
    // Filter by unit
    if (filters.unit) {
      const bkId = resolveId(house.bavanakutayimaId);
      const bavanakutayima = allBavanakutayimas.find(bk => bk._id === bkId);
      if (!bavanakutayima || resolveId(bavanakutayima.unitId) !== filters.unit) return false;
    }
    // Filter by bavanakutayima
    if (filters.bavanakutayima && resolveId(house.bavanakutayimaId) !== filters.bavanakutayima) return false;
    return true;
  }).filter((house) =>
    house.familyName.toLowerCase().includes('') ||
    (house.hierarchicalNumber && house.hierarchicalNumber.toLowerCase().includes(''))
  );

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
          <p className="text-sm text-orange-600 mt-2">Please select a church to view and manage houses</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Houses</h2>
          <p className="text-gray-600">Manage family houses</p>
        </div>
        <button
          onClick={() => {
            setEditingHouse(null);
            resetForm();
            setShowModal(true);
          }}
          disabled={!selectedChurch}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add House
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SearchableSelect
          label="Filter by Unit"
          options={units.map((unit) => ({
            value: unit._id,
            label: unit.name,
          }))}
          value={filters.unit}
          onChange={(value) => setFilters({ ...filters, unit: value, bavanakutayima: '' })}
          placeholder="All Units"
        />
        <SearchableSelect
          label="Filter by Bavanakutayima"
          options={bavanakutayimas.map((bk) => ({
            value: bk._id,
            label: bk.name,
          }))}
          value={filters.bavanakutayima}
          onChange={(value) => setFilters({ ...filters, bavanakutayima: value })}
          placeholder="All Bavanakutayimas"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hierarchical ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Head of Family</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Bavanakutayima</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : filteredHouses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No houses found</td></tr>
              ) : (
                filteredHouses.map((house) => (
                  <tr key={house._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">{house.hierarchicalNumber || house.houseNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{house.familyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{house.headOfFamily || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{getBavanakutayimaName(house.bavanakutayimaId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(house)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(house._id)}
                        disabled={deletingId === house._id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === house._id ? <div className="animate-spin text-sm">⏳</div> : <Trash2 className="w-5 h-5" />}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingHouse ? 'Edit House' : 'Add New House'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <SearchableSelect
                label="Unit"
                options={units.map((unit) => ({ value: unit._id, label: unit.name }))}
                value={formData.unitId}
                onChange={(value) => setFormData({ ...formData, unitId: value })}
                placeholder="Search and select unit (optional)..."
              />

              <div>
                <SearchableSelect
                  label="Bavanakutayima"
                  required
                  options={allBavanakutayimas.map((bk) => ({ value: bk._id, label: bk.name }))}
                  value={formData.bavanakutayimaId}
                  onChange={(value) => setFormData({ ...formData, bavanakutayimaId: value })}
                  placeholder="Search and select bavanakutayima..."
                />
                <FieldError message={formErrors.bavanakutayimaId} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                <input
                  type="text"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    formErrors.familyName ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <FieldError message={formErrors.familyName} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head of Family</label>
                <input
                  type="text"
                  value={formData.headOfFamily}
                  onChange={(e) => setFormData({ ...formData, headOfFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

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
                  {submitting ? (editingHouse ? 'Updating...' : 'Creating...') : (editingHouse ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
