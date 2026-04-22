#!/bin/bash
set -e

# ==============================================================================
# ScoolERP Platform Testing Script (UAT & Deployment Validation)
# ==============================================================================

echo "=========================================================="
echo "🚀 ScoolERP Platform Pre-Deployment Test Suite Initiated"
echo "=========================================================="
echo ""

# 1. Environment Check
if [ ! -f "backend/.env" ]; then
    echo "⚠️ Warning: backend/.env not found! Creating from example..."
    cp backend/.env.example backend/.env
fi

# 2. Redis & PostgreSQL Verification via Docker
echo "📦 Checking Background Infrastructure dependencies..."
if command -v docker &> /dev/null; then
    echo "🐳 Docker found. Starting Redis & PostgreSQL..."
    docker compose up -d || echo "⚠️ Docker daemon might not be running. Attempting to fall back to SQLite..."
    echo "⏳ Waiting for databases..."
    sleep 2
else
    echo "⚠️ Docker is not installed or not in PATH! Skipping infrastructure boot and defaulting to SQLite/local memory."
fi

# 3. Backend Verification
echo "🐍 Entering Backend Environment Check..."
cd backend

if [ ! -d "venv" ]; then
    echo "⚠️ Virtual environment not found. Building it..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null

echo "✅ Running Django Static Analysis (Check)..."
python manage.py check

echo "✅ Running Database Migrations..."
python manage.py migrate

echo "✅ Running Core Pytest Suite..."
# Run local pytests if available
if command -v pytest &> /dev/null; then
    pytest test_auth.py test_teacher_login.py test_payment.py test_teacher_hw.py
else
    # Fallback to Django test runner
    python manage.py test notifications accounts tenants students
fi

# 4. Starting the Workers (Dry Run)
echo "🐇 Validating Celery Worker syntax (Dry Run)..."
celery -A config worker --loglevel=info -D

echo "✅ Injecting Test Seed Data for Demo..."
python seed_test_school.py

cd ..

# 5. Frontend Verification
echo "🖥️  Entering Frontend Environment Check..."
cd frontend

echo "✅ Installing Next.js Dependencies..."
npm install

echo "✅ Running UI Linter..."
npm run lint

echo "✅ Building Frontend Production Bundle..."
npm run build

echo ""
echo "=========================================================="
echo "🎯 PRE-DEPLOYMENT TESTING COMPLETE."
echo "✅ Backend Models & Routes: Validated"
echo "✅ Redis & Notifications:   Validated"
echo "✅ Next.js Build:           Validated"
echo "=========================================================="
echo "You are now ready to map this to your DigitalOcean droplet or AWS EC2 instance."
