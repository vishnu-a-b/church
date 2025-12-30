'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { Sidebar, MenuItem } from '@/components/Sidebar';
import { FiHome, FiUsers, FiActivity, FiDollarSign, FiSettings, FiUserCheck } from 'react-icons/fi';
import { BsBuilding, BsPeople } from 'react-icons/bs';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, loading } = useRoleAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/super-admin');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/super-admin');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/super-admin/dashboard', icon: FiHome },
    { name: 'Churches', href: '/super-admin/dashboard/churches', icon: BsBuilding },
    { name: 'Admin Management', href: '/super-admin/dashboard/admins', icon: FiSettings },
    { name: 'Users', href: '/super-admin/dashboard/users', icon: FiUserCheck },
    { name: 'Members', href: '/super-admin/dashboard/members', icon: BsPeople },
    { name: 'Transactions', href: '/super-admin/dashboard/transactions', icon: FiDollarSign },
    { name: 'Campaigns', href: '/super-admin/dashboard/campaigns', icon: FiActivity },
    { name: 'Spiritual Activities', href: '/super-admin/dashboard/activities', icon: FiActivity },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        menuItems={menuItems}
        title="Super Admin"
        subtitle="Church Wallet System"
        color="from-purple-600 to-blue-600"
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

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleAuthProvider role="super_admin" expectedRole="super_admin">
      <DashboardContent>{children}</DashboardContent>
    </RoleAuthProvider>
  );
}
