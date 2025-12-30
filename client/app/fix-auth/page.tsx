'use client';

import { useEffect, useState } from 'react';

export default function FixAuthPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');

      setTokenInfo({
        accessToken: accessToken || 'null',
        accessTokenLength: accessToken?.length || 0,
        refreshToken: refreshToken || 'null',
        refreshTokenLength: refreshToken?.length || 0,
        user: user || 'null',
      });
    }
  }, []);

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      setCleared(true);
      setTimeout(() => {
        window.location.href = '/admin-login';
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🔧 Auth Diagnostic & Fix
        </h1>

        {tokenInfo && (
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 p-4 rounded">
              <h2 className="font-bold text-lg mb-2">Current localStorage:</h2>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <strong>accessToken:</strong>
                  <span className={tokenInfo.accessToken === 'undefined' || tokenInfo.accessTokenLength < 20 ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {' '}{tokenInfo.accessToken.substring(0, 50)}...
                  </span>
                </div>
                <div>
                  <strong>accessToken length:</strong>
                  <span className={tokenInfo.accessTokenLength === 9 ? 'text-red-600 font-bold text-xl' : 'text-green-600'}>
                    {' '}{tokenInfo.accessTokenLength}
                    {tokenInfo.accessTokenLength === 9 && ' ⚠️ INVALID! (This is "undefined" string)'}
                  </span>
                </div>
                <div>
                  <strong>refreshToken length:</strong>
                  <span className={tokenInfo.refreshTokenLength < 20 ? 'text-red-600' : 'text-green-600'}>
                    {' '}{tokenInfo.refreshTokenLength}
                  </span>
                </div>
                <div>
                  <strong>user:</strong> {tokenInfo.user.substring(0, 100)}...
                </div>
              </div>
            </div>

            {(tokenInfo.accessToken === 'undefined' || tokenInfo.accessTokenLength < 20) && !cleared && (
              <div className="bg-red-50 border-2 border-red-500 p-6 rounded">
                <h2 className="font-bold text-xl mb-3 text-red-800">
                  🚨 PROBLEM FOUND!
                </h2>
                <p className="mb-4 text-red-700">
                  Your accessToken is invalid: "{tokenInfo.accessToken}" (length: {tokenInfo.accessTokenLength})
                </p>
                <p className="mb-4 text-red-700">
                  This is why you're getting 401 errors. The browser is sending "undefined" as the JWT token.
                </p>
                <button
                  onClick={clearStorage}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 text-lg"
                >
                  🧹 CLEAR INVALID TOKENS & FIX
                </button>
              </div>
            )}

            {tokenInfo.accessTokenLength >= 20 && (
              <div className="bg-green-50 border-2 border-green-500 p-6 rounded">
                <h2 className="font-bold text-xl mb-3 text-green-800">
                  ✅ Token looks valid!
                </h2>
                <p className="text-green-700">
                  Your token length is {tokenInfo.accessTokenLength} characters, which appears to be a valid JWT.
                </p>
                <a
                  href="/dashboard"
                  className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
                >
                  Go to Dashboard
                </a>
              </div>
            )}

            {cleared && (
              <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded">
                <h2 className="font-bold text-xl mb-3 text-blue-800">
                  ✅ Cleared!
                </h2>
                <p className="text-blue-700">
                  Redirecting to login page...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
