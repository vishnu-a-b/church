# Login Page Troubleshooting Guide

## Issue: Church Admin Login Shows Member Login Page

### Quick Fix:

1. **Clear Browser Storage:**
   - Open browser DevTools (F12 or Right-click → Inspect)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Click **Clear storage** or **Clear all**
   - Refresh the page

2. **Clear Specific localStorage:**
   ```javascript
   // Open browser console (F12 → Console tab) and run:
   localStorage.clear();
   location.reload();
   ```

3. **Restart Dev Server:**
   ```bash
   # Stop the frontend server (Ctrl+C)
   # Then restart:
   cd client
   npm run dev
   ```

4. **Hard Refresh:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

## Login Page URLs:

| Page | URL | Login With |
|------|-----|------------|
| **Super Admin** | http://localhost:3000/admin-login | Username: `admin` |
| **Church Admin** | http://localhost:3000/church-admin-login | Email: `paul@example.com` |
| **Unit Admin** | http://localhost:3000/unit-admin-login | Email |
| **Kutayima Admin** | http://localhost:3000/kutayima-admin-login | Email |
| **Member Login** | http://localhost:3000/member-login | Username: `thomas` or `john` |
| **Home (Member)** | http://localhost:3000/ | Username/Email |

## Correct Credentials:

### Church Admin:
```
URL: http://localhost:3000/church-admin-login
Email: paul@example.com
Password: password123
```

### Super Admin:
```
URL: http://localhost:3000/admin-login
Username: admin
Password: admin123
```

### Member:
```
URL: http://localhost:3000/member-login
Username: thomas
Password: password123
```

## If Still Having Issues:

### 1. Check Server Status:
```bash
# Backend should be on port 3001
curl http://localhost:3001/api

# Frontend should be on port 3000
curl http://localhost:3000
```

### 2. Verify Database:
```bash
cd server
npm run db:reset
```

### 3. Clear Next.js Cache:
```bash
cd client
rm -rf .next
npm run dev
```

### 4. Check for Port Conflicts:
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill any process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart servers
cd server && npm run dev &
cd client && npm run dev
```

## Common Issues:

### Issue 1: Wrong Credentials
- **Church Admin** uses **EMAIL** not username
- **Member** uses **USERNAME** not email
- **Super Admin** uses **USERNAME** not email

### Issue 2: Cached Authentication
- Browser has old tokens stored
- **Solution:** Clear localStorage (see step 2 above)

### Issue 3: Multiple Layout Files
- Both `layout.js` and `layout.tsx` exist
- Next.js might be using the wrong one
- **Solution:** Delete `layout.js` and keep only `layout.tsx`

```bash
cd client/app
rm layout.js
# Keep layout.tsx only
```

### Issue 4: Server Not Running
- Backend must run on port 3001
- Frontend must run on port 3000
- **Solution:** Start both servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Step-by-Step Login Test:

1. **Clear Everything:**
   ```javascript
   // In browser console:
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Go to Church Admin Login:**
   ```
   http://localhost:3000/church-admin-login
   ```

3. **Enter Credentials:**
   ```
   Email: paul@example.com
   Password: password123
   ```

4. **Click Eye Icon 👁️** to verify password is typed correctly

5. **Click "Login as Church Admin"**

6. **Should redirect to:** `/dashboard`

## Need More Help?

If the page still shows member login:
1. Take a screenshot
2. Open DevTools Console (F12)
3. Check for any error messages
4. Verify the URL is exactly: `http://localhost:3000/church-admin-login`
5. Try in incognito/private window (no cache)

## Quick Reset Everything:

```bash
# Stop all servers (Ctrl+C in each terminal)

# Reset database
cd server
npm run db:reset

# Clear Next.js cache
cd ../client
rm -rf .next

# Restart backend
cd ../server
npm run dev &

# Restart frontend
cd ../client
npm run dev

# Clear browser data
# Open browser console and run:
localStorage.clear();
location.reload();
```

Then try logging in again!
