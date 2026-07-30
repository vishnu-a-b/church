# Email Notification System - Complete Guide

## Overview

A comprehensive email notification system has been implemented for the Church Wallet System with the following features:

1. **Welcome Emails** - Sent when new members are registered
2. **Email Verification** - Secure token-based verification system
3. **Transaction Notifications** - Emails for transactions and Stothrakazhcha contributions
4. **Preference Management** - Members can enable/disable email notifications

---

## ✅ Implementation Completed

### Backend Changes

#### 1. **Dependencies Installed**
- `nodemailer` - Email sending library
- `@types/nodemailer` - TypeScript definitions

#### 2. **Member Model Updates** (`server/src/models/Member.ts`)
Added three new fields:
```typescript
isEmailVerified: boolean          // Whether email is verified
emailVerificationToken: string    // Unique verification token
emailNotificationsEnabled: boolean // User preference for notifications
```

#### 3. **Email Service** (`server/src/services/emailService.ts`)
Created professional email templates with:
- **Welcome Email**: Includes member info, hierarchy details, and verification link
- **Transaction Notification**: Receipt details with campaign/Stothrakazhcha info
- Beautiful HTML templates with responsive design
- Plain text fallbacks

#### 4. **Verification Controller** (`server/src/controllers/emailVerificationController.ts`)
- `verifyEmail()` - Verifies email using token
- `updateEmailPreferences()` - Updates notification preferences
- `generateVerificationToken()` - Creates secure tokens

#### 5. **API Routes** (`server/src/routes/entity.routes.ts`)
Public routes (no authentication required):
- `GET /api/verify-email?token=xxx` - Verify email
- `POST /api/verify-email/preferences` - Update preferences

#### 6. **Updated Controllers**

**Member Creation** (`entityController.ts`):
- Generates verification token on member creation
- Sends welcome email with hierarchy information
- Includes verification link

**Transaction Creation** (`entityController.ts`):
- Sends email notification after transaction
- Only sends if member email is verified and notifications enabled
- Includes campaign name if applicable

**Stothrakazhcha Contribution** (`stothrakazhchaController.ts`):
- Sends email notification after contribution
- Includes week and year information

### Frontend Changes

#### 7. **Verification Page** (`client/app/verify-email/page.tsx`)
Beautiful verification page with:
- Token-based verification
- Success/error states with animations
- Member information display
- Toggle for email notification preferences
- Responsive design with gradient backgrounds

---

## 🔧 Configuration

### Environment Variables

Already configured in `.env`:
```env
# Email Configuration
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=Church Wallet System <your_email@gmail.com>
CLIENT_URL=http://localhost:3000
```

---

## 📧 Email Flow

### 1. Member Registration Flow
```
Admin creates member with email
    ↓
System generates verification token
    ↓
Welcome email sent with:
  - Member details
  - Hierarchy information (Church, Unit, Bavanakutayima, House)
  - Member ID (hierarchical number)
  - Verification link
    ↓
Member clicks verification link
    ↓
Email verified successfully
    ↓
Member can enable/disable notifications
```

### 2. Transaction Notification Flow
```
Transaction created (Campaign or Stothrakazhcha)
    ↓
Check if member has email
    ↓
Check if email is verified
    ↓
Check if notifications are enabled
    ↓
Send transaction email with:
  - Receipt number
  - Transaction type
  - Amount
  - Payment method
  - Date
  - Campaign/Stothrakazhcha name (if applicable)
```

---

## 🎯 Email Notification Conditions

Emails are sent ONLY when ALL conditions are met:

1. ✅ `EMAIL_ENABLED=true` in `.env`
2. ✅ Member has an email address
3. ✅ Email is verified (`isEmailVerified: true`)
4. ✅ Member has enabled notifications (`emailNotificationsEnabled: true`)

---

## 🔐 Security Features

1. **Token-Based Verification**: Cryptographically secure random tokens
2. **Public Routes**: Verification endpoints don't require authentication
3. **Token Cleanup**: Verification tokens are cleared after successful verification
4. **Async Email Sending**: Emails don't block API responses
5. **Error Handling**: Email failures don't affect transaction/member creation

---

## 📱 User Experience

### Welcome Email Features
- Professional gradient header
- Member information table
- Hierarchy breakdown
- Prominent verification button
- Mobile-responsive design
- Plain text alternative

