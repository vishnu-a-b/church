'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { Plus, Calendar, DollarSign, Users, TrendingUp, Trash2, Edit, UserPlus, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
  const router = useRouter();
  const [stothrakazhchas, setStothrakazhchas] = useState<Stothrakazhcha[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingDues, setProcessingDues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStothrakazhcha, setSelectedStothrakazhcha] = useState<Stothrakazhcha | null>(null);
  const [showDuesConfirmModal, setShowDuesConfirmModal] = useState(false);
  const [duesStothrakazhchaId, setDuesStothrakazhchaId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setBavanakutayimas(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching bavanakutayimas:', error);
      setBavanakutayimas([]);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    if (!bavanakutayimaId) {
      setHouses([]);
      return;
    }
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
      setHouses([]);
    }
  };

  const fetchMembers = async (houseId: string) => {
    if (!houseId) {
      setMembers([]);
      return;
    }
    try {
      const response = await api.get(`/members?houseId=${houseId}`);
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
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
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRow = (stothrakazhchaId: string) => {
    setExpandedRowId(expandedRowId === stothrakazhchaId ? null : stothrakazhchaId);
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
    setExpandedRowId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Stothrakazhcha?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/stothrakazhcha/${id}`);
      toast.success('Stothrakazhcha deleted successfully!');
      fetchStothrakazhchas();
      setExpandedRowId(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete Stothrakazhcha');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDuesConfirm = (stothrakazhchaId?: string) => {
    setDuesStothrakazhchaId(stothrakazhchaId || null);
    setShowDuesConfirmModal(true);
  };

  const handleProcessDues = async () => {
    setProcessingDues(true);
    setShowDuesConfirmModal(false);

    try {
      const response = await api.post('/stothrakazhcha-dues/process', {
        stothrakazhchaId: duesStothrakazhchaId || undefined
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
      setDuesStothrakazhchaId(null);
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

    setAddingPayment(true);
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
    } finally {
      setAddingPayment(false);
    }
  };

  const handleViewPayments = (stothrakazhcha: Stothrakazhcha) => {
    router.push(`/church-admin/dashboard/stothrakazhcha/payments?id=${stothrakazhcha._id}`);
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

  // Filter and pagination
  const filteredStothrakazhchas = stothrakazhchas.filter(item => {
    const weekString = `Week ${item.weekNumber}`;
    const yearString = item.year.toString();
    const statusString = item.status;
    return weekString.toLowerCase().includes(searchTerm.toLowerCase()) ||
           yearString.includes(searchTerm) ||
           statusString.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredStothrakazhchas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStothrakazhchas = filteredStothrakazhchas.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stothrakazhcha Management</h2>
          <p className="text-gray-600">Manage weekly contributions and process dues</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenDuesConfirm()}
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

      {/* Search and Results Count */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by week, year, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            Showing {paginatedStothrakazhchas.length} of {filteredStothrakazhchas.length} records
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : paginatedStothrakazhchas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No Stothrakazhcha found matching your search' : 'No Stothrakazhcha found'}
                  </td>
                </tr>
              ) : (
                paginatedStothrakazhchas.map((item) => (
                  <>
                    <tr
                      key={item._id}
                      onClick={() => toggleRow(item._id)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        expandedRowId === item._id ? 'bg-teal-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Week {item.weekNumber}</div>
                            <div className="text-sm text-gray-500">{item.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(item.weekStartDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {formatDate(item.weekEndDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(item.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.amountType === 'per_member' ? 'Per Member' : 'Per House'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{item.defaultAmount} default
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ₹{item.totalCollected || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: ₹{item.totalContributors > 0
                            ? (item.totalCollected / item.totalContributors).toFixed(2)
                            : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.totalContributors || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Dues ✓
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(item._id);
                          }}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          {expandedRowId === item._id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRowId === item._id && (
                      <tr key={`${item._id}-actions`} className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleViewPayments(item)}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <Users className="w-4 h-4" />
                              View Payments ({item.totalContributors || 0})
                            </button>
                            <button
                              onClick={() => handleOpenPaymentModal(item)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <UserPlus className="w-4 h-4" />
                              Add Payment
                            </button>
                            {!item.duesProcessed && (
                              <button
                                onClick={() => handleOpenDuesConfirm(item._id)}
                                disabled={processingDues}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <TrendingUp className="w-4 h-4" />
                                Process Dues
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(item)}
                              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              disabled={deletingId === item._id}
                              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {deletingId === item._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredStothrakazhchas.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredStothrakazhchas.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredStothrakazhchas.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
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
                    disabled={submitting}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dues Processing Confirmation Modal */}
      {showDuesConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirm Process Dues
              </h3>
              <div className="h-1 w-20 bg-purple-600 rounded"></div>
            </div>

            <div className="space-y-4">
              {/* Warning Icon */}
              <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800">
                    Important: This action will process dues
                  </p>
                </div>
              </div>

              {/* What will happen */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">What will happen:</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      {duesStothrakazhchaId
                        ? 'Dues will be calculated for the selected Stothrakazhcha week'
                        : 'Dues will be calculated for ALL active Stothrakazhchas that have not been processed'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      The average contribution amount will be calculated from existing contributors
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Non-contributors (members/houses who haven't paid) will be assigned this average amount as their due
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Transaction records will be created for all dues assigned
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span className="font-semibold">
                      Once processed, this cannot be undone
                    </span>
                  </li>
                </ul>
              </div>

              {/* Selected Stothrakazhcha info */}
              {duesStothrakazhchaId && (() => {
                const selected = stothrakazhchas.find(s => s._id === duesStothrakazhchaId);
                return selected ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Processing for:</p>
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">Week {selected.weekNumber}, {selected.year}</span>
                      <span className="text-gray-600 ml-2">
                        ({formatDate(selected.weekStartDate)} - {formatDate(selected.weekEndDate)})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Default Amount: ₹{selected.defaultAmount} ({selected.amountType === 'per_member' ? 'Per Member' : 'Per House'})
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Contributors: {selected.totalContributors || 0}
                    </p>
                  </div>
                ) : null;
              })()}

              {/* Confirmation question */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-900 text-center">
                  Are you sure you want to process dues?
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDuesConfirmModal(false);
                  setDuesStothrakazhchaId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                disabled={processingDues}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessDues}
                disabled={processingDues}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingDues ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  'Yes, Process Dues'
                )}
              </button>
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
                  disabled={addingPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingPayment ? 'Adding Payment...' : 'Add Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
