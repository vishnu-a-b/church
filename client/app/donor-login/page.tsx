'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import PasswordInput from '@/components/PasswordInput';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors, usernameLoginSchema } from '@/lib/validation';

export default function DonorLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [donorInfo, setDonorInfo] = useState<any>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const validation = validateForm(usernameLoginSchema, formData);
    if (!validation.success) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await axios.post(`${apiUrl}/auth/donor-login`, {
        username: validation.data.username,
        password: validation.data.password,
      });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data;

        localStorage.setItem('donor_accessToken', accessToken);
        localStorage.setItem('donor_refreshToken', refreshToken);
        localStorage.setItem('donor_user', JSON.stringify(user));

        setDonorInfo(user);
        setLoginSuccess(true);
        setIsLoading(false);

        setTimeout(() => {
          router.push('/donor/dashboard');
        }, 1500);
      } else {
        setError(response.data.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-600 to-orange-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {loginSuccess && donorInfo ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Login Successful!</h2>
              <p className="text-gray-600 mb-6">Welcome, {donorInfo.name}</p>
            </div>

            {donorInfo.churchId && typeof donorInfo.churchId === 'object' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 text-left">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Church</p>
                    <p className="font-semibold text-gray-800">{donorInfo.churchId.name}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 animate-pulse">Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Supporter Login</h1>
              <p className="text-gray-600">Track your monthly contribution here</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username, Email, or Phone
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${
                    fieldErrors.username ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Enter your username, email, or phone"
                  disabled={isLoading}
                />
                <FieldError message={fieldErrors.username} />
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
                className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
                  Back to Home
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
