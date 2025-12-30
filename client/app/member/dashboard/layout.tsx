'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, MenuItem } from '@/components/Sidebar';
import { FiHome, FiDollarSign } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MemberDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = () => {
      console.log('🔍 Checking member authentication...');

      const accessToken = localStorage.getItem('member_accessToken');
      const userStr = localStorage.getItem('member_user');

      console.log('Access token exists:', !!accessToken);
      console.log('User data exists:', !!userStr);

      if (!accessToken || !userStr) {
        console.log('❌ No authentication found, redirecting to login...');
        router.push('/member-login');
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        console.log('✅ User authenticated:', userData.username, userData.role);
        setUser(userData);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('member_accessToken');
        localStorage.removeItem('member_refreshToken');
        localStorage.removeItem('member_user');
        router.push('/member-login');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('member_accessToken');
    localStorage.removeItem('member_refreshToken');
    localStorage.removeItem('member_user');
    router.push('/member-login');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/member/dashboard', icon: FiHome },
    { name: 'Stothrakazhcha', href: '/member/dashboard/stothrakazhcha', icon: FiDollarSign },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Sidebar
        menuItems={menuItems}
        title="Member Portal"
        subtitle={`${user.firstName} ${user.lastName}`}
        color="from-teal-600 to-cyan-600"
        userEmail={user.email || user.username}
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
