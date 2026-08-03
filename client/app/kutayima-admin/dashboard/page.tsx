'use client';

import { useState, useEffect } from 'react';
import { useRoleAuth } from '@/context/RoleAuthContext';
import { Users } from 'lucide-react';
import { BsHouseDoor } from 'react-icons/bs';
import { createRoleApi } from '@/lib/roleApi';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function KutayimaAdminDashboardPage() {
  const { user } = useRoleAuth();
  const [stats, setStats] = useState({ members: 0, houses: 0 });
  const [loading, setLoading] = useState(true);
  const api = createRoleApi('kudumbakutayima_admin');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [membersRes, housesRes] = await Promise.all([
        api.get('/members'),
        api.get('/houses'),
      ]);

      setStats({
        members: membersRes.data.data?.length || 0,
        houses: housesRes.data.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Members',
      value: stats.members,
      icon: Users,
      color: 'bg-green-500',
      link: '/kutayima-admin/dashboard/members',
    },
    {
      name: 'Total Houses',
      value: stats.houses,
      icon: BsHouseDoor,
      color: 'bg-purple-500',
      link: '/kutayima-admin/dashboard/houses',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.username}!</h2>
        <p className="text-gray-600">Bavanakutayima Management Dashboard - Overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-2xl">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
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

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/kutayima-admin/dashboard/members"
            className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-colors font-medium text-sm text-center text-green-700 bg-green-50 hover:bg-green-100"
          >
            <Users className="w-5 h-5" />
            Members
          </Link>
          <Link
            href="/kutayima-admin/dashboard/houses"
            className="flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-colors font-medium text-sm text-center text-purple-700 bg-purple-50 hover:bg-purple-100"
          >
            <BsHouseDoor className="w-5 h-5" />
            Houses
          </Link>
        </div>
      </div>
    </div>
  );
}
