'use client';

import { useState, useEffect } from 'react';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { createRoleApi } from '@/lib/roleApi';
import { SearchableSelect } from '@/components/SearchableSelect';
import { House, Bavanakutayima } from '@/types';
import { Plus, Edit2, Trash2, Search, X, Building2 } from 'lucide-react';

export default function HousesPage() {
  const { user, loading: authLoading } = useRoleAuth();
  const api = createRoleApi('church_admin');
  const [houses, setHouses] = useState<House[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [allBavanakutayimas, setAllBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [formBavanakutayimas, setFormBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    bavanakutayima: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
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
      fetchData();
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [housesRes, unitsRes, bavanakutayimasRes] = await Promise.all([
        api.get('/houses'),
        api.get('/units'),
        api.get('/bavanakutayimas'),
      ]);
      setHouses(housesRes.data?.data || []);
      // Filter units to only show units from church admin's church
      const allUnits = unitsRes.data?.data || [];
      const userChurchId = typeof user?.churchId === 'object' && user.churchId !== null
        ? (user.churchId as any)._id || (user.churchId as any).id
        : user?.churchId;
      const churchUnits = userChurchId
        ? allUnits.filter((unit: any) => {
            const unitChurchId = typeof unit.churchId === 'object' && unit.churchId !== null
              ? (unit.churchId as any)._id || (unit.churchId as any).id
              : unit.churchId;
            return unitChurchId?.toString() === userChurchId?.toString();
          })
        : allUnits;
      setUnits(churchUnits);
      setBavanakutayimas(bavanakutayimasRes.data?.data || []);
      setAllBavanakutayimas(bavanakutayimasRes.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBavanakutayimasByUnit = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setFormBavanakutayimas(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Update bavanakutayimas when unit changes in form
  useEffect(() => {
    if (formData.unitId) {
      fetchBavanakutayimasByUnit(formData.unitId);
    } else {
      setFormBavanakutayimas([]);
    }
  }, [formData.unitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHouse) {
        await api.put(`/houses/${editingHouse._id}`, formData);
      } else {
        await api.post('/houses', formData);
      }
      setShowModal(false);
      setEditingHouse(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    // Find the unit for this house's bavanakutayima
    const bavanakutayima = allBavanakutayimas.find(bk => bk._id === house.bavanakutayimaId);
    const unitId = bavanakutayima?.unitId || '';

    setFormData({
      unitId: unitId,
      bavanakutayimaId: house.bavanakutayimaId,
      familyName: house.familyName,
      headOfFamily: house.headOfFamily || '',
      address: house.address || '',
      phone: house.phone || '',
      houseNumber: house.houseNumber || '',
    });

    // Fetch bavanakutayimas for this unit
    if (unitId) {
      fetchBavanakutayimasByUnit(unitId);
    }

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/houses/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      unitId: '',
      bavanakutayimaId: '',
      familyName: '',
      headOfFamily: '',
      address: '',
      phone: '',
      houseNumber: '',
    });
    setFormBavanakutayimas([]);
  };

  const getBavanakutayimaName = (id: string) => {
    return allBavanakutayimas.find((b) => b._id === id)?.name || 'Unknown';
  };

  const filteredHouses = houses.filter((house) => {
    if (filters.bavanakutayima && house.bavanakutayimaId !== filters.bavanakutayima) return false;
    return true;
  });

  return (
    <div className="space-y-6">
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
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add House
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : filteredHouses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No houses found</div>
        ) : (
          filteredHouses.map((house) => (
            <div key={house._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(house)} className="text-blue-600 hover:text-blue-800">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(house._id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{house.familyName}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                {house.houseNumber && <p>House #: {house.houseNumber}</p>}
                {house.headOfFamily && <p>Head: {house.headOfFamily}</p>}
                {house.phone && <p>Phone: {house.phone}</p>}
                <p className="text-xs text-gray-500">{getBavanakutayimaName(house.bavanakutayimaId)}</p>
              </div>
            </div>
          ))
        )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  required
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value, bavanakutayimaId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a unit</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>{unit.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bavanakutayima *</label>
                <select
                  required
                  value={formData.bavanakutayimaId}
                  onChange={(e) => setFormData({ ...formData, bavanakutayimaId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={!formData.unitId}
                >
                  <option value="">Select a bavanakutayima</option>
                  {formBavanakutayimas.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                {!formData.unitId && (
                  <p className="text-xs text-gray-500 mt-1">Please select a unit first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                <input
                  type="text"
                  required
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingHouse ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
