#!/bin/bash

# Smart Home Sense - Frontend Server Start Script
# Starts Vite React dev server on http://127.0.0.1:5173

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Smart Home Sense - Frontend Server                       ║"
echo "║     Starting Vite on http://127.0.0.1:5173                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start frontend dev server
echo "🚀 Starting frontend server..."
echo ""
echo "Access at: http://127.0.0.1:5173"
echo ""
echo "Backend API expected at: http://127.0.0.1:8000"
echo "Make sure backend is running before using the app!"
echo ""
echo "To stop server: Press Ctrl+C"
echo ""

npm run dev
