'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { Campaign } from '@/types';
import { Wallet, TrendingUp, Plus, Clock, UserPlus, Users, Edit, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'react-toastify';

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

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processingDues, setProcessingDues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    name: '',
    campaignType: 'general_fund',
    contributionMode: 'fixed',
    amountType: 'per_member',
    fixedAmount: 0,
    minimumAmount: 0,
    startDate: '',
    endDate: '',
    dueDate: '',
    isActive: true,
  });
  const api = createRoleApi('church_admin');

  useEffect(() => {
    fetchCampaigns();
    fetchUnits();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns');
      setCampaigns(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
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
        await api.put(`/campaigns/${editingId}`, formData);
        toast.success('Campaign updated successfully!');
      } else {
        await api.post('/campaigns', formData);
        toast.success('Campaign created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} campaign`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      campaignType: 'general_fund',
      contributionMode: 'fixed',
      amountType: 'per_member',
      fixedAmount: 0,
      minimumAmount: 0,
      startDate: '',
      endDate: '',
      dueDate: '',
      isActive: true,
    });
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign._id);
    setFormData({
      name: campaign.name,
      campaignType: campaign.campaignType,
      contributionMode: campaign.contributionMode,
      amountType: campaign.amountType,
      fixedAmount: campaign.fixedAmount,
      minimumAmount: campaign.minimumAmount || 0,
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      dueDate: campaign.dueDate ? new Date(campaign.dueDate).toISOString().split('T')[0] : '',
      isActive: campaign.isActive,
    });
    setShowModal(true);
    setExpandedRowId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign deleted successfully!');
      fetchCampaigns();
      setExpandedRowId(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete campaign');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRow = (campaignId: string) => {
    setExpandedRowId(expandedRowId === campaignId ? null : campaignId);
  };

  const handleProcessDues = async (campaignId?: string) => {
    const message = campaignId
      ? 'Process dues for this campaign? This will add minimum amounts to wallets of non-contributors.'
      : 'Process dues for all overdue campaigns? This will add minimum amounts to wallets of non-contributors.';

    if (!confirm(message)) {
      return;
    }

    setProcessingDues(true);
    try {
      const response = await api.post('/campaigns/process-dues', {
        campaignId: campaignId || undefined
      });
      const data = response.data?.data;

      toast.success(
        `Successfully processed ${data.campaignsProcessed} campaign(s)!\n` +
        `Members: ${data.totalMembersProcessed}, Houses: ${data.totalHousesProcessed}`,
        { autoClose: 5000 }
      );

      fetchCampaigns(); // Refresh the list
    } catch (error: any) {
      console.error('Error processing dues:', error);
      toast.error(error.response?.data?.error || 'Failed to process campaign dues');
    } finally {
      setProcessingDues(false);
    }
  };

  const handleOpenPaymentModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
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

    if (!selectedCampaign) return;

    setAddingPayment(true);
    try {
      await api.post(`/campaigns/${selectedCampaign._id}/contribute`, {
        amount: parseFloat(paymentData.amount),
        memberId: paymentData.memberId,
      });

      toast.success('Payment added successfully!');
      setShowPaymentModal(false);
      setPaymentData({ memberId: '', amount: '' });
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast.error(error.response?.data?.error || 'Failed to add payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const handleViewPayments = (campaign: Campaign) => {
    router.push(`/church-admin/dashboard/campaigns/payments?id=${campaign._id}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeCampaigns = campaigns.filter((c) => c.isActive);
  const totalCollected = campaigns.reduce((sum, c) => sum + c.totalCollected, 0);

  // Filter and pagination
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.campaignType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Campaigns</h2>
          <p className="text-gray-600">Manage fundraising campaigns</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleProcessDues()}
            disabled={processingDues}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Process overdue variable campaigns and add dues to non-contributors"
          >
            {processingDues ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing All...
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" />
                Process All Dues
              </>
            )}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-800">{campaigns.length}</p>
            </div>
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-800">{activeCampaigns.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-800">₹{totalCollected.toLocaleString()}</p>
            </div>
            <Wallet className="w-8 h-8 text-purple-600" />
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
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            Showing {paginatedCampaigns.length} of {filteredCampaigns.length} campaigns
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No campaigns found matching your search' : 'No campaigns found'}
                  </td>
                </tr>
              ) : (
                paginatedCampaigns.map((campaign) => (
                  <>
                    <tr
                      key={campaign._id}
                      onClick={() => toggleRow(campaign._id)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        expandedRowId === campaign._id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(campaign.startDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {campaign.campaignType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {campaign.contributionMode}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {campaign.amountType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{campaign.fixedAmount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ₹{campaign.totalCollected.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.participantCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            campaign.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {campaign.duesProcessed && (
                          <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Dues ✓
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(campaign._id);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          {expandedRowId === campaign._id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRowId === campaign._id && (
                      <tr key={`${campaign._id}-actions`} className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleViewPayments(campaign)}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <Users className="w-4 h-4" />
                              View Payments ({campaign.participantCount})
                            </button>
                            <button
                              onClick={() => handleOpenPaymentModal(campaign)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <UserPlus className="w-4 h-4" />
                              Add Payment
                            </button>
                            {!campaign.duesProcessed && (
                              <button
                                onClick={() => handleProcessDues(campaign._id)}
                                disabled={processingDues}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <TrendingUp className="w-4 h-4" />
                                Process Dues
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(campaign)}
                              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(campaign._id)}
                              disabled={deletingId === campaign._id}
                              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {deletingId === campaign._id ? (
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
        {!loading && filteredCampaigns.length > 0 && (
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
                      {Math.min(startIndex + itemsPerPage, filteredCampaigns.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredCampaigns.length}</span> results
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
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
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

      {/* Create/Edit Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Campaign' : 'Create New Campaign'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Christmas Fund 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type *</label>
                  <select
                    required
                    value={formData.campaignType}
                    onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="stothrakazhcha">Stothrakazhcha</option>
                    <option value="spl_contribution">Special Contribution</option>
                    <option value="general_fund">General Fund</option>
                    <option value="building_fund">Building Fund</option>
                    <option value="charity">Charity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Mode *</label>
                  <select
                    required
                    value={formData.contributionMode}
                    onChange={(e) => setFormData({ ...formData, contributionMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="fixed">Fixed (Add to wallets immediately)</option>
                    <option value="variable">Variable (Track contributions, add dues later)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Type *</label>
                  <select
                    required
                    value={formData.amountType}
                    onChange={(e) => setFormData({ ...formData, amountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="per_member">Per Member</option>
                    <option value="per_house">Per House</option>
                    <option value="flexible">Flexible (No allocation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.contributionMode === 'fixed' ? 'Fixed Amount *' : 'Fixed Amount (Optional)'}
                  </label>
                  <input
                    type="number"
                    required={formData.contributionMode === 'fixed'}
                    min="0"
                    value={formData.fixedAmount}
                    onChange={(e) => setFormData({ ...formData, fixedAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Amount per member/house"
                  />
                </div>
              </div>

              {formData.contributionMode === 'variable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Amount (For non-contributors)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimumAmount}
                    onChange={(e) => setFormData({ ...formData, minimumAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Minimum amount to add if member doesn't contribute"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.contributionMode === 'variable' ? 'Due Date *' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required={formData.contributionMode === 'variable'}
                    value={formData.contributionMode === 'variable' ? formData.dueDate : formData.endDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      [formData.contributionMode === 'variable' ? 'dueDate' : 'endDate']: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {formData.contributionMode === 'variable' && (
                    <p className="text-xs text-gray-500 mt-1">Dues will be added after this date</p>
                  )}
                </div>

                {formData.contributionMode === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Campaign is active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? (editingId ? 'Updating...' : 'Creating...')
                    : (editingId ? 'Update Campaign' : 'Create Campaign')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Add Payment - {selectedCampaign.name}
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

              {/* Amount Input */}
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
                {selectedCampaign.fixedAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: ₹{selectedCampaign.fixedAmount}
                  </p>
                )}
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
                  disabled={addingPayment}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
