# Church Wallet Keeping System

A comprehensive financial and spiritual management system for churches with 340+ members.

## 🚀 Project Overview

This is a full-stack TypeScript application built with:
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + MongoDB + Mongoose
- **Authentication**: JWT-based with role-based access control (RBAC)
- **SMS Integration**: Fast2SMS API for notifications

## 📁 Project Structure

```
church-wallet-system/
├── client/                    # Next.js 14 Frontend (TypeScript)
│   ├── app/                   # App router pages
│   ├── components/            # Reusable React components
│   ├── context/               # React Context (Auth, etc.)
│   ├── lib/                   # Utilities and API client
│   ├── types/                 # TypeScript type definitions
│   └── public/                # Static assets
│
├── server/                    # Express.js Backend (TypeScript)
│   ├── src/
│   │   ├── models/            # Mongoose models (11 models)
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, RBAC, validation
│   │   ├── services/          # External services (SMS)
│   │   ├── config/            # Configuration files
│   │   ├── types/             # TypeScript interfaces
│   │   └── server.ts          # Entry point
│   └── dist/                  # Compiled JavaScript
│
└── docs/                      # Documentation
```

## ✅ Completed Features

### Phase 1: Foundation ✓

1. **Client Setup** ✓
   - Next.js 14 with App Router and TypeScript
   - Tailwind CSS configuration
   - Static export configuration
   - Type-safe API client with Axios
   - Auth Context with TypeScript

2. **Server Setup** ✓
   - Express.js with TypeScript
   - MongoDB connection configuration
   - Environment variables setup
   - Error handling middleware

3. **Database Models (11 Models)** ✓
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

4. **Authentication System** ✓
   - JWT token generation and verification
   - Password hashing with bcrypt
   - Auth middleware (protect routes)
   - RBAC middleware (role-based access)
   - Auth controller (register, login, logout, change password)
   - Auth routes with validation

### User Roles

- **Super Admin**: Full system access, manages churches
- **Unit Admin**: Manages specific unit data
- **Member**: Limited access to own data

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Church
```

### 2. Server Setup

```bash
cd server
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Development
npm run dev

# Build for production
npm run build
npm start
```

**Server Environment Variables (.env)**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/church_wallet
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
SMS_ENABLED=true
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_api_key
SMS_SENDER_ID=CHURCH
CORS_ORIGIN=http://localhost:3000
```

### 3. Client Setup

```bash
cd client
npm install

# Development
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

**Client Environment Variables (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Church Wallet System
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🎯 Next Steps (Pending)

### Phase 2: Core Features
- [ ] Complete all API routes and controllers
- [ ] Implement 5 financial transaction types
- [ ] Build wallet system with balance calculations
- [ ] Integrate Fast2SMS for notifications

### Phase 3: Spiritual Activities
- [ ] Mass attendance tracking
- [ ] Fasting tracking
- [ ] Prayer logging
- [ ] Activity reports

### Phase 4: Frontend
- [ ] Build admin dashboard
- [ ] Create member portal
- [ ] Implement all forms
- [ ] Add charts and analytics

### Phase 5: Testing & Deployment
- [ ] Test all features
- [ ] Mobile responsiveness
- [ ] Production deployment

## 📝 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### Request Examples

**Register**:
```json
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}
```

**Login**:
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation on all routes
- ✅ CORS protection
- ✅ Environment variables for secrets
- ✅ TypeScript for type safety

## 🛠️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript 5.3
- React 18
- Tailwind CSS 3.4
- Axios (API client)
- React Hook Form + Zod (forms & validation)
- Recharts (charts)
- Lucide React (icons)

### Backend
- Node.js + Express.js
- TypeScript 5.3
- MongoDB + Mongoose 8
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- express-validator (validation)
- Fast2SMS (SMS service)

## 📊 Database Schema

The system uses a hierarchical structure:

```
Church
  └── Units
        └── Bavanakutayimas
              └── Houses
                    └── Members
```

### Key Collections:
- **Users**: Authentication and authorization
- **Churches**: Church information and settings
- **Transactions**: Financial transactions
- **Wallets**: Member and house wallets
- **Campaigns**: Fixed-amount campaigns
- **SpiritualActivities**: Mass, fasting, prayers
- **SMSLogs**: SMS notification tracking

## 🤝 Contributing

This is a private project for church management. For questions or support, contact Vishnu.

## 📄 License

ISC License - Copyright (c) 2024

## 🙏 Acknowledgments

Built with care for efficient church financial and spiritual management.

---

**Version**: 1.0.0
**Last Updated**: December 2024
**Developer**: Vishnu
