# Authentication System Documentation

## Overview

The Church Wallet System uses a **dual-token authentication system** with:
- **Access Tokens**: Short-lived (15 minutes) for API requests
- **Refresh Tokens**: Long-lived (7 days) for obtaining new access tokens

This provides enhanced security while maintaining a good user experience.

## How It Works

### 1. Login/Registration Flow

```typescript
// User logs in
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response includes both tokens
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",  // 15 min expiry
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...", // 7 days expiry
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "user@example.com",
    "role": "member"
  }
}
```

### 2. Making API Requests

The client automatically includes the access token in requests:

```typescript
Authorization: Bearer <accessToken>
```

### 3. Automatic Token Refresh

When the access token expires (after 15 minutes):

1. API returns `401 Unauthorized`
2. Client automatically calls `/api/auth/refresh-token` with refresh token
3. Server validates refresh token and issues new tokens
4. Client retries the original request with new access token
5. All queued requests are processed with new token

```typescript
// Automatic refresh (handled by axios interceptor)
POST /api/auth/refresh-token
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "accessToken": "new_access_token...",
  "refreshToken": "new_refresh_token..."
}
```

### 4. Logout

```typescript
POST /api/auth/logout
// Removes refresh token from database
// Client clears all tokens from localStorage
```

## Security Features

### Access Token (15 minutes)
- ✅ Short expiration reduces risk if compromised
- ✅ Used for all API requests
- ✅ Stored in localStorage
- ✅ Automatically refreshed before expiry

### Refresh Token (7 days)
- ✅ Long expiration for better UX
- ✅ Stored in database (can be invalidated)
- ✅ Stored in localStorage
- ✅ Used only to get new access tokens
- ✅ Invalidated on logout
- ✅ Invalidated on password change

### Additional Security
- ✅ Refresh tokens stored in database with user
- ✅ Only one active refresh token per user
- ✅ Refresh token rotation (new token on each refresh)
- ✅ Password changes invalidate all refresh tokens
- ✅ Logout invalidates refresh token

## Configuration

### Server (.env)

```env
# JWT Configuration
JWT_SECRET=your_access_token_secret_here
JWT_ACCESS_TOKEN_EXPIRE=15m
JWT_REFRESH_TOKEN_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
```

**Important**: Use different secrets for access and refresh tokens!

### Token Expiration Times

You can customize expiration times:

| Token Type | Default | Recommended | Min | Max |
|------------|---------|-------------|-----|-----|
| Access | 15m | 15m-1h | 5m | 1h |
| Refresh | 7d | 7d-30d | 1d | 30d |

## Client Implementation

### Storing Tokens

```typescript
// After login/register
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));
```

### Automatic Refresh (Axios Interceptor)

The client automatically handles token refresh:

```typescript
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Automatically refresh token and retry request
      const newAccessToken = await refreshAccessToken();
      // Retry original request with new token
      return api(originalRequest);
    }
  }
);
```

### Manual Logout

```typescript
const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  setUser(null);
};
```

## API Endpoints

### POST /api/auth/register
Register a new user and receive tokens.

**Request**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### POST /api/auth/login
Login and receive tokens.

**Request**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### POST /api/auth/refresh-token
Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "accessToken": "new_access_token...",
  "refreshToken": "new_refresh_token..."
}
```

### GET /api/auth/me
Get current user (requires access token).

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "success": true,
  "user": { ... }
}
```

### POST /api/auth/logout
Logout and invalidate refresh token.

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### POST /api/auth/change-password
Change password (invalidates all refresh tokens).

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Request**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      User Login/Register                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │  Access Token (15m) + Refresh Token (7d) │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │       Make API Requests                 │
        │   (with Access Token in header)         │
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         Access Token Valid          Access Token Expired
                │                           │
                ▼                           ▼
        ┌───────────────┐      ┌─────────────────────────┐
        │  API Success  │      │ Auto Refresh Token      │
        └───────────────┘      │ Get New Access Token    │
                               └─────────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────┐
                              │  Retry Original Request │
                              └─────────────────────────┘
```

## Error Handling

### Invalid/Expired Refresh Token
- Redirect user to login page
- Clear all stored tokens
- Display "Session expired, please login again"

### Invalid Access Token
- Automatically attempt refresh
- If refresh fails, redirect to login

### Account Deactivated
- Return 401 with "Account is deactivated"
- Clear tokens and redirect to login

## Best Practices

1. **Never** expose tokens in URLs or logs
2. **Always** use HTTPS in production
3. **Store** tokens in localStorage (not cookies for static export)
4. **Validate** tokens on every protected route
5. **Rotate** refresh tokens on each use
6. **Invalidate** refresh tokens on logout/password change
7. **Monitor** for unusual refresh patterns (potential security breach)

## Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer your_access_token_here"
```

## Migration from Single Token

If migrating from single token system:

1. Update `.env` with new token secrets and expiry times
2. Clear existing user tokens (they'll need to re-login)
3. Update client code to use `accessToken` and `refreshToken`
4. Test thoroughly before deploying

## Troubleshooting

### "Invalid or expired refresh token"
- Refresh token has expired (>7 days)
- User needs to login again
- Check token expiry settings in .env

### "Token refresh loop"
- Check refresh token is being saved correctly
- Verify REFRESH_TOKEN_SECRET is set correctly
- Check axios interceptor is not causing infinite loop

### "Cannot read property 'id' of undefined"
- Access token is malformed
- Check JWT_SECRET matches between token creation and verification
- Verify token is being sent in Authorization header

## Security Considerations

⚠️ **Important**:
- Use different secrets for access and refresh tokens
- Never commit secrets to version control
- Rotate secrets periodically in production
- Monitor for unusual authentication patterns
- Implement rate limiting on authentication endpoints
- Consider implementing device/IP tracking for refresh tokens
- In production, consider using HTTP-only cookies for refresh tokens

---

**Last Updated**: December 2024
**Version**: 2.0 (Dual Token System)
