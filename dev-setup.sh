#!/bin/bash

# --- School ERP Fast-Setup Script ---
# This script prepares the complete environment (Backend + Frontend) 
# for a fresh development run.

set -e # Exit on error

echo "🚀 Starting School ERP Setup..."

# 1. Backend Setup
echo "📂 Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# Create .env from .env.example if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env for Backend"
fi

# Run migrations and seed data
echo "⚙️ Initializing Database..."
python manage.py migrate
python seed_demo.py
cd ..

# 2. Frontend Setup
echo "📂 Setting up Frontend..."
cd frontend
# Create .env.local from .env.example if it doesn't exist
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local for Frontend"
fi
npm install
cd ..

echo "--------------------------------------------------"
echo "🎉 Setup Complete! 🎉"
echo ""
echo "To start development:"
echo "1. Backend:  cd backend && source venv/bin/activate && python manage.py runserver"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Default Super Admin: super_admin@demo.com / password123"
echo "--------------------------------------------------"
