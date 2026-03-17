#!/bin/bash
# Backend startup and validation script

set -e

echo "🚀 Vizzy Chat AI Backend - Startup Script"
echo "=========================================="

# Check Python version
echo "✓ Checking Python version..."
python --version

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Check environment variables
echo "🔐 Checking environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env with your Supabase and API credentials!"
else
    echo "✓ .env file exists"
fi

# Check required env vars
required_vars=("SUPABASE_URL" "SUPABASE_KEY" "FAL_API_KEY" "GROQ_API_KEY")
for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env; then
        value=$(grep "^$var=" .env | cut -d'=' -f2)
        if [ -z "$value" ] || [ "$value" = "your_"* ] || [ "$value" = "change_this" ]; then
            echo "⚠️  $var is not configured in .env"
        else
            echo "✓ $var is configured"
        fi
    else
        echo "⚠️  $var is missing from .env"
    fi
done

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p app/api/v1/routers
mkdir -p vizzy_admin
mkdir -p migrations
echo "✓ Directories ready"

# Start the server
echo ""
echo "🌟 Starting FastAPI server..."
echo "=========================================="
echo "📍 Server will run at: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo "📍 ReDoc: http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

python main.py
