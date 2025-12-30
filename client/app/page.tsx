'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';

function MemberLoginForm() {
  const router = useRouter();
  const { loading, login, isAuthenticated } = useRoleAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => { if (!loading && isAuthenticated) router.push('/member/dashboard'); }, [loading, isAuthenticated, router]);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { 
    e.preventDefault(); 
    setError(''); 
    setIsLogging(true); 
    const result = await login(formData.email, formData.password); 
    if (result.success) router.push('/member/dashboard'); 
    else { setError(result.error || 'Login failed'); setIsLogging(false); }
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-green-600"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-green-600 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Member Login</h1>
          <p className="text-gray-600">Church Wallet System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="george.mathew@email.com" />
          </div>
          <PasswordInput
            id="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={isLogging}
          />
          <button type="submit" disabled={isLogging} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">{isLogging ? 'Logging in...' : 'Login'}</button>
          <p className="text-xs text-gray-500 text-center">george.mathew@email.com / member123</p>
        </form>

        <div className="mt-6 pt-6 border-t text-center space-y-2">
          <p className="text-sm text-gray-600 font-semibold">Admin Logins:</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Link href="/super-admin" className="text-purple-600 hover:underline">Super Admin</Link>
            <span className="text-gray-400">|</span>
            <Link href="/church-admin" className="text-green-600 hover:underline">Church Admin</Link>
            <span className="text-gray-400">|</span>
            <Link href="/unit-admin" className="text-blue-600 hover:underline">Unit Admin</Link>
            <span className="text-gray-400">|</span>
            <Link href="/kutayima-admin" className="text-orange-600 hover:underline">Kutayima Admin</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberLoginPage() {
  return <RoleAuthProvider role="member" expectedRole="member"><MemberLoginForm /></RoleAuthProvider>;
}
