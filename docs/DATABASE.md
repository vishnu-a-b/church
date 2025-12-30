# Database Schema Documentation

## Overview

The Church Wallet System uses MongoDB with Mongoose ODM. All models are fully typed with TypeScript.

## Hierarchical Structure

```
Church (പള്ളി)
  └── Units (യൂണിറ്റ്)
        └── Bavanakutayimas (ഭവനകൂട്ടായ്മ)
              └── Houses (വീടുകൾ)
                    └── Members (അംഗങ്ങൾ)
```

## Collections

### 1. Users
**Purpose**: Authentication and authorization

```typescript
{
  _id: ObjectId,
  username: string,
  email: string,
  password: string (hashed),
  role: 'super_admin' | 'unit_admin' | 'member',
  churchId?: ObjectId,
  unitId?: ObjectId,
  memberId?: ObjectId,
  isActive: boolean,
  lastLogin?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `username` (unique)

### 2. Churches
**Purpose**: Church information and settings

```typescript
{
  _id: ObjectId,
  name: string,
  location: string,
  diocese?: string,
  established?: Date,
  contactPerson?: string,
  phone?: string,
  email?: string,
  settings: {
    smsEnabled: boolean,
    smsProvider: 'fast2sms' | 'msg91',
    smsApiKey?: string,
    smsSenderId: string,
    currency: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Units
**Purpose**: Church organizational units

```typescript
{
  _id: ObjectId,
  churchId: ObjectId,
  name: string,
  unitNumber?: string,
  adminUserId?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `churchId`

### 4. Bavanakutayimas
**Purpose**: Sub-units within units

```typescript
{
  _id: ObjectId,
  unitId: ObjectId,
  name: string,
  leaderName?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `unitId`

### 5. Houses
**Purpose**: Family houses within bavanakutayimas

```typescript
{
  _id: ObjectId,
  bavanakutayimaId: ObjectId,
  familyName: string,
  headOfFamily?: string,
  address?: string,
  phone?: string,
  houseNumber?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `bavanakutayimaId`

### 6. Members
**Purpose**: Individual church members

```typescript
{
  _id: ObjectId,
  houseId: ObjectId,
  firstName: string,
  lastName?: string,
  dateOfBirth?: Date,
  gender: 'male' | 'female',
  phone?: string,
  email?: string,
  baptismName?: string,
  relationToHead: 'head' | 'spouse' | 'child' | 'parent' | 'other',
  isActive: boolean,
  smsPreferences: {
    enabled: boolean,
    paymentNotifications: boolean,
    receiptNotifications: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `houseId`, `phone`

### 7. Wallets
**Purpose**: Track member and house balances

```typescript
{
  _id: ObjectId,
  walletType: 'member' | 'house',
  ownerId: ObjectId,
  ownerModel: 'Member' | 'House',
  ownerName: string,
  balance: number,
  transactions: [{
    transactionId: ObjectId,
    amount: number,
    type: string,
    date: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `{ownerId, walletType}` (unique)

### 8. Transactions
**Purpose**: All financial transactions

```typescript
{
  _id: ObjectId,
  receiptNumber: string (unique),
  transactionType: 'lelam' | 'thirunnaal_panam' | 'dashamansham' |
                   'spl_contribution' | 'stothrakazhcha',

  // For Spl-സംഭാവന
  contributionMode?: 'fixed' | 'variable',
  campaignId?: ObjectId,

  // Distribution
  distribution?: 'member_only' | 'house_only' | 'both',
  memberAmount: number,
  houseAmount: number,
  totalAmount: number,

  // References
  memberId?: ObjectId,
  houseId?: ObjectId,
  unitId?: ObjectId,
  churchId: ObjectId,

  // Payment details
  paymentDate: Date,
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque',
  notes?: string,

  // SMS tracking
  smsNotificationSent: boolean,
  smsLogId?: ObjectId,

  // Audit
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `churchId`, `memberId`, `houseId`, `receiptNumber` (unique)

### 9. Campaigns
**Purpose**: Fixed-amount campaigns

```typescript
{
  _id: ObjectId,
  churchId: ObjectId,
  campaignType: 'stothrakazhcha' | 'spl_contribution',
  name: string,
  description?: string,
  fixedAmount: number,
  amountType: 'per_house' | 'per_member',
  startDate: Date,
  endDate?: Date,
  dueDate?: Date,
  isActive: boolean,
  totalCollected: number,
  participantCount: number,
  createdBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `{churchId, isActive}`

### 10. SpiritualActivities
**Purpose**: Track spiritual activities

```typescript
{
  _id: ObjectId,
  memberId: ObjectId,
  activityType: 'mass' | 'fasting' | 'prayer',

  // Mass
  massDate?: Date,
  massAttended?: boolean,

  // Fasting
  fastingWeek?: string,
  fastingDays?: string[],

  // Prayer
  prayerType?: 'rosary' | 'divine_mercy' | 'stations' | 'other',
  prayerCount?: number,
  prayerWeek?: string,

  // Self-reporting
  selfReported: boolean,
  reportedAt?: Date,

  // Verification
  verifiedBy?: ObjectId,
  verifiedAt?: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `memberId`, `massDate`, `fastingWeek`, `prayerWeek`

### 11. SMSLogs
**Purpose**: Track all SMS notifications

```typescript
{
  _id: ObjectId,
  recipientType: 'member' | 'house_head',
  recipientId: ObjectId,
  recipientModel: 'Member' | 'House',
  recipientName: string,
  phoneNumber: string,
  messageType: 'payment_added' | 'receipt_confirmation',
  templateUsed?: string,
  messageContent: string,
  transactionId?: ObjectId,
  sentAt: Date,
  status: 'sent' | 'delivered' | 'failed',
  deliveryStatus: {
    sentTo?: string,
    messageId?: string,
    deliveredAt?: Date,
    failureReason?: string
  },
  cost: number,
  createdAt: Date
}
```

**Indexes**: `transactionId`, `phoneNumber`, `sentAt`

## Relationships

### One-to-Many
- Church → Units
- Unit → Bavanakutayimas
- Bavanakutayima → Houses
- House → Members

### References
- Transaction → Member (optional)
- Transaction → House (optional)
- Transaction → Campaign (optional)
- Wallet → Member or House
- SpiritualActivity → Member
- SMSLog → Transaction

## Data Validation

All models include:
- Required field validation
- Type validation
- String length limits
- Email/phone number format validation
- Enum validation for specific fields

## Performance Optimization

### Indexes
Strategically placed on:
- Frequently queried fields
- Foreign keys
- Unique fields

### Virtuals and Populate
Use `.populate()` to load related documents efficiently.

## Migration Notes

When updating schema:
1. Update TypeScript interfaces in `types/index.ts`
2. Update Mongoose schema
3. Update API validation
4. Update frontend types
5. Test thoroughly

## Backup Strategy

**Recommended**:
- Daily automated backups
- MongoDB Atlas automatic backups (if using Atlas)
- Export critical data periodically

**Manual Backup**:
```bash
mongodump --uri="mongodb://localhost:27017/church_wallet" --out=./backup
```

**Restore**:
```bash
mongorestore --uri="mongodb://localhost:27017/church_wallet" ./backup/church_wallet
```
