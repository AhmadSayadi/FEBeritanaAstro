#!/usr/bin/env bash
#
# One-command deploy for the VPS (Node standalone + PM2).
#
# Usage on the VPS, from the project root:
#   ./deploy.sh
#
# What it does:
#   1. git pull            — fetch the latest committed code
#   2. npm ci (if needed)  — reinstall deps only when package-lock changed
#   3. build (node target) — astro build -> dist/server/entry.mjs
#   4. pm2 restart         — reload the running app with the new build
#   5. health check        — confirm the local server answers 200
#
# Safe to re-run. Exits on the first error so a failed build never restarts
# the app with broken output.

set -euo pipefail

APP_NAME="beritana-astro"
# Local port the app listens on (Astro, behind Nginx). Matches ecosystem.config.cjs.
HEALTH_URL="http://127.0.0.1:20167/"

cd "$(dirname "$0")"

echo "==> [1/5] git pull"
BEFORE_LOCK="$(sha1sum package-lock.json 2>/dev/null | awk '{print $1}' || true)"
git pull --ff-only
AFTER_LOCK="$(sha1sum package-lock.json 2>/dev/null | awk '{print $1}' || true)"

echo "==> [2/5] dependencies"
if [ "$BEFORE_LOCK" != "$AFTER_LOCK" ]; then
  echo "    package-lock.json changed -> npm ci"
  npm ci
else
  echo "    lockfile unchanged -> skip install"
fi

echo "==> [3/5] build (DEPLOY_TARGET=node)"
DEPLOY_TARGET=node npm run build

echo "==> [4/5] pm2 restart $APP_NAME"
# --update-env picks up any changed .env/env values on restart.
pm2 restart "$APP_NAME" --update-env

echo "==> [5/5] health check $HEALTH_URL"
# Give the app a moment to come back up, then check it answers 200.
sleep 2
CODE="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "$HEALTH_URL" || echo 000)"
if [ "$CODE" = "200" ]; then
  echo "    OK: $APP_NAME is serving ($CODE)"
  pm2 save
  echo "==> Deploy complete."
else
  echo "    WARNING: health check returned $CODE (expected 200)."
  echo "    Check logs:  pm2 logs $APP_NAME --lines 50"
  exit 1
fi
