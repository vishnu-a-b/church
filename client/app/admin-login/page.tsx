'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';

export default function AdminLogin() {
  const router = useRouter();
  const { loading, login, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Removed auto-redirect useEffect to prevent unwanted redirects
  // The redirect is now handled in handleSubmit after role validation

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Check if user is actually a super_admin
        if (result.user?.role === 'super_admin') {
          // Wait a moment to ensure localStorage is written
          await new Promise(resolve => setTimeout(resolve, 200));
          // Use window.location for a hard redirect to ensure it works
          window.location.href = '/dashboard';
        } else {
          // Wrong role - logout and show error
          await logout();
          setError(`Access denied. This login is for Super Admins only. You are logged in as: ${result.user?.role}`);
          setIsLoading(false);
        }
      } else {
        setError(result.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Super Admin Login
          </h1>
          <p className="text-gray-600">
            Church Wallet System - Administrator Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="admin@church.org"
            />
          </div>

          <PasswordInput
            id="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            disabled={isLoading}
            autoComplete="current-password"
            className="mb-1"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login as Admin'}
          </button>

          <div className="text-center text-sm text-gray-600 mt-4 space-y-2">
            <p className="text-xs">Default Credentials:</p>
            <p className="text-xs">Email: admin@church.org / Password: admin123</p>
            <div className="pt-3 border-t border-gray-200 mt-4 space-y-1">
              <div>
                <Link href="/church-admin-login" className="text-blue-600 hover:text-blue-800 text-xs">
                  Church Admin
                </Link>
                {' | '}
                <Link href="/unit-admin-login" className="text-blue-600 hover:text-blue-800 text-xs">
                  Unit Admin
                </Link>
              </div>
              <div>
                <Link href="/kutayima-admin-login" className="text-blue-600 hover:text-blue-800 text-xs">
                  Kutayima Admin
                </Link>
                {' | '}
                <Link href="/" className="text-blue-600 hover:text-blue-800 text-xs">
                  Member Login
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
