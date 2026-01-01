# API Testing Scripts

This directory contains scripts to test and populate the Campaign, Stothrakazhcha, and Transaction APIs with sample data.

## Quick Start

### Option 1: Using the Bash Script (Recommended)

1. **Start your server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Get your authentication token:**
   - Open your browser and go to `http://localhost:3000`
   - Login as a Church Admin
   - Open Developer Tools (F12)
   - Go to: Application > Local Storage > http://localhost:3000
   - Copy the value of `church_admin_accessToken`

3. **Run the test script:**
   ```bash
   cd server
   ./scripts/test-api.sh <paste_your_token_here>
   ```

   Example:
   ```bash
   ./scripts/test-api.sh eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Option 2: Using the TypeScript Script

1. **Update the token in the script:**
   ```bash
   nano src/scripts/addTestData.ts
   # Replace 'YOUR_CHURCH_ADMIN_TOKEN_HERE' with your actual token
   ```

2. **Run the script:**
   ```bash
   npx ts-node src/scripts/addTestData.ts
   ```

## What the Scripts Do

Both scripts will create:

### Campaigns (3 total)
1. **Christmas Fund 2024**
   - Type: General Fund
   - Mode: Variable contribution
   - Fixed Amount: ₹500
   - Minimum Amount: ₹200
   - Status: Active

2. **Building Fund - January 2025**
   - Type: Building Fund
   - Mode: Fixed contribution
   - Fixed Amount: ₹1000 per house
   - Status: Active

3. **Charity Drive - December 2024**
   - Type: Charity
   - Mode: Variable contribution
   - Minimum Amount: ₹100
   - Status: Active

### Stothrakazhcha (2-3 entries)
1. **Week 52, 2024**
   - Period: Dec 23-29, 2024
   - Default Amount: ₹100 per member
   - Status: Active

2. **Week 1, 2025**
   - Period: Dec 30 - Jan 5, 2025
   - Default Amount: ₹100 per member
   - Status: Active

### Contributions
- 3-5 random member contributions to each campaign
- 5-9 random member contributions to each stothrakazhcha
- All contributions automatically create transactions

## Verifying the Test Data

After running the script, check:

1. **Campaigns Page:**
   ```
   http://localhost:3000/church-admin/dashboard/campaigns
   ```
   - Should see 3 campaigns with participant counts
   - Click "View Payments" to see the contributors

2. **Stothrakazhcha Page:**
   ```
   http://localhost:3000/church-admin/dashboard/stothrakazhcha
   ```
   - Should see 2-3 weeks with contributions
   - Click the green "View Payments" icon to see contributors

3. **Transactions Page:**
   ```
   http://localhost:3000/church-admin/dashboard/transactions
   ```
   - Should see all contributions as transactions
   - Can filter by type (Campaign/Stothrakazhcha)

## Troubleshooting

### "Authentication failed" or 401 error
- Your token might be expired
- Login again and get a fresh token
- Make sure you're using the church_admin token (not member or other roles)

### "No members found"
- You need to add members first before running these scripts
- Go to the Members page and add at least 3 members

### Script permission denied
```bash
chmod +x scripts/test-api.sh
```

### jq command not found (for bash script)
Install jq:
- **Mac:** `brew install jq`
- **Ubuntu:** `sudo apt-get install jq`
- **Windows:** Download from https://stedolan.github.io/jq/

Or use the TypeScript script instead (doesn't need jq)

## Cleanup

To remove test data, you can manually delete the test campaigns and stothrakazhcha entries from the dashboard, or use the MongoDB shell:

```javascript
// Delete test campaigns
db.campaigns.deleteMany({ name: { $regex: /Fund|Charity/ } })

// Delete test stothrakazhcha
db.stothrakazhchas.deleteMany({ year: { $in: [2024, 2025] } })

// Delete associated transactions
db.transactions.deleteMany({ description: { $regex: /Campaign|Stothrakazhcha/ } })
```

## Notes

- The scripts are idempotent - you can run them multiple times
- Duplicate campaigns/stothrakazhcha may show warnings but won't break anything
- All amounts are in Indian Rupees (₹)
- Contributions create transactions automatically via the backend API
