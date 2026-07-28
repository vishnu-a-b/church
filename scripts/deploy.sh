#!/usr/bin/env bash
# deploy.sh — runs on the server to deploy the Church app
# Usage: bash scripts/deploy.sh
# Expects all app secrets (MONGODB_URI, JWT_SECRET, ...) to already be exported
# in the environment — the GitHub Actions workflow exports them over SSH before
# calling this script. Unlike edv, this script (re)writes the .env files on every
# deploy so GitHub secrets stay the single source of truth.
set -euo pipefail

PROJECT_DIR="/home/projects/church"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
LOG_DIR="/var/log/pm2"
API_URL="https://api.offerings.stmaryselthuruth.org"

: "${MONGODB_URI:?MONGODB_URI is not set}"
: "${JWT_SECRET:?JWT_SECRET is not set}"
: "${CLIENT_DOMAIN:?CLIENT_DOMAIN is not set}"

echo "▶ [1/6] Pulling latest code..."
cd "$PROJECT_DIR"
git pull --rebase origin main

echo "▶ [2/6] Writing server/.env..."
cat > "$SERVER_DIR/.env" <<EOF
PORT=5010
NODE_ENV=production

MONGODB_URI=${MONGODB_URI}

JWT_SECRET=${JWT_SECRET}
JWT_ACCESS_TOKEN_EXPIRE=${JWT_ACCESS_TOKEN_EXPIRE:-30m}
JWT_REFRESH_TOKEN_EXPIRE=${JWT_REFRESH_TOKEN_EXPIRE:-365d}
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}

SMS_ENABLED=${SMS_ENABLED:-false}
SMS_PROVIDER=${SMS_PROVIDER:-fast2sms}
FAST2SMS_API_KEY=${FAST2SMS_API_KEY:-}
SMS_SENDER_ID=${SMS_SENDER_ID:-CHURCH}

CORS_ORIGIN=https://${CLIENT_DOMAIN}
CLIENT_URL=https://${CLIENT_DOMAIN}

EMAIL_ENABLED=${EMAIL_ENABLED:-false}
EMAIL_HOST=${EMAIL_HOST:-smtp.gmail.com}
EMAIL_PORT=${EMAIL_PORT:-587}
EMAIL_SECURE=${EMAIL_SECURE:-false}
EMAIL_USERNAME=${EMAIL_USERNAME:-}
EMAIL_PASSWORD=${EMAIL_PASSWORD:-}
EMAIL_FROM=${EMAIL_FROM:-}

EDV_BRIDGE_ENABLED=${EDV_BRIDGE_ENABLED:-false}
EDV_BRIDGE_API_URL=${EDV_BRIDGE_API_URL:-}
EOF

echo "▶ [3/6] Building server..."
cd "$SERVER_DIR"
npm ci
npm run build            # tsc → dist/

echo "▶ [4/6] Writing client/.env.production..."
cat > "$CLIENT_DIR/.env.production" <<EOF
NEXT_PUBLIC_API_URL=${API_URL}/api
EOF

echo "▶ [5/6] Building client (static export)..."
cd "$CLIENT_DIR"
npm ci
npm run build            # next build (output: 'export') → out/

echo "▶ [6/6] Reloading PM2..."
mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"
pm2 reload ecosystem.config.js --env production --update-env 2>/dev/null \
  || pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "✅  Deploy complete."
pm2 list
