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

# Install frontend dependencies if missing
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --prefix frontend
fi

# Install backend dependencies if missing
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --prefix backend
fi

# Stop any existing dashboard processes using the stop script
bash "$SCRIPT_DIR/stop_dashboard.sh"

# Wait until ports 3000, 3001, and 8000 are freed (max 10 seconds)
echo "Waiting for ports to be released..."
for i in $(seq 1 20); do
    BUSY=""
    for port in 3000 3001 8000; do
        if ss -tlnp 2>/dev/null | grep -q ":${port} " || lsof -i :"${port}" >/dev/null 2>&1; then
            BUSY="$BUSY $port"
        fi
    done
    if [ -z "$BUSY" ]; then
        echo "All ports are free."
        break
    fi
    if [ "$i" -eq 20 ]; then
        echo "WARNING: Ports$BUSY still in use after 10s. Forcing kill..."
        for port in 3000 3001 8000; do
            fuser -k "${port}/tcp" 2>/dev/null || true
        done
        sleep 1
    fi
    sleep 0.5
done

# Run backend and frontend in detached mode
# --raw is required to avoid concurrently's TTY detection issues when running under nohup
echo "Running dashboard services in detached mode..."
nohup npx concurrently --raw \
    "npm run dev --prefix frontend" \
    "npm run dev --prefix backend" \
    "cd backend/api && .venv/bin/uvicorn main:app --reload --port 8000" \
    > dashboard.log 2>&1 &
PID=$!

echo "Dashboard backends and frontends started in detached mode with PID $PID."
echo "Listening logs at $DASHBOARD_DIR/dashboard.log"
