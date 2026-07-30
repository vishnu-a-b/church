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
echo "✅ Logged in successfully"
echo ""

# Find and delete existing member
echo "🔍 Finding and deleting existing member..."
MEMBERS=$(curl -s -X GET "$API_URL/members" -H "Authorization: Bearer $TOKEN")
MEMBER_ID=$(echo $MEMBERS | jq -r ".data[] | select(.email == \"$EMAIL\") | ._id")

if [ "$MEMBER_ID" != "null" ] && [ ! -z "$MEMBER_ID" ]; then
  curl -s -X DELETE "$API_URL/members/$MEMBER_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
  echo "✅ Deleted existing member"
else
  echo "ℹ️  No existing member found"
fi
echo ""

# Get data for new member
echo "📋 Fetching hierarchy data..."
CHURCH=$(curl -s -X GET "$API_URL/churches" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
CHURCH_ID=$(echo $CHURCH | jq -r '._id')
CHURCH_NAME=$(echo $CHURCH | jq -r '.name')

UNIT=$(curl -s -X GET "$API_URL/units?churchId=$CHURCH_ID" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
UNIT_ID=$(echo $UNIT | jq -r '._id')
UNIT_NAME=$(echo $UNIT | jq -r '.name')

BAVANA=$(curl -s -X GET "$API_URL/bavanakutayimas?unitId=$UNIT_ID" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
BAVANA_ID=$(echo $BAVANA | jq -r '._id')
BAVANA_NAME=$(echo $BAVANA | jq -r '.name')

HOUSE=$(curl -s -X GET "$API_URL/houses?bavanakutayimaId=$BAVANA_ID" -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
HOUSE_ID=$(echo $HOUSE | jq -r '._id')
HOUSE_NAME=$(echo $HOUSE | jq -r '.familyName')

echo "   Church: $CHURCH_NAME"
echo "   Unit: $UNIT_NAME"
echo "   Bavanakutayima: $BAVANA_NAME"
echo "   House: $HOUSE_NAME"
echo ""

# Create new member
echo "👤 Creating new test member..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"churchId\": \"$CHURCH_ID\",
    \"unitId\": \"$UNIT_ID\",
    \"bavanakutayimaId\": \"$BAVANA_ID\",
    \"houseId\": \"$HOUSE_ID\",
    \"firstName\": \"Vishnu\",
    \"lastName\": \"A B\",
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

SUCCESS=$(echo $CREATE_RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  MEMBER_ID=$(echo $CREATE_RESPONSE | jq -r '.data._id')
  UNIQUE_ID=$(echo $CREATE_RESPONSE | jq -r '.data.uniqueId')
  echo "✅ Member created successfully!"
  echo ""
  echo "📧 WELCOME EMAIL SENT!"
  echo ""
  echo "📬 Check your email inbox: $EMAIL"
  echo "   From: Church Wallet System <sbnctrl@gmail.com>"
  echo "   Subject: Welcome to Church Wallet System - Please Verify Your Email"
  echo ""
  echo "Member Details:"
  echo "   ID: $MEMBER_ID"
  echo "   Hierarchical Number: $UNIQUE_ID"
  echo "   Church: $CHURCH_NAME"
  echo "   Unit: $UNIT_NAME"
  echo "   Bavanakutayima: $BAVANA_NAME"
  echo "   House: $HOUSE_NAME"
  echo ""
  echo "📋 Next Steps:"
  echo "1. Check your email for the welcome message"
  echo "2. Click the verification link in the email"
  echo "3. Enable email notifications"
  echo "4. Create a test transaction to receive notification"
  echo ""
  echo "🔗 Verification page: http://localhost:3000/verify-email?token=..."
else
  echo "❌ Member creation failed"
  echo $CREATE_RESPONSE | jq .
fi
