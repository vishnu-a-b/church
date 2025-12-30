'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { LogOut, Home } from 'lucide-react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, loading } = useRoleAuth();
  useEffect(() => { if (!loading && !user) router.push('/kutayima-admin'); }, [user, loading, router]);
  const handleLogout = async () => { await logout(); router.push('/kutayima-admin'); };
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  if (!user) return null;
  return (<div className="min-h-screen bg-gray-50"><div className="bg-white border-b"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center"><div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3"><Home className="w-5 h-5 text-white" /></div><div><h1 className="text-xl font-bold">Kutayima Admin Dashboard</h1><p className="text-xs text-gray-500">{user.email}</p></div></div><button onClick={handleLogout} className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"><LogOut className="w-4 h-4 mr-2" />Logout</button></div></div><main className="max-w-7xl mx-auto p-8">{children}</main></div>);
}
export default function Layout({ children }: { children: React.ReactNode }) { return <RoleAuthProvider role="kudumbakutayima_admin" expectedRole="kudumbakutayima_admin"><DashboardContent>{children}</DashboardContent></RoleAuthProvider>; }
