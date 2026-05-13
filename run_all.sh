#!/bin/bash

# Smart Home Sense - Full Stack Start Script
# Starts both backend and frontend in parallel

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Smart Home Sense - Full Stack (Backend + Frontend)       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="$(dirname "$0")"
cd "$PROJECT_DIR"

# Check if backend script exists
if [ ! -f "run_backend.sh" ]; then
    echo "❌ run_backend.sh not found!"
    exit 1
fi

# Check if frontend script exists
if [ ! -f "run_frontend.sh" ]; then
    echo "❌ run_frontend.sh not found!"
    exit 1
fi

# Make scripts executable
chmod +x run_backend.sh run_frontend.sh

echo "🔄 Starting both services..."
echo ""

# Start backend in background
echo "📍 Starting backend (http://127.0.0.1:8000)..."
./run_backend.sh &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend in background
echo "📍 Starting frontend (http://127.0.0.1:5173)..."
./run_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   ✅ BOTH SERVICES RUNNING                    ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Backend:  http://127.0.0.1:8000                             ║"
echo "║  Frontend: http://127.0.0.1:5173                             ║"
echo "║                                                               ║"
echo "║  Backend PID:  $BACKEND_PID                                       ║"
echo "║  Frontend PID: $FRONTEND_PID                                      ║"
echo "║                                                               ║"
echo "║  To stop all:  Press Ctrl+C (or kill $BACKEND_PID $FRONTEND_PID)  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
