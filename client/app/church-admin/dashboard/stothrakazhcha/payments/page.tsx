'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { ArrowLeft, UserPlus, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { SearchableSelect } from '@/components/SearchableSelect';

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

export default function StothrakazhchaPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stothrakazhchaId = searchParams.get('id');
  const api = createRoleApi('church_admin');

  const [stothrakazhcha, setStothrakazhcha] = useState<Stothrakazhcha | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // Pagination and search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (stothrakazhchaId) {
      fetchStothrakazhchaData();
      fetchUnits();
    }
  }, [stothrakazhchaId]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchStothrakazhchaData = async () => {
    if (!stothrakazhchaId) return;

    try {
      const stothRes = await api.get(`/stothrakazhcha/${stothrakazhchaId}`);
      const stothData = stothRes.data?.data || stothRes.data;

      setStothrakazhcha(stothData);

      // Use contributors from the stothrakazhcha data
      // Transform to match the expected format for display
      const contributorsData = stothData.contributors || [];
      setPayments(contributorsData.map((c: any) => ({
        member: c.member || c.contributorId,
        house: c.house,
        amount: c.amount,
        contributedAt: c.contributedAt
      })));
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to load stothrakazhcha data');
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
      console.log('Fetching bavanakutayimas for unit:', unitId);
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      const bavanakutayimasList = response.data?.data || [];
      console.log('Fetched bavanakutayimas:', bavanakutayimasList);
      setBavanakutayimas(bavanakutayimasList);

      if (bavanakutayimasList.length === 0) {
        toast.info('No bavanakutayimas found for this unit');
      }
    } catch (error) {
      console.error('Error fetching bavanakutayimas:', error);
      toast.error('Failed to load bavanakutayimas');
      setBavanakutayimas([]);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    if (!bavanakutayimaId) {
      setHouses([]);
      return;
    }
    try {
      console.log('Fetching houses for bavanakutayima:', bavanakutayimaId);
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      const housesList = response.data?.data || [];
      console.log('Fetched houses:', housesList);
      setHouses(housesList);

      if (housesList.length === 0) {
        toast.info('No houses found for this bavanakutayima');
      }
    } catch (error) {
      console.error('Error fetching houses:', error);
      toast.error('Failed to load houses');
      setHouses([]);
    }
  };

  const fetchMembers = async (houseId: string) => {
    if (!houseId) {
      setMembers([]);
      return;
    }
    try {
      console.log('Fetching members for house:', houseId);
      const response = await api.get(`/members?houseId=${houseId}`);
      const membersList = response.data?.data || [];
      console.log('Fetched members:', membersList);
      setMembers(membersList);

      if (membersList.length === 0) {
        toast.info('No members found for this house');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
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

  const handleAddPayment = async () => {
    if (!paymentData.memberId || !paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please select a member and enter a valid amount');
      return;
    }

    if (!stothrakazhchaId) return;

    try {
      await api.post(`/stothrakazhcha/${stothrakazhchaId}/contribute`, {
        amount: parseFloat(paymentData.amount),
        memberId: paymentData.memberId,
      });

      toast.success('Payment added successfully!');
      setShowPaymentModal(false);
      setPaymentData({ memberId: '', amount: '' });
      setSelectedUnit('');
      setSelectedBavanakutayima('');
      setSelectedHouse('');
      fetchStothrakazhchaData();
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

  if (!stothrakazhchaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No stothrakazhcha selected</h2>
          <button
            onClick={() => router.push('/church-admin/dashboard/stothrakazhcha')}
            className="text-teal-600 hover:text-teal-700"
          >
            ← Back to Stothrakazhcha
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!stothrakazhcha) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Stothrakazhcha not found</h2>
          <button
            onClick={() => router.push('/church-admin/dashboard/stothrakazhcha')}
            className="text-teal-600 hover:text-teal-700"
          >
            ← Back to Stothrakazhcha
          </button>
        </div>
      </div>
    );
  }

  const avgContribution = stothrakazhcha.totalContributors > 0
    ? (stothrakazhcha.totalCollected / stothrakazhcha.totalContributors).toFixed(2)
    : '0';

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const memberName = `${payment.member?.firstName || ''} ${payment.member?.lastName || ''}`.toLowerCase();
    const houseName = payment.house?.familyName?.toLowerCase() || '';
    const amount = payment.amount?.toString() || '';

    return memberName.includes(searchLower) ||
           houseName.includes(searchLower) ||
           amount.includes(searchLower);
  });

  // Paginate filtered results
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/church-admin/dashboard/stothrakazhcha')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Week {stothrakazhcha.weekNumber}, {stothrakazhcha.year}
            </h1>
            <p className="text-gray-600">
              {formatDate(stothrakazhcha.weekStartDate)} - {formatDate(stothrakazhcha.weekEndDate)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-800">₹{stothrakazhcha.totalCollected?.toLocaleString() || 0}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contributors</p>
              <p className="text-2xl font-bold text-gray-800">{stothrakazhcha.totalContributors || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold text-gray-800">₹{avgContribution}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatDate(stothrakazhcha.dueDate)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
            {payments.length > 0 && (
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search by member, house, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No payments yet for this week</p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              Add the first payment
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No payments found matching &quot;{searchTerm}&quot;</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.map((payment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.member?.firstName} {payment.member?.lastName}
                      </div>
                      {payment.member?.email && (
                        <div className="text-sm text-gray-500">{payment.member.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.house?.familyName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ₹{payment.amount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.contributedAt ? formatDate(payment.contributedAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Total Collected:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    ₹{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
                  {searchTerm && ` (filtered from ${payments.length} total)`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              currentPage === page
                                ? 'bg-teal-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Add Payment - Week {stothrakazhcha.weekNumber}, {stothrakazhcha.year}
            </h3>
            <div className="space-y-4">
              <SearchableSelect
                label="1. Select Unit"
                required
                options={units.map((unit) => ({ value: unit._id, label: unit.name }))}
                value={selectedUnit}
                onChange={handleUnitChange}
                placeholder="Choose a unit..."
              />

              <SearchableSelect
                label="2. Select Bavanakutayima"
                required
                options={bavanakutayimas.map((bav) => ({ value: bav._id, label: bav.name }))}
                value={selectedBavanakutayima}
                onChange={handleBavanakutayimaChange}
                placeholder={selectedUnit ? "Choose a bavanakutayima..." : "Select unit first"}
                disabled={!selectedUnit || bavanakutayimas.length === 0}
              />

              <SearchableSelect
                label="3. Select House"
                required
                options={houses.map((house) => ({ value: house._id, label: house.familyName }))}
                value={selectedHouse}
                onChange={handleHouseChange}
                placeholder={selectedBavanakutayima ? "Choose a house..." : "Select bavanakutayima first"}
                disabled={!selectedBavanakutayima || houses.length === 0}
              />

              <SearchableSelect
                label="4. Select Member"
                required
                options={members.map((member) => ({
                  value: member._id,
                  label: `${member.firstName} ${member.lastName}${member.email ? ` (${member.email})` : ''}`
                }))}
                value={paymentData.memberId}
                onChange={(value) => setPaymentData({ ...paymentData, memberId: value })}
                placeholder={selectedHouse ? "Choose a member..." : "Select house first"}
                disabled={!selectedHouse || members.length === 0}
              />

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
                {stothrakazhcha.defaultAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Default: ₹{stothrakazhcha.defaultAmount}
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
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
