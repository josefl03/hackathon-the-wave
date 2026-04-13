#!/bin/bash
# Start the dashboard backend and frontend via the existing package.json dev script in detached mode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR/../dashboard"

cd "$DASHBOARD_DIR" || { echo "Failed to navigate to dashboard directory"; exit 1; }

# Install root dependencies if concurrently is not installed
if [ ! -d "node_modules" ]; then
    echo "Installing dashboard dependencies..."
    npm install
fi

# Stop any existing dashboard processes using the newly created stop script
bash "$SCRIPT_DIR/stop_dashboard.sh"

# Run backend and frontend in detached mode
echo "Running 'npm run dev' in detached mode..."
nohup npm run dev > dashboard.log 2>&1 &
PID=$!

echo "Dashboard backends and frontends started in detached mode with PID $PID."
echo "Listening logs at $DASHBOARD_DIR/dashboard.log"
