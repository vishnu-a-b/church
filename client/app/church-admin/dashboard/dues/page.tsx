'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { SearchableSelect } from '@/components/SearchableSelect';
import { AlertCircle, DollarSign, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface DueItem {
  _id: string;
  name: string;
  type: 'member' | 'house';
  campaignName?: string;
  dueAmount: number;
  paidAmount: number;
  remainingAmount: number;
  campaignId?: string;
  stothrakazhchaId?: string;
  dueForId?: string;
  hierarchicalNumber?: string;
}

export default function DuesPage() {
  const [dues, setDues] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState<DueItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [filters, setFilters] = useState({
    unit: '',
    bavanakutayima: '',
    house: '',
    member: '',
  });

  const api = createRoleApi('church_admin');

  useEffect(() => {
    fetchDues();
    fetchUnits();
  }, []);

  useEffect(() => {
    if (filters.unit) {
      fetchBavanakutayimas(filters.unit);
    } else {
      setBavanakutayimas([]);
      setHouses([]);
    }
  }, [filters.unit]);

  useEffect(() => {
    if (filters.bavanakutayima) {
      fetchHouses(filters.bavanakutayima);
    } else {
      setHouses([]);
    }
  }, [filters.bavanakutayima]);

  useEffect(() => {
    if (filters.house) {
      fetchMembers(filters.house);
    } else {
      setMembers([]);
    }
  }, [filters.house]);

  useEffect(() => {
    fetchDues();
  }, [filters]);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.unit) params.append('unitId', filters.unit);
      if (filters.bavanakutayima) params.append('bavanakutayimaId', filters.bavanakutayima);
      if (filters.house) params.append('houseId', filters.house);
      if (filters.member) params.append('memberId', filters.member);

      const queryString = params.toString();
      const url = queryString ? `/dues?${queryString}` : '/dues';

      const response = await api.get(url);
      setDues(response.data.data || []);
    } catch (error) {
      console.error('Error fetching dues:', error);
      toast.error('Failed to load dues');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBavanakutayimas = async (unitId: string) => {
    try {
      const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
      setBavanakutayimas(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHouses = async (bavanakutayimaId: string) => {
    try {
      const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
      setHouses(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMembers = async (houseId: string) => {
    try {
      const response = await api.get(`/members?houseId=${houseId}`);
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePayDue = (due: DueItem) => {
    setSelectedDue(due);
    setPaymentAmount(due.remainingAmount.toString());
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedDue || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedDue.remainingAmount) {
      toast.error('Payment amount cannot exceed remaining balance');
      return;
    }

    setProcessingPayment(true);
    try {
      await api.post('/dues/pay', {
        dueId: selectedDue._id,
        dueType: selectedDue.campaignId ? 'campaign' : 'stothrakazhcha',
        amount,
        paymentMethod,
      });

      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedDue(null);
      setPaymentAmount('');
      fetchDues(); // Refresh the list
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const totalDues = dues.reduce((sum, d) => sum + d.remainingAmount, 0);
  const memberDues = dues.filter(d => d.type === 'member');
  const houseDues = dues.filter(d => d.type === 'house');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dues Management</h1>
          <p className="text-gray-600 text-sm">Manage and process campaign and stothrakazhcha dues</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-3xl font-bold text-red-600">₹{totalDues.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 mt-1">{dues.length} pending</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Member Dues</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{memberDues.reduce((s, d) => s + d.remainingAmount, 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{memberDues.length} members</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">House Dues</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{houseDues.reduce((s, d) => s + d.remainingAmount, 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{houseDues.length} houses</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchableSelect
            label="Unit"
            options={[
              { value: '', label: 'All Units' },
              ...units.map((unit) => ({ value: unit._id, label: unit.name }))
            ]}
            value={filters.unit}
            onChange={(value) => setFilters({ ...filters, unit: value, bavanakutayima: '', house: '', member: '' })}
          />
          <SearchableSelect
            label="Bavanakutayima"
            options={[
              { value: '', label: 'All Bavanakutayimas' },
              ...bavanakutayimas.map((bk) => ({ value: bk._id, label: bk.name }))
            ]}
            value={filters.bavanakutayima}
            onChange={(value) => setFilters({ ...filters, bavanakutayima: value, house: '', member: '' })}
            disabled={!filters.unit}
          />
          <SearchableSelect
            label="House"
            options={[
              { value: '', label: 'All Houses' },
              ...houses.map((house) => ({ value: house._id, label: house.familyName }))
            ]}
            value={filters.house}
            onChange={(value) => setFilters({ ...filters, house: value, member: '' })}
            disabled={!filters.bavanakutayima}
          />
          <SearchableSelect
            label="Member"
            options={[
              { value: '', label: 'All Members' },
              ...members.map((member) => ({
                value: member._id,
                label: `${member.firstName} ${member.lastName || ''}`
              }))
            ]}
            value={filters.member}
            onChange={(value) => setFilters({ ...filters, member: value })}
            disabled={!filters.house}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ unit: '', bavanakutayima: '', house: '', member: '' })}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Dues Tables */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dues...</p>
        </div>
      ) : dues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">No outstanding dues found!</p>
          <p className="text-sm text-gray-500 mt-2">All members and houses are up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Member Dues Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Member Dues ({memberDues.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hierarchical ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Campaign/Week</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Due Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Remaining</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {memberDues.map((due) => (
                    <tr key={due._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{due.hierarchicalNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{due.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{due.campaignName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-800">₹{due.dueAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">₹{due.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        ₹{due.remainingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handlePayDue(due)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Pay Due
                        </button>
                      </td>
                    </tr>
                  ))}
                  {memberDues.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No member dues found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* House Dues Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                House Dues ({houseDues.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hierarchical ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">House</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Campaign/Week</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Due Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Remaining</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {houseDues.map((due) => (
                    <tr key={due._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{due.hierarchicalNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{due.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{due.campaignName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-800">₹{due.dueAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">₹{due.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        ₹{due.remainingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handlePayDue(due)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Pay Due
                        </button>
                      </td>
                    </tr>
                  ))}
                  {houseDues.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No house dues found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Pay Due</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Paying for</p>
                <p className="font-semibold text-gray-800">{selectedDue.name}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedDue.campaignName}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Total Due</p>
                  <p className="font-semibold">₹{selectedDue.dueAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Paid</p>
                  <p className="font-semibold text-green-600">₹{selectedDue.paidAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Remaining</p>
                  <p className="font-semibold text-red-600">₹{selectedDue.remainingAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedDue.remainingAmount}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {processingPayment ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
