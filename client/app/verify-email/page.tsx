'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import axios from 'axios';

// useSearchParams() opts a page out of static generation unless the component
// using it is wrapped in Suspense — required for `next build` with static export.
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [memberData, setMemberData] = useState<any>(null);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/verify-email?token=${token}`
      );

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
        setMemberData(response.data.member);
        setEmailNotificationsEnabled(response.data.member.emailNotificationsEnabled);
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.error || 'Failed to verify email. Please try again.'
      );
    }
  };

  const updateEmailPreferences = async (enabled: boolean) => {
    setUpdatingPreferences(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verify-email/preferences?token=${token}`,
        { emailNotificationsEnabled: enabled }
      );

      if (response.data.success) {
        setEmailNotificationsEnabled(enabled);
        setMessage(
          enabled
            ? 'Email notifications enabled successfully!'
            : 'Email notifications disabled successfully!'
        );
      }
    } catch (error: any) {
      alert(
        error.response?.data?.error ||
          'Failed to update preferences. Please try again.'
      );
    } finally {
      setUpdatingPreferences(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-center">
            <Mail className="w-16 h-16 text-white mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">Email Verification</h1>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Verifying your email...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <a
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Home
                </a>
              </div>
            )}

            {status === 'success' && (
              <div className="py-4">
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Email Verified Successfully!
                  </h2>
                  <p className="text-gray-600">{message}</p>
                </div>

                {memberData && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Member Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-800">
                          {memberData.firstName} {memberData.lastName || ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-800">
                          {memberData.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {memberData.isEmailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Notification Preferences */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Email Notification Preferences
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose whether you want to receive email notifications for
                    transactions (campaigns, Stothrakazhcha, etc.).
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => updateEmailPreferences(true)}
                      disabled={
                        updatingPreferences || emailNotificationsEnabled
                      }
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        emailNotificationsEnabled
                          ? 'bg-green-100 text-green-800 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {updatingPreferences && !emailNotificationsEnabled ? (
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      ) : emailNotificationsEnabled ? (
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                      ) : null}
                      {emailNotificationsEnabled
                        ? 'Email Notifications Enabled'
                        : 'Enable Email Notifications'}
                    </button>

                    <button
                      onClick={() => updateEmailPreferences(false)}
                      disabled={
                        updatingPreferences || !emailNotificationsEnabled
                      }
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        !emailNotificationsEnabled
                          ? 'bg-gray-100 text-gray-800 cursor-default'
                          : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                      }`}
                    >
                      {updatingPreferences && emailNotificationsEnabled ? (
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      ) : !emailNotificationsEnabled ? (
                        <XCircle className="w-5 h-5 inline mr-2" />
                      ) : null}
                      {!emailNotificationsEnabled
                        ? 'Email Notifications Disabled'
                        : 'Disable Email Notifications'}
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> You can change these preferences
                      anytime by visiting this link again or through your member
                      portal settings.
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <a
                    href="/member/login"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Member Login
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-500">
            Church Wallet System - Email Verification
          </div>
        </div>
      </div>
    </div>
  );
}
