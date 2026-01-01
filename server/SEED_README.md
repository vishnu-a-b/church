# Database Seed Script - Full Data

## Overview
This comprehensive seed script (`seedFull.ts`) clears all existing data and populates the database with complete hierarchical church data including members, campaigns, stothrakazhcha, and payment transactions.

## What Gets Seeded

### Organizational Hierarchy
- **1 Church**: St. Mary's Cathedral
- **3 Units**: Sacred Heart Unit, Holy Family Unit, Divine Mercy Unit
- **6 Bavanakutayimas** (Prayer Groups) across units
- **10 Houses** distributed across prayer groups
- **30 Members** with complete family relationships
- **1 Super Admin** user

### Financial Data
- **4 Campaigns** with different types and payment modes:
  1. Church Building Fund 2025 (per_member, fixed: ₹5,000)
  2. Christmas Charity Fund (per_house, variable)
  3. Annual Feast Day Fund (per_house, fixed: ₹2,000)
  4. Education Support Fund (flexible, variable)

- **36 Campaign Payment Transactions**
  - Member payments for building fund
  - House payments for charity and feast fund
  - Mixed payments for education fund

### Stothrakazhcha (Weekly Contributions)
- **4 Weeks** of stothrakazhcha records
  - Week 1-3: Closed with payment history
  - Week 4: Active (current week)
- **70 Stothrakazhcha Transactions** (member and house payments)
- **45 Stothrakazhcha Dues** (outstanding and partial payments)

### Spiritual Activities
- **199 Activity Records** including:
  - Mass attendance
  - Fasting records
  - Prayer activities (rosary, divine mercy, stations, etc.)

## Total Data Summary
- **Total Transactions**: 106
- **Total Campaign Amount**: ₹88,683
- **Total Stothrakazhcha Amount**: ₹7,850
- **Grand Total**: ₹96,533

## How to Run

### Prerequisites
- MongoDB connection string in `.env` file
- Node.js and npm installed
- All dependencies installed (`npm install`)

### Running the Seed Script

```bash
# From the server directory
cd server

# Run the seed script
npx ts-node src/seedFull.ts
```

### Alternative: Add npm script
Add this to your `package.json`:
```json
{
  "scripts": {
    "seed:full": "ts-node src/seedFull.ts"
  }
}
```

Then run:
```bash
npm run seed:full
```

## Login Credentials

After seeding, you can login with these credentials:

### Super Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@example.com`

### Church Admin
- **Username**: `paul`
- **Password**: `password123`
- **Email**: `paul@example.com`

### Sample Members
- **Username**: `thomas` | Password: `password123` | Email: `thomas@example.com`
- **Username**: `john` | Password: `password123` | Email: `john@example.com`
- **Username**: `james` | Password: `password123` | Email: `james@example.com`

## What Gets Cleared

⚠️ **WARNING**: This script clears ALL existing data before seeding:
- Churches
- Units
- Bavanakutayimas
- Houses
- Members
- Campaigns
- Transactions
- Spiritual Activities
- Stothrakazhcha
- Stothrakazhcha Dues

## Campaign Details

### 1. Church Building Fund 2025
- **Type**: Building Fund
- **Mode**: Fixed amount
- **Amount**: ₹5,000 per member
- **Collected**: ₹50,000 from 10 contributors
- **Period**: Jan 2025 - Dec 2025

### 2. Christmas Charity Fund
- **Type**: Charity
- **Mode**: Variable amount
- **Amount**: Minimum ₹500 per house
- **Collected**: ₹12,441 from 10 houses
- **Period**: Dec 2024 - Jan 2025

### 3. Annual Feast Day Fund
- **Type**: Special Contribution
- **Mode**: Fixed amount
- **Amount**: ₹2,000 per house
- **Collected**: ₹16,000 from 8 houses
- **Period**: Jan 2025 - Feb 2025

### 4. Education Support Fund
- **Type**: General Fund
- **Mode**: Variable amount
- **Amount**: Minimum ₹100 (flexible)
- **Collected**: ₹10,242 from 8 contributors (mix of members and houses)
- **Period**: Jan 2025 - Mar 2025

## Stothrakazhcha Details

### Week 1 (Closed)
- **Amount Collected**: ₹2,500
- **Contributors**: 25 members paid
- **Outstanding**: 5 members have dues

### Week 2 (Closed)
- **Amount Collected**: ₹2,250
- **Contributors**: 25 members (20 full, 5 partial)
- **Outstanding**: 10 members (5 partial, 5 unpaid)

### Week 3 (Closed)
- **Amount Collected**: ₹3,100
- **Contributors**: 20 (15 members + 5 houses paying for families)
- **Payment Mix**: Individual member payments and house-level payments

### Week 4 (Active)
- **Status**: Active (current week)
- **Dues Created**: All 30 members have dues
- **Collected**: ₹0 (awaiting payments)

## Data Structure

### Hierarchy Flow
```
Church (1)
  └── Units (3)
      └── Bavanakutayimas (6)
          └── Houses (10)
              └── Members (30)
```

### Payment Distribution
- **Member-only payments**: Building Fund, some Education Fund
- **House-only payments**: Christmas Charity, Feast Day Fund, some Education Fund
- **Mixed payments**: Week 3 Stothrakazhcha shows both member and house payments

### Spiritual Activities Distribution
Each member has:
- 3-5 mass attendance records
- 1 fasting record (random)
- 1-3 prayer activity records

## Notes
- All passwords are hashed using bcrypt
- Receipt numbers are auto-generated (RCP-1000 onwards)
- Phone numbers follow 10-digit format
- SMS notifications are marked as not sent (can be sent separately)
- All amounts are in INR (₹)
