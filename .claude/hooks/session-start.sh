#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies
npm install

# Start Next.js dev server in background on port 3000
nohup npm run dev -- --port 3000 > /tmp/nextjs-dev.log 2>&1 &

echo "Dev server starting on port 3000..."
