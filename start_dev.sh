#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Booting ScoolERP Development Servers"
echo "=========================================================="

# Cleanup routine when the user hits Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down all servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $CELERY_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Start Backend Django Server
echo "🐍 Starting Django Backend on port 8000..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# 2. Start Next.js Frontend Server
echo "🖥️  Starting Next.js Frontend on port 3000..."
cd frontend
# Attempt to load nvm to fix npm command not found
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if command -v npm &> /dev/null; then
    npm run dev &
    FRONTEND_PID=$!
else
    echo "⚠️ npm is STILL not found in PATH! Frontend will not start."
fi
cd ..

# 3. Start Celery Worker (Optional)
echo "🐇 Skipping Celery Worker (Redis not guaranteed to map on local terminal)..."

echo "=========================================================="
echo "✅ All Servers Running!"
echo "📍 Frontend URL: http://localhost:3000"
echo "📍 Backend URL:  http://localhost:8000/api"
echo "Press [Ctrl+C] to gracefully stop all processes."
echo "=========================================================="

# Keep script alive and stream logs
wait $FRONTEND_PID $BACKEND_PID $CELERY_PID
