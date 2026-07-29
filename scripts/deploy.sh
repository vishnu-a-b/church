#!/usr/bin/env bash
# deploy.sh — runs on the server to deploy the Church app
# Usage: bash scripts/deploy.sh
#
# The ONLY secret this script gets from GitHub Actions is MONGODB_URI —
# everything else (JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRE, JWT_REFRESH_TOKEN_EXPIRE,
# REFRESH_TOKEN_SECRET, CORS_ORIGIN, CLIENT_URL, SMS_*, EMAIL_*, EDV_BRIDGE_*)
# must already be set once, by hand, in server/.env on the server. This script
# never writes or touches any of those — it only upserts MONGODB_URI/PORT/NODE_ENV.
set -euo pipefail

PROJECT_DIR="/home/projects/church"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
LOG_DIR="/var/log/pm2"
API_URL="https://api.offerings.stmaryselthuruth.org"

# git pull happens FIRST, before anything else — including the env-var guard
# checks below. If a future fix changes what's required/how it's validated,
# this ordering means a bad/outdated guard on disk can never block the pull
# that would fix it — it always gets a chance to update itself before failing.
echo "▶ [1/6] Pulling latest code..."
cd "$PROJECT_DIR"
git pull --rebase origin main

: "${MONGODB_URI:?MONGODB_URI is not set}"

# Upserts KEY=VALUE into FILE — replaces an existing "KEY=..." line in place,
# or appends if missing. Any line whose key isn't passed to this function
# (e.g. the manually-managed JWT_* / REFRESH_TOKEN_SECRET / CORS_ORIGIN /
# CLIENT_URL lines) is left alone.
set_env_var() {
  local key="$1" value="$2" file="$3"
  # Rebuild rather than sed-substitute: sed's replacement treats `&`/`\` specially,
  # which would corrupt values like MONGODB_URI (its query string contains "&").
  if [ -f "$file" ] && grep -q "^${key}=" "$file"; then
    grep -v "^${key}=" "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
  fi
  echo "${key}=${value}" >> "$file"
}

echo "▶ [2/6] Updating server/.env..."
touch "$SERVER_DIR/.env"
for required_key in JWT_SECRET REFRESH_TOKEN_SECRET CORS_ORIGIN CLIENT_URL; do
  grep -q "^${required_key}=" "$SERVER_DIR/.env" || {
    echo "❌ ${required_key} is missing from $SERVER_DIR/.env — set it there manually once (this script does not manage it)."
    exit 1
  }
done

set_env_var PORT 5010 "$SERVER_DIR/.env"
set_env_var NODE_ENV production "$SERVER_DIR/.env"
set_env_var MONGODB_URI "${MONGODB_URI}" "$SERVER_DIR/.env"

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
                          # nginx serves this directory directly — no process/port for it

echo "▶ [6/6] Reloading PM2 (church-api only — the client has no process to manage)..."
mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"
pm2 reload ecosystem.config.js --env production --update-env 2>/dev/null \
  || pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "✅  Deploy complete."
pm2 list
