#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BINARY_PATH="src/generated/prisma/libquery_engine-darwin-arm64.dylib.node"

cd "$ROOT_DIR"

if [ ! -f "$BINARY_PATH" ]; then
  echo "No binary found at $BINARY_PATH"
  exit 0
fi

echo "Removing $BINARY_PATH from git index and filesystem..."
git rm --cached "$BINARY_PATH" || true
rm -f "$BINARY_PATH"

git add .gitignore || true
git commit -m "chore: remove macOS Prisma query engine binary; let CI install proper engine" || {
  echo "Nothing to commit (maybe already removed)."
  exit 0
}

echo "Committed. Please push to remote: git push"
