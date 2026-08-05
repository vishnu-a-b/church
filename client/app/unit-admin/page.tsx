'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleAuthProvider, useRoleAuth } from '@/context/RoleAuthContext';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors, emailLoginSchema } from '@/lib/validation';

function UnitAdminLoginForm() {
  const router = useRouter();
  const { loading, login, isAuthenticated } = useRoleAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => { if (!loading && isAuthenticated) router.push('/unit-admin/dashboard'); }, [loading, isAuthenticated, router]);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const result = validateForm(emailLoginSchema, formData);
    if (!result.success) { setFieldErrors(result.errors); return; }
    setFieldErrors({});
    setIsLogging(true);
    const loginResult = await login(result.data.email, result.data.password);
    if (loginResult.success) router.push('/unit-admin/dashboard'); else { setError(loginResult.error || 'Login failed'); setIsLogging(false); }
  };
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;

  return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 px-4"><div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md"><h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Unit Admin</h1><form onSubmit={handleSubmit} className="space-y-4">{error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}<div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${fieldErrors.email ? 'border-red-400' : ''}`} placeholder="unit1@church.org" /><FieldError message={fieldErrors.email} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${fieldErrors.password ? 'border-red-400' : ''}`} /><FieldError message={fieldErrors.password} /></div><button type="submit" disabled={isLogging} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{isLogging ? 'Logging in...' : 'Login'}</button><p className="text-xs text-gray-500 text-center">unit1@church.org / unit123</p></form></div></div>);
}
export default function UnitAdminLoginPage() { return <RoleAuthProvider role="unit_admin" expectedRole="unit_admin"><UnitAdminLoginForm /></RoleAuthProvider>; }
