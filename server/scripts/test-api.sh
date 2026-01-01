#!/bin/bash

# Script to test Campaign, Stothrakazhcha, and Transaction APIs
# Usage: ./scripts/test-api.sh <your_auth_token>

set -e

API_URL="http://localhost:3001/api"
TOKEN="${1:-YOUR_TOKEN_HERE}"

if [ "$TOKEN" = "YOUR_TOKEN_HERE" ]; then
  echo "❌ Error: Please provide your authentication token"
  echo "Usage: ./scripts/test-api.sh <your_auth_token>"
  echo ""
  echo "To get your token:"
  echo "1. Login to the app as church admin"
  echo "2. Open browser DevTools > Application > Local Storage"
  echo "3. Copy the value of 'church_admin_accessToken'"
  echo "4. Run: ./scripts/test-api.sh <paste_token_here>"
  exit 1
fi

echo "🚀 Testing Campaign, Stothrakazhcha, and Transaction APIs"
echo "==========================================================="
echo ""

# Function to make API calls
call_api() {
  local method=$1
  local endpoint=$2
  local data=$3

  curl -s -X "$method" "$API_URL$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    ${data:+-d "$data"}
}

# 1. Get members first (we'll need them for contributions)
echo "📋 Step 1: Fetching members..."
MEMBERS=$(call_api GET "/members")
MEMBER_COUNT=$(echo "$MEMBERS" | jq -r '.data | length' 2>/dev/null || echo "0")

if [ "$MEMBER_COUNT" = "0" ]; then
  echo "❌ No members found! Please add members first."
  exit 1
fi

echo "✅ Found $MEMBER_COUNT members"
echo ""

# Get first 3 member IDs for testing
MEMBER_ID_1=$(echo "$MEMBERS" | jq -r '.data[0]._id' 2>/dev/null)
MEMBER_ID_2=$(echo "$MEMBERS" | jq -r '.data[1]._id' 2>/dev/null)
MEMBER_ID_3=$(echo "$MEMBERS" | jq -r '.data[2]._id' 2>/dev/null)

# 2. Create test campaigns
echo "💰 Step 2: Creating test campaigns..."

# Campaign 1: Christmas Fund
CAMPAIGN_1=$(call_api POST "/campaigns" '{
  "name": "Christmas Fund 2024",
  "campaignType": "general_fund",
  "contributionMode": "variable",
  "amountType": "per_member",
  "fixedAmount": 500,
  "minimumAmount": 200,
  "startDate": "2024-12-01",
  "endDate": "2024-12-25",
  "dueDate": "2024-12-25",
  "isActive": true
}')

CAMPAIGN_1_ID=$(echo "$CAMPAIGN_1" | jq -r '.data._id // ._id' 2>/dev/null)
if [ -n "$CAMPAIGN_1_ID" ] && [ "$CAMPAIGN_1_ID" != "null" ]; then
  echo "  ✅ Created: Christmas Fund 2024 (ID: $CAMPAIGN_1_ID)"
else
  echo "  ⚠️  Christmas Fund already exists or failed"
fi

# Campaign 2: Building Fund
CAMPAIGN_2=$(call_api POST "/campaigns" '{
  "name": "Building Fund - January 2025",
  "campaignType": "building_fund",
  "contributionMode": "fixed",
  "amountType": "per_house",
  "fixedAmount": 1000,
  "minimumAmount": 0,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "dueDate": "2025-01-31",
  "isActive": true
}')

CAMPAIGN_2_ID=$(echo "$CAMPAIGN_2" | jq -r '.data._id // ._id' 2>/dev/null)
if [ -n "$CAMPAIGN_2_ID" ] && [ "$CAMPAIGN_2_ID" != "null" ]; then
  echo "  ✅ Created: Building Fund - January 2025 (ID: $CAMPAIGN_2_ID)"
else
  echo "  ⚠️  Building Fund already exists or failed"
fi

