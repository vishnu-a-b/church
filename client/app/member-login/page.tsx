'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { MapPin, Users, Home } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';

export default function MemberLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [memberInfo, setMemberInfo] = useState<any>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      console.log('🔐 Attempting member login...');
      console.log('API URL:', apiUrl);
      console.log('Username:', formData.username);

      const response = await axios.post(`${apiUrl}/auth/member-login`, {
        username: formData.username,
        password: formData.password,
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data;

        console.log('User role:', user.role);
        console.log('Access token received:', !!accessToken);
        console.log('Refresh token received:', !!refreshToken);

        // Store authentication data in localStorage
        localStorage.setItem('member_accessToken', accessToken);
        localStorage.setItem('member_refreshToken', refreshToken);
        localStorage.setItem('member_user', JSON.stringify(user));

        console.log('✅ Stored in localStorage');

        // Show success message with hierarchy info
        setMemberInfo(user);
        setLoginSuccess(true);
        setIsLoading(false);

        // Redirect after showing the info
        setTimeout(() => {
          router.push('/member/dashboard');
        }, 2000);
      } else {
        setError(response.data.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-blue-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {loginSuccess && memberInfo ? (
          // Success Message with Hierarchy Info
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Login Successful!</h2>
              <p className="text-gray-600 mb-6">
                Welcome, {memberInfo.firstName} {memberInfo.lastName}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {memberInfo.churchId && typeof memberInfo.churchId === 'object' && (
                <div className="flex items-center gap-3 text-left">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Church</p>
                    <p className="font-semibold text-gray-800">{memberInfo.churchId.name}</p>
                  </div>
                </div>
              )}

              {memberInfo.unitId && typeof memberInfo.unitId === 'object' && (
                <div className="flex items-center gap-3 text-left">
                  <Users className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Unit</p>
                    <p className="font-semibold text-gray-800">{memberInfo.unitId.name}</p>
                  </div>
                </div>
              )}

              {memberInfo.bavanakutayimaId && typeof memberInfo.bavanakutayimaId === 'object' && (
                <div className="flex items-center gap-3 text-left">
                  <Home className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Bavanakutayima</p>
                    <p className="font-semibold text-gray-800">{memberInfo.bavanakutayimaId.name}</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 animate-pulse">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          // Login Form
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Member Login</h1>
              <p className="text-gray-600">Welcome back! Please login to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <PasswordInput
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            disabled={isLoading}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Not a member?{' '}
                <Link href="/" className="text-teal-600 hover:text-teal-700 font-medium">
                  Back to Home
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500 mb-2">Looking for a different portal?</p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link
                  href="/church-admin-login"
                  className="text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Church Admin
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/unit-admin-login"
                  className="text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Unit Admin
                </Link>
                <span className="text-gray-300">•</span>
                <Link
                  href="/kutayima-admin-login"
                  className="text-xs text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Kutayima Admin
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
