'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { ArrowLeft, Receipt } from 'lucide-react';

interface Rite {
  _id: string;
  category: string;
  nameMalayalam: string;
  nameEnglish: string;
  amount: number;
  splitConfigured: boolean;
  split: Array<{ recipientLabel: string; percent: number }>;
}

interface Unit { _id: string; name: string; }
interface Bavanakutayima { _id: string; name: string; }
interface House { _id: string; familyName: string; }
interface Member { _id: string; firstName: string; lastName: string; unitId?: string; houseId?: string; }

export default function RecordThirukkarmangalPaymentPage() {
  const router = useRouter();
  const api = createRoleApi('church_admin');

  const [rites, setRites] = useState<Rite[]>([]);
  const [selectedRiteId, setSelectedRiteId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const [units, setUnits] = useState<Unit[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedBavanakutayima, setSelectedBavanakutayima] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const [me, setMe] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRites();
    fetchUnits();
    const stored = localStorage.getItem('church_admin_user');
    if (stored) setMe(JSON.parse(stored));
  }, []);

  const fetchRites = async () => {
    try {
      const response = await api.get('/thirukkarmangal/rites');
      setRites(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load rate list');
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/units');
      setUnits(response.data?.data || []);
    } catch (error) {
      console.error(error);
    }
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

  const selectedRite = rites.find((r) => r._id === selectedRiteId) || null;

  const handleRiteChange = (riteId: string) => {
    setSelectedRiteId(riteId);
    const rite = rites.find((r) => r._id === riteId);
    if (rite) setAmount(rite.amount.toString());
  };

  const previewSplit = () => {
    if (!selectedRite || !selectedRite.splitConfigured) return [];
    const paid = Number(amount) || 0;
    return selectedRite.split.map((s) => ({
      ...s,
      amount: Math.round(((paid * s.percent) / 100) * 100) / 100,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedRiteId) {
      toast.error('Select a rite');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!selectedMember) {
      toast.error('Select a member');
      return;
    }
    if (!me?.churchId) {
      toast.error('Church admin must have a church assigned');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transactions', {
        transactionType: 'thirukkarmangal',
        riteId: selectedRiteId,
        churchId: me.churchId,
        memberId: selectedMember,
        unitId: selectedUnit,
        houseId: selectedHouse,
        distribution: 'member_only',
        memberAmount: Number(amount),
        houseAmount: 0,
        totalAmount: Number(amount),
        paymentMethod,
        notes: notes || `Thirukkarmangal: ${selectedRite?.nameEnglish}`,
      });
      toast.success('Payment recorded successfully');
      router.push('/church-admin/dashboard/thirukkarmangal/rites');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const split = previewSplit();

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => router.push('/church-admin/dashboard/thirukkarmangal/rites')}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to rate list
      </button>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-teal-600" />
          <h2 className="text-xl font-bold text-gray-800">Record Thirukkarmangal Payment</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rite *</label>
          <select
            value={selectedRiteId}
            onChange={(e) => handleRiteChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Choose a rite...</option>
            {rites.map((rite) => (
              <option key={rite._id} value={rite._id}>
                {rite.nameEnglish} — ₹{rite.amount}
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        {selectedRite && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
            {selectedRite.splitConfigured ? (
              <>
                <p className="font-semibold text-gray-700 mb-1">Split preview:</p>
                <ul className="space-y-0.5 text-gray-600">
                  {split.map((s, i) => (
                    <li key={i}>{s.recipientLabel}: {s.percent}% = ₹{s.amount}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-amber-700">No split configured for this rite yet — payment will still be recorded.</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select value={selectedUnit} onChange={(e) => handleUnitChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select...</option>
              {units.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bavanakutayima *</label>
            <select value={selectedBavanakutayima} onChange={(e) => handleBavanakutayimaChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!selectedUnit}>
              <option value="">Select...</option>
              {bavanakutayimas.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House *</label>
            <select value={selectedHouse} onChange={(e) => handleHouseChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" disabled={!selectedBavanakutayima}>
              <option value="">Select...</option>
              {houses.map((h) => <option key={h._id} value={h._id}>{h.familyName}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
          <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" disabled={!selectedHouse}>
            <option value="">Select...</option>
            {members.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Optional"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
