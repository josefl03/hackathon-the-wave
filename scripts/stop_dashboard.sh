#!/bin/bash
# Stop the dashboard backend and frontend processes cleanly

echo "Stopping any existing dashboard processes..."

# Kill Node-based processes
pkill -f "next-server" || true
pkill -f "next dev" || true
pkill -f "nodemon" || true
pkill -f "node server.js" || true

# Kill Python AI API process
pkill -f "uvicorn main:app" || true
pkill -f "uvicorn" || true

# Free ports robustly
fuser -k 3000/tcp || true
fuser -k 3001/tcp || true
fuser -k 8000/tcp || true

# Remove backend and frontend caches/locks if needed, to avoid stalled starts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
rm -rf "$SCRIPT_DIR/../dashboard/frontend/.next"

echo "Dashboard stopped successfully."
