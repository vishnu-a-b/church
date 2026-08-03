'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { MonthlySupportPlan, Donor } from '@/types';
import { ArrowLeft, Search, Trash, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

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

export default function SuperAdminMonthlySupportPlanFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const churchId = searchParams.get('churchId') || '';
  const api = createRoleApi('super_admin');

  const backHref = `/super-admin/dashboard/monthly-support${churchId ? `?churchId=${churchId}` : ''}`;

  const [loading, setLoading] = useState(!!planId);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!churchId) return;
    fetchAllMembers();
    fetchAllDonors();
    if (planId) {
      fetchPlan();
    }
  }, [planId, churchId]);

  const fetchPlan = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const response = await api.get(`/monthly-support-plans/${planId}`);
      const plan: MonthlySupportPlan = response.data?.data;
      if (!plan) {
        toast.error('Plan not found');
        router.push(backHref);
        return;
      }
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
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load plan');
      router.push(backHref);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await api.get(`/members?churchId=${churchId}`);
      setAllMembers(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAllDonors = async () => {
    setLoadingDonors(true);
    try {
      const response = await api.get(`/donors?churchId=${churchId}`);
      setAllDonors(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast.error('Failed to load donors');
    } finally {
      setLoadingDonors(false);
    }
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
        churchId,
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

    if (!churchId) {
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
        churchId,
        members: planMembers.map((m) => ({
          ...(m.memberId ? { memberId: m.memberId } : { donorId: m.donorId }),
          ...(m.amount.trim() !== '' ? { amount: parseFloat(m.amount) } : {}),
        })),
      };

      if (planId) {
        await api.put(`/monthly-support-plans/${planId}`, payload);
        toast.success('Plan updated successfully!');
      } else {
        await api.post('/monthly-support-plans', payload);
        toast.success('Plan created successfully!');
      }
      router.push(backHref);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || `Failed to ${planId ? 'update' : 'create'} plan`);
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!churchId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No church selected.</p>
        <button onClick={() => router.push('/super-admin/dashboard/monthly-support')} className="text-purple-600 hover:underline mt-2">
          Back to Monthly Support
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monthly Support
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{planId ? 'Edit Monthly Support Plan' : 'Create Monthly Support Plan'}</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
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
              {submitting ? (planId ? 'Updating...' : 'Creating...') : planId ? 'Update Plan' : 'Create Plan'}
            </button>
            <button
              type="button"
              onClick={() => router.push(backHref)}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
