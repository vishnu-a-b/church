# API Usage Guide with Automatic Token Refresh

This guide explains how to use the Axios API client with automatic access token refresh.

## Overview

The API client (`/lib/api.ts`) automatically handles:
- Adding access tokens to requests
- Refreshing expired tokens
- Queuing concurrent requests during token refresh
- Redirecting to login when refresh fails
- Validating token format

## Quick Start

### 1. Import the API Client

```typescript
import api from '@/lib/api';
import { setAuthData, clearAuthData, isAuthenticated } from '@/lib/tokenManager';
```

### 2. Login and Store Tokens

```typescript
// Login function
const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/auth/login', {
      username,
      password,
    });

    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user data
    setAuthData(
      { accessToken, refreshToken },
      user
    );

    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### 3. Make Authenticated API Calls

```typescript
// The api client automatically adds the access token!
const fetchMembers = async () => {
  try {
    const response = await api.get('/members');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw error;
  }
};

const createMember = async (memberData: any) => {
  try {
    const response = await api.post('/members', memberData);
    return response.data;
  } catch (error) {
    console.error('Failed to create member:', error);
    throw error;
  }
};

const updateMember = async (id: string, memberData: any) => {
  try {
    const response = await api.put(`/members/${id}`, memberData);
    return response.data;
  } catch (error) {
    console.error('Failed to update member:', error);
    throw error;
  }
};
```

### 4. Logout

```typescript
import { logout } from '@/lib/tokenManager';

const handleLogout = () => {
  logout(); // Clears tokens and redirects to /login
};
```

## How Token Refresh Works

### Automatic Refresh Flow

1. You make an API call: `api.get('/members')`
2. Access token is automatically added to request headers
3. If the token is expired, server responds with **401 Unauthorized**
4. Interceptor catches the 401 error
5. Interceptor uses refresh token to get new access token
6. Original request is retried with new token
7. All concurrent requests are queued and retried after refresh

### Request Queue Example

```typescript
// Multiple concurrent requests
Promise.all([
  api.get('/members'),      // Request 1
  api.get('/houses'),       // Request 2
  api.get('/transactions'), // Request 3
]);

// What happens:
// 1. All 3 requests start simultaneously
// 2. All get 401 (token expired)
// 3. First request triggers token refresh
// 4. Other 2 requests are queued
// 5. Token refreshes successfully
// 6. All 3 requests retry with new token
// 7. All 3 succeed!
```

## Token Manager Utilities

### Check Authentication Status

```typescript
import { isAuthenticated, getUserData, getUserRole } from '@/lib/tokenManager';

// Check if user is logged in
if (isAuthenticated()) {
  console.log('User is authenticated');
}

// Get current user
const user = getUserData();
console.log('Current user:', user);

// Get user role
const role = getUserRole();
console.log('User role:', role);
```

### Role-Based Access Control

```typescript
import { hasRole, hasAnyRole, isAdmin } from '@/lib/tokenManager';

// Check specific role
if (hasRole('super_admin')) {
  console.log('User is super admin');
}

// Check multiple roles
if (hasAnyRole(['church_admin', 'super_admin'])) {
  console.log('User is an admin');
}

// Quick admin check
if (isAdmin()) {
  console.log('User has admin privileges');
}
```

### Token Validation

```typescript
import {
  isValidTokenFormat,
  isTokenExpired,
  getTokenExpiration,
  getTimeUntilExpiry
} from '@/lib/tokenManager';

const accessToken = getAccessToken();

// Check token format
if (isValidTokenFormat(accessToken)) {
  console.log('Token format is valid');
}

// Check if expired
if (isTokenExpired(accessToken)) {
  console.log('Token is expired');
}

// Get expiration time
const expiryDate = getTokenExpiration(accessToken);
console.log('Token expires at:', expiryDate);

// Get time until expiry (in milliseconds)
const timeLeft = getTimeUntilExpiry(accessToken);
console.log('Token expires in:', timeLeft / 1000 / 60, 'minutes');
```

## React Component Examples

### Login Component

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAuthData } from '@/lib/tokenManager';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Store tokens
      setAuthData(
        { accessToken, refreshToken },
        user
      );

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <button type="submit">Login</button>
    </form>
  );
}
```

### Protected Component with Data Fetching

```typescript
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUserRole, logout } from '@/lib/tokenManager';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/members');
      setMembers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); // Automatically clears tokens and redirects
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Members ({getUserRole()})</h1>
      <button onClick={handleLogout}>Logout</button>

      <ul>
        {members.map((member: any) => (
          <li key={member._id}>
            {member.firstName} {member.lastName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Auth Guard Hook

```typescript
// /hooks/useAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUserData } from '@/lib/tokenManager';

export function useAuth(requiredRole?: string) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (requiredRole) {
      const user = getUserData();
      if (user?.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [router, requiredRole]);

  return getUserData();
}

// Usage in component:
export default function AdminPage() {
  const user = useAuth('super_admin'); // Only super_admin can access

  return <div>Welcome, {user?.firstName}!</div>;
}
```

## Error Handling

### Handling API Errors

```typescript
const createMember = async (data: any) => {
  try {
    const response = await api.post('/members', data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 400:
          console.error('Validation error:', error.response.data);
          break;
        case 401:
          // Token refresh failed, user will be redirected automatically
          console.error('Authentication failed');
          break;
        case 403:
          console.error('Permission denied');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('Unknown error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    throw error;
  }
};
```

## Best Practices

1. **Always use the `api` instance** - Don't create new axios instances
2. **Don't manually handle 401 errors** - The interceptor does this automatically
3. **Use token manager utilities** - Don't access localStorage directly
4. **Check authentication in protected routes** - Use the `useAuth` hook
5. **Handle errors gracefully** - Show user-friendly error messages
6. **Test token refresh** - Verify it works with expired tokens

## Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Customize Redirect URL

Edit `/lib/api.ts`:

```typescript
const clearAuthAndRedirect = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Change this to your login route
    window.location.href = '/login'; // or '/auth/signin', etc.
  }
};
```

## Troubleshooting

### Token Refresh Loop

If you see continuous refresh attempts:
- Check that the refresh token endpoint is working
- Verify token expiration times are correct
- Ensure refresh tokens are being returned correctly

### Redirect Not Working

If automatic redirect to login doesn't work:
- Check that `window.location.href` is supported in your environment
- Verify the login route exists
- Check browser console for errors

### Concurrent Request Issues

If requests fail during token refresh:
- The queue system should handle this automatically
- Check console for "[API] Token refreshed successfully" message
- Verify all requests are using the same `api` instance

## Summary

The automatic token refresh system provides:
- ✅ Seamless user experience (no sudden logouts)
- ✅ Secure token management
- ✅ Automatic retry of failed requests
- ✅ Concurrent request handling
- ✅ Comprehensive token utilities
- ✅ Type-safe API calls

Just import `api` and make your calls - everything else is handled automatically!
