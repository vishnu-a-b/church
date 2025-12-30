'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';

export default function KutayimaAdminLogin() {
  const router = useRouter();
  const { loading, login, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        if (result.user?.role === 'kudumbakutayima_admin') {
          window.location.href = '/dashboard';
        } else {
          await logout();
          setError(`Access denied. This login is for Kudumbakutayima Admins only. You are logged in as: ${result.user?.role}`);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-600 to-orange-600">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-600 to-orange-600 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Kudumbakutayima Admin
          </h1>
          <p className="text-gray-600">
            Church Wallet System - Prayer Group Administrator
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kutayima Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              placeholder="kutayima1@church.org"
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
            className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login as Kutayima Admin'}
          </button>

          <div className="text-center text-sm text-gray-600 mt-4 space-y-2">
            <p className="text-xs">Demo Credentials:</p>
            <p className="text-xs">Kutayima 1: kutayima1@church.org / kutayima123</p>
            <p className="text-xs">Kutayima 2: kutayima2@church.org / kutayima123</p>
            <div className="pt-3 border-t border-gray-200 mt-4 space-y-1">
              <div>
                <Link href="/admin-login" className="text-blue-600 hover:text-blue-800 text-xs">
                  Super Admin
                </Link>
                {' | '}
                <Link href="/church-admin-login" className="text-blue-600 hover:text-blue-800 text-xs">
                  Church Admin
                </Link>
              </div>
              <div>
                <Link href="/unit-admin-login" className="text-blue-600 hover:text-blue-800 text-xs">
                  Unit Admin
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
