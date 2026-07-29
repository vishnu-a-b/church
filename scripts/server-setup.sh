#!/usr/bin/env bash
# First-time server setup for the Church app.
# Run this ONCE on the server (same host that already runs edv) as root or with sudo.
#
# Assumes Node.js and PM2 are already installed (from setting up edv on this same
# server). This script only adds what the Church app needs on top of that:
# the project directory and first deploy. The client is a static Next.js
# export — nginx serves client/out/ directly off disk, no process/port for it.
#
# Does NOT touch nginx or SSL/certbot — that's handled manually. Once this app is
# running, point your nginx config at:
#   api.offerings.stmaryselthuruth.org  ->  127.0.0.1:5010        (church-api, proxied)
#   <your client domain>                ->  /home/projects/church/client/out  (served directly)
set -euo pipefail

PROJECT_DIR="/home/projects/church"
REPO_URL="git@github.com:vishnu-a-b/church.git"
PM2_LOG_DIR="/var/log/pm2"

echo "==> Checking Node.js / PM2 (should already be present from the edv setup)..."
command -v node >/dev/null || { echo "Node.js not found — install it first (see edv/scripts/server-setup.sh)"; exit 1; }
command -v pm2  >/dev/null || { echo "PM2 not found — install it first: npm install -g pm2"; exit 1; }

echo "==> Creating directories..."
mkdir -p "$PROJECT_DIR" "$PM2_LOG_DIR"

echo "==> Cloning repository..."
git clone "$REPO_URL" "$PROJECT_DIR"

echo "==> Before the first deploy, create $PROJECT_DIR/server/.env by hand with:"
echo "      JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRE, JWT_REFRESH_TOKEN_EXPIRE, REFRESH_TOKEN_SECRET"
echo "      CORS_ORIGIN, CLIENT_URL   (both = https://<your client domain>)"
echo "    deploy.sh checks these are present and refuses to run without them — it"
echo "    never manages them."
echo ""
echo "    Also set (not hard-checked, but the app needs them for those features):"
echo "      SMS_ENABLED, SMS_PROVIDER, FAST2SMS_API_KEY, SMS_SENDER_ID"
echo "      EMAIL_ENABLED, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USERNAME,"
echo "      EMAIL_PASSWORD, EMAIL_FROM"
echo "      EDV_BRIDGE_ENABLED, EDV_BRIDGE_API_URL"
echo ""
echo "==> The only secret GitHub Actions manages is MONGODB_URI (plus SSH_HOST/"
echo "    SSH_USER/SSH_KEY to reach this server) — set that one in GitHub, then"
echo "    trigger a deploy by pushing to main."
echo ""
echo "    Alternatively, to do the very first start by hand right now, export"
echo "    MONGODB_URI and run: bash $PROJECT_DIR/scripts/deploy.sh"
