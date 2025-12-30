'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { Sidebar, MenuItem } from '@/components/Sidebar';
import { FiHome, FiUsers, FiActivity, FiDollarSign, FiUserCheck } from 'react-icons/fi';
import { BsPeople, BsHouseDoor, BsNewspaper, BsCalendarEvent } from 'react-icons/bs';
import { MdOutlineAccountTree, MdPayment } from 'react-icons/md';
import { ToastContainer } from 'react-toastify';
import { createRoleApi } from '@/lib/roleApi';
import 'react-toastify/dist/ReactToastify.css';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, loading } = useRoleAuth();
  const [churchName, setChurchName] = useState<string>('');
  const api = createRoleApi('church_admin');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/church-admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchChurchName = async () => {
      if (user?.churchId) {
        try {
          const response = await api.get(`/churches/${user.churchId}`);
          setChurchName(response.data?.data?.name || '');
        } catch (error) {
          console.error('Error fetching church:', error);
          // Set a fallback name if church fetch fails
          setChurchName('My Church');
        }
      } else {
        // If no churchId, set a default name
        setChurchName('Church Management');
      }
    };

    if (user) {
      fetchChurchName();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/church-admin');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/church-admin/dashboard', icon: FiHome },
    { name: 'Units', href: '/church-admin/dashboard/units', icon: MdOutlineAccountTree },
    { name: 'Bavanakutayimas', href: '/church-admin/dashboard/bavanakutayimas', icon: BsPeople },
    { name: 'Houses', href: '/church-admin/dashboard/houses', icon: BsHouseDoor },
    { name: 'Members', href: '/church-admin/dashboard/members', icon: FiUsers },
    { name: 'Users', href: '/church-admin/dashboard/users', icon: FiUserCheck },
    { name: 'Transactions', href: '/church-admin/dashboard/transactions', icon: FiDollarSign },
    { name: 'Campaigns', href: '/church-admin/dashboard/campaigns', icon: FiActivity },
    { name: 'Stothrakazhcha', href: '/church-admin/dashboard/stothrakazhcha', icon: MdPayment },
    { name: 'Spiritual Activities', href: '/church-admin/dashboard/activities', icon: FiActivity },
    { name: 'News', href: '/church-admin/dashboard/news', icon: BsNewspaper },
    { name: 'Events', href: '/church-admin/dashboard/events', icon: BsCalendarEvent },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Sidebar
        menuItems={menuItems}
        title="Church Admin"
        subtitle={churchName || 'Church Management'}
        color="from-green-600 to-teal-600"
        userEmail={user.email}
        onLogout={handleLogout}
      />

      {/* Main content - offset for sidebar */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function ChurchAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleAuthProvider role="church_admin" expectedRole="church_admin">
      <DashboardContent>{children}</DashboardContent>
    </RoleAuthProvider>
  );
}

