'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Gift, Plus } from 'lucide-react';

interface Transaction {
  _id: string;
  receiptNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  memberId?: { firstName: string; lastName: string };
  notes?: string;
}

interface Unit { _id: string; name: string; }
interface Bavanakutayima { _id: string; name: string; }
interface House { _id: string; familyName: string; }
interface Member { _id: string; firstName: string; lastName: string; }

export default function ChurchAdminPathavarmPage() {
  const api = createRoleApi('church_admin');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [me, setMe] = useState<any>(null);

  const [units, setUnits] = useState<Unit[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedBavanakutayima, setSelectedBavanakutayima] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchTransactions();
    fetchUnits();
    const stored = localStorage.getItem('church_admin_user');
    if (stored) setMe(JSON.parse(stored));
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions?transactionType=pathavarm');
      setTransactions(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load Pathavarm contributions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    const response = await api.get('/units');
    setUnits(response.data?.data || []);
  };

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedBavanakutayima('');
    setSelectedHouse('');
    setSelectedMember('');
    setBavanakutayimas([]);
    setHouses([]);
    setMembers([]);
    if (!unitId) return;
    const response = await api.get(`/bavanakutayimas?unitId=${unitId}`);
    setBavanakutayimas(response.data?.data || []);
  };

  const handleBavanakutayimaChange = async (bavanakutayimaId: string) => {
    setSelectedBavanakutayima(bavanakutayimaId);
    setSelectedHouse('');
    setSelectedMember('');
    setHouses([]);
    setMembers([]);
    if (!bavanakutayimaId) return;
    const response = await api.get(`/houses?bavanakutayimaId=${bavanakutayimaId}`);
    setHouses(response.data?.data || []);
  };

  const handleHouseChange = async (houseId: string) => {
    setSelectedHouse(houseId);
    setSelectedMember('');
    setMembers([]);
    if (!houseId) return;
    const response = await api.get(`/members?houseId=${houseId}`);
    setMembers(response.data?.data || []);
  };

  const resetForm = () => {
    setSelectedUnit('');
    setSelectedBavanakutayima('');
    setSelectedHouse('');
    setSelectedMember('');
    setAmount('');
    setPaymentMethod('cash');
    setBavanakutayimas([]);
    setHouses([]);
    setMembers([]);
  };

  const handleSubmit = async () => {
    if (!selectedMember || !amount || Number(amount) <= 0) {
      toast.error('Select a member and enter a valid amount');
      return;
    }
    if (!me?.churchId) {
      toast.error('Church admin must have a church assigned');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        transactionType: 'pathavarm',
        churchId: me.churchId,
        memberId: selectedMember,
        unitId: selectedUnit,
        houseId: selectedHouse,
        distribution: 'member_only',
        memberAmount: Number(amount),
        houseAmount: 0,
        totalAmount: Number(amount),
        paymentMethod,
        notes: 'Pathavarm (Tithe)',
      });
      toast.success('Pathavarm contribution recorded');
      setShowModal(false);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const total = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pathavarm (Tithe)</h2>
          <p className="text-gray-600">Per-member, one-time, optional contributions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" /> Record Contribution
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-teal-600" />
          <div>
            <p className="text-sm text-gray-600">Total Collected</p>
            <p className="text-2xl font-bold text-gray-800">₹{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">{transactions.length} contributions</div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No Pathavarm contributions yet</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{t.receiptNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {t.memberId ? `${t.memberId.firstName} ${t.memberId.lastName}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{t.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{t.paymentMethod.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.paymentDate).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold">Record Pathavarm Contribution</h3>

            <div className="grid grid-cols-1 gap-3">
              <select value={selectedUnit} onChange={(e) => handleUnitChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Unit...</option>
                {units.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
              <select value={selectedBavanakutayima} onChange={(e) => handleBavanakutayimaChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!selectedUnit}>
                <option value="">Select Bavanakutayima...</option>
                {bavanakutayimas.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              <select value={selectedHouse} onChange={(e) => handleHouseChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!selectedBavanakutayima}>
                <option value="">Select House...</option>
                {houses.map((h) => <option key={h._id} value={h._id}>{h.familyName}</option>)}
              </select>
              <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!selectedHouse}>
                <option value="">Select Member...</option>
                {members.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {submitting ? 'Recording...' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