# Campaign 3: Charity Drive
CAMPAIGN_3=$(call_api POST "/campaigns" '{
  "name": "Charity Drive - December 2024",
  "campaignType": "charity",
  "contributionMode": "variable",
  "amountType": "flexible",
  "fixedAmount": 0,
  "minimumAmount": 100,
  "startDate": "2024-12-15",
  "endDate": "2024-12-31",
  "dueDate": "2024-12-31",
  "isActive": true
}')

CAMPAIGN_3_ID=$(echo "$CAMPAIGN_3" | jq -r '.data._id // ._id' 2>/dev/null)
if [ -n "$CAMPAIGN_3_ID" ] && [ "$CAMPAIGN_3_ID" != "null" ]; then
  echo "  ✅ Created: Charity Drive - December 2024 (ID: $CAMPAIGN_3_ID)"
else
  echo "  ⚠️  Charity Drive already exists or failed"
fi

echo ""

# 3. Add contributions to campaigns
if [ -n "$CAMPAIGN_1_ID" ] && [ "$CAMPAIGN_1_ID" != "null" ] && [ -n "$MEMBER_ID_1" ]; then
  echo "💸 Step 3: Adding contributions to campaigns..."

  # Add contributions to Campaign 1
  call_api POST "/campaigns/$CAMPAIGN_1_ID/contribute" "{\"amount\": 500, \"memberId\": \"$MEMBER_ID_1\"}" > /dev/null
  echo "  ✅ Added ₹500 contribution to Christmas Fund"

  if [ -n "$MEMBER_ID_2" ]; then
    call_api POST "/campaigns/$CAMPAIGN_1_ID/contribute" "{\"amount\": 750, \"memberId\": \"$MEMBER_ID_2\"}" > /dev/null
    echo "  ✅ Added ₹750 contribution to Christmas Fund"
  fi

  if [ -n "$MEMBER_ID_3" ]; then
    call_api POST "/campaigns/$CAMPAIGN_1_ID/contribute" "{\"amount\": 300, \"memberId\": \"$MEMBER_ID_3\"}" > /dev/null
    echo "  ✅ Added ₹300 contribution to Christmas Fund"
  fi

  # Add contributions to Campaign 2 if it exists
  if [ -n "$CAMPAIGN_2_ID" ] && [ "$CAMPAIGN_2_ID" != "null" ]; then
    call_api POST "/campaigns/$CAMPAIGN_2_ID/contribute" "{\"amount\": 1000, \"memberId\": \"$MEMBER_ID_1\"}" > /dev/null
    echo "  ✅ Added ₹1000 contribution to Building Fund"
  fi

  # Add contributions to Campaign 3 if it exists
  if [ -n "$CAMPAIGN_3_ID" ] && [ "$CAMPAIGN_3_ID" != "null" ] && [ -n "$MEMBER_ID_2" ]; then
    call_api POST "/campaigns/$CAMPAIGN_3_ID/contribute" "{\"amount\": 250, \"memberId\": \"$MEMBER_ID_2\"}" > /dev/null
    echo "  ✅ Added ₹250 contribution to Charity Drive"
  fi

  echo ""
fi

# 4. Create test Stothrakazhcha
echo "📅 Step 4: Creating test Stothrakazhcha..."

# Stothrakazhcha 1
STOTH_1=$(call_api POST "/stothrakazhcha" '{
  "weekNumber": 52,
  "year": 2024,
  "weekStartDate": "2024-12-23",
  "weekEndDate": "2024-12-29",
  "dueDate": "2024-12-29",
  "defaultAmount": 100,
  "amountType": "per_member",
  "status": "active"
}')

STOTH_1_ID=$(echo "$STOTH_1" | jq -r '.data._id // ._id' 2>/dev/null)
if [ -n "$STOTH_1_ID" ] && [ "$STOTH_1_ID" != "null" ]; then
  echo "  ✅ Created: Week 52, 2024 (ID: $STOTH_1_ID)"
else
  echo "  ⚠️  Week 52, 2024 already exists or failed"
fi

# Stothrakazhcha 2
STOTH_2=$(call_api POST "/stothrakazhcha" '{
  "weekNumber": 1,
  "year": 2025,
  "weekStartDate": "2024-12-30",
  "weekEndDate": "2025-01-05",
  "dueDate": "2025-01-05",
  "defaultAmount": 100,
  "amountType": "per_member",
  "status": "active"
}')

