'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar, Plus, CheckCircle, Clock, Activity } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { createRoleApi } from '@/lib/roleApi';
import { toast } from 'react-toastify';

interface SpiritualActivity {
  _id: string;
  activityType: string;
  activityDate: Date;
  notes?: string;
  createdAt: Date;
}

export default function MemberSpiritualActivitiesPage() {
  const api = createRoleApi('member');
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    activityType: '',
    activityDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/members/me/spiritual-activities');

      if (response.data.success) {
        setActivities(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching spiritual activities:', error);
      toast.error('Failed to load spiritual activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activityType || !formData.activityDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/members/me/spiritual-activities', formData);

      if (response.data.success) {
        toast.success('Spiritual activity added successfully!');
        setShowAddModal(false);
        setFormData({
          activityType: '',
          activityDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        fetchActivities();
      }
    } catch (error: any) {
      console.error('Error adding spiritual activity:', error);
      toast.error(error.response?.data?.error || 'Failed to add spiritual activity');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      prayer: 'Prayer',
      mass: 'Holy Mass',
      confession: 'Confession',
      rosary: 'Rosary',
      adoration: 'Adoration',
      bible_reading: 'Bible Reading',
      fasting: 'Fasting',
      charity: 'Charity Work',
      retreat: 'Retreat',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const columns: ColumnDef<SpiritualActivity>[] = [
    {
      accessorKey: 'activityType',
      header: 'Activity Type',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          <Heart className="w-4 h-4" />
          {getActivityTypeLabel(row.original.activityType)}
        </span>
      ),
    },
    {
      accessorKey: 'activityDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-purple-600" />
          {formatDate(row.original.activityDate)}
        </span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => row.original.notes ? (
        <span className="text-gray-600 italic text-sm">{row.original.notes}</span>
      ) : (
        <span className="text-gray-400">-</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Recorded On',
      cell: ({ row }) => (
        <span className="text-gray-500 text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Spiritual Activities</h1>
            <p className="text-purple-100">Track your spiritual journey and activities</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <Heart className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">Total Activities</p>
              <p className="text-4xl font-bold text-purple-900">{activities.length}</p>
              <p className="text-xs text-purple-600 mt-1">All time</p>
            </div>
            <div className="bg-purple-500 bg-opacity-20 rounded-full p-4">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">This Month</p>
              <p className="text-4xl font-bold text-blue-900">
                {activities.filter(a => {
                  const activityDate = new Date(a.activityDate);
                  const now = new Date();
                  return activityDate.getMonth() === now.getMonth() &&
                         activityDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-xs text-blue-600 mt-1">Current month</p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 rounded-full p-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Latest Activity</p>
              <p className="text-lg font-bold text-green-900">
                {activities.length > 0 ? formatDate(activities[0].activityDate) : 'No activities yet'}
              </p>
              <p className="text-xs text-green-600 mt-1">Most recent</p>
            </div>
            <div className="bg-green-500 bg-opacity-20 rounded-full p-4">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Activity Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add Spiritual Activity
        </button>
      </div>

      {/* Activities DataTable */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
            Activity History
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-4">
            Showing {activities.length} spiritual activit{activities.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={activities}
          searchPlaceholder="Search by activity type or notes..."
        />
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Add Spiritual Activity</h2>
              <p className="text-purple-100 text-sm mt-1">Record your spiritual journey</p>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select activity type</option>
                  <option value="prayer">Prayer</option>
                  <option value="mass">Holy Mass</option>
                  <option value="confession">Confession</option>
                  <option value="rosary">Rosary</option>
                  <option value="adoration">Adoration</option>
                  <option value="bible_reading">Bible Reading</option>
                  <option value="fasting">Fasting</option>
                  <option value="charity">Charity Work</option>
                  <option value="retreat">Retreat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.activityDate}
                  onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add any additional details..."
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      activityType: '',
                      activityDate: new Date().toISOString().split('T')[0],
                      notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
