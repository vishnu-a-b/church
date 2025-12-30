# Church Management System - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Recent Changes](#recent-changes)
6. [Pending Tasks](#pending-tasks)
7. [Setup Instructions](#setup-instructions)
8. [API Documentation](#api-documentation)

---

## Project Overview

A comprehensive Church Management System designed to manage church operations including:
- Multiple churches, units, and subdivisions (Bavanakutayimas)
- Family houses and members
- Financial transactions and campaigns
- Spiritual activities tracking
- User management with role-based access control
- SMS notifications

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Custom components with Lucide React icons
- **Notifications**: React Toastify

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access & Refresh Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Security**: bcrypt for password hashing

---

## Architecture

### Data Hierarchy
```
Church
  └─ Units
      └─ Bavanakutayimas (Prayer Groups)
          └─ Houses (Families)
              └─ Members
```

### Authentication Flow
- Role-based authentication with separate contexts per role
- Multi-tab session support (different roles in different tabs)
- JWT access tokens with refresh token mechanism
- Role-specific API endpoints

### User Roles
1. **Super Admin**: Full system access
2. **Church Admin**: Manages single church and all its sub-entities
3. **Unit Admin**: Manages single unit and its sub-entities
4. **Kudumbakutayima Admin**: Manages prayer group
5. **Member**: Basic access

---

## User Roles & Permissions

### Super Admin
- ✅ Manage all churches
- ✅ Manage all units across all churches
- ✅ Manage all users
- ✅ View all transactions
- ✅ Full system access

### Church Admin (Recently Updated)
- ✅ Manage units **within their assigned church only**
- ✅ Manage bavanakutayimas within their church's units
- ✅ Manage houses within their church
- ✅ Manage members within their church
- ✅ Manage users for their church
- ✅ View/create transactions for their church
- ✅ Manage campaigns for their church
- ✅ View spiritual activities
- ❌ Cannot create/edit units for other churches
- ❌ Cannot access other churches' data

### Unit Admin
- ✅ Manage their assigned unit
- ✅ Manage bavanakutayimas within their unit
- ✅ Manage houses within their unit
- ✅ Manage members within their unit
- ❌ Cannot access other units

### Member
- ✅ View own profile
- ✅ Update own information
- ✅ Record spiritual activities

---

## Recent Changes

### Church Admin Restrictions (Completed: 2025-12-08)

#### Frontend Changes:
1. **Units Page** (`client/app/church-admin/dashboard/units/page.tsx`)
   - ✅ Removed church selection dropdown
   - ✅ Auto-populates churchId from logged-in user
   - ✅ Shows church name in table
   - ✅ Fixed bug with church state management

2. **Bavanakutayimas Page** (`client/app/church-admin/dashboard/bavanakutayimas/page.tsx`)
   - ✅ Filters units to show only church admin's church units
   - ✅ Prevents creating bavanakutayimas for other churches

3. **Houses Page** (`client/app/church-admin/dashboard/houses/page.tsx`)
   - ✅ Filters units to show only church admin's church units
   - ✅ Restricts house creation to own church

4. **Sidebar** (`client/app/church-admin/dashboard/layout.tsx`)
   - ✅ Displays church name dynamically
   - ✅ Fetches church data based on user's churchId

#### Backend Changes:
5. **Entity Controller** (`server/src/controllers/entityController.ts`)

   **Units:**
   - ✅ GET: Filters units by church admin's churchId
   - ✅ CREATE: Validates churchId matches user's church
   - ✅ UPDATE: Prevents updating units from other churches
   - ✅ UPDATE: Prevents changing church assignment
   - ✅ DELETE: Restricts deletion to own church's units

   **Bavanakutayimas:**
   - ✅ GET: Filters by units in church admin's church
   - ✅ CREATE: Validates unit belongs to admin's church

   **Houses:**
   - ✅ GET: Filters by bavanakutayimas in church admin's church
   - ✅ CREATE: Validates bavanakutayima belongs to admin's church

---

## Pending Tasks

### High Priority

#### 1. Complete Backend Validation for Church Admin
- [ ] Add update/delete validation for Bavanakutayimas
  - Location: `server/src/controllers/entityController.ts`
  - Functions: `updateBavanakutayima`, `deleteBavanakutayima`
  - Need to verify the bavanakutayima belongs to church admin's church

- [ ] Add update/delete validation for Houses
  - Location: `server/src/controllers/entityController.ts`
  - Functions: `updateHouse`, `deleteHouse`
  - Need to verify the house belongs to church admin's church

- [ ] Add church admin restrictions for Members
  - Location: `server/src/controllers/entityController.ts`
  - Functions: `getAllMembers`, `createMember`, `updateMember`, `deleteMember`
  - Filter/validate members belong to church admin's church

- [ ] Add church admin restrictions for Transactions
  - Location: `server/src/controllers/entityController.ts`
  - Functions: `getAllTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`
  - Filter/validate transactions belong to church admin's church

- [ ] Add church admin restrictions for Campaigns
  - Location: `server/src/controllers/entityController.ts`
  - Functions: `getAllCampaigns`, `createCampaign`, `updateCampaign`, `deleteCampaign`
  - Filter/validate campaigns belong to church admin's church

- [ ] Add church admin restrictions for Users
  - Location: `server/src/controllers/entityController.ts`
  - Functions: `getAllUsers`, `createUser`, `updateUser`, `deleteUser`
  - Filter/validate users belong to church admin's church

#### 2. Frontend - Church Admin Pages
- [ ] Update Members page to remove church selection if present
- [ ] Update Transactions page - filter by church admin's church
- [ ] Update Campaigns page - auto-set churchId for church admin
- [ ] Update Users page - filter to show only users from admin's church
- [ ] Update Activities page - filter by church admin's church

#### 3. Unit Admin Restrictions (Similar to Church Admin)
- [ ] Frontend: Filter data to show only unit admin's unit
- [ ] Backend: Add validation for unit admin operations
- [ ] Update all pages in `/client/app/unit-admin/dashboard/`

#### 4. Data Validation & Error Handling
- [ ] Add comprehensive error messages for permission denials
- [ ] Add loading states for all API calls
- [ ] Add success/error toast notifications consistently
- [ ] Validate form inputs on client-side before submission

### Medium Priority

#### 5. Security Enhancements
- [ ] Add rate limiting to authentication endpoints
- [ ] Implement CORS properly for production
- [ ] Add input sanitization for all user inputs
- [ ] Add SQL/NoSQL injection prevention
- [ ] Add XSS protection
- [ ] Implement CSRF tokens

#### 6. Testing
- [ ] Write unit tests for backend controllers
- [ ] Write integration tests for API endpoints
- [ ] Write frontend component tests
- [ ] Add E2E tests for critical user flows
- [ ] Test role-based access control thoroughly

#### 7. UI/UX Improvements
- [ ] Add confirmation modals for delete operations
- [ ] Improve mobile responsiveness
- [ ] Add skeleton loaders for better UX
- [ ] Add pagination for large data lists
- [ ] Add export functionality (Excel/PDF)
- [ ] Add advanced search and filtering
- [ ] Add sorting capabilities to tables

#### 8. Reports & Analytics
- [ ] Dashboard statistics for each role
- [ ] Financial reports (transactions summary)
- [ ] Member statistics and demographics
- [ ] Campaign performance reports
- [ ] Spiritual activity reports
- [ ] Export reports in PDF/Excel format

### Low Priority

#### 9. Features
- [ ] Email notifications in addition to SMS
- [ ] Multi-language support (i18n)
- [ ] Dark mode support
- [ ] Audit logs for all operations
- [ ] Backup and restore functionality
- [ ] Calendar view for events
- [ ] Member photo uploads
- [ ] Document management system

#### 10. Performance Optimization
- [ ] Implement caching (Redis)
- [ ] Optimize database queries (add indexes)
- [ ] Implement lazy loading for images
- [ ] Code splitting for better performance
- [ ] Optimize bundle size
- [ ] Add service worker for PWA

#### 11. DevOps
- [ ] Set up CI/CD pipeline
- [ ] Docker containerization
- [ ] Production deployment guide
- [ ] Environment-based configuration
- [ ] Logging and monitoring setup
- [ ] Database backup automation

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+
- Git

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure environment variables
# Edit .env and add:
# - MONGODB_URI
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - PORT
# - SMS credentials (if using SMS features)

# Start development server
npm run dev

# Server runs on http://localhost:5000 (or configured PORT)
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Configure environment variables
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev

# Application runs on http://localhost:3000
```

### Database Setup

```bash
# Ensure MongoDB is running
# Create database named 'church_management'

# Optional: Import seed data
# mongoimport --db church_management --collection churches --file seed/churches.json
```

---

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Authentication Endpoints

```
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Entity Endpoints

All endpoints require Bearer token authentication.

**Churches:**
```
GET    /churches
GET    /churches/:id
POST   /churches
PUT    /churches/:id
DELETE /churches/:id
```

**Units:**
```
GET    /units
GET    /units/:id
POST   /units
PUT    /units/:id
DELETE /units/:id
```

**Bavanakutayimas:**
```
GET    /bavanakutayimas
GET    /bavanakutayimas/:id
POST   /bavanakutayimas
PUT    /bavanakutayimas/:id
DELETE /bavanakutayimas/:id
```

**Houses:**
```
GET    /houses
GET    /houses/:id
POST   /houses
PUT    /houses/:id
DELETE /houses/:id
```

**Members:**
```
GET    /members
GET    /members/:id
POST   /members
PUT    /members/:id
DELETE /members/:id
```

**Transactions:**
```
GET    /transactions
GET    /transactions/:id
POST   /transactions
PUT    /transactions/:id
DELETE /transactions/:id
```

**Campaigns:**
```
GET    /campaigns
GET    /campaigns/:id
POST   /campaigns
PUT    /campaigns/:id
DELETE /campaigns/:id
```

**Users:**
```
GET    /users
POST   /users
PUT    /users/:id
DELETE /users/:id
```

**Spiritual Activities:**
```
GET    /spiritual-activities
GET    /spiritual-activities/:id
POST   /spiritual-activities
PUT    /spiritual-activities/:id
DELETE /spiritual-activities/:id
```

### Swagger Documentation
Access interactive API documentation at: `http://localhost:5000/api-docs`

---

## File Structure

```
Church/
├── client/                      # Frontend Next.js application
│   ├── app/                     # Next.js 14 app directory
│   │   ├── church-admin/        # Church admin routes
│   │   ├── unit-admin/          # Unit admin routes
│   │   ├── super-admin/         # Super admin routes
│   │   └── dashboard/           # Member dashboard
│   ├── components/              # Reusable components
│   │   ├── Sidebar.tsx
│   │   ├── DataTable.tsx
│   │   └── ...
│   ├── context/                 # React contexts
│   │   ├── AuthContext.tsx
│   │   └── RoleAuthContext.tsx
│   ├── lib/                     # Utility functions
│   │   ├── roleApi.ts
│   │   └── toastService.ts
│   └── types/                   # TypeScript types
│       └── index.ts
│
├── server/                      # Backend Express application
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── jwt.ts
│   │   │   └── swagger.ts
│   │   ├── controllers/         # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── churchController.ts
│   │   │   └── entityController.ts
│   │   ├── middleware/          # Express middleware
│   │   │   └── auth.middleware.ts
│   │   ├── models/              # Mongoose models
│   │   │   ├── User.ts
│   │   │   ├── Church.ts
│   │   │   ├── Unit.ts
│   │   │   ├── Bavanakutayima.ts
│   │   │   ├── House.ts
│   │   │   ├── Member.ts
│   │   │   ├── Transaction.ts
│   │   │   └── Campaign.ts
│   │   ├── routes/              # API routes
│   │   │   ├── auth.routes.ts
│   │   │   └── entity.routes.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   └── server.ts            # App entry point
│   └── package.json
│
├── docs/                        # Documentation
│   └── AUTHENTICATION.md
│
└── PROJECT_DOCUMENTATION.md     # This file
```

---

## Database Schema

### User
```typescript
{
  username: string
  email: string
  password: string (hashed)
  role: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member'
  churchId?: ObjectId (ref: Church)
  unitId?: ObjectId (ref: Unit)
  bavanakutayimaId?: ObjectId (ref: Bavanakutayima)
  memberId?: ObjectId (ref: Member)
  isActive: boolean
  lastLogin?: Date
  refreshToken?: string
  timestamps: true
}
```

### Church
```typescript
{
  name: string
  uniqueId: string (auto-generated)
  location: string
  diocese?: string
  established?: Date
  contactPerson?: string
  phone?: string
  email?: string
  settings: {
    smsEnabled: boolean
    smsProvider: 'fast2sms' | 'msg91'
    smsApiKey?: string
    smsSenderId: string
    currency: string
  }
  timestamps: true
}
```

### Unit
```typescript
{
  churchId: ObjectId (ref: Church)
  unitNumber: number (auto-generated)
  uniqueId: string (auto-generated)
  name: string
  unitCode?: string
  adminUserId?: ObjectId (ref: User)
  timestamps: true
}
```

### Bavanakutayima
```typescript
{
  unitId: ObjectId (ref: Unit)
  bavanakutayimaNumber: number (auto-generated)
  uniqueId: string (auto-generated)
  name: string
  leaderName?: string
  timestamps: true
}
```

### House
```typescript
{
  bavanakutayimaId: ObjectId (ref: Bavanakutayima)
  houseNumber: number (auto-generated)
  uniqueId: string (auto-generated)
  familyName: string
  headOfFamily?: string
  address?: string
  phone?: string
  houseCode?: string
  timestamps: true
}
```

### Member
```typescript
{
  churchId: ObjectId (ref: Church)
  unitId: ObjectId (ref: Unit)
  bavanakutayimaId: ObjectId (ref: Bavanakutayima)
  houseId: ObjectId (ref: House)
  memberNumber: number (auto-generated)
  uniqueId: string (auto-generated)
  firstName: string
  lastName?: string
  dateOfBirth?: Date
  gender: 'male' | 'female'
  phone?: string
  email?: string
  baptismName?: string
  relationToHead: 'head' | 'spouse' | 'child' | 'parent' | 'other'
  isActive: boolean
  smsPreferences: {
    enabled: boolean
    paymentNotifications: boolean
    receiptNotifications: boolean
  }
  timestamps: true
}
```

---

## Contributing

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes

### Commit Message Format
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(church-admin): add role-based restrictions for units

- Remove church selection dropdown
- Auto-populate churchId from logged-in user
- Add backend validation for church admin operations

Closes #123
```

---

## Support & Contact

For questions or issues:
1. Check existing documentation
2. Review API documentation at `/api-docs`
3. Check issue tracker
4. Contact development team

---

## License

[Specify your license here]

---

## Changelog

### Version 1.1.0 (2025-12-08)
- Added church admin role restrictions
- Removed church selection from church admin forms
- Added backend validation for church admin operations
- Added church name display in sidebar
- Fixed bugs in units page

### Version 1.0.0 (Initial Release)
- Basic CRUD operations for all entities
- Role-based authentication
- Multi-role session support
- SMS notification system
- Transaction management
- Campaign management
- Spiritual activity tracking

---

**Last Updated:** December 8, 2025
**Document Version:** 1.1.0
