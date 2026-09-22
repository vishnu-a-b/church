'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { ArrowLeft, CalendarPlus } from 'lucide-react';

interface Rite { _id: string; nameMalayalam: string; nameEnglish: string; amount: number; category: string; }
interface Unit { _id: string; name: string; }
interface Bavanakutayima { _id: string; name: string; }
interface House { _id: string; familyName: string; }
interface Member { _id: string; firstName: string; lastName: string; }

const CATEGORY_LABELS: Record<string, string> = {
  holy_masses: 'Holy Masses',
  feast_day_rites: 'Feast Day Rites',
  blessings: 'Blessings',
  deceased_rites: 'Rites for the Deceased',
  other_rites: 'Other Sacred Rites',
};

export default function NewThirukkarmangalBookingPage() {
  const router = useRouter();
  const api = createRoleApi('church_admin');

  const [rites, setRites] = useState<Rite[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bavanakutayimas, setBavanakutayimas] = useState<Bavanakutayima[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [selectedRiteId, setSelectedRiteId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedBk, setSelectedBk] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/thirukkarmangal/rites').then(r => setRites(r.data?.data || [])).catch(() => {});
    api.get('/units').then(r => setUnits(r.data?.data || [])).catch(() => {});
  }, []);

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedBk(''); setSelectedHouse(''); setSelectedMember('');
    setBavanakutayimas([]); setHouses([]); setMembers([]);
    if (!unitId) return;
    const r = await api.get(`/bavanakutayimas?unitId=${unitId}`);
    setBavanakutayimas(r.data?.data || []);
  };

  const handleBkChange = async (bkId: string) => {
    setSelectedBk(bkId);
    setSelectedHouse(''); setSelectedMember('');
    setHouses([]); setMembers([]);
    if (!bkId) return;
    const r = await api.get(`/houses?bavanakutayimaId=${bkId}`);
    setHouses(r.data?.data || []);
  };

  const handleHouseChange = async (houseId: string) => {
    setSelectedHouse(houseId);
    setSelectedMember(''); setMembers([]);
    if (!houseId) return;
    const r = await api.get(`/members?houseId=${houseId}`);
    setMembers(r.data?.data || []);
  };

  const selectedRite = rites.find(r => r._id === selectedRiteId);

  const groupedRites = rites.reduce((acc, rite) => {
    if (!acc[rite.category]) acc[rite.category] = [];
    acc[rite.category].push(rite);
    return acc;
  }, {} as Record<string, Rite[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiteId) { toast.error('Select a rite'); return; }
    if (!selectedMember) { toast.error('Select a member'); return; }
    if (!scheduledDate) { toast.error('Select a scheduled date'); return; }

    setSubmitting(true);
    try {
      await api.post('/thirukkarmangal/scheduled-bookings', {
        riteId: selectedRiteId,
        memberId: selectedMember,
        scheduledDate,
        notes: notes.trim() || undefined,
      });
      toast.success('Booking created successfully');
      router.push('/church-admin/dashboard/thirukkarmangal/bookings');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/church-admin/dashboard/thirukkarmangal/bookings')}
          className="text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">New Thirukkarmangal Booking</h2>
          <p className="text-gray-500 text-sm">Schedule a rite — payment can be added later</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
        {/* Rite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rite *</label>
          <select
            value={selectedRiteId}
            onChange={(e) => setSelectedRiteId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="">Choose a rite...</option>
            {Object.entries(groupedRites).map(([cat, catRites]) => (
              <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                {catRites.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.nameEnglish} — ₹{r.amount}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedRite && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 text-sm text-teal-800">
            <span className="font-semibold">{selectedRite.nameMalayalam}</span>
            <span className="mx-2">·</span>
            Standard fee: <span className="font-semibold">₹{selectedRite.amount}</span>
          </div>
        )}

        {/* Scheduled Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>

        {/* Member Selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Member *</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={selectedUnit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select unit...</option>
                {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bavanakutayima</label>
              <select
                value={selectedBk}
                onChange={(e) => handleBkChange(e.target.value)}
                disabled={!selectedUnit}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
              >
                <option value="">Select...</option>
                {bavanakutayimas.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">House</label>
              <select
                value={selectedHouse}
                onChange={(e) => handleHouseChange(e.target.value)}
                disabled={!selectedBk}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
              >
                <option value="">Select...</option>
                {houses.map(h => <option key={h._id} value={h._id}>{h.familyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Member</label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                disabled={!selectedHouse}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                required
              >
                <option value="">Select...</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/church-admin/dashboard/thirukkarmangal/bookings')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <CalendarPlus className="w-4 h-4" />
            {submitting ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}
