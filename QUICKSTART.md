# Quick Start Guide

Get the Church Wallet System running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ MongoDB installed (or MongoDB Atlas account)
- ✅ Terminal/Command Prompt

## Step 1: Verify Installation

```bash
node --version  # Should be 18+
npm --version   # Should be 8+
mongod --version  # For local MongoDB
```

## Step 2: Start MongoDB

**Option A - Local MongoDB**:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B - MongoDB Atlas**:
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Skip to Step 3 and use your Atlas URI

## Step 3: Configure Environment

**Server Configuration**:
```bash
cd server
```

Create `.env` file (or edit existing):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/church_wallet
JWT_SECRET=my_super_secret_key_12345
JWT_EXPIRE=7d
SMS_ENABLED=false
CORS_ORIGIN=http://localhost:3000
```

**Client Configuration**:
```bash
cd client
```

Create `.env.local` file (or edit existing):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Church Wallet System
```

## Step 4: Install Dependencies

**Install Server Dependencies**:
```bash
cd server
npm install
```

**Install Client Dependencies**:
```bash
cd client
npm install
```

## Step 5: Start the Servers

**Terminal 1 - Start Backend**:
```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000 in development mode
```

**Terminal 2 - Start Frontend**:
```bash
cd client
npm run dev
```

You should see:
```
  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
```

## Step 6: Test the Application

### Test Backend Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Church Wallet API is running",
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@church.com",
    "password": "password123",
    "role": "super_admin"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@church.com",
    "role": "super_admin"
  }
}
```

### Open Frontend
Visit http://localhost:3000 in your browser

You should see the login/register page!

## Step 7: Create Your First User

Using the frontend:
1. Click "Register" tab
2. Fill in:
   - Username: `admin`
   - Email: `admin@church.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Register"

Or use the terminal (see Step 6).

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error**: `MongooseServerSelectionError`

**Solution**:
```bash
# Check if MongoDB is running
mongosh  # Should connect successfully

# If not running, start it:
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
net start MongoDB  # Windows
```

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use ::3000`

**Solution**:
```bash
# Find and kill the process
lsof -i :3000  # Find PID
kill -9 <PID>  # Kill process

# Or use a different port
PORT=3001 npm run dev
```

### Issue: Dependencies Not Installing

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: TypeScript Errors

**Solution**:
```bash
# Type check
npm run type-check

# If errors persist, rebuild
npm run build
```

## Next Steps

Now that your app is running:

1. **Create Church Hierarchy**:
   - Create a church
   - Add units
   - Add bavanakutayimas
   - Add houses
   - Add members

2. **Test Transactions**:
   - Try creating different transaction types
   - Test wallet calculations

3. **Explore the API**:
   - Use Postman or Insomnia
   - Check docs/API.md for endpoints

4. **Customize**:
   - Update church name
   - Configure SMS settings
   - Customize colors in tailwind.config.js

## Development Commands

### Server
```bash
npm run dev        # Start development server
npm run build      # Build TypeScript
npm start          # Start production server
npm run type-check # Check TypeScript
```

### Client
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run type-check # Check TypeScript
```

## Useful Resources

- **Main README**: `/README.md`
- **Setup Guide**: `/docs/SETUP.md`
- **Database Docs**: `/docs/DATABASE.md`
- **API Docs**: `/docs/API.md`
- **Project Status**: `/PROJECT_STATUS.md`

## Help & Support

If you encounter issues:
1. Check the documentation
2. Review error messages carefully
3. Check console logs (browser & terminal)
4. Verify environment variables

---

## Summary Checklist

- [ ] MongoDB running
- [ ] Server .env configured
- [ ] Client .env.local configured
- [ ] Dependencies installed (server)
- [ ] Dependencies installed (client)
- [ ] Server running on port 5000
- [ ] Client running on port 3000
- [ ] Health check passing
- [ ] Test user created

Once all checkboxes are ticked, you're ready to develop! 🎉

---

**Need help?** Review the documentation in `/docs` or check `PROJECT_STATUS.md` for current progress.

Happy coding! 🚀
