# Quick Start Guide - Church Management System

**Last Session:** December 8, 2025
**Status:** Church Admin restrictions partially implemented

---

## 🎯 What Was Just Completed

### Church Admin Role Restrictions - PARTIALLY DONE ✅

#### ✅ Completed:

1. **Frontend Pages (Church Admin)**
   - ✅ Units page - removed church selection, auto-sets churchId
   - ✅ Bavanakutayimas page - filters units by church
   - ✅ Houses page - filters units by church
   - ✅ Sidebar - shows church name dynamically

2. **Backend API (Church Admin)**
   - ✅ Units: GET (filter), CREATE (validate), UPDATE (validate), DELETE (validate)
   - ✅ Bavanakutayimas: GET (filter), CREATE (validate)
   - ✅ Houses: GET (filter), CREATE (validate)

#### ❌ Still Pending:

1. **Backend API (Church Admin) - HIGH PRIORITY**
   - ❌ Bavanakutayimas: UPDATE, DELETE validation
   - ❌ Houses: UPDATE, DELETE validation
   - ❌ Members: All operations (GET filter, CREATE/UPDATE/DELETE validation)
   - ❌ Transactions: All operations
   - ❌ Campaigns: All operations
   - ❌ Users: All operations
   - ❌ Spiritual Activities: Filter

2. **Frontend Pages (Church Admin)**
   - ❌ Members page
   - ❌ Transactions page
   - ❌ Campaigns page
   - ❌ Users page
   - ❌ Activities page

3. **Unit Admin - NOT STARTED**
   - ❌ All backend validation
   - ❌ All frontend pages

---

## 🚀 How to Continue Development

### Step 1: Complete Church Admin Backend (Recommended Next Step)

Open file: `server/src/controllers/entityController.ts`

#### 1.1 Complete Bavanakutayimas

**Find the `updateBavanakutayima` function** (around line 235) and add:

```typescript
export const updateBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // ADD THIS: Find existing bavanakutayima to check permissions
    const existing = await Bavanakutayima.findById(req.params.id).populate('unitId');
    if (!existing) {
      res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
      return;
    }

    // ADD THIS: Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      const unit = await Unit.findById(existing.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only update bavanakutayimas in their own church' });
        return;
      }
      // Prevent changing to different church's unit
      if (req.body.unitId) {
        const newUnit = await Unit.findById(req.body.unitId);
        if (!newUnit || String(newUnit.churchId) !== String(req.user.churchId)) {
          res.status(403).json({ success: false, error: 'Cannot change to a unit from another church' });
          return;
        }
      }
    }

    // KEEP EXISTING CODE BELOW
    const bavanakutayima = await Bavanakutayima.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('unitId', 'name uniqueId');
    if (!bavanakutayima) {
      res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
      return;
    }
    res.json({ success: true, data: bavanakutayima });
  } catch (error) {
    next(error);
  }
};
```

**Find the `deleteBavanakutayima` function** (around line 248) and add:

```typescript
export const deleteBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // ADD THIS: Find bavanakutayima to check permissions
    const bavanakutayima = await Bavanakutayima.findById(req.params.id);
    if (!bavanakutayima) {
      res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
      return;
    }

    // ADD THIS: Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      const unit = await Unit.findById(bavanakutayima.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only delete bavanakutayimas from their own church' });
        return;
      }
    }

    // KEEP EXISTING CODE BELOW
    await Bavanakutayima.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bavanakutayima deleted successfully' });
  } catch (error) {
    next(error);
  }
};
```

#### 1.2 Complete Houses

**Find the `updateHouse` function** (around line 349) and add similar validation

**Find the `deleteHouse` function** (around line 260) and add similar validation

#### 1.3 Complete Members, Transactions, Campaigns, Users

Follow the same pattern as above. See `PENDING_TASKS.md` for detailed checklist.

---

### Step 2: Test Backend Changes

```bash
# Start backend server
cd server
npm run dev

# Test with Postman or curl
# 1. Login as church admin
# 2. Try to create/update/delete units from another church (should fail)
# 3. Try to create/update/delete units from own church (should succeed)
```

---

### Step 3: Update Frontend Pages

#### Example: Members Page

File: `client/app/church-admin/dashboard/members/page.tsx`

Check if there's a church selection dropdown. If yes, remove it similar to how we did for Units page.

---

## 🧪 Testing Checklist

After making changes, test with different user roles:

### Church Admin Tests
- [ ] Login as church admin
- [ ] Create unit for own church ✅
- [ ] Create unit for different church ❌ (should fail)
- [ ] Update unit from own church ✅
- [ ] Update unit from different church ❌ (should fail)
- [ ] Delete unit from own church ✅
- [ ] Delete unit from different church ❌ (should fail)
- [ ] Repeat for bavanakutayimas, houses, members, etc.

