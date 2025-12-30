'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Plus, Calendar, DollarSign, Users, TrendingUp, Trash2, Edit, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

interface Stothrakazhcha {
  _id: string;
  churchId: any;
  weekNumber: number;
  year: number;
  weekStartDate: Date;
  weekEndDate: Date;
  dueDate: Date;
  defaultAmount: number;
  amountType: 'per_member' | 'per_house';
  status: 'active' | 'closed' | 'processed';
  contributors: Array<{
    contributorId: string;
    contributorType: 'Member' | 'House';
    amount: number;
    contributedAt: Date;
  }>;
  totalCollected: number;
  totalContributors: number;
  duesProcessed: boolean;
  duesProcessedAt?: Date;
  createdAt: Date;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  houseId?: string;
}

interface Unit {
  _id: string;
  name: string;
}

interface Bavanakutayima {
  _id: string;
  name: string;
  unitId: string;
}

interface House {
  _id: string;
  familyName: string;
  bavanakutayimaId: string;
}

export default function ChurchAdminStothrakazhchaPage() {
  const [stothrakazhchas, setStothrakazhchas] = useState<Stothrakazhcha[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingDues, setProcessingDues] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStothrakazhcha, setSelectedStothrakazhcha] = useState<Stothrakazhcha | null>(null);

  // Hierarchy data
  const [units, setUnits] = useState<Unit[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Selected hierarchy
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedBavanakutayima, setSelectedBavanakutayima] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');

  const [paymentData, setPaymentData] = useState({
    memberId: '',
    amount: '',
  });
  const [formData, setFormData] = useState({
    weekNumber: '',
    year: new Date().getFullYear().toString(),
    weekStartDate: '',
    weekEndDate: '',
    dueDate: '',
    defaultAmount: '',
    amountType: 'per_member' as 'per_member' | 'per_house',
    status: 'active' as 'active' | 'closed' | 'processed',
  });

  // Helper function to get week number from date
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Helper function to calculate week dates from a date
  const calculateWeekDates = (dateStr: string) => {
    if (!dateStr) return;

    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day; // Get Monday

    const weekStart = new Date(date.setDate(diff));
    const weekEnd = new Date(date.setDate(diff + 6)); // Get Sunday
    const dueDate = new Date(date.setDate(diff + 7)); // Next Monday

    const weekNum = getWeekNumber(weekStart);
    const year = weekStart.getFullYear();

    setFormData(prev => ({
      ...prev,
      weekNumber: weekNum.toString(),
      year: year.toString(),
      weekStartDate: dateStr,
      weekEndDate: weekEnd.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    }));
  };

  const api = createRoleApi('church_admin');

  useEffect(() => {
    fetchStothrakazhchas();
    fetchUnits();
  }, []);

  const fetchStothrakazhchas = async () => {
    try {
      const response = await api.get('/stothrakazhcha');
      setStothrakazhchas(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load Stothrakazhcha data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchBavanakutayimas = async (unitId: string) => {
    if (!unitId) {
      setBavanakutayimas([]);
      return;
    }
    try {
      const response = await api.get('/bavanakutayimas');
      const filtered = (response.data?.data || []).filter((b: Bavanakutayima) => b.unitId === unitId);
      setBavanakutayimas(filtered);
    } catch (error) {
      console.error('Error fetching bavanakutayimas:', error);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    if (!bavanakutayimaId) {
      setHouses([]);
      return;
    }
    try {
      const response = await api.get('/houses');
      const filtered = (response.data?.data || []).filter((h: House) => h.bavanakutayimaId === bavanakutayimaId);
      setHouses(filtered);
    } catch (error) {
      console.error('Error fetching houses:', error);
    }
  };

  const fetchMembers = async (houseId: string) => {
    if (!houseId) {
      setMembers([]);
      return;
    }
    try {
      const response = await api.get('/members');
      const filtered = (response.data?.data || []).filter((m: Member) => m.houseId === houseId);
      setMembers(filtered);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedBavanakutayima('');
    setSelectedHouse('');
    setPaymentData({ ...paymentData, memberId: '' });
    setBavanakutayimas([]);
    setHouses([]);
    setMembers([]);
    if (unitId) {
      fetchBavanakutayimas(unitId);
    }
  };

  const handleBavanakutayimaChange = (bavanakutayimaId: string) => {
    setSelectedBavanakutayima(bavanakutayimaId);
    setSelectedHouse('');
    setPaymentData({ ...paymentData, memberId: '' });
    setHouses([]);
    setMembers([]);
    if (bavanakutayimaId) {
      fetchHouses(bavanakutayimaId);
    }
  };

  const handleHouseChange = (houseId: string) => {
    setSelectedHouse(houseId);
    setPaymentData({ ...paymentData, memberId: '' });
    setMembers([]);
    if (houseId) {
      fetchMembers(houseId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/stothrakazhcha/${editingId}`, formData);
        toast.success('Stothrakazhcha updated successfully!');
      } else {
        await api.post('/stothrakazhcha', formData);
        toast.success('Stothrakazhcha created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchStothrakazhchas();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to save Stothrakazhcha');
    }
  };

  const handleEdit = (item: Stothrakazhcha) => {
    setEditingId(item._id);
    setFormData({
      weekNumber: item.weekNumber.toString(),
      year: item.year.toString(),
      weekStartDate: new Date(item.weekStartDate).toISOString().split('T')[0],
      weekEndDate: new Date(item.weekEndDate).toISOString().split('T')[0],
      dueDate: new Date(item.dueDate).toISOString().split('T')[0],
      defaultAmount: item.defaultAmount.toString(),
      amountType: item.amountType,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Stothrakazhcha?')) return;
    try {
      await api.delete(`/stothrakazhcha/${id}`);
      toast.success('Stothrakazhcha deleted successfully!');
      fetchStothrakazhchas();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete Stothrakazhcha');
    }
  };

  const handleProcessDues = async (stothrakazhchaId?: string) => {
    if (!confirm('This will calculate and assign dues to non-contributors. Continue?')) return;

    setProcessingDues(true);
    try {
      const response = await api.post('/stothrakazhcha-dues/process', {
        stothrakazhchaId: stothrakazhchaId || undefined
      });
      toast.success(
        `Dues processed successfully! ${response.data?.data?.totalMembersProcessed || 0} members, ${response.data?.data?.totalHousesProcessed || 0} houses`
      );
      fetchStothrakazhchas();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to process dues');
    } finally {
      setProcessingDues(false);
    }
  };

  const handleOpenPaymentModal = (stothrakazhcha: Stothrakazhcha) => {
    setSelectedStothrakazhcha(stothrakazhcha);
    setPaymentData({ memberId: '', amount: '' });
    setSelectedUnit('');
    setSelectedBavanakutayima('');
    setSelectedHouse('');
    setBavanakutayimas([]);
    setHouses([]);
    setMembers([]);
    setShowPaymentModal(true);
  };

  const handleAddPayment = async () => {
    if (!paymentData.memberId || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please select a member and enter a valid amount');
      return;
    }

    if (!selectedStothrakazhcha) return;

    try {
      await api.post(`/stothrakazhcha/${selectedStothrakazhcha._id}/contribute`, {
        amount: parseFloat(paymentData.amount),
        memberId: paymentData.memberId,
      });

      toast.success('Payment added successfully!');
      setShowPaymentModal(false);
      setPaymentData({ memberId: '', amount: '' });
      fetchStothrakazhchas();
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast.error(error.response?.data?.error || 'Failed to add payment');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      weekNumber: '',
      year: new Date().getFullYear().toString(),
      weekStartDate: '',
      weekEndDate: '',
      dueDate: '',
      defaultAmount: '',
      amountType: 'per_member',
      status: 'active',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeStothrakazhchas = stothrakazhchas.filter((s) => s.status === 'active');
  const totalCollected = stothrakazhchas.reduce((sum, s) => sum + (s.totalCollected || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stothrakazhcha Management</h2>
          <p className="text-gray-600">Manage weekly contributions and process dues</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleProcessDues()}
            disabled={processingDues}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {processingDues ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Process Dues
              </>
            )}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Stothrakazhcha
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stothrakazhchas</p>
              <p className="text-2xl font-bold text-gray-800">{stothrakazhchas.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-800">{activeStothrakazhchas.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalCollected}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : stothrakazhchas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">No Stothrakazhcha found</td>
                </tr>
              ) : (
                stothrakazhchas.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Week {item.weekNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.weekStartDate)} - {formatDate(item.weekEndDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.amountType === 'per_member' ? 'Per Member' : 'Per House'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{item.totalCollected || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.totalContributors || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.totalContributors > 0
                        ? (item.totalCollected / item.totalContributors).toFixed(2)
                        : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'processed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.duesProcessed && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Dues Processed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenPaymentModal(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Add Payment"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      {!item.duesProcessed && (
                        <button
                          onClick={() => handleProcessDues(item._id)}
                          disabled={processingDues}
                          className="text-purple-600 hover:text-purple-900 mr-3 disabled:opacity-50"
                          title="Process Dues"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-teal-600 hover:text-teal-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingId ? 'Edit Stothrakazhcha' : 'Create Stothrakazhcha'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Any Date in the Week *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.weekStartDate}
                    onChange={(e) => calculateWeekDates(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Week number, dates, and due date will be calculated automatically
                  </p>
                </div>

                {formData.weekNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Week Number:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formData.weekNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Year:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formData.year}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Week Period:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {formData.weekStartDate} to {formData.weekEndDate}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="ml-2 font-semibold text-gray-900">{formData.dueDate}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.defaultAmount}
                    onChange={(e) => setFormData({ ...formData, defaultAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Fallback amount if no contributions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Type *
                  </label>
                  <select
                    value={formData.amountType}
                    onChange={(e) =>
                      setFormData({ ...formData, amountType: e.target.value as any })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="per_member">Per Member</option>
                    <option value="per_house">Per House</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="processed">Processed</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Members can make variable contributions. When processing dues,
                    the average amount (total collected / contributors) will be assigned to non-contributors.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedStothrakazhcha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Add Payment - Week {selectedStothrakazhcha.weekNumber}, {selectedStothrakazhcha.year}
            </h3>
            <div className="space-y-4">
              {/* Unit Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  1. Select Unit *
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Choose a unit...</option>
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bavanakutayima Select */}
              {selectedUnit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    2. Select Bavanakutayima *
                  </label>
                  <select
                    value={selectedBavanakutayima}
                    onChange={(e) => handleBavanakutayimaChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">Choose a bavanakutayima...</option>
                    {bavanakutayimas.map((bav) => (
                      <option key={bav._id} value={bav._id}>
                        {bav.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* House Select */}
              {selectedBavanakutayima && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3. Select House *
                  </label>
                  <select
                    value={selectedHouse}
                    onChange={(e) => handleHouseChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">Choose a house...</option>
                    {houses.map((house) => (
                      <option key={house._id} value={house._id}>
                        {house.familyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Member Select */}
              {selectedHouse && members.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    4. Select Member *
                  </label>
                  <select
                    value={paymentData.memberId}
                    onChange={(e) => setPaymentData({ ...paymentData, memberId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">Choose a member...</option>
                    {members.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} {member.email && `(${member.email})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will create a transaction and record the payment for this member.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentData({ memberId: '', amount: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
