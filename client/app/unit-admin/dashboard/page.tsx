'use client';

import { useState, useEffect } from 'react';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { Users, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { BsHouseDoor, BsPeople } from 'react-icons/bs';
import { createRoleApi } from '@/lib/roleApi';
import Link from 'next/link';

export default function UnitAdminDashboardPage() {
  const { user } = useRoleAuth();
  const [stats, setStats] = useState({
    bavanakutayimas: 0,
    houses: 0,
    users: 0,
    members: 0,
    transactions: 0,
    totalAmount: 0,
    campaigns: 0,
    activities: 0,
  });
  const [loading, setLoading] = useState(true);
  const api = createRoleApi('unit_admin');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [bavanakutayimasRes, housesRes, membersRes, transactionsRes, campaignsRes, activitiesRes] = await Promise.all([
        api.get('/bavanakutayimas'),
        api.get('/houses'),
        api.get('/members'),
        api.get('/transactions'),
        api.get('/campaigns'),
        api.get('/spiritual-activities'),
      ]);

      const transactions = transactionsRes.data.data || [];
      const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);

      // Filter users from members (members with username)
      const allMembers = membersRes.data.data || [];
      const usersCount = allMembers.filter((m: any) => m.username).length;

      setStats({
        bavanakutayimas: bavanakutayimasRes.data.data?.length || 0,
        houses: housesRes.data.data?.length || 0,
        users: usersCount,
        members: allMembers.length,
        transactions: transactions.length,
        totalAmount,
        campaigns: campaignsRes.data.data?.length || 0,
        activities: activitiesRes.data.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Bavanakutayimas',
      value: stats.bavanakutayimas,
      icon: BsPeople,
      color: 'bg-indigo-500',
      link: '/unit-admin/dashboard/bavanakutayimas',
    },
    {
      name: 'Total Houses',
      value: stats.houses,
      icon: BsHouseDoor,
      color: 'bg-purple-500',
      link: '/unit-admin/dashboard/houses',
    },
    {
      name: 'Total Members',
      value: stats.members,
      icon: Users,
      color: 'bg-green-500',
      link: '/unit-admin/dashboard/members',
    },
    {
      name: 'Users with Login',
      value: stats.users,
      icon: Users,
      color: 'bg-teal-500',
      link: '/unit-admin/dashboard/users',
    },
    {
      name: 'Active Campaigns',
      value: stats.campaigns,
      icon: Activity,
      color: 'bg-orange-500',
      link: '/unit-admin/dashboard/campaigns',
    },
    {
      name: 'Total Transactions',
      value: stats.transactions,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      link: '/unit-admin/dashboard/transactions',
    },
    {
      name: 'Total Amount',
      value: `₹${stats.totalAmount.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-pink-500',
      link: '/unit-admin/dashboard/transactions',
    },
    {
      name: 'Spiritual Activities',
      value: stats.activities,
      icon: Activity,
      color: 'bg-violet-500',
      link: '/unit-admin/dashboard/activities',
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.username}!</h2>
        <p className="text-gray-600">Unit Management Dashboard - Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.link}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.name}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/unit-admin/dashboard/members" className="block px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
              Manage Members
            </Link>
            <Link href="/unit-admin/dashboard/bavanakutayimas" className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
              Manage Bavanakutayimas
            </Link>
            <Link href="/unit-admin/dashboard/transactions" className="block px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
              View Transactions
            </Link>
            <Link href="/unit-admin/dashboard/campaigns" className="block px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium">
              Manage Campaigns
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">✅ Unit Admin Dashboard</h3>
          <p className="text-blue-700 text-sm mb-4">
            You're logged in as <strong>Unit Admin</strong>. You can manage all aspects of your unit including bavanakutayimas, houses, members, and financial records.
          </p>
          <div className="bg-white rounded-lg p-4 text-xs text-gray-600">
            <p className="font-semibold mb-2">Available Features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Hierarchical management (Bavanakutayima → House → Member)</li>
              <li>Member and user management</li>
              <li>Financial transaction tracking</li>
              <li>Campaign management</li>
              <li>Spiritual activity tracking</li>
              <li>Full CRUD operations for all entities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
