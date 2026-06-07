#!/bin/sh
# Sends one lightweight read to Supabase so the free-tier project does not
# pause after 7 days of inactivity. Exits non-zero on failure so the run is
# visible as failed in `fly logs`.
set -e

echo "Pinging Supabase to keep the project active..."

code=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/products?select=id&limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "HTTP status: ${code}"

if [ "${code}" -ge 200 ] && [ "${code}" -lt 300 ]; then
  echo "Success — Supabase responded, inactivity timer reset."
  exit 0
else
  echo "Unexpected status ${code} — check secrets and table access."
  exit 1
fi
