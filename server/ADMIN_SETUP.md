# Admin User Creation Guide

This guide explains how to create admin users in the Church Management System.

## Admin Roles

The system supports the following admin roles:

1. **Super Admin** (`super_admin`)
   - Full system access across all churches
   - Can manage all data and settings
   - Not restricted to any specific church

2. **Church Admin** (`church_admin`)
   - Full access to their assigned church
   - Can manage units, bavanakutayimas, houses, members
   - Can create transactions and manage campaigns
   - Cannot access other churches' data

3. **Unit Admin** (`unit_admin`)
   - Read-only access to their assigned unit
   - Can view data but cannot create or modify
   - Restricted to their specific unit

4. **Bavanakutayima Admin** (`kudumbakutayima_admin`)
   - Read-only access to their assigned bavanakutayima
   - Can view data but cannot create or modify
   - Restricted to their specific bavanakutayima

## Creating Admin Users

### Option 1: Create All Admins Automatically

This script creates admin users for all existing churches, units, and bavanakutayimas:

```bash
cd server
npm run create:all-admins
```

**What it does:**
- Creates a super admin (if not exists)
- Creates church admins for all churches
- Creates unit admins for all units
- Creates bavanakutayima admins for all bavanakutayimas
- Skips any admins that already exist
- Displays all created credentials

**Default Credentials Pattern:**

- **Super Admin:**
  - Username: `superadmin`
  - Email: `superadmin@church.com`
  - Password: `SuperAdmin@123`

- **Church Admin:**
  - Username: `admin_<church_unique_id>`
  - Email: `admin@<church_unique_id>.church.com`
  - Password: `ChurchAdmin@123`

- **Unit Admin:**
  - Username: `unit_<unit_unique_id>`
  - Email: `unit@<unit_unique_id>.church.com`
  - Password: `UnitAdmin@123`

- **Bavanakutayima Admin:**
  - Username: `kutayima_<bavana_unique_id>`
  - Email: `kutayima@<bavana_unique_id>.church.com`
  - Password: `KutayimaAdmin@123`

### Option 2: Create Super Admin Only

```bash
cd server
npm run create:superadmin
```

Creates only the super admin user.

## After Creation

1. **Save the credentials** displayed after running the script
2. **Log in** using the provided credentials
3. **Change the password** immediately after first login
4. **Deactivate unused accounts** for security

## Login URLs

- **Super Admin:** `/super-admin`
- **Church Admin:** `/church-admin`
- **Unit Admin:** `/unit-admin`
- **Bavanakutayima Admin:** `/kutayima-admin`
- **Member:** `/member-login`

## Manual User Creation

You can also create users manually through the API:

### Using Super Admin Portal

1. Log in as super admin
2. Navigate to Users section
3. Click "Create User"
4. Fill in the required fields:
   - Username
   - Email
   - Password
   - Role
   - Church (for church/unit/bavanakutayima admins)
   - Unit (for unit/bavanakutayima admins)
   - Bavanakutayima (for bavanakutayima admins)

### Using API Endpoint

```bash
POST /api/users
Authorization: Bearer <super_admin_token>

{
  "username": "admin_church1",
  "email": "admin@church1.com",
  "password": "SecurePassword123",
  "role": "church_admin",
  "churchId": "<church_object_id>",
  "isActive": true
}
```

## Security Best Practices

1. **Change default passwords** immediately
2. **Use strong passwords** (min 8 chars, mix of upper/lower/numbers/symbols)
3. **Enable two-factor authentication** (if implemented)
4. **Regularly review** active admin accounts
5. **Deactivate** accounts when users leave
6. **Use least privilege principle** - assign minimum required role

## Troubleshooting

### Admin already exists

If you see "Admin already exists - skipping", it means that user is already in the database. To reset:

1. Delete the existing user from database
2. Run the script again

Or manually update the password:

```javascript
// In MongoDB shell
db.users.updateOne(
  { username: "superadmin" },
  { $set: { password: "<bcrypt_hashed_password>" } }
)
```

### Cannot find churches/units

Make sure you have seeded the database first:

```bash
npm run seed:complete
```

This creates sample churches, units, and bavanakutayimas.

### Login issues

1. Verify the user exists in database
2. Check the role matches the login portal
3. Ensure the user is active (`isActive: true`)
4. Try resetting the password

## Database Queries

### View all admin users:

```javascript
db.users.find({ role: { $ne: 'member' } })
```

### Count admins by role:

```javascript
db.users.aggregate([
  { $match: { role: { $ne: 'member' } } },
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

### Deactivate a user:

```javascript
db.users.updateOne(
  { username: "username_here" },
  { $set: { isActive: false } }
)
```

## Support

For issues or questions, contact the development team or check the main README.md file.