### Transaction Email Features
- Transaction details in organized table
- Formatted currency (₹)
- Formatted dates (Indian locale)
- Campaign/Stothrakazhcha name
- Thank you message
- Preference management link

### Verification Page Features
- Loading state with spinner
- Success state with checkmark
- Error state with error icon
- Member information display
- Email status badge (Verified/Unverified)
- Toggle buttons for preferences
- Smooth animations
- Mobile-responsive

---

## 🧪 Testing the System

### Test 1: Member Registration & Welcome Email
1. Create a new member with a valid email address
2. Check the email inbox for welcome email
3. Click the verification link
4. Verify email successfully
5. Enable email notifications

### Test 2: Transaction Notification
1. Ensure member email is verified and notifications enabled
2. Create a transaction for that member
3. Check email for transaction notification

### Test 3: Stothrakazhcha Notification
1. Ensure member email is verified and notifications enabled
2. Add a Stothrakazhcha contribution for that member
3. Check email for contribution notification

### Test 4: Preference Management
1. Access verification page with token
2. Toggle email notifications on/off
3. Verify preferences are saved

---

## 📊 Email Templates Preview

### Welcome Email
```
┌─────────────────────────────────────┐
│  Welcome to Church Wallet System!   │ (Gradient Header)
└─────────────────────────────────────┘

Hello [Name]!

Your Member Information:
• Member ID: 1-1-1-1-1
• Name: John Doe
• Email: john@example.com

Your Hierarchy:
• Church: St. Mary's Church
• Unit: North Unit
• Bavanakutayima: Group A
• House: Doe Family

[Verify Email Address Button]
```

### Transaction Email
```
┌─────────────────────────────────────┐
│     Transaction Notification        │ (Gradient Header)
└─────────────────────────────────────┘

Hello [Name]!

Transaction Details:
• Receipt Number: RCP-xxx
• Type: Stothrakazhcha
• Campaign: Week 45, 2025
• Amount: ₹500
• Payment Method: CASH
• Date: December 12, 2024

Thank you for your contribution!
```

---

## 🛠️ Troubleshooting

### Emails Not Sending
1. Check `EMAIL_ENABLED=true` in `.env`
2. Verify Gmail credentials are correct
3. Check server logs for email errors
4. Ensure Gmail "App Passwords" is used (not regular password)

### Verification Link Not Working
1. Check `CLIENT_URL` in `.env` matches your frontend URL
2. Verify token is included in URL
3. Check member exists in database
4. Verify token hasn't been used/cleared

### Notifications Not Received
1. Check member email is verified (`isEmailVerified: true`)
2. Check notifications are enabled (`emailNotificationsEnabled: true`)
3. Check spam/junk folder
4. Check server logs for email sending errors

---

## 📝 Database Schema Updates

```typescript
// Member Model - New Fields
{
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,  // Not returned by default
  },
  emailNotificationsEnabled: {
    type: Boolean,
    default: false,  // Disabled until verified
  }
}
```

---

## 🎉 Benefits

1. **Professional Communication**: Beautiful, branded emails
2. **Verified Contacts**: Only send to verified email addresses
3. **User Control**: Members can opt-in/out of notifications
4. **Secure**: Token-based verification system
5. **Non-Blocking**: Async email sending doesn't slow down operations
6. **Error Resilient**: Email failures don't break transactions
7. **Mobile-Friendly**: All emails and pages are responsive
8. **Hierarchy Awareness**: Welcome email includes full hierarchy info

---

## 🚀 Next Steps (Optional Enhancements)

1. **Resend Verification Email**: Add ability to resend verification email
2. **Email Templates**: Add more template types (reminders, due dates, etc.)
3. **Batch Emails**: Send bulk notifications for campaigns
4. **Email Analytics**: Track open rates and click rates
5. **Custom Templates**: Allow admins to customize email templates
6. **Multi-language**: Support multiple languages
7. **SMS Integration**: Add SMS notifications alongside emails
8. **Scheduled Emails**: Send reminder emails for pending dues

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review server logs
3. Verify .env configuration
4. Check member email verification status
5. Test with a known working email address

---

**System Status**: ✅ Fully Operational

**Last Updated**: December 2024

**Version**: 1.0.0
