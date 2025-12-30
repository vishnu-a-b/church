'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Users, Building2, TrendingUp, Wallet, Heart, Church as ChurchIcon } from 'lucide-react';

interface Stats {
  totalChurches: number;
  totalUnits: number;
  totalMembers: number;
  totalTransactions: number;
  totalAmount: number;
  activeCampaigns: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalChurches: 0,
    totalUnits: 0,
    totalMembers: 0,
    totalTransactions: 0,
    totalAmount: 0,
    activeCampaigns: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Only fetch stats once auth is loaded and user is authenticated
    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user]);

  const fetchStats = async () => {
    try {
      // Fetch stats from API
      const [churchesRes, unitsRes, membersRes, transactionsRes, campaignsRes] = await Promise.all([
        api.get('/churches'),
        api.get('/units'),
        api.get('/members'),
        api.get('/transactions'),
        api.get('/campaigns'),
      ]);

      const transactions = transactionsRes.data?.data || [];
      const totalAmount = transactions.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);

      setStats({
        totalChurches: churchesRes.data?.data?.length || 0,
        totalUnits: unitsRes.data?.data?.length || 0,
        totalMembers: membersRes.data?.data?.length || 0,
        totalTransactions: transactions.length,
        totalAmount,
        activeCampaigns: campaignsRes.data?.data?.filter((c: any) => c.isActive).length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Churches',
      value: stats.totalChurches,
      icon: ChurchIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Total Units',
      value: stats.totalUnits,
      icon: Building2,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      name: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: Heart,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
    {
      name: 'Total Transactions',
      value: stats.totalTransactions,
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      name: 'Total Amount',
      value: `₹${stats.totalAmount.toLocaleString()}`,
      icon: Wallet,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.username}!
        </h2>
        <p className="text-blue-100">
          Here's what's happening in your church management system today.
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.name}</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
            <Users className="w-5 h-5 mr-2" />
            Add Member
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium">
            <TrendingUp className="w-5 h-5 mr-2" />
            New Transaction
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium">
            <Wallet className="w-5 h-5 mr-2" />
            Create Campaign
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium">
            <Building2 className="w-5 h-5 mr-2" />
            Add House
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
            <div>
              <p className="text-sm text-gray-800 font-medium">
                System initialized successfully
              </p>
              <p className="text-xs text-gray-500">Just now</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
            <div>
              <p className="text-sm text-gray-800 font-medium">
                Database seeded with sample data
              </p>
              <p className="text-xs text-gray-500">A few moments ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
