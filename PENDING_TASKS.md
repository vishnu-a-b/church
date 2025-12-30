# Pending Tasks - Church Management System

**Last Updated:** December 8, 2025

---

## 🔴 High Priority (Must Complete First)

### 1. Backend Validation - Church Admin Role

#### Bavanakutayimas (`server/src/controllers/entityController.ts`)
- [ ] **updateBavanakutayima** - Add validation
  ```typescript
  // Need to check:
  // 1. Find existing bavanakutayima
  // 2. Get associated unit
  // 3. Verify unit.churchId matches req.user.churchId
  // 4. Prevent changing unitId to different church
  ```

- [ ] **deleteBavanakutayima** - Add validation
  ```typescript
  // Need to check:
  // 1. Find bavanakutayima
  // 2. Get associated unit
  // 3. Verify unit.churchId matches req.user.churchId
  ```

#### Houses (`server/src/controllers/entityController.ts`)
- [ ] **updateHouse** - Add validation
  ```typescript
  // Need to check:
  // 1. Find existing house
  // 2. Get bavanakutayima -> unit
  // 3. Verify unit.churchId matches req.user.churchId
  // 4. Prevent changing bavanakutayimaId to different church
  ```

- [ ] **deleteHouse** - Add validation
  ```typescript
  // Need to check:
  // 1. Find house
  // 2. Get bavanakutayima -> unit
  // 3. Verify unit.churchId matches req.user.churchId
  ```

#### Members (`server/src/controllers/entityController.ts`)
- [ ] **getAllMembers** - Add church admin filter
  ```typescript
  // Filter members by churchId if church_admin
  if (req.user?.role === 'church_admin' && req.user.churchId) {
    filter.churchId = req.user.churchId;
  }
  ```

- [ ] **createMember** - Add validation
  ```typescript
  // Verify churchId in req.body matches req.user.churchId
  ```

- [ ] **updateMember** - Add validation
  ```typescript
  // 1. Find existing member
  // 2. Verify member.churchId matches req.user.churchId
  // 3. Prevent changing churchId
  ```

- [ ] **deleteMember** - Add validation
  ```typescript
  // 1. Find member
  // 2. Verify member.churchId matches req.user.churchId
  ```

#### Transactions (`server/src/controllers/entityController.ts`)
- [ ] **getAllTransactions** - Add church admin filter
  ```typescript
  // Filter transactions by churchId if church_admin
  ```

- [ ] **createTransaction** - Add validation
  ```typescript
  // Verify churchId in req.body matches req.user.churchId
  ```

- [ ] **updateTransaction** - Add validation
  ```typescript
  // Verify transaction.churchId matches req.user.churchId
  ```

- [ ] **deleteTransaction** - Add validation
  ```typescript
  // Verify transaction.churchId matches req.user.churchId
  ```

#### Campaigns (`server/src/controllers/entityController.ts`)
- [ ] **getAllCampaigns** - Add church admin filter
  ```typescript
  // Filter campaigns by churchId if church_admin
  ```

- [ ] **createCampaign** - Add validation
  ```typescript
  // Auto-set churchId from req.user.churchId for church_admin
  ```

- [ ] **updateCampaign** - Add validation
  ```typescript
  // Verify campaign.churchId matches req.user.churchId
  ```

- [ ] **deleteCampaign** - Add validation
  ```typescript
  // Verify campaign.churchId matches req.user.churchId
  ```

#### Users (`server/src/controllers/entityController.ts`)
- [ ] **getAllUsers** - Add church admin filter
  ```typescript
  // Filter users by churchId if church_admin
  ```

- [ ] **createUser** - Add validation
  ```typescript
  // If church_admin, auto-set churchId from req.user.churchId
  // Prevent church_admin from creating super_admin users
  ```

- [ ] **updateUser** - Add validation
  ```typescript
  // Verify user.churchId matches req.user.churchId
  // Prevent church_admin from changing churchId
  ```

- [ ] **deleteUser** - Add validation
  ```typescript
  // Verify user.churchId matches req.user.churchId
  ```

#### Spiritual Activities (`server/src/controllers/entityController.ts`)
- [ ] **getAllSpiritualActivities** - Add church admin filter
  ```typescript
  // Need to filter by member.churchId
  // Complex: activities -> member -> churchId
  ```

---

### 2. Frontend Pages - Church Admin

#### Members Page
- [ ] Check if church selection exists in form
  - File: `client/app/church-admin/dashboard/members/page.tsx`
  - Action: Remove church selection if present

#### Transactions Page
- [ ] Review transaction form
  - File: `client/app/church-admin/dashboard/transactions/page.tsx`
  - Action: Auto-set churchId from user context
  - Action: Remove church selection dropdown if present

#### Campaigns Page
- [ ] Review campaign form
  - File: `client/app/church-admin/dashboard/campaigns/page.tsx`
  - Action: Auto-set churchId from user context
  - Action: Remove church selection dropdown if present

#### Users Page
- [ ] Filter users by church
  - File: `client/app/church-admin/dashboard/users/page.tsx`
  - Action: Already filtered by backend, verify frontend

