'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { MonthlySupportPlan } from '@/types';
import { Repeat, Users, TrendingUp, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, ListChecks, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MonthlySupportPage() {
  const router = useRouter();
  const api = createRoleApi('church_admin');

  const [plans, setPlans] = useState<MonthlySupportPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/monthly-support-plans');
      setPlans(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load monthly support plans');
    } finally {
      setLoading(false);
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
    router.push(`/church-admin/dashboard/monthly-support/dues?planId=${plan._id}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const activePlans = plans.filter((p) => p.isActive);
  const totalMembersCovered = plans.reduce((sum, p) => sum + p.members.length, 0);

  const filteredPlans = plans.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Monthly Support</h2>
          <p className="text-gray-600">Recurring fixed monthly pledges from specific members</p>
        </div>
        <button
          onClick={() => router.push('/church-admin/dashboard/monthly-support/plan')}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
              {loading ? (
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
                              onClick={() => router.push(`/church-admin/dashboard/monthly-support/pay?planId=${plan._id}`)}
                              disabled={plan.members.length === 0}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <DollarSign className="w-4 h-4" />
                              Add Payment
                            </button>
                            <button
                              onClick={() => router.push(`/church-admin/dashboard/monthly-support/plan?planId=${plan._id}`)}
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
