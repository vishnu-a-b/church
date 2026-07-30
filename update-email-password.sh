#!/bin/bash

echo "📧 Update Gmail App Password"
echo "============================"
echo ""
echo "Please follow these steps:"
echo "1. Go to: https://myaccount.google.com/apppasswords"
echo "2. Generate a new App Password for 'Church Wallet System'"
echo "3. Copy the 16-character password (remove spaces)"
echo ""
read -p "Enter the new App Password (without spaces): " NEW_PASSWORD

if [ -z "$NEW_PASSWORD" ]; then
  echo "❌ Password cannot be empty"
  exit 1
fi

# Remove any spaces just in case
NEW_PASSWORD=$(echo "$NEW_PASSWORD" | tr -d ' ')

echo ""
echo "Updating .env file..."

# Update the .env file
sed -i '' "s/^EMAIL_PASSWORD=.*/EMAIL_PASSWORD=$NEW_PASSWORD/" /Users/vishnuab/Official/Church/server/.env

echo "✅ Password updated in .env file"
echo ""
echo "Testing email connection..."
echo ""

cd /Users/vishnuab/Official/Church/server
npx ts-node src/test-email.ts