#### Activities Page
- [ ] Review activities page
  - File: `client/app/church-admin/dashboard/activities/page.tsx`
  - Action: Verify filtering is working

---

### 3. Unit Admin Restrictions (Same Pattern as Church Admin)

#### Backend - Unit Admin Validation
- [ ] Add unitId filtering to `getAllBavanakutayimas`
- [ ] Add unitId validation to `createBavanakutayima`
- [ ] Add unitId validation to `updateBavanakutayima`
- [ ] Add unitId validation to `deleteBavanakutayima`
- [ ] Add unitId filtering to `getAllHouses`
- [ ] Add unitId validation to `createHouse`
- [ ] Add unitId validation to `updateHouse`
- [ ] Add unitId validation to `deleteHouse`
- [ ] Add unitId filtering to `getAllMembers`
- [ ] Add unitId validation for member operations

#### Frontend - Unit Admin Pages
- [ ] **Bavanakutayimas Page**
  - File: `client/app/unit-admin/dashboard/bavanakutayimas/page.tsx`
  - Remove unit selection dropdown
  - Auto-set unitId from user context

- [ ] **Houses Page**
  - File: `client/app/unit-admin/dashboard/houses/page.tsx`
  - Filter bavanakutayimas by unit admin's unit

- [ ] **Members Page**
  - File: `client/app/unit-admin/dashboard/members/page.tsx`
  - Filter by unit admin's unit

- [ ] **Transactions Page**
  - File: `client/app/unit-admin/dashboard/transactions/page.tsx`
  - Auto-set unitId from user context

- [ ] **Activities Page**
  - File: `client/app/unit-admin/dashboard/activities/page.tsx`
  - Filter by unit admin's unit

- [ ] **Update Sidebar**
  - File: `client/app/unit-admin/dashboard/layout.tsx`
  - Show unit name in sidebar

---

## 🟡 Medium Priority

### 4. Security Enhancements

- [ ] **Rate Limiting**
  - Install: `npm install express-rate-limit`
  - Add to auth routes to prevent brute force attacks
  - Limit: 5 login attempts per 15 minutes per IP

- [ ] **CORS Configuration**
  - File: `server/src/server.ts`
  - Configure proper CORS for production
  - Whitelist only allowed origins

- [ ] **Input Sanitization**
  - Install: `npm install express-validator`
  - Add validation middleware to all routes
  - Sanitize user inputs

- [ ] **XSS Protection**
  - Install: `npm install helmet`
  - Add helmet middleware
  - Configure CSP headers

- [ ] **CSRF Protection**
  - Install: `npm install csurf`
  - Implement CSRF tokens for forms

---

### 5. Error Handling & User Experience

- [ ] **Consistent Error Messages**
  - Create error message constants
  - Use consistent format across all endpoints
  - User-friendly error messages

- [ ] **Loading States**
  - Add loading spinners to all forms
  - Add skeleton loaders for data tables
  - Disable buttons during API calls

- [ ] **Toast Notifications**
  - Ensure all API calls show toast on success/error
  - Standardize toast duration and position

- [ ] **Form Validation**
  - Add client-side validation to all forms
  - Show inline error messages
  - Validate before API call

- [ ] **Confirmation Dialogs**
  - Add confirmation modal component
  - Use for all delete operations
  - Show what will be deleted

---

### 6. Testing

- [ ] **Backend Unit Tests**
  - Install: `npm install --save-dev jest @types/jest ts-jest supertest`
  - Test auth controller
  - Test entity controller (all CRUD operations)
  - Test middleware (auth, role validation)

- [ ] **Backend Integration Tests**
  - Test API endpoints with different roles
  - Test permission restrictions
  - Test error scenarios

- [ ] **Frontend Component Tests**
  - Install: `npm install --save-dev @testing-library/react @testing-library/jest-dom`
  - Test Sidebar component
  - Test DataTable component
  - Test form components

- [ ] **E2E Tests**
  - Install: `npm install --save-dev playwright`
  - Test login flow for each role
  - Test CRUD operations
  - Test permission restrictions

---

### 7. UI/UX Improvements

- [ ] **Mobile Responsiveness**
  - Test all pages on mobile devices
  - Fix sidebar on mobile
  - Improve table responsiveness
  - Add mobile-friendly forms

- [ ] **Pagination**
  - Add pagination to Units list
  - Add pagination to Members list
  - Add pagination to Transactions list
  - Server-side pagination for performance

- [ ] **Search & Filter**
  - Add global search
  - Add date range filters for transactions
  - Add status filters
  - Save filter preferences

- [ ] **Sorting**
  - Add sortable columns to tables
  - Save sort preferences
  - Multi-column sorting

- [ ] **Export Functionality**
  - Install: `npm install xlsx`
  - Export members to Excel
  - Export transactions to Excel
  - Export reports to PDF

---

### 8. Reports & Analytics