### Super Admin Tests
- [ ] Login as super admin
- [ ] Should be able to access ALL churches
- [ ] Should be able to create/update/delete for ANY church

---

## 📁 Important File Locations

### Backend
```
server/src/
├── controllers/
│   └── entityController.ts          ⭐ Main file to edit
├── middleware/
│   └── auth.middleware.ts            (Authentication)
├── models/
│   ├── User.ts                       (User schema - has churchId)
│   ├── Unit.ts                       (Unit schema - has churchId)
│   └── ...
└── routes/
    └── entity.routes.ts              (All API routes)
```

### Frontend - Church Admin
```
client/app/church-admin/dashboard/
├── layout.tsx                        ✅ DONE (shows church name)
├── units/page.tsx                    ✅ DONE (no church selection)
├── bavanakutayimas/page.tsx          ✅ DONE (filtered units)
├── houses/page.tsx                   ✅ DONE (filtered units)
├── members/page.tsx                  ❌ TODO
├── transactions/page.tsx             ❌ TODO
├── campaigns/page.tsx                ❌ TODO
├── users/page.tsx                    ❌ TODO
└── activities/page.tsx               ❌ TODO
```

### Frontend - Unit Admin (Not started)
```
client/app/unit-admin/dashboard/
├── layout.tsx                        ❌ TODO (show unit name)
├── bavanakutayimas/page.tsx          ❌ TODO
├── houses/page.tsx                   ❌ TODO
├── members/page.tsx                  ❌ TODO
├── transactions/page.tsx             ❌ TODO
└── activities/page.tsx               ❌ TODO
```

---

## 🔧 Development Commands

```bash
# Backend
cd server
npm install          # Install dependencies
npm run dev          # Start dev server (port 5000)
npm run build        # Build for production
npm start            # Start production server

# Frontend
cd client
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm start            # Start production server

# Database
mongod               # Start MongoDB
mongo                # Open MongoDB shell
```

---

## 🐛 Common Issues & Solutions

### Issue 1: TypeScript errors about `req.user`
**Solution:** The `req.user` comes from `AuthRequest` type in `server/src/types/index.ts`

### Issue 2: Can't access `churchId` from user
**Solution:** Make sure you're logged in with a church admin account that has `churchId` set

### Issue 3: Frontend shows empty data
**Solution:** Check browser console for API errors. Backend might be filtering data correctly.

### Issue 4: Changes not reflecting
**Solution:**
- Restart backend server after changes
- Clear browser cache / hard refresh (Cmd+Shift+R)

---

## 📚 Code Patterns to Follow

### Backend Validation Pattern

```typescript
// 1. Check if user is church_admin
if (req.user?.role === 'church_admin') {

  // 2. Ensure church_admin has churchId
  if (!req.user.churchId) {
    res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
    return;
  }

  // 3. For CREATE: Validate incoming data
  if (String(req.body.churchId) !== String(req.user.churchId)) {
    res.status(403).json({ success: false, error: 'Church admins can only create for their own church' });
    return;
  }

  // 4. For UPDATE/DELETE: Validate existing resource
  const existing = await Model.findById(req.params.id);
  if (String(existing.churchId) !== String(req.user.churchId)) {
    res.status(403).json({ success: false, error: 'Church admins can only modify their own church resources' });
    return;
  }
}
```

### Frontend Pattern

```typescript
// 1. Get user from context
const { user } = useRoleAuth();

// 2. In form submission, auto-set churchId
const submitData = {
  ...formData,
  churchId: user?.churchId  // Auto-populate
};

// 3. When fetching data, filter in useEffect
const churchUnits = allUnits.filter(unit => unit.churchId === user?.churchId);
```

---

## 🎓 Learning Resources

- **MongoDB Queries:** https://docs.mongodb.com/manual/reference/method/
- **Express Middleware:** https://expressjs.com/en/guide/using-middleware.html
- **Next.js App Router:** https://nextjs.org/docs/app
- **TypeScript:** https://www.typescriptlang.org/docs/

---

## 📞 Questions?

Review these files:
1. `PROJECT_DOCUMENTATION.md` - Full project overview
2. `PENDING_TASKS.md` - Detailed task breakdown
3. `docs/AUTHENTICATION.md` - Authentication flow

---

## ✨ Next Session Checklist

Before starting next session:

- [ ] Pull latest code from repository
- [ ] Review `PENDING_TASKS.md`
- [ ] Check `PROJECT_DOCUMENTATION.md` for any updates
- [ ] Test current functionality
- [ ] Pick next high-priority task

---

**Happy Coding! 🚀**

Remember: Test thoroughly with different user roles after each change!
