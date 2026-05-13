#!/bin/bash

# Smart Home Sense - Backend Server Start Script
# Starts FastAPI backend server on http://127.0.0.1:8000

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Smart Home Sense - Backend Server                        ║"
echo "║     Starting FastAPI on http://127.0.0.1:8000                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "📝 Please run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Check if model exists
if [ ! -f "models/smart_home_model.pkl" ]; then
    echo "⚠️  Model file not found! Training model first..."
    python models/model.py
fi

# Start backend server
echo "🚀 Starting backend server..."
echo ""
echo "Available endpoints:"
echo "  • Health check:        GET  http://127.0.0.1:8000/health"
echo "  • API docs:            GET  http://127.0.0.1:8000/docs"
echo "  • Telemetry analysis:  POST http://127.0.0.1:8000/api/v1/telemetry/analyze"
echo ""
echo "To stop server: Press Ctrl+C"
echo ""

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
