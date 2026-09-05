#!/bin/sh
# Runs the harness from the host. Wraps `docker compose` so the exit code is the type-checker's
# and a leftover container never makes the next run report a stale result.
set -eu

cd "$(dirname "$0")"

if [ "${1:-}" = "--clean" ]; then
    echo "==> Dropping the download cache"
    docker compose down -v >/dev/null 2>&1 || true
fi

# Captured through `if` rather than `$?`: under `set -e` a failing check would exit here and the
# cleanup below would never run.
if docker compose run --rm check; then
    status=0
else
    status=$?
fi

docker compose down >/dev/null 2>&1 || true
exit "$status"
