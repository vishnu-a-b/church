#!/usr/bin/env bash
# First-time server setup for the Church app.
# Run this ONCE on the server (same host that already runs edv) as root or with sudo.
#
# Assumes Node.js and PM2 are already installed (from setting up edv on this same
# server). This script only adds what the Church app needs on top of that:
# `serve` (to host the Next.js static export) and the project directory/first deploy.
#
# Does NOT touch nginx or SSL/certbot — that's handled manually. Once this app is
# running, point your nginx config at:
#   api.offerings.stmaryselthuruth.org  ->  127.0.0.1:5010   (church-api)
#   <your client domain>                ->  127.0.0.1:5011   (church-web)
set -euo pipefail

PROJECT_DIR="/home/projects/church"
REPO_URL="git@github.com:vishnu-a-b/church.git"
PM2_LOG_DIR="/var/log/pm2"

echo "==> Checking Node.js / PM2 (should already be present from the edv setup)..."
command -v node >/dev/null || { echo "Node.js not found — install it first (see edv/scripts/server-setup.sh)"; exit 1; }
command -v pm2  >/dev/null || { echo "PM2 not found — install it first: npm install -g pm2"; exit 1; }

echo "==> Installing 'serve' (hosts the Next.js static export)..."
npm install -g serve

echo "==> Creating directories..."
mkdir -p "$PROJECT_DIR" "$PM2_LOG_DIR"

echo "==> Cloning repository..."
git clone "$REPO_URL" "$PROJECT_DIR"

echo "==> Before the first deploy, create $PROJECT_DIR/server/.env by hand with:"
echo "      JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRE, JWT_REFRESH_TOKEN_EXPIRE, REFRESH_TOKEN_SECRET"
echo "    deploy.sh will refuse to run without these — it never manages them."
echo ""
echo "==> Then set the required GitHub secrets (see plan/README) and trigger a deploy"
echo "    by pushing to main — the Action will build and start both processes."
echo ""
echo "    Alternatively, to do the very first start by hand right now, export the"
echo "    same env vars deploy.sh expects (MONGODB_URI, CLIENT_DOMAIN, ...)"
echo "    and then run: bash $PROJECT_DIR/scripts/deploy.sh"
