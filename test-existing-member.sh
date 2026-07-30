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
echo "✅ Logged in"
echo ""

echo "🔍 Finding existing member with email: $EMAIL"
MEMBERS=$(curl -s -X GET "$API_URL/members" \
  -H "Authorization: Bearer $TOKEN")

MEMBER=$(echo $MEMBERS | jq -r ".data[] | select(.email == \"$EMAIL\")")
MEMBER_ID=$(echo $MEMBER | jq -r '._id')
MEMBER_NAME=$(echo $MEMBER | jq -r '.firstName + " " + .lastName')

if [ "$MEMBER_ID" = "null" ] || [ -z "$MEMBER_ID" ]; then
  echo "❌ Member not found"
  exit 1
fi

echo "✅ Found member: $MEMBER_NAME (ID: $MEMBER_ID)"
echo ""

echo "📊 Member Details:"
echo "$MEMBER" | jq '{
  firstName,
  lastName,
  email,
  isEmailVerified,
  emailNotificationsEnabled,
  uniqueId
}'
echo ""

read -p "Do you want to delete this member and create a new one? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🗑️  Deleting member..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/members/$MEMBER_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$DELETE_RESPONSE" | jq .
  
  if [ "$(echo $DELETE_RESPONSE | jq -r '.success')" = "true" ]; then
    echo "✅ Member deleted successfully"
    echo ""
    echo "Now run the creation script again: ./test-member-email.sh"
  else
    echo "❌ Failed to delete member"
  fi
else
  echo "Member kept. You can test with the existing member."
fi
