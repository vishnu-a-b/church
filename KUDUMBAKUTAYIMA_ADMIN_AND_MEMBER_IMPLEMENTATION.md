# Kudumbakutayima Admin & Member Role Implementation Plan

## Overview
This document outlines the complete implementation plan for Kudumbakutayima Admin and Member roles in the Church Management System.

---

## 1. Kudumbakutayima Admin Role

### Access Level
- **Scope:** Bavanakutayima (Kudumbakutayima) level access
- **Permission Type:** Read-only (similar to Unit Admin)
- **Hierarchy:** Below Unit Admin, above Members

### Permissions

#### Can View:
- ✅ Houses in their bavanakutayima
- ✅ Members in their bavanakutayima
- ✅ Transactions from their bavanakutayima
- ✅ Spiritual activities for members in their bavanakutayima
- ✅ Their own bavanakutayima details

#### Cannot Do:
- ❌ Create any records
- ❌ Update any records
- ❌ Delete any records
- ❌ Access other bavanakutayimas' data

### Backend Implementation Needed

#### 1. Entity Controller Updates
Add kudumbakutayima_admin restrictions to:

**getAllHouses:**
```typescript
if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
  filter.bavanakutayimaId = req.user.bavanakutayimaId;
}
```

**getAllMembers:**
```typescript
if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
  filter.bavanakutayimaId = req.user.bavanakutayimaId;
}
```

**getAllTransactions:**
```typescript
if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
  // Get all houses in their bavanakutayima
  const houses = await House.find({ bavanakutayimaId: req.user.bavanakutayimaId });
  const houseIds = houses.map(h => h._id);
  filter.houseId = { $in: houseIds };
}
```

**getAllSpiritualActivities:**
```typescript
if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
  // Get all members in their bavanakutayima
  const members = await Member.find({ bavanakutayimaId: req.user.bavanakutayimaId });
  const memberIds = members.map(m => m._id);
  filter.memberId = { $in: memberIds };
}
```

**All Create/Update/Delete operations:**
```typescript
if (req.user?.role === 'kudumbakutayima_admin') {
  res.status(403).json({ success: false, error: 'Kudumbakutayima admins have read-only access' });
  return;
}
```

### Frontend Dashboard Pages

#### Pages to Create:

1. **Dashboard Home** (`kutayima-admin/dashboard/page.tsx`)
   - Overview statistics
   - Houses count
   - Members count
   - Recent transactions
   - Recent activities

2. **Houses Page** (`kutayima-admin/dashboard/houses/page.tsx`)
   - List all houses in their bavanakutayima
   - View house details
   - View members in each house
   - Read-only (no edit/delete buttons)

3. **Members Page** (`kutayima-admin/dashboard/members/page.tsx`)
   - List all members in their bavanakutayima
   - Filter by house
   - View member details
   - Read-only

4. **Transactions Page** (`kutayima-admin/dashboard/transactions/page.tsx`)
   - List all transactions from their bavanakutayima
   - Filter by house/member
   - View transaction details
   - Read-only

5. **Activities Page** (`kutayima-admin/dashboard/activities/page.tsx`)
   - List spiritual activities for members
   - Filter by member/house
   - View activity details
   - Read-only

---

## 2. Member Role

### Access Level
- **Scope:** Personal data only
- **Permission Type:** View own data + limited updates
- **Hierarchy:** Lowest level

### Permissions

#### Can View:
- ✅ Their own profile information
- ✅ Their own transactions
- ✅ Their own spiritual activities
- ✅ Their house information
- ✅ Their bavanakutayima/unit information

#### Can Update:
- ✅ Their own profile (limited fields):
  - Phone number
  - Email
  - Address (if applicable)
  - Password
  - SMS preferences

#### Can Create:
- ✅ Self-reported spiritual activities
  - Mass attendance
  - Fasting records
  - Prayer activities

#### Cannot Do:
- ❌ View other members' data
- ❌ Create/update/delete transactions
- ❌ Modify system data
- ❌ Access admin functions

### Backend Implementation Needed

#### 1. New Endpoints for Member Self-Service

**GET /api/members/me**
```typescript
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const member = await Member.findById(req.user?.id)
      .populate('churchId', 'name')
      .populate('unitId', 'name')
      .populate('bavanakutayimaId', 'name')
      .populate('houseId', 'familyName');

    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};
```

**PUT /api/members/me**
```typescript
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow updating specific fields
    const allowedFields = ['phone', 'email', 'smsPreferences', 'password'];
    const updates: any = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const member = await Member.findByIdAndUpdate(
      req.user?.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};
```

**GET /api/members/me/transactions**
```typescript
export const getMyTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({
      memberId: req.user?.id
    })
    .populate('campaignId', 'name')
    .sort({ paymentDate: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};
```

**GET /api/members/me/spiritual-activities**
```typescript
export const getMySpiritualActivities = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await SpiritualActivity.find({
      memberId: req.user?.id
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};
```

**POST /api/members/me/spiritual-activities**
```typescript
export const createMySpiritualActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activityData = {
      ...req.body,
      memberId: req.user?.id,
      selfReported: true,
      reportedAt: new Date()
    };

    const activity = await SpiritualActivity.create(activityData);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};
```

