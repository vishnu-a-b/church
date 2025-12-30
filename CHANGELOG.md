# Changelog

All notable changes to the Church Wallet System will be documented in this file.

## [Unreleased]

## [1.1.0] - 2024-12-01

### Added
- **Dual Token Authentication System**
  - Access tokens (15 minutes expiry)
  - Refresh tokens (7 days expiry)
  - Automatic token refresh on expiry
  - Token rotation for enhanced security
  - Refresh token invalidation on logout/password change

### Changed
- **MongoDB Configuration**
  - Updated to use MongoDB Atlas cloud database
  - Connection string now uses Atlas credentials
  - Database name changed to `church`

- **Authentication Flow**
  - Login/Register now returns both `accessToken` and `refreshToken`
  - All API requests use short-lived access tokens
  - Automatic token refresh handled by client
  - Logout now invalidates refresh token in database

- **Security Improvements**
  - Separate secrets for access and refresh tokens
  - Refresh tokens stored in database (can be invalidated)
  - Password change invalidates all refresh tokens
  - Token rotation on each refresh

### Updated
- Frontend API client with automatic token refresh
- AuthContext to handle dual token system
- TypeScript types for new auth response
- User model to store refresh tokens
- Authentication controller with refresh endpoint
- API documentation with new endpoints

### Fixed
- TypeScript compilation issues in JWT config
- Token storage in localStorage (now uses `accessToken` and `refreshToken`)

## [1.0.0] - 2024-12-01

### Added
- **Project Foundation**
  - Next.js 14 frontend with TypeScript
  - Express.js backend with TypeScript
  - MongoDB database with Mongoose ODM
  - Complete TypeScript setup for full-stack

- **Database Models (11 Models)**
  - User (Authentication)
  - Church
  - Unit
  - Bavanakutayima
  - House
  - Member
  - Wallet
  - Transaction
  - Campaign
  - SpiritualActivity
  - SMSLog

- **Authentication System**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Role-based access control (RBAC)
  - Auth middleware
  - Protected routes

- **API Endpoints**
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me
  - POST /api/auth/logout
  - POST /api/auth/change-password

- **Documentation**
  - Main README
  - Quick Start Guide
  - Setup Guide
  - Database Schema Documentation
  - API Documentation
  - Project Status Tracking

- **Configuration**
  - Environment variables setup
  - CORS configuration
  - Error handling middleware
  - Validation middleware
  - Static export configuration

### Security
- Password hashing (bcrypt with 10 salt rounds)
- JWT token generation and verification
- Role-based access control
- Input validation on all routes
- TypeScript for type safety

---

## Version History

### Version 1.1.0 (Current)
**Focus**: Enhanced authentication with dual token system and MongoDB Atlas

**Key Features**:
- ✅ Dual token authentication (access + refresh)
- ✅ Automatic token refresh
- ✅ MongoDB Atlas integration
- ✅ Enhanced security with token rotation

### Version 1.0.0
**Focus**: Project foundation and core infrastructure

**Key Features**:
- ✅ Full TypeScript setup
- ✅ 11 database models
- ✅ Basic authentication
- ✅ RBAC system
- ✅ Comprehensive documentation

---

## Upcoming Features

### Version 1.2.0 (Planned)
- Complete API routes for all resources
- Church/Unit/House/Member management endpoints
- Transaction endpoints (all 5 types)
- Wallet management endpoints
- Campaign management

### Version 1.3.0 (Planned)
- Frontend admin dashboard
- Member portal
- Transaction forms
- Wallet displays
- Charts and analytics

### Version 1.4.0 (Planned)
- Fast2SMS integration
- SMS notification system
- SMS templates
- SMS logging and tracking

### Version 1.5.0 (Planned)
- Spiritual activities tracking
- Mass attendance
- Fasting tracking
- Prayer counting
- Self-reporting functionality

### Version 2.0.0 (Planned)
- Reports and analytics
- Excel/PDF export
- Advanced filtering
- Performance optimizations
- Production deployment

---

## Notes

### Breaking Changes in 1.1.0
- Frontend localStorage keys changed:
  - `token` → `accessToken` and `refreshToken`
- API responses now include both tokens
- Old single-token sessions will be invalidated

### Migration Guide
If upgrading from 1.0.0 to 1.1.0:
1. Update `.env` with new token secrets
2. Users will need to re-login
3. Update any custom code using `token` to use `accessToken`

---

**Format**: Based on [Keep a Changelog](https://keepachangelog.com/)
**Versioning**: [Semantic Versioning](https://semver.org/)
