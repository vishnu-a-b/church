# Setup Guide

## Quick Start

### 1. Install Dependencies

**Server**:
```bash
cd server
npm install
```

**Client**:
```bash
cd client
npm install
```

### 2. Configure Environment Variables

**Server** - Create `server/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/church_wallet
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/church_wallet

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# SMS Service (Fast2SMS)
SMS_ENABLED=true
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_fast2sms_api_key_here
SMS_SENDER_ID=CHURCH

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Client** - Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Church Wallet System
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Option B: MongoDB Atlas**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in server/.env

### 4. Run Development Servers

**Terminal 1 - Start Backend**:
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend**:
```bash
cd client
npm run dev
```

### 5. Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/health

## TypeScript Type Checking

**Client**:
```bash
cd client
npm run type-check
```

**Server**:
```bash
cd server
npm run type-check
```

## Production Build

**Server**:
```bash
cd server
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled code
```

**Client**:
```bash
cd client
npm run build  # Creates static export in out/
```

## Troubleshooting

### MongoDB Connection Issues

**Error**: "MongooseServerSelectionError"

**Solution**:
1. Check MongoDB is running
2. Verify MONGODB_URI in .env
3. Check network/firewall settings

### Port Already in Use

**Error**: "EADDRINUSE: address already in use"

**Solution**:
```bash
# Find process using port
lsof -i :5000  # or :3000

# Kill process
kill -9 <PID>
```

### TypeScript Compilation Errors

**Solution**:
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Development Tips

### Hot Reload

Both servers support hot reload:
- **Client**: Next.js Fast Refresh
- **Server**: ts-node-dev watches files

### Testing API Endpoints

Use tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- MongoDB for VS Code

## Next Steps

After setup, proceed to create:
1. Test user accounts
2. Church hierarchy (Church → Unit → Bavanakutayima → House → Member)
3. Test transactions
4. Configure SMS settings

See the main README.md for full documentation.
