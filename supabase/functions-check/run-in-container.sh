#!/bin/sh
# Entrypoint of the `check` service. Kept separate from the compose file so the command is
# readable and can report what it looked at before it fails.
set -eu

echo "==> $(deno --version | head -1)"
echo

files=$(find /functions -name '*.ts' | sort)

if [ -z "$files" ]; then
    echo "No .ts files under /functions. The mount is wrong, so a green run would mean nothing."
    exit 1
fi

echo "==> Files to check:"
echo "$files" | sed 's|^|    |'
echo

# `-exec ... +` so every file goes to a single invocation and the module graph is resolved once.
find /functions -name '*.ts' -exec deno check {} +

echo
echo "==> Type-check passed."
