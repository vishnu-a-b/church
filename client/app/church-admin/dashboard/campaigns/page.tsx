'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Campaign } from '@/types';
import { Wallet, TrendingUp, Plus, Clock, UserPlus } from 'lucide-react';
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processingDues, setProcessingDues] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

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
      await api.post('/campaigns', formData);
      toast.success('Campaign created successfully!');
      setShowModal(false);
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
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    }
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
    }
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
            onClick={() => setShowModal(true)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No campaigns found</div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campaign.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{campaign.name}</h3>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p className="capitalize">Type: {campaign.campaignType.replace('_', ' ')}</p>
                <p>Fixed Amount: ₹{campaign.fixedAmount}</p>
                <p className="capitalize">Amount Type: {campaign.amountType.replace('_', ' ')}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collected:</span>
                  <span className="font-semibold text-gray-800">₹{campaign.totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-semibold text-gray-800">{campaign.participantCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="text-gray-800">{formatDate(campaign.startDate)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleOpenPaymentModal(campaign)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member Payment
                </button>
                {!campaign.duesProcessed && (
                  <button
                    onClick={() => handleProcessDues(campaign._id)}
                    disabled={processingDues}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Process Dues
                  </button>
                )}
                {campaign.duesProcessed && (
                  <div className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                    ✓ Dues Processed
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Campaign</h3>
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
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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
