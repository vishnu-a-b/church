#!/bin/bash

API_URL="http://localhost:3001/api"
EMAIL="vishnuab1207@gmail.com"

echo "🔐 Logging in as super admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@church.com",
    "password": "SuperAdmin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response:"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

echo "📋 Fetching existing data..."

# Get first church
CHURCH=$(curl -s -X GET "$API_URL/churches" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')

CHURCH_ID=$(echo $CHURCH | jq -r '._id')
CHURCH_NAME=$(echo $CHURCH | jq -r '.name')

echo "   Church: $CHURCH_NAME ($CHURCH_ID)"

# Get first unit
UNIT=$(curl -s -X GET "$API_URL/units?churchId=$CHURCH_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')

UNIT_ID=$(echo $UNIT | jq -r '._id')
UNIT_NAME=$(echo $UNIT | jq -r '.name')

echo "   Unit: $UNIT_NAME ($UNIT_ID)"

# Get first bavanakutayima
BAVANA=$(curl -s -X GET "$API_URL/bavanakutayimas?unitId=$UNIT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')

BAVANA_ID=$(echo $BAVANA | jq -r '._id')
BAVANA_NAME=$(echo $BAVANA | jq -r '.name')

echo "   Bavanakutayima: $BAVANA_NAME ($BAVANA_ID)"

# Get first house
HOUSE=$(curl -s -X GET "$API_URL/houses?bavanakutayimaId=$BAVANA_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')

HOUSE_ID=$(echo $HOUSE | jq -r '._id')
HOUSE_NAME=$(echo $HOUSE | jq -r '.familyName')

echo "   House: $HOUSE_NAME ($HOUSE_ID)"
echo ""

if [ "$HOUSE_ID" = "null" ] || [ -z "$HOUSE_ID" ]; then
  echo "❌ Could not find required data (church/unit/bavanakutayima/house)"
  exit 1
fi

echo "👤 Creating test member with email: $EMAIL"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"churchId\": \"$CHURCH_ID\",
    \"unitId\": \"$UNIT_ID\",
    \"bavanakutayimaId\": \"$BAVANA_ID\",
    \"houseId\": \"$HOUSE_ID\",
    \"firstName\": \"Vishnu\",
    \"lastName\": \"Test\",
    \"gender\": \"male\",
    \"email\": \"$EMAIL\",
    \"phone\": \"9876543210\",
    \"baptismName\": \"Vishnu\",
    \"relationToHead\": \"head\",
    \"isActive\": true,
    \"smsPreferences\": {
      \"enabled\": true,
      \"paymentNotifications\": true,
      \"receiptNotifications\": true
    }
  }")

echo "Response:"
echo $CREATE_RESPONSE | jq .

SUCCESS=$(echo $CREATE_RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  MEMBER_ID=$(echo $CREATE_RESPONSE | jq -r '.data._id')
  UNIQUE_ID=$(echo $CREATE_RESPONSE | jq -r '.data.uniqueId')
  echo ""
  echo "✅ Member created successfully!"
  echo "   Member ID: $MEMBER_ID"
  echo "   Hierarchical ID: $UNIQUE_ID"
  echo ""
  echo "📧 Check your email ($EMAIL) for the welcome message!"
  echo "   Look for an email from: Church Wallet System <sbnctrl@gmail.com>"
  echo ""
  echo "🔗 The email will contain a verification link like:"
  echo "   http://localhost:3000/verify-email?token=..."
else
  echo ""
  echo "❌ Member creation failed"
  ERROR=$(echo $CREATE_RESPONSE | jq -r '.error // .message // "Unknown error"')
  echo "   Error: $ERROR"
fi
