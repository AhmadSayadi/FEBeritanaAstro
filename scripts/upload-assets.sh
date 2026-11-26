#!/usr/bin/env bash
#
# Upload the built /_astro/* files to the R2 bucket behind assets.beritana.com.
#
# Run AFTER `npm run build` and BEFORE restarting the app, so the new HTML never
# points at files the CDN doesn't have yet. deploy.sh does this automatically.
#
# Needs rclone (https://rclone.org/install/) and these keys in .env:
#   ASSETS_PREFIX=https://assets.beritana.com
#   R2_ACCOUNT_ID=...           Cloudflare account ID
#   R2_ACCESS_KEY_ID=...        R2 API token (Object Read & Write on the bucket)
#   R2_SECRET_ACCESS_KEY=...
#   R2_ASSETS_BUCKET=...        bucket name connected to assets.beritana.com
#
# Uses `copy --ignore-existing`, never `sync`: file names are content-hashed, so
# an existing name never changes, and old files stay available for visitors
# still holding HTML from the previous deploy.

set -euo pipefail
cd "$(dirname "$0")/.."

# Read one KEY from .env without sourcing the whole file (it has inline comments).
envval() {
  grep -E "^$1=" .env 2>/dev/null | tail -n1 | cut -d= -f2- | sed -e 's/[[:space:]]#.*$//' -e 's/\r$//' -e 's/^"//' -e 's/"$//' || true
}

ASSETS_PREFIX="${ASSETS_PREFIX:-$(envval ASSETS_PREFIX)}"
if [ -z "$ASSETS_PREFIX" ]; then
  echo "    ASSETS_PREFIX empty -> assets served by the app itself, skip upload"
  exit 0
fi

for k in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_ASSETS_BUCKET; do
  if [ -z "${!k:-}" ]; then declare "$k=$(envval "$k")"; fi
  if [ -z "${!k}" ]; then echo "ERROR: $k is not set in .env" >&2; exit 1; fi
done

command -v rclone >/dev/null || { echo "ERROR: rclone not installed (curl https://rclone.org/install.sh | sudo bash)" >&2; exit 1; }
[ -d dist/client/_astro ] || { echo "ERROR: dist/client/_astro missing, run the build first" >&2; exit 1; }

# rclone remote "r2" defined entirely through env vars (no config file).
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "    uploading dist/client/_astro -> r2:${R2_ASSETS_BUCKET}/_astro"
rclone copy dist/client/_astro "r2:${R2_ASSETS_BUCKET}/_astro" \
  --ignore-existing \
  --s3-no-check-bucket \
  --header-upload "Cache-Control: public, max-age=31536000, immutable" \
  --transfers 16 \
  --stats-one-line --stats 5s

# Spot-check one file through the public domain before the app switches over.
SAMPLE="$(cd dist/client && find _astro -type f -name '*.css' | head -n1)"
[ -n "$SAMPLE" ] || SAMPLE="$(cd dist/client && find _astro -type f | head -n1)"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "${ASSETS_PREFIX}/${SAMPLE}" || echo 000)"
if [ "$CODE" != "200" ]; then
  echo "ERROR: ${ASSETS_PREFIX}/${SAMPLE} returned $CODE (expected 200). Not switching." >&2
  exit 1
fi
echo "    OK: ${ASSETS_PREFIX}/${SAMPLE} -> 200"
