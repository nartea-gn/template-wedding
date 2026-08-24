#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SMOKE_TEST_URL:-}" ]; then
  echo "SMOKE_TEST_URL is required"
  exit 1
fi

for path in / /rsvp /admin; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$SMOKE_TEST_URL$path")
  if [ "$status" != "200" ]; then
    echo "Smoke test failed for $path (HTTP $status)"
    exit 1
  fi
  echo "Smoke test passed for $path (HTTP $status)"
done
