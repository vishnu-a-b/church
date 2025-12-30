'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { Sidebar, MenuItem } from '@/components/Sidebar';
import { FiHome, FiUsers, FiActivity, FiDollarSign, FiUserCheck } from 'react-icons/fi';
import { BsPeople, BsHouseDoor } from 'react-icons/bs';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, loading } = useRoleAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/unit-admin');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/unit-admin');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/unit-admin/dashboard', icon: FiHome },
    { name: 'Bavanakutayimas', href: '/unit-admin/dashboard/bavanakutayimas', icon: BsPeople },
    { name: 'Houses', href: '/unit-admin/dashboard/houses', icon: BsHouseDoor },
    { name: 'Members', href: '/unit-admin/dashboard/members', icon: FiUsers },
    { name: 'Users', href: '/unit-admin/dashboard/users', icon: FiUserCheck },
    { name: 'Transactions', href: '/unit-admin/dashboard/transactions', icon: FiDollarSign },
    { name: 'Campaigns', href: '/unit-admin/dashboard/campaigns', icon: FiActivity },
    { name: 'Spiritual Activities', href: '/unit-admin/dashboard/activities', icon: FiActivity },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        menuItems={menuItems}
        title="Unit Admin"
        subtitle="Unit Management"
        color="from-blue-600 to-cyan-600"
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

export default function UnitAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleAuthProvider role="unit_admin" expectedRole="unit_admin">
      <DashboardContent>{children}</DashboardContent>
    </RoleAuthProvider>
  );
}
