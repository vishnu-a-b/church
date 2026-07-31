'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { MonthlySupportPlan, MonthlySupportMember, Donor } from '@/types';
import { Repeat, Users, TrendingUp, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, ListChecks, Trash, UserPlus, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';

interface Church {
  _id: string;
  name: string;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
}

interface PlanMemberDraft {
  memberId?: string;
  donorId?: string;
  amount: string; // empty string = use plan default
  name: string;
}

const entryId = (m: PlanMemberDraft): string => (m.memberId ?? m.donorId)!;

const emptyForm = {
  name: '',
  description: '',
  defaultAmount: 0,
  treatment: 'income' as 'income' | 'liability',
  dayOfMonth: 5,
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function SuperAdminMonthlySupportPage() {
  const router = useRouter();
  const api = createRoleApi('super_admin');

  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedChurch, setSelectedChurch] = useState('');

  const [plans, setPlans] = useState<MonthlySupportPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState(emptyForm);
  const [planMembers, setPlanMembers] = useState<PlanMemberDraft[]>([]);

  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const [pickerTab, setPickerTab] = useState<'members' | 'donors'>('members');
  const [allDonors, setAllDonors] = useState<Donor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [donorSearchTerm, setDonorSearchTerm] = useState('');
  const [showNewDonorForm, setShowNewDonorForm] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');
  const [newDonorEmail, setNewDonorEmail] = useState('');
  const [newDonorAddress, setNewDonorAddress] = useState('');
  const [creatingDonor, setCreatingDonor] = useState(false);

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<MonthlySupportPlan | null>(null);
  const [paymentEntryId, setPaymentEntryId] = useState('');
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('cash');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchChurches();
  }, []);

  useEffect(() => {
    if (selectedChurch) {
      fetchPlans();
      setAllMembers([]);
      setAllDonors([]);
    } else {
      setPlans([]);
    }
  }, [selectedChurch]);

  const fetchChurches = async () => {
    try {
      const response = await api.get('/churches');
      setChurches(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
      toast.error('Failed to load churches');
    }
  };

  const fetchPlans = async () => {
    if (!selectedChurch) return;
    setLoading(true);
    try {
      const response = await api.get(`/monthly-support-plans?churchId=${selectedChurch}`);
      setPlans(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load monthly support plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMembers = async () => {
    if (!selectedChurch || allMembers.length > 0) return;
    setLoadingMembers(true);
    try {
      const response = await api.get(`/members?churchId=${selectedChurch}`);
      setAllMembers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAllDonors = async () => {
    if (!selectedChurch || allDonors.length > 0) return;
    setLoadingDonors(true);
    try {
      const response = await api.get(`/donors?churchId=${selectedChurch}`);
      setAllDonors(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast.error('Failed to load donors');
    } finally {
      setLoadingDonors(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    fetchAllMembers();
    fetchAllDonors();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setPlanMembers([]);
    setMemberSearchTerm('');
    setDonorSearchTerm('');
    setPickerTab('members');
    setShowNewDonorForm(false);
    setNewDonorName('');
    setNewDonorPhone('');
  };

  const handleEdit = (plan: MonthlySupportPlan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      defaultAmount: plan.defaultAmount,
      treatment: plan.treatment ?? 'income',
      dayOfMonth: plan.dayOfMonth,
      startDate: new Date(plan.startDate).toISOString().split('T')[0],
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
      isActive: plan.isActive,
    });
    setPlanMembers(
      plan.members.map((m) => {
        if (m.donorId) {
          const donor = typeof m.donorId === 'object' ? m.donorId : null;
          return {
            donorId: typeof m.donorId === 'object' ? m.donorId._id : m.donorId,
            amount: m.amount !== undefined && m.amount !== null ? String(m.amount) : '',
            name: donor ? donor.name : 'Donor',
          };
        }
        const member = typeof m.memberId === 'object' ? m.memberId : null;
        return {
          memberId: typeof m.memberId === 'object' ? m.memberId?._id : m.memberId,
          amount: m.amount !== undefined && m.amount !== null ? String(m.amount) : '',
          name: member ? `${member.firstName} ${member.lastName || ''}`.trim() : 'Member',
        };
      })
    );
    fetchAllMembers();
    fetchAllDonors();
    setShowModal(true);
    setExpandedRowId(null);
  };

  const addMember = (member: Member) => {
    if (planMembers.some((m) => m.memberId === member._id)) {
      toast.warning('Already added to this plan');
      return;
    }
    setPlanMembers([
      ...planMembers,
      { memberId: member._id, amount: '', name: `${member.firstName} ${member.lastName || ''}`.trim() },
    ]);
  };

  const addDonor = (donor: Donor) => {
    if (planMembers.some((m) => m.donorId === donor._id)) {
      toast.warning('Already added to this plan');
      return;
    }
    setPlanMembers([...planMembers, { donorId: donor._id, amount: '', name: donor.name }]);
  };

  const handleCreateDonor = async () => {
    if (!newDonorName.trim()) {
      toast.error('Enter a name for the donor');
      return;
    }
    if (!newDonorPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setCreatingDonor(true);
    try {
      const response = await api.post('/donors', {
        churchId: selectedChurch,
        name: newDonorName.trim(),
        phone: newDonorPhone.trim(),
        email: newDonorEmail.trim() || undefined,
        address: newDonorAddress.trim() || undefined,
      });
      const donor: Donor = response.data?.data;
      setAllDonors([donor, ...allDonors]);
      addDonor(donor);
      setShowNewDonorForm(false);
      setNewDonorName('');
      setNewDonorPhone('');
      setNewDonorEmail('');
      setNewDonorAddress('');
      toast.success('Donor registered and added to plan');
    } catch (error: any) {
      console.error('Error creating donor:', error);
      toast.error(error.response?.data?.error || 'Failed to create donor');
    } finally {
      setCreatingDonor(false);
    }
  };

  const removeMember = (id: string) => {
    setPlanMembers(planMembers.filter((m) => entryId(m) !== id));
  };

  const updateMemberAmount = (id: string, amount: string) => {
    setPlanMembers(planMembers.map((m) => (entryId(m) === id ? { ...m, amount } : m)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChurch) {
      toast.error('Select a church first');
      return;
    }
    if (planMembers.length === 0) {
      toast.error('Add at least one member to the plan');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        churchId: selectedChurch,
        members: planMembers.map((m) => ({
          ...(m.memberId ? { memberId: m.memberId } : { donorId: m.donorId }),
          ...(m.amount.trim() !== '' ? { amount: parseFloat(m.amount) } : {}),
        })),
      };

      if (editingId) {
        await api.put(`/monthly-support-plans/${editingId}`, payload);
        toast.success('Plan updated successfully!');
      } else {
        await api.post('/monthly-support-plans', payload);
        toast.success('Plan created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} plan`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monthly support plan? Existing dues will remain, but no new dues will be generated.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/monthly-support-plans/${id}`);
      toast.success('Plan deleted successfully!');
      fetchPlans();
      setExpandedRowId(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete plan');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRow = (planId: string) => {
    setExpandedRowId(expandedRowId === planId ? null : planId);
  };

  const handleViewDues = (plan: MonthlySupportPlan) => {
    router.push(`/super-admin/dashboard/monthly-support/dues?planId=${plan._id}`);
  };

  const planMemberId = (m: MonthlySupportMember): string => {
    if (m.memberId) return typeof m.memberId === 'string' ? m.memberId : m.memberId._id;
    return typeof m.donorId === 'string' ? m.donorId! : m.donorId!._id;
  };

  const planMemberName = (m: MonthlySupportMember): string => {
    if (m.memberId) {
      if (typeof m.memberId === 'string') return 'Member';
      return `${m.memberId.firstName} ${m.memberId.lastName || ''}`.trim();
    }
    if (m.donorId) {
      return typeof m.donorId === 'string' ? 'Donor' : m.donorId.name;
    }
    return 'Unknown';
  };

  const planMemberIsDonor = (m: MonthlySupportMember): boolean => !!m.donorId;

  const openAddPaymentModal = (plan: MonthlySupportPlan) => {
    setPaymentPlan(plan);
    setPaymentEntryId('');
    setPaymentAmountInput('');
    setPaymentMethodInput('cash');
    setShowAddPaymentModal(true);
  };

  const handlePaymentEntryChange = (entryIdValue: string) => {
    setPaymentEntryId(entryIdValue);
    const entry = paymentPlan?.members.find((m) => planMemberId(m) === entryIdValue);
    setPaymentAmountInput(String(entry?.amount ?? paymentPlan?.defaultAmount ?? ''));
  };

  const handleAddPayment = async () => {
    if (!paymentPlan || !paymentEntryId) {
      toast.error('Select a member/donor');
      return;
    }
    const amount = parseFloat(paymentAmountInput);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const entry = paymentPlan.members.find((m) => planMemberId(m) === paymentEntryId);
    if (!entry) return;

    setSubmittingPayment(true);
    try {
      await api.post(`/monthly-support-plans/${paymentPlan._id}/pay`, {
        memberId: entry.memberId ? paymentEntryId : undefined,
        donorId: entry.donorId ? paymentEntryId : undefined,
        amount,
        paymentMethod: paymentMethodInput,
      });
      toast.success('Payment recorded successfully');
      setShowAddPaymentModal(false);
      setPaymentPlan(null);
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const activePlans = plans.filter((p) => p.isActive);
  const totalMembersCovered = plans.reduce((sum, p) => sum + p.members.length, 0);

  const filteredPlans = plans.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredMembers = allMembers.filter((member) => {
    const term = memberSearchTerm.toLowerCase();
    const fullName = `${member.firstName} ${member.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (member.email || '').toLowerCase().includes(term) ||
      (member.hierarchicalNumber || '').toLowerCase().includes(term) ||
      (member.uniqueId || '').toLowerCase().includes(term)
    );
  });

  const filteredDonors = allDonors.filter((donor) => {
    const term = donorSearchTerm.toLowerCase();
    return donor.name.toLowerCase().includes(term) || (donor.phone || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Church Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Church *</label>
        <select
          value={selectedChurch}
          onChange={(e) => setSelectedChurch(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">-- Select a Church --</option>
          {churches.map((church) => (
            <option key={church._id} value={church._id}>
              {church.name}
            </option>
          ))}
        </select>
        {!selectedChurch && (
          <p className="text-sm text-orange-600 mt-2">Please select a church to view and manage monthly support plans</p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Monthly Support</h2>
          <p className="text-gray-600">Recurring fixed monthly pledges from specific members</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedChurch}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-2xl font-bold text-gray-800">{plans.length}</p>
            </div>
            <Repeat className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-800">{activePlans.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members Covered</p>
              <p className="text-2xl font-bold text-gray-800">{totalMembersCovered}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!selectedChurch ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Select a church to view plans</td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No plans found matching your search' : 'No monthly support plans yet'}
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <>
                    <tr
                      key={plan._id}
                      onClick={() => toggleRow(plan._id)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${expandedRowId === plan._id ? 'bg-purple-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Repeat className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {plan.name}
                              {plan.treatment === 'liability' && (
                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Liability</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">Since {formatDate(plan.startDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{plan.defaultAmount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{plan.dayOfMonth}{ordinalSuffix(plan.dayOfMonth)} of month</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{plan.members.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(plan._id);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          {expandedRowId === plan._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                    {expandedRowId === plan._id && (
                      <tr key={`${plan._id}-actions`} className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleViewDues(plan)}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <ListChecks className="w-4 h-4" />
                              View Dues
                            </button>
                            <button
                              onClick={() => openAddPaymentModal(plan)}
                              disabled={plan.members.length === 0}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <DollarSign className="w-4 h-4" />
                              Add Payment
                            </button>
                            <button
                              onClick={() => handleEdit(plan)}
                              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(plan._id)}
                              disabled={deletingId === plan._id}
                              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {deletingId === plan._id ? (
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
      </div>

      {/* Create/Edit Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Monthly Support Plan' : 'Create Monthly Support Plan'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Widows Monthly Support"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional notes about this plan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.defaultAmount}
                    onChange={(e) => setFormData({ ...formData, defaultAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for members without a custom amount below</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Day of Month *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="28"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">1-28, to avoid short-month issues</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accounting Treatment *</label>
                <select
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value as 'income' | 'liability' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="income">Donation (Income)</option>
                  <option value="liability">Hall Booking / Refundable (Liability)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Liability plans post to EDV under Current Liabilities, one ledger per person — use this when the church owes something back (a booking, a refund), not for regular donations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank for an open-ended plan</p>
                </div>
              </div>

              {/* Member Selection */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Members ({planMembers.length})</h3>

                {planMembers.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                    {planMembers.map((m) => (
                      <div key={entryId(m)} className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{m.name}</p>
                          {m.donorId && (
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Outside Donor</span>
                          )}
                        </div>
                        <div className="w-36">
                          <input
                            type="number"
                            min="0"
                            value={m.amount}
                            onChange={(e) => updateMemberAmount(entryId(m), e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder={`₹${formData.defaultAmount} (default)`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(entryId(m))}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Members / Outside Donors tab switcher */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerTab('members')}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      pickerTab === 'members' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('donors')}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      pickerTab === 'donors' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Outside Donors
                  </button>
                </div>

                {pickerTab === 'members' ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search members to add..."
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {loadingMembers ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredMembers.map((member) => {
                          const isAdded = planMembers.some((m) => m.memberId === member._id);
                          return (
                            <div
                              key={member._id}
                              className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                                isAdded ? 'bg-green-50' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {member.firstName} {member.lastName || ''}
                                  </p>
                                  {member.hierarchicalNumber && (
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                      {member.hierarchicalNumber}
                                    </span>
                                  )}
                                </div>
                                {member.email && <p className="text-xs text-gray-500 mt-1">{member.email}</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => addMember(member)}
                                disabled={isAdded}
                                className={`px-3 py-1 text-xs rounded transition-colors flex-shrink-0 ${
                                  isAdded ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                              >
                                {isAdded ? 'Added' : 'Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">
                      People supporting this plan who aren&apos;t registered church members (well-wishers, friends of the church, etc).
                    </p>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search outside donors..."
                        value={donorSearchTerm}
                        onChange={(e) => setDonorSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {!showNewDonorForm ? (
                      <button
                        type="button"
                        onClick={() => setShowNewDonorForm(true)}
                        className="flex items-center gap-1.5 text-sm text-purple-600 font-medium mb-2 hover:text-purple-800"
                      >
                        <UserPlus className="w-4 h-4" /> Register a new outside donor
                      </button>
                    ) : (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 space-y-2">
                        <input
                          type="text"
                          placeholder="Donor name *"
                          value={newDonorName}
                          onChange={(e) => setNewDonorName(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Phone *"
                          required
                          value={newDonorPhone}
                          onChange={(e) => setNewDonorPhone(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="email"
                          placeholder="Email (optional)"
                          value={newDonorEmail}
                          onChange={(e) => setNewDonorEmail(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Address (optional)"
                          value={newDonorAddress}
                          onChange={(e) => setNewDonorAddress(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateDonor}
                            disabled={creatingDonor}
                            className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                          >
                            {creatingDonor ? 'Adding...' : 'Add to Plan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewDonorForm(false); setNewDonorName(''); setNewDonorPhone(''); setNewDonorEmail(''); setNewDonorAddress(''); }}
                            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {loadingDonors ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredDonors.length === 0 ? (
                          <p className="text-sm text-gray-500 p-3">No outside donors yet.</p>
                        ) : (
                          filteredDonors.map((donor) => {
                            const isAdded = planMembers.some((m) => m.donorId === donor._id);
                            return (
                              <div
                                key={donor._id}
                                className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                                  isAdded ? 'bg-green-50' : ''
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                                  {donor.phone && <p className="text-xs text-gray-500 mt-1">{donor.phone}</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addDonor(donor)}
                                  disabled={isAdded}
                                  className={`px-3 py-1 text-xs rounded transition-colors flex-shrink-0 ${
                                    isAdded ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
                                  }`}
                                >
                                  {isAdded ? 'Added' : 'Add'}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
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
                  Plan is active (dues will be generated automatically each month)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingId ? 'Updating...' : 'Creating...') : editingId ? 'Update Plan' : 'Create Plan'}
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
      {showAddPaymentModal && paymentPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-1">Add Payment</h3>
            <p className="text-sm text-gray-500 mb-4">{paymentPlan.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member / Donor *</label>
                <select
                  value={paymentEntryId}
                  onChange={(e) => handlePaymentEntryChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Choose...</option>
                  {paymentPlan.members.map((m) => (
                    <option key={planMemberId(m)} value={planMemberId(m)}>
                      {planMemberName(m)}{planMemberIsDonor(m) ? ' (Outside Donor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This creates the current month&apos;s due for this member if it doesn&apos;t exist yet, records the payment against it, and syncs to EDV.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  disabled={submittingPayment}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
