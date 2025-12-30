# Database Management Scripts

This document explains how to clear and reset your database with test data.

## Prerequisites

Make sure you have:
1. MongoDB running
2. `.env` file configured with `MONGODB_URI`
3. Dependencies installed (`npm install`)

## Available Commands

### 1. Clear Database (Delete All Data)

```bash
npm run db:clear
```

**What it does:**
- Connects to your database
- Asks for confirmation (type "yes" to proceed)
- Deletes ALL data from all collections
- Shows summary of deleted documents

**Example Output:**
```
⚠️  WARNING: This will DELETE ALL DATA from the database!
📍 Database: mongodb://localhost:27017/church-wallet

Are you sure you want to continue? (yes/no): yes

🗑️  Clearing all collections...

📊 Deletion Summary:
══════════════════════════════════════════════════
   Churches                  : 1 deleted
   Units                     : 3 deleted
   Bavanakutayimas          : 5 deleted
   Houses                    : 10 deleted
   Members                   : 25 deleted
   Stothrakazhcha Dues      : 15 deleted
   ...
══════════════════════════════════════════════════

✅ Total documents deleted: 89
🎉 Database cleared successfully!
```

### 2. Reset Database with Test Data

```bash
npm run db:reset
```

**What it does:**
- Clears all existing data
- Seeds comprehensive test data including:
  - 1 Church
  - 2 Units
  - 3 Bavanakutayimas
  - 4 Houses
  - 7 Members (6 regular + 1 admin)
  - 1 Active Stothrakazhcha
  - 2 Stothrakazhcha Dues
  - 2 News items
  - 2 Events
- Creates admin and test users with credentials

**Example Output:**
```
🌱 Starting database seed...

🗑️  Clearing existing data...
✅ Data cleared

🏛️  Creating Church...
   ✓ Created: St. Mary's Cathedral

👥 Creating Units...
   ✓ Created 2 units

🙏 Creating Bavanakutayimas...
   ✓ Created 3 bavanakutayimas

... (more output)

═══════════════════════════════════════════════════════════
🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!
═══════════════════════════════════════════════════════════

📊 Summary:
   Churches           : 1
   Units              : 2
   Bavanakutayimas    : 3
   Houses             : 4
   Members            : 7 (including admin)
   Stothrakazhcha     : 1
   Stothrakazhcha Dues: 2
   News               : 2
   Events             : 2

🔐 Admin Credentials:
   Username: admin
   Password: admin123

👥 Test User Credentials:
   Username: thomas    | Password: password123 | Role: member
   Username: john      | Password: password123 | Role: member
   Username: paul      | Password: password123 | Role: church_admin
```

### 3. Seed Complete Data (Same as Reset)

```bash
npm run seed:complete
```

Alias for `db:reset` - clears and seeds the database.

### 4. Other Seed Options

**Original Seed Script:**
```bash
npm run seed
```

**New Seed Script:**
```bash
npm run seed:new
```

**Christmas Special Seed:**
```bash
npm run seed:christmas
```

## Test Users

After running `db:reset`, you can login with these credentials:

### Super Admin
- **Login Page:** `/admin-login`
- **Username:** `admin` *(use username, not email)*
- **Password:** `admin123`
- **Role:** `super_admin`
- Full access to all features

### Church Admin
- **Login Page:** `/church-admin-login`
- **Email:** `paul@example.com` *(use email, not username)*
- **Password:** `password123`
- **Role:** `church_admin`
- Can manage church members and data

### Regular Members
- **Login Page:** `/member-login`
- **Member 1:** Username: `thomas` | Email: `thomas@example.com` | Password: `password123`
- **Member 2:** Username: `john` | Email: `john@example.com` | Password: `password123`
- **Role:** `member`
- Regular member access

> **Important:** Different login pages accept different formats:
> - **Admin logins** (church/unit/kutayima) use **EMAIL**
> - **Member login** uses **USERNAME**
> - **Super admin login** uses **USERNAME**

## Test Data Structure

### Church Hierarchy

```
St. Mary's Cathedral (CH001)
├── Sacred Heart Unit (CH001-U001)
│   ├── Morning Star Prayer Group (CH001-U001-B001)
│   │   ├── Mathew Family (CH001-U001-B001-H001)
│   │   │   ├── Thomas Mathew (Head) - Has login
│   │   │   └── Anna Mathew (Spouse)
│   │   └── Joseph Family (CH001-U001-B001-H002)
│   │       ├── John Joseph (Head) - Has login
│   │       └── Mary Joseph (Spouse)
│   └── Holy Cross Prayer Group (CH001-U001-B002)
│       └── Peter Family (CH001-U001-B002-H001)
│           └── Simon Peter (Head)
└── Holy Family Unit (CH001-U002)
    └── Divine Mercy Group (CH001-U002-B001)
        └── Abraham Family (CH001-U002-B001-H001)
            └── Paul Abraham (Head) - Church Admin
```

### Stothrakazhcha Test Data

- **Week 1, 2025** - Active
  - Default Amount: ₹100 per member
  - 1 Contributor: Thomas Mathew (paid ₹100)
  - 2 Dues:
    - Anna Mathew - ₹100 unpaid
    - John Joseph - ₹50 unpaid (paid ₹50)

## Common Workflows

### Start Fresh Development
```bash
# 1. Clear database
npm run db:clear

# 2. Seed with test data
npm run db:reset

# 3. Start development server
npm run dev
```

### Quick Reset
```bash
# One command to clear and seed
npm run db:reset
```

### Just Clear (No Seed)
```bash
# Only delete data, don't add test data
npm run db:clear
```

## Safety Features

1. **Confirmation Required**
   - `db:clear` asks for "yes" confirmation before deleting
   - Prevents accidental data loss

2. **Summary Reports**
   - Both scripts show detailed summaries
   - You can verify what was deleted/created

3. **Connection Management**
   - Scripts automatically close database connections
   - No hanging processes

## Troubleshooting

### Error: Cannot connect to database
**Solution:** Make sure MongoDB is running and `MONGODB_URI` is correct in `.env`

```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB
mongod
```

### Error: Module not found
**Solution:** Install dependencies
```bash
npm install
```

### Script hangs waiting for input
**Solution:** When `db:clear` asks "Are you sure?", type `yes` and press Enter

### Want to cancel during confirmation
**Solution:** Type anything except "yes" (like "no" or just press Enter)

## Script Files

- **Clear Script:** `/server/src/clearDatabase.ts`
- **Complete Seed:** `/server/src/seedComplete.ts`
- **Original Seed:** `/server/src/seed.ts`
- **New Seed:** `/server/src/seedNew.ts`

## Best Practices

1. **Always backup production data** before running clear scripts
2. **Use `db:reset` for development** - quick and consistent test data
3. **Use `db:clear` carefully** - it permanently deletes everything
4. **Verify environment** - make sure you're connected to the right database

## Quick Reference

| Command | Description | Confirmation |
|---------|-------------|--------------|
| `npm run db:clear` | Delete all data | Yes |
| `npm run db:reset` | Clear + Seed test data | No (auto) |
| `npm run seed:complete` | Same as db:reset | No (auto) |
| `npm run seed` | Original seed script | No (auto) |

---

**⚠️ Warning:** Always verify you're connected to the correct database before running these scripts. Check your `MONGODB_URI` in `.env`.
