'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Home,
  Church as ChurchIcon,
  Users,
  Heart,
  Building2,
  UserCircle2,
  Wallet,
  TrendingUp,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  children?: NavItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  useEffect(() => {
    console.log('[Dashboard Layout] Auth check - loading:', loading, 'user:', user?.email);
    // Only redirect if we're sure there's no auth - check localStorage as well
    if (!loading && !user) {
      // Double check localStorage before redirecting
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken');
      console.log('[Dashboard Layout] No user, checking localStorage - hasToken:', !!hasToken);
      if (!hasToken) {
        console.log('[Dashboard Layout] No token, redirecting to /');
        router.push('/');
      } else {
        console.log('[Dashboard Layout] Token exists but user not loaded yet - waiting...');
      }
    }
  }, [user, loading, router]);

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    {
      name: 'Church Management',
      href: '/dashboard/churches',
      icon: ChurchIcon,
      children: [
        { name: 'Churches', href: '/dashboard/churches', icon: ChurchIcon },
        { name: 'Units', href: '/dashboard/units', icon: Building2 },
        { name: 'Bavanakutayimas', href: '/dashboard/bavanakutayimas', icon: Heart },
      ],
    },
    {
      name: 'Members',
      href: '/dashboard/members',
      icon: Users,
      children: [
        { name: 'Houses', href: '/dashboard/houses', icon: Building2 },
        { name: 'Members', href: '/dashboard/members', icon: Users },
      ],
    },
    {
      name: 'Finance',
      href: '/dashboard/transactions',
      icon: TrendingUp,
      children: [
        { name: 'Transactions', href: '/dashboard/transactions', icon: TrendingUp },
        { name: 'Campaigns', href: '/dashboard/campaigns', icon: Wallet },
      ],
    },
    { name: 'Spiritual Activities', href: '/dashboard/activities', icon: Activity },
    { name: 'Users', href: '/dashboard/users', icon: UserCircle2 },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render nothing - let the useEffect handle redirect
  // This prevents flash of blank screen
  if (!user) {
    // Check if we have a token in localStorage - might be loading still
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken');
    if (!hasToken) {
      return null;
    }
    // If we have a token but no user yet, show loading
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <ChurchIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-800">Church Wallet</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedMenus.includes(item.name) ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedMenus.includes(item.name) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                              pathname === child.href
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 text-gray-500"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <h1 className="text-lg lg:text-xl font-semibold text-gray-800">
              {pathname === '/dashboard' ? 'Dashboard' : navigation.find(n => pathname.startsWith(n.href))?.name || 'Management'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
