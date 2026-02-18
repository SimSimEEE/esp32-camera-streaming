#!/bin/bash

# Build script for motion detector service
echo "🔨 Building ESP32 Motion Detector..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

# Run tests if available
if [ -d "tests" ]; then
    echo "🧪 Running tests..."
    python3 -m pytest tests/ || echo "⚠️  Some tests failed"
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t esp32-motion-detector:latest .

echo "✅ Build complete!"
echo ""
echo "Run with:"
echo "  npm run start       # Docker Compose"
echo "  npm run local       # Local Python"
