#!/bin/bash

# Dashkit Development Server Launcher
# This script starts both backend and frontend servers in separate terminals

echo "🚀 Starting Dashkit Development Servers..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Backend Server in new Git Bash terminal
echo "📦 Launching Backend Server (Port 3003)..."
start "Dashkit Backend" bash -c "cd '$SCRIPT_DIR/Dashkit_backend' && echo '🔧 Backend Server Starting...' && echo '📍 Location: $PWD' && echo '' && npm run dev; exec bash"

# Wait a moment before starting frontend
sleep 2

# Start Frontend Server in new Git Bash terminal
echo "🎨 Launching Frontend Server (Port 4200)..."
start "Dashkit Frontend" bash -c "cd '$SCRIPT_DIR/Dashkit_shop_frontend' && echo '🎨 Frontend Server Starting...' && echo '📍 Location: $PWD' && echo '' && npm start; exec bash"

echo ""
echo "✅ Both servers are launching in separate terminals!"
echo ""
echo "Backend:  http://localhost:3003"
echo "Frontend: http://localhost:4200"
echo ""
echo "Press Ctrl+C in each terminal to stop the servers."