- [ ] **Dashboard Statistics**
  - Super Admin: Total churches, units, members, transactions
  - Church Admin: Units, members, transaction totals
  - Unit Admin: Members, houses, transactions
  - Add charts/graphs

- [ ] **Financial Reports**
  - Monthly transaction summary
  - Campaign-wise collection report
  - Payment method breakdown
  - Export to PDF/Excel

- [ ] **Member Reports**
  - Age distribution
  - Gender distribution
  - Active vs inactive members
  - Members without login access

- [ ] **Campaign Reports**
  - Campaign performance
  - Collection vs target
  - Participation rate

---

## 🟢 Low Priority

### 9. Additional Features

- [ ] **Email Notifications**
  - Install: `npm install nodemailer`
  - Configure email service
  - Send welcome emails
  - Send password reset emails
  - Send transaction receipts

- [ ] **Multi-language Support (i18n)**
  - Install: `npm install next-i18next`
  - Extract all text strings
  - Create translation files
  - Support English and local language

- [ ] **Dark Mode**
  - Install: `npm install next-themes`
  - Add theme toggle
  - Create dark mode styles
  - Save user preference

- [ ] **Audit Logs**
  - Create AuditLog model
  - Log all create/update/delete operations
  - Show who did what and when
  - Admin can view audit logs

- [ ] **Backup & Restore**
  - MongoDB backup script
  - Automated daily backups
  - Restore functionality
  - Backup to cloud storage

- [ ] **Calendar View**
  - Show campaigns on calendar
  - Show spiritual activities
  - Add events/reminders

- [ ] **Photo Uploads**
  - Member profile photos
  - Church photos
  - Install: `npm install multer`
  - Store on cloud (AWS S3/Cloudinary)

- [ ] **Document Management**
  - Upload/store documents
  - Church certificates
  - Member documents
  - Transaction receipts

---

### 10. Performance Optimization

- [ ] **Caching**
  - Install: `npm install redis`
  - Cache frequently accessed data
  - Cache church/unit lists
  - Set appropriate TTL

- [ ] **Database Optimization**
  - Add indexes to frequently queried fields
  - Review slow queries
  - Optimize aggregation pipelines
  - Add compound indexes

- [ ] **Frontend Optimization**
  - Implement React.lazy for code splitting
  - Optimize images (Next.js Image component)
  - Reduce bundle size
  - Implement virtual scrolling for large lists

- [ ] **API Optimization**
  - Implement field selection (?fields=name,email)
  - Add pagination to all list endpoints
  - Optimize populate queries
  - Use lean() for read-only queries

---

### 11. DevOps & Deployment

- [ ] **Docker Setup**
  - Create Dockerfile for backend
  - Create Dockerfile for frontend
  - Create docker-compose.yml
  - Document Docker setup

- [ ] **CI/CD Pipeline**
  - Set up GitHub Actions
  - Automated testing on PR
  - Automated deployment to staging
  - Production deployment workflow

- [ ] **Environment Configuration**
  - Create .env.example files
  - Document all environment variables
  - Use environment-specific configs
  - Add config validation

- [ ] **Logging & Monitoring**
  - Install: `npm install winston`
  - Set up structured logging
  - Log errors to file
  - Monitor API performance
  - Set up error tracking (Sentry)

- [ ] **Database Backup Automation**
  - Schedule daily MongoDB backups
  - Backup to S3 or similar
  - Test restore procedures
  - Set retention policy

- [ ] **Production Deployment Guide**
  - Server requirements
  - Installation steps
  - SSL certificate setup
  - Environment configuration
  - Monitoring setup

---

## 📋 Quick Start Guide

### What to Work on Next?

1. **Complete Church Admin Backend** (Highest Priority)
   - Start with: Members, Transactions, Campaigns backend validation
   - Time estimate: 2-3 hours

2. **Frontend Church Admin Pages** (High Priority)
   - Review and update: Members, Transactions, Campaigns pages
   - Time estimate: 2-3 hours

3. **Unit Admin Complete Implementation** (High Priority)
   - Backend validation + Frontend pages
   - Time estimate: 4-6 hours

4. **Security Enhancements** (Medium Priority)
   - Start with rate limiting and input validation
   - Time estimate: 2-4 hours

5. **Testing** (Medium Priority)
   - Start with critical path tests
   - Time estimate: Ongoing

---

## 🐛 Known Bugs

- [ ] None currently tracked

---

## 💡 Feature Requests

- [ ] None currently tracked

---

## 📝 Notes

- All backend validation should follow the same pattern as Units (check role, verify ownership, prevent cross-church access)
- All frontend pages should auto-populate churchId/unitId from user context
- Always test with different roles to ensure restrictions work properly
- Add comprehensive error messages for better debugging

---

**Priority Legend:**
- 🔴 High Priority: Must complete for production
- 🟡 Medium Priority: Important for better UX/security
- 🟢 Low Priority: Nice to have features

---

**Status Tracking:**
- ✅ Completed
- 🟢 In Progress
- ⏸️ On Hold
- ❌ Blocked

**Last Review Date:** December 8, 2025
