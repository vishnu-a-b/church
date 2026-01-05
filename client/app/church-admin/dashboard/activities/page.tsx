'use client';

import { useState, useEffect } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { Activity, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, Calendar, Users, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface SpiritualActivity {
  _id: string;
  memberId: { _id: string; firstName: string; lastName: string };
  activityType: 'mass' | 'fasting' | 'prayer';
  massDate?: string;
  massAttended?: boolean;
  fastingWeek?: string;
  fastingDays?: string[];
  prayerType?: string;
  prayerCount?: number;
  prayerWeek?: string;
  selfReported: boolean;
  reportedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export default function SpiritualActivitiesPage() {
  const [activities, setActivities] = useState<SpiritualActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const api = createRoleApi('church_admin');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/spiritual-activities');
      setActivities(response.data.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load spiritual activities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spiritual activity?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/spiritual-activities/${id}`);
      toast.success('Spiritual activity deleted successfully!');
      fetchActivities();
      setExpandedRowId(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete spiritual activity');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRow = (activityId: string) => {
    setExpandedRowId(expandedRowId === activityId ? null : activityId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityDetails = (activity: SpiritualActivity) => {
    switch (activity.activityType) {
      case 'mass':
        return formatDate(activity.massDate);
      case 'fasting':
        return activity.fastingDays?.join(', ') || '-';
      case 'prayer':
        return `${activity.prayerType || 'Prayer'} (${activity.prayerCount || 0}x)`;
      default:
        return '-';
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'mass':
        return 'bg-blue-100 text-blue-800';
      case 'fasting':
        return 'bg-purple-100 text-purple-800';
      case 'prayer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and pagination
  const filteredActivities = activities.filter(activity => {
    const memberName = `${activity.memberId.firstName} ${activity.memberId.lastName || ''}`.toLowerCase();
    const activityType = activity.activityType.toLowerCase();
    return memberName.includes(searchTerm.toLowerCase()) || activityType.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate stats
  const stats = {
    mass: activities.filter(a => a.activityType === 'mass').length,
    fasting: activities.filter(a => a.activityType === 'fasting').length,
    prayer: activities.filter(a => a.activityType === 'prayer').length,
    verified: activities.filter(a => a.verifiedBy).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Spiritual Activities</h2>
          <p className="text-gray-600 text-sm">Manage and track spiritual activities</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Activity
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Mass</p>
              <p className="text-2xl font-bold text-blue-800">{stats.mass}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Fasting</p>
              <p className="text-2xl font-bold text-purple-800">{stats.fasting}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Prayer</p>
              <p className="text-2xl font-bold text-green-800">{stats.prayer}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-700 font-medium">Verified</p>
              <p className="text-2xl font-bold text-teal-800">{stats.verified}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-teal-600" />
          </div>
        </div>
      </div>

      {/* Search and Results Count */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by member name or activity type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            Showing {paginatedActivities.length} of {filteredActivities.length} activities
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : paginatedActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No activities found matching your search' : 'No spiritual activities found'}
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((activity) => (
                  <>
                    <tr
                      key={activity._id}
                      onClick={() => toggleRow(activity._id)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                        expandedRowId === activity._id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Activity className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.memberId.firstName} {activity.memberId.lastName || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getActivityBadgeColor(activity.activityType)}`}>
                          {activity.activityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getActivityDetails(activity)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {activity.fastingWeek || activity.prayerWeek || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.verifiedBy ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(activity.reportedAt)}</div>
                        <div className="text-xs text-gray-500">
                          {activity.selfReported ? 'Self-Reported' : 'Admin'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(activity._id);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          {expandedRowId === activity._id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRowId === activity._id && (
                      <tr key={`${activity._id}-actions`} className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => {
                                setEditingId(activity._id);
                                setShowAddModal(true);
                                setExpandedRowId(null);
                              }}
                              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(activity._id)}
                              disabled={deletingId === activity._id}
                              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {deletingId === activity._id ? (
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

        {/* Pagination */}
        {!loading && filteredActivities.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredActivities.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredActivities.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TODO: Add/Edit Modal will be implemented here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Activity' : 'Add Activity'}
            </h3>
            <p className="text-gray-600 mb-4">
              Activity management form will be implemented here.
            </p>
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingId(null);
              }}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
