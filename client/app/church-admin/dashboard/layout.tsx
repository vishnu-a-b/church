'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { Sidebar, MenuItem } from '@/components/Sidebar';
import { FiHome, FiUsers, FiActivity, FiDollarSign, FiUserCheck, FiAlertCircle, FiMenu, FiSearch } from 'react-icons/fi';
import { BsPeople, BsHouseDoor, BsNewspaper, BsCalendarEvent } from 'react-icons/bs';
import { MdOutlineAccountTree, MdPayment } from 'react-icons/md';
import { ToastContainer } from 'react-toastify';
import { createRoleApi } from '@/lib/roleApi';
import 'react-toastify/dist/ReactToastify.css';

interface SearchResult {
  _id: string;
  name: string;
  email?: string;
  hierarchicalNumber?: string;
  uniqueId?: string;
  receiptNumber?: string;
  amount?: number;
  date?: string;
  type: 'member' | 'house' | 'transaction';
}

interface SearchResults {
  members: SearchResult[];
  houses: SearchResult[];
  transactions: SearchResult[];
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, loading } = useRoleAuth();
  const [churchName, setChurchName] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
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
          setChurchName('My Church');
        }
      } else {
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response.data.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');

    if (result.type === 'member') {
      router.push(`/church-admin/dashboard/members`);
    } else if (result.type === 'house') {
      router.push(`/church-admin/dashboard/houses`);
    } else if (result.type === 'transaction') {
      router.push(`/church-admin/dashboard/transactions`);
    }
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return searchResults.members.length + searchResults.houses.length + searchResults.transactions.length;
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/church-admin/dashboard', icon: FiHome },
    { name: 'Units', href: '/church-admin/dashboard/units', icon: MdOutlineAccountTree },
    { name: 'Bavanakutayimas', href: '/church-admin/dashboard/bavanakutayimas', icon: BsPeople },
    { name: 'Houses', href: '/church-admin/dashboard/houses', icon: BsHouseDoor },
    { name: 'Members', href: '/church-admin/dashboard/members', icon: FiUsers },
    { name: 'Users', href: '/church-admin/dashboard/users', icon: FiUserCheck },
    { name: 'Transactions', href: '/church-admin/dashboard/transactions', icon: FiDollarSign },
    { name: 'Dues', href: '/church-admin/dashboard/dues', icon: FiAlertCircle },
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

      {/* Top Navbar */}
      <nav className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300"
           style={{ left: sidebarCollapsed ? '5rem' : '16rem' }}>
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side - Sidebar toggle and Search bar */}
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <FiMenu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 relative flex gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search members, houses, transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searching || searchQuery.trim().length < 2}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <FiSearch className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>

            {/* Search Results Dropdown */}
            {showResults && searchResults && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                {getTotalResults() === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <>
                    {/* Members */}
                    {searchResults?.members && searchResults.members.length > 0 && (
                      <div className="border-b border-gray-100">
                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                          Members ({searchResults.members.length})
                        </div>
                        {searchResults.members.map((result) => (
                          <div
                            key={result._id}
                            onClick={() => handleResultClick(result)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{result.name}</p>
                                {result.email && (
                                  <p className="text-xs text-gray-500">{result.email}</p>
                                )}
                              </div>
                              {result.hierarchicalNumber && (
                                <span className="text-xs font-semibold text-blue-600">
                                  {result.hierarchicalNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Houses */}
                    {searchResults?.houses && searchResults.houses.length > 0 && (
                      <div className="border-b border-gray-100">
                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                          Houses ({searchResults.houses.length})
                        </div>
                        {searchResults.houses.map((result) => (
                          <div
                            key={result._id}
                            onClick={() => handleResultClick(result)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{result.name}</p>
                              {result.hierarchicalNumber && (
                                <span className="text-xs font-semibold text-blue-600">
                                  {result.hierarchicalNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transactions */}
                    {searchResults?.transactions && searchResults.transactions.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                          Transactions ({searchResults.transactions.length})
                        </div>
                        {searchResults.transactions.map((result) => (
                          <div
                            key={result._id}
                            onClick={() => handleResultClick(result)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{result.receiptNumber}</p>
                              <span className="text-sm font-semibold text-green-600">
                                ₹{result.amount?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            </form>
          </div>

          {/* Right side - User info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-700">{user.email}</p>
              <p className="text-xs text-gray-500">{churchName}</p>
            </div>
          </div>
        </div>
      </nav>

      <Sidebar
        menuItems={menuItems}
        title="Church Admin"
        subtitle={churchName || 'Church Management'}
        color="from-green-600 to-teal-600"
        userEmail={user.email}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
      />

      {/* Main content - offset for sidebar and top navbar */}
      <main className="min-h-screen transition-all duration-300"
            style={{
              marginLeft: sidebarCollapsed ? '5rem' : '16rem',
              marginTop: '4rem'
            }}>
        <div className="p-4 lg:p-8">
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