STOTH_2_ID=$(echo "$STOTH_2" | jq -r '.data._id // ._id' 2>/dev/null)
if [ -n "$STOTH_2_ID" ] && [ "$STOTH_2_ID" != "null" ]; then
  echo "  ✅ Created: Week 1, 2025 (ID: $STOTH_2_ID)"
else
  echo "  ⚠️  Week 1, 2025 already exists or failed"
fi

echo ""

# 5. Add contributions to Stothrakazhcha
if [ -n "$STOTH_1_ID" ] && [ "$STOTH_1_ID" != "null" ] && [ -n "$MEMBER_ID_1" ]; then
  echo "💸 Step 5: Adding contributions to Stothrakazhcha..."

  # Add contributions to Week 52
  call_api POST "/stothrakazhcha/$STOTH_1_ID/contribute" "{\"amount\": 100, \"memberId\": \"$MEMBER_ID_1\"}" > /dev/null
  echo "  ✅ Added ₹100 contribution to Week 52"

  if [ -n "$MEMBER_ID_2" ]; then
    call_api POST "/stothrakazhcha/$STOTH_1_ID/contribute" "{\"amount\": 150, \"memberId\": \"$MEMBER_ID_2\"}" > /dev/null
    echo "  ✅ Added ₹150 contribution to Week 52"
  fi

  if [ -n "$MEMBER_ID_3" ]; then
    call_api POST "/stothrakazhcha/$STOTH_1_ID/contribute" "{\"amount\": 100, \"memberId\": \"$MEMBER_ID_3\"}" > /dev/null
    echo "  ✅ Added ₹100 contribution to Week 52"
  fi

  # Add contributions to Week 1, 2025 if it exists
  if [ -n "$STOTH_2_ID" ] && [ "$STOTH_2_ID" != "null" ]; then
    call_api POST "/stothrakazhcha/$STOTH_2_ID/contribute" "{\"amount\": 120, \"memberId\": \"$MEMBER_ID_1\"}" > /dev/null
    echo "  ✅ Added ₹120 contribution to Week 1, 2025"

    if [ -n "$MEMBER_ID_2" ]; then
      call_api POST "/stothrakazhcha/$STOTH_2_ID/contribute" "{\"amount\": 100, \"memberId\": \"$MEMBER_ID_2\"}" > /dev/null
      echo "  ✅ Added ₹100 contribution to Week 1, 2025"
    fi
  fi

  echo ""
fi

# 6. Verify all data
echo "🔍 Step 6: Verifying data..."

# Get campaigns
CAMPAIGNS=$(call_api GET "/campaigns")
CAMPAIGN_COUNT=$(echo "$CAMPAIGNS" | jq -r '.data | length' 2>/dev/null || echo "0")
echo "  📊 Total Campaigns: $CAMPAIGN_COUNT"

# Get stothrakazhcha
STOTHRAKAZHCHAS=$(call_api GET "/stothrakazhcha")
STOTH_COUNT=$(echo "$STOTHRAKAZHCHAS" | jq -r '.data | length' 2>/dev/null || echo "0")
echo "  📊 Total Stothrakazhcha: $STOTH_COUNT"

# Get transactions
TRANSACTIONS=$(call_api GET "/transactions")
TRANSACTION_COUNT=$(echo "$TRANSACTIONS" | jq -r '.data | length' 2>/dev/null || echo "0")
echo "  📊 Total Transactions: $TRANSACTION_COUNT"

echo ""
echo "✨ Test data added successfully!"
echo ""
echo "📝 What to check:"
echo "  1. Go to /church-admin/dashboard/campaigns"
echo "  2. Click 'View Payments' on any campaign"
echo "  3. Go to /church-admin/dashboard/stothrakazhcha"
echo "  4. Click the green 'View Payments' icon"
echo "  5. Go to /church-admin/dashboard/transactions"
echo "  6. You should see all the contributions as transactions"
echo ""
