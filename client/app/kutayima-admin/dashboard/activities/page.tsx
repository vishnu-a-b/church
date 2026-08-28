'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';
import { Heart, Plus } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Activity {
  _id: string;
  memberId: { firstName: string; lastName: string } | null;
  activityType: string;
  createdAt: string;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function KutayimaAdminActivitiesPage() {
  const api = createRoleApi('kudumbakutayima_admin');
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [memberId, setMemberId] = useState('');
  const [activityType, setActivityType] = useState<'mass' | 'fasting' | 'prayer'>('mass');
  const [massDate, setMassDate] = useState('');
  const [fastingWeek, setFastingWeek] = useState('');
  const [fastingDays, setFastingDays] = useState<string[]>([]);
  const [prayerType, setPrayerType] = useState('rosary');
  const [prayerCount, setPrayerCount] = useState('');
  const [prayerWeek, setPrayerWeek] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchMyMarkedActivities();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMyMarkedActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/spiritual-activities?includeAllStatuses=true');
      setActivities(response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setFastingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const resetForm = () => {
    setMemberId('');
    setActivityType('mass');
    setMassDate('');
    setFastingWeek('');
    setFastingDays([]);
    setPrayerType('rosary');
    setPrayerCount('');
    setPrayerWeek('');
  };

  const handleSubmit = async () => {
    if (!memberId) {
      toast.error('Select a member');
      return;
    }

    const body: any = { memberId, activityType };
    if (activityType === 'mass') {
      if (!massDate) { toast.error('Select a mass date'); return; }
      body.massDate = massDate;
      body.massAttended = true;
    } else if (activityType === 'fasting') {
      if (!fastingWeek) { toast.error('Enter the fasting week'); return; }
      body.fastingWeek = fastingWeek;
      body.fastingDays = fastingDays;
    } else {
      if (!prayerWeek) { toast.error('Enter the prayer week'); return; }
      body.prayerType = prayerType;
      body.prayerCount = Number(prayerCount) || 0;
      body.prayerWeek = prayerWeek;
    }

    setSubmitting(true);
    try {
      await api.post('/approvals/spiritual-activities/mark-pending', body);
      toast.success('Activity marked successfully');
      setShowModal(false);
      resetForm();
      fetchMyMarkedActivities();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Spiritual Activities</h2>
          <p className="text-gray-600">Mark spiritual activities for members in your group</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <Plus className="w-5 h-5" /> Mark Activity
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No activities marked yet</td></tr>
            ) : (
              activities.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{a.memberId ? `${a.memberId.firstName} ${a.memberId.lastName}` : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{a.activityType}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-bold">Mark Spiritual Activity</h3>
            </div>

            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
              <option value="">Select member...</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
            </select>

            <select value={activityType} onChange={(e) => setActivityType(e.target.value as any)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
              <option value="mass">Mass</option>
              <option value="fasting">Fasting</option>
              <option value="prayer">Prayer</option>
            </select>

            {activityType === 'mass' && (
              <input type="date" value={massDate} onChange={(e) => setMassDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            )}

            {activityType === 'fasting' && (
              <div className="space-y-2">
                <input type="text" placeholder="Fasting week (e.g. 2026-W32)" value={fastingWeek} onChange={(e) => setFastingWeek(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${fastingDays.includes(day) ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activityType === 'prayer' && (
              <div className="space-y-2">
                <select value={prayerType} onChange={(e) => setPrayerType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="rosary">Rosary</option>
                  <option value="divine_mercy">Divine Mercy</option>
                  <option value="stations">Stations</option>
                  <option value="other">Other</option>
                </select>
                <input type="number" min="0" placeholder="Count" value={prayerCount} onChange={(e) => setPrayerCount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                <input type="text" placeholder="Prayer week (e.g. 2026-W32)" value={prayerWeek} onChange={(e) => setPrayerWeek(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
