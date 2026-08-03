'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { Sidebar, MenuItem } from '@/components/Sidebar';
import { FiHome, FiUsers } from 'react-icons/fi';
import { BsHouseDoor } from 'react-icons/bs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, loading } = useRoleAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/kutayima-admin');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/kutayima-admin');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/kutayima-admin/dashboard', icon: FiHome },
    { name: 'Members', href: '/kutayima-admin/dashboard/members', icon: FiUsers },
    { name: 'Houses', href: '/kutayima-admin/dashboard/houses', icon: BsHouseDoor },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Sidebar
        menuItems={menuItems}
        title="Kutayima Admin"
        subtitle="Bavanakutayima Management"
        color="from-orange-600 to-amber-600"
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

export default function KutayimaAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleAuthProvider role="kudumbakutayima_admin" expectedRole="kudumbakutayima_admin">
      <DashboardContent>{children}</DashboardContent>
    </RoleAuthProvider>
  );
}
