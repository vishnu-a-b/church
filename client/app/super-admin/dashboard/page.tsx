'use client';

import { useState, useEffect } from 'react';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { Users, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { BsBuilding } from 'react-icons/bs';
import { createRoleApi } from '@/lib/roleApi';
import Link from 'next/link';

export default function SuperAdminDashboardPage() {
  const { user } = useRoleAuth();
  const [stats, setStats] = useState({
    churches: 0,
    users: 0,
    members: 0,
    transactions: 0,
    totalAmount: 0,
    campaigns: 0,
  });
  const [loading, setLoading] = useState(true);
  const api = createRoleApi('super_admin');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [churchesRes, usersRes, membersRes, transactionsRes, campaignsRes] = await Promise.all([
        api.get('/churches'),
        api.get('/users'),
        api.get('/members'),
        api.get('/transactions'),
        api.get('/campaigns'),
      ]);

      const transactions = transactionsRes.data.data || [];
      const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);

      setStats({
        churches: churchesRes.data.data?.length || 0,
        users: usersRes.data.data?.length || 0,
        members: membersRes.data.data?.length || 0,
        transactions: transactions.length,
        totalAmount,
        campaigns: campaignsRes.data.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Churches',
      value: stats.churches,
      icon: BsBuilding,
      color: 'bg-blue-500',
      link: '/super-admin/dashboard/churches',
    },
    {
      name: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'bg-green-500',
      link: '/super-admin/dashboard/users',
    },
    {
      name: 'Total Members',
      value: stats.members,
      icon: Users,
      color: 'bg-purple-500',
      link: '/super-admin/dashboard/churches',
    },
    {
      name: 'Active Campaigns',
      value: stats.campaigns,
      icon: Activity,
      color: 'bg-orange-500',
      link: '/super-admin/dashboard/campaigns',
    },
    {
      name: 'Total Transactions',
      value: stats.transactions,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      link: '/super-admin/dashboard/transactions',
    },
    {
      name: 'Total Amount',
      value: `₹${stats.totalAmount.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-pink-500',
      link: '/super-admin/dashboard/transactions',
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.username}!</h2>
        <p className="text-gray-600">System Overview - Church Wallet Management</p>
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
            <Link href="/super-admin/dashboard/churches" className="block px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium">
              Manage Churches
            </Link>
            <Link href="/super-admin/dashboard/users" className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
              Manage Users
            </Link>
            <Link href="/super-admin/dashboard/campaigns" className="block px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
              View Campaigns
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">✅ Multi-Role System Active!</h3>
          <p className="text-purple-700 text-sm mb-4">
            You're logged in as <strong>Super Admin</strong>. You can manage all churches, units, and members across the entire system.
          </p>
          <div className="bg-white rounded-lg p-4 text-xs text-gray-600">
            <p className="font-semibold mb-2">Available Features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Hierarchical drill-down (Church → Unit → Bavanakutayima → House → Member)</li>
              <li>User management with filters</li>
              <li>Campaign and transaction tracking</li>
              <li>Multi-role session support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
