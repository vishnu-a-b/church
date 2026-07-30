#!/bin/bash

API_URL="http://localhost:3001/api"
EMAIL="vishnuab1207@gmail.com"

echo "📧 Test Transaction Email Notification"
echo "======================================"
echo ""

# Login
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@church.com", "password": "SuperAdmin@123"}' | jq -r '.accessToken')

echo "✅ Logged in"
echo ""

# Find the member
echo "🔍 Finding member with email: $EMAIL"
MEMBER=$(curl -s -X GET "$API_URL/members" -H "Authorization: Bearer $TOKEN" | jq -r ".data[] | select(.email == \"$EMAIL\")")
MEMBER_ID=$(echo $MEMBER | jq -r '._id')
MEMBER_NAME=$(echo $MEMBER | jq -r '.firstName + " " + .lastName')
CHURCH_ID=$(echo $MEMBER | jq -r '.churchId')
UNIT_ID=$(echo $MEMBER | jq -r '.unitId')
HOUSE_ID=$(echo $MEMBER | jq -r '.houseId')

echo "✅ Found: $MEMBER_NAME (ID: $MEMBER_ID)"
echo ""

echo "📋 Current Email Settings:"
echo "   Email Verified: $(echo $MEMBER | jq -r '.isEmailVerified')"
echo "   Notifications Enabled: $(echo $MEMBER | jq -r '.emailNotificationsEnabled')"
echo ""

IS_VERIFIED=$(echo $MEMBER | jq -r '.isEmailVerified')
NOTIF_ENABLED=$(echo $MEMBER | jq -r '.emailNotificationsEnabled')

if [ "$IS_VERIFIED" = "false" ]; then
  echo "⚠️  Email is NOT verified!"
  echo "   Please check your email and click the verification link first."
  echo "   Then come back and run this script again."
  echo ""
  exit 0
fi

if [ "$NOTIF_ENABLED" = "false" ]; then
  echo "⚠️  Email notifications are DISABLED!"
  echo "   Please enable notifications from the verification page."
  echo "   Visit the verification link in your email and enable notifications."
  echo ""
  exit 0
fi

echo "✅ Email is verified and notifications are enabled!"
echo ""
echo "💳 Creating test transaction..."

RECEIPT_NUM="TEST-$(date +%s)"

TRANSACTION=$(curl -s -X POST "$API_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"receiptNumber\": \"$RECEIPT_NUM\",
    \"transactionType\": \"dashamansham\",
    \"contributionMode\": \"fixed\",
    \"distribution\": \"member_only\",
    \"memberAmount\": 100,
    \"houseAmount\": 0,
    \"totalAmount\": 100,
    \"memberId\": \"$MEMBER_ID\",
    \"houseId\": \"$HOUSE_ID\",
    \"unitId\": \"$UNIT_ID\",
    \"churchId\": \"$CHURCH_ID\",
    \"paymentDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
    \"paymentMethod\": \"cash\",
    \"notes\": \"Test transaction for email notification\",
    \"createdBy\": \"$MEMBER_ID\"
  }")

SUCCESS=$(echo $TRANSACTION | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Transaction created successfully!"
  echo ""
  echo "📧 TRANSACTION EMAIL SENT!"
  echo ""
  echo "📬 Check your email inbox: $EMAIL"
  echo "   Subject: Transaction Receipt - $RECEIPT_NUM"
  echo ""
  echo "Transaction Details:"
  echo $TRANSACTION | jq '.data | {receiptNumber, transactionType, totalAmount, paymentMethod}'
else
  echo "❌ Transaction creation failed:"
  echo $TRANSACTION | jq .
fi
