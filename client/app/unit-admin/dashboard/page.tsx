'use client';

import { useState, useEffect } from 'react';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { Users, TrendingUp, Activity, DollarSign, AlertCircle, UserCheck } from 'lucide-react';
import { BsHouseDoor, BsPeople } from 'react-icons/bs';
import { createRoleApi } from '@/lib/roleApi';
import Link from 'next/link';
import { toast } from 'react-toastify';

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
      toast.error('Some dashboard stats failed to load');
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

  const quickActions = [
    { name: 'Members', href: '/unit-admin/dashboard/members', icon: Users, color: 'text-green-700 bg-green-50 hover:bg-green-100' },
    { name: 'Bavanakutayimas', href: '/unit-admin/dashboard/bavanakutayimas', icon: BsPeople, color: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100' },
    { name: 'Houses', href: '/unit-admin/dashboard/houses', icon: BsHouseDoor, color: 'text-purple-700 bg-purple-50 hover:bg-purple-100' },
    { name: 'Transactions', href: '/unit-admin/dashboard/transactions', icon: TrendingUp, color: 'text-cyan-700 bg-cyan-50 hover:bg-cyan-100' },
    { name: 'Dues', href: '/unit-admin/dashboard/dues', icon: AlertCircle, color: 'text-red-700 bg-red-50 hover:bg-red-100' },
    { name: 'Campaigns', href: '/unit-admin/dashboard/campaigns', icon: Activity, color: 'text-orange-700 bg-orange-50 hover:bg-orange-100' },
    { name: 'Users', href: '/unit-admin/dashboard/users', icon: UserCheck, color: 'text-teal-700 bg-teal-50 hover:bg-teal-100' },
    { name: 'Spiritual Activities', href: '/unit-admin/dashboard/activities', icon: Activity, color: 'text-violet-700 bg-violet-50 hover:bg-violet-100' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.username}!</h2>
        <p className="text-gray-600">Unit Management Dashboard - Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-gray-200 mb-4" />
                <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-28 bg-gray-100 rounded" />
              </div>
            ))
          : statCards.map((stat) => (
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-colors font-medium text-sm text-center ${action.color}`}
            >
              <action.icon className="w-5 h-5" />
              {action.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