### Frontend Dashboard Pages

#### Pages to Create:

1. **Dashboard Home** (`member/dashboard/page.tsx`)
   - Welcome message with member name
   - Quick stats:
     - Total contributions
     - Recent transactions (last 3)
     - Recent spiritual activities (last 3)
     - Upcoming campaigns
   - Quick actions:
     - Report spiritual activity
     - View full transaction history
     - Update profile

2. **Profile Page** (`member/dashboard/profile/page.tsx`)
   - View personal information
   - Edit allowed fields (phone, email, password)
   - View house information
   - View bavanakutayima/unit information
   - SMS preferences toggle

3. **Transactions Page** (`member/dashboard/transactions/page.tsx`)
   - List all their transactions
   - Filter by date range
   - Filter by campaign
   - View transaction details
   - Download receipt (future feature)
   - Summary statistics:
     - Total contributed
     - Number of transactions
     - Average contribution

4. **Spiritual Activities Page** (`member/dashboard/activities/page.tsx`)
   - List all their spiritual activities
   - Filter by activity type
   - Filter by date range
   - Create new spiritual activity:
     - Mass attendance
     - Fasting records
     - Prayer activities
   - Verification status indicators

5. **Campaigns Page** (`member/dashboard/campaigns/page.tsx`)
   - View active campaigns
   - See their participation in each campaign
   - View campaign details
   - See campaign progress

---

## Implementation Priority

### Phase 1: Backend Access Control (HIGH PRIORITY)
1. Add kudumbakutayima_admin read filters to all GET endpoints
2. Add kudumbakutayima_admin write restrictions to all POST/PUT/DELETE
3. Create member self-service endpoints (/api/members/me/*)
4. Add route definitions for new endpoints

### Phase 2: Kudumbakutayima Admin Frontend (MEDIUM PRIORITY)
1. Dashboard home with statistics
2. Houses list page
3. Members list page
4. Transactions list page
5. Activities list page
6. Add read-only indicators/badges

### Phase 3: Member Frontend (HIGH PRIORITY)
1. Dashboard home
2. Profile page with edit functionality
3. Transactions history page
4. Spiritual activities page with create form
5. Campaigns view page

### Phase 4: Testing & Refinement (CRITICAL)
1. Test kudumbakutayima_admin with test data
2. Test member self-service features
3. Verify read-only restrictions
4. Test create spiritual activity feature
5. End-to-end testing for both roles

---

## Database Schema Updates

### User Model
Ensure User model has `bavanakutayimaId` field for kudumbakutayima_admin:
```typescript
bavanakutayimaId: {
  type: Schema.Types.ObjectId,
  ref: 'Bavanakutayima',
  required: function(this: IUser) {
    return this.role === 'kudumbakutayima_admin';
  }
}
```

### Member Model
Ensure Member model can be used for authentication (already has username/password).

---

## Security Considerations

### Kudumbakutayima Admin
- Must verify `bavanakutayimaId` exists in user object
- Must filter all queries by bavanakutayimaId
- Cannot access data from other bavanakutayimas
- Read-only enforcement on all write operations

### Member
- Must verify requests are for their own data (`req.user.id === memberId`)
- Cannot access other members' data
- Limited update fields to prevent privilege escalation
- Self-reported activities flagged for admin verification

---

## Route Definitions

### New Routes to Add

```typescript
// Member self-service routes
router.get('/members/me', protect, getMyProfile);
router.put('/members/me', protect, updateMyProfile);
router.get('/members/me/transactions', protect, getMyTransactions);
router.get('/members/me/spiritual-activities', protect, getMySpiritualActivities);
router.post('/members/me/spiritual-activities', protect, createMySpiritualActivity);
```

---

## Success Criteria

### Kudumbakutayima Admin
- [ ] Can log in successfully
- [ ] Can view houses in their bavanakutayima only
- [ ] Can view members in their bavanakutayima only
- [ ] Can view transactions from their bavanakutayima
- [ ] Cannot create/update/delete any records (403 error)
- [ ] Cannot access other bavanakutayimas' data

### Member
- [ ] Can log in successfully
- [ ] Can view their own profile
- [ ] Can update allowed profile fields
- [ ] Can view their own transactions
- [ ] Can view their own spiritual activities
- [ ] Can create self-reported spiritual activities
- [ ] Cannot access other members' data (403 error)
- [ ] Cannot create transactions

---

## Estimated Implementation Time

**Backend:**
- Kudumbakutayima Admin access control: 2-3 hours
- Member self-service endpoints: 2-3 hours
- Route definitions and testing: 1 hour
**Total Backend: 5-7 hours**

**Frontend:**
- Kudumbakutayima Admin dashboard (5 pages): 4-5 hours
- Member portal (5 pages): 4-5 hours
- Component reuse and styling: 1-2 hours
**Total Frontend: 9-12 hours**

**Testing & Refinement:** 2-3 hours

**Grand Total: 16-22 hours**

---

**Status:** Planning Complete - Ready for Implementation
**Last Updated:** December 8, 2025
