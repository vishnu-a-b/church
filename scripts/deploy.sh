#!/usr/bin/env bash
# deploy.sh — runs on the server to deploy the Church app
# Usage: bash scripts/deploy.sh
# Expects most app secrets (MONGODB_URI, SMS_*, EMAIL_*, EDV_BRIDGE_*, ...) to
# already be exported in the environment — the GitHub Actions workflow exports
# them over SSH before calling this script, and those keys get upserted into
# server/.env on every deploy so GitHub secrets stay the source of truth for them.
#
# JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRE, JWT_REFRESH_TOKEN_EXPIRE, and
# REFRESH_TOKEN_SECRET are deliberately NOT managed here — they must already be
# set once, by hand, in server/.env on the server, and this script leaves them
# untouched on every subsequent deploy.
set -euo pipefail

PROJECT_DIR="/home/projects/church"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
LOG_DIR="/var/log/pm2"
API_URL="https://api.offerings.stmaryselthuruth.org"

: "${MONGODB_URI:?MONGODB_URI is not set}"
: "${CLIENT_DOMAIN:?CLIENT_DOMAIN is not set}"

# Upserts KEY=VALUE into FILE — replaces an existing "KEY=..." line in place,
# or appends if missing. Any line whose key isn't passed to this function
# (e.g. the manually-managed JWT_* / REFRESH_TOKEN_SECRET lines) is left alone.
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

echo "▶ [1/6] Pulling latest code..."
cd "$PROJECT_DIR"
git pull --rebase origin main

echo "▶ [2/6] Updating server/.env..."
touch "$SERVER_DIR/.env"
for required_key in JWT_SECRET REFRESH_TOKEN_SECRET; do
  grep -q "^${required_key}=" "$SERVER_DIR/.env" || {
    echo "❌ ${required_key} is missing from $SERVER_DIR/.env — set it there manually once (this script does not manage it)."
    exit 1
  }
done

set_env_var PORT 5010 "$SERVER_DIR/.env"
set_env_var NODE_ENV production "$SERVER_DIR/.env"
set_env_var MONGODB_URI "${MONGODB_URI}" "$SERVER_DIR/.env"
set_env_var SMS_ENABLED "${SMS_ENABLED:-false}" "$SERVER_DIR/.env"
set_env_var SMS_PROVIDER "${SMS_PROVIDER:-fast2sms}" "$SERVER_DIR/.env"
set_env_var FAST2SMS_API_KEY "${FAST2SMS_API_KEY:-}" "$SERVER_DIR/.env"
set_env_var SMS_SENDER_ID "${SMS_SENDER_ID:-CHURCH}" "$SERVER_DIR/.env"
set_env_var CORS_ORIGIN "https://${CLIENT_DOMAIN}" "$SERVER_DIR/.env"
set_env_var CLIENT_URL "https://${CLIENT_DOMAIN}" "$SERVER_DIR/.env"
set_env_var EMAIL_ENABLED "${EMAIL_ENABLED:-false}" "$SERVER_DIR/.env"
set_env_var EMAIL_HOST "${EMAIL_HOST:-smtp.gmail.com}" "$SERVER_DIR/.env"
set_env_var EMAIL_PORT "${EMAIL_PORT:-587}" "$SERVER_DIR/.env"
set_env_var EMAIL_SECURE "${EMAIL_SECURE:-false}" "$SERVER_DIR/.env"
set_env_var EMAIL_USERNAME "${EMAIL_USERNAME:-}" "$SERVER_DIR/.env"
set_env_var EMAIL_PASSWORD "${EMAIL_PASSWORD:-}" "$SERVER_DIR/.env"
set_env_var EMAIL_FROM "${EMAIL_FROM:-}" "$SERVER_DIR/.env"
set_env_var EDV_BRIDGE_ENABLED "${EDV_BRIDGE_ENABLED:-false}" "$SERVER_DIR/.env"
set_env_var EDV_BRIDGE_API_URL "${EDV_BRIDGE_API_URL:-}" "$SERVER_DIR/.env"

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
