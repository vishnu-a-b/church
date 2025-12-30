'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';

function KutayimaAdminLoginForm() {
  const router = useRouter();
  const { loading, login, isAuthenticated } = useRoleAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => { if (!loading && isAuthenticated) router.push('/kutayima-admin/dashboard'); }, [loading, isAuthenticated, router]);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setError(''); setIsLogging(true); const result = await login(formData.email, formData.password); if (result.success) router.push('/kutayima-admin/dashboard'); else { setError(result.error || 'Login failed'); setIsLogging(false); }};
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 to-red-600"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;

  return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 to-red-600 px-4"><div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md"><h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Kutayima Admin</h1><form onSubmit={handleSubmit} className="space-y-4">{error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}<div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="kutayima1@church.org" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" /></div><button type="submit" disabled={isLogging} className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50">{isLogging ? 'Logging in...' : 'Login'}</button><p className="text-xs text-gray-500 text-center">kutayima1@church.org / kutayima123</p></form></div></div>);
}
export default function KutayimaAdminLoginPage() { return <RoleAuthProvider role="kudumbakutayima_admin" expectedRole="kudumbakutayima_admin"><KutayimaAdminLoginForm /></RoleAuthProvider>; }
