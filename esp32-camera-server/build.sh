#!/bin/bash
set -e

# ESP32 Camera Streaming - Docker Build Script
# Author: Sim Si-Geun
# Date: 2026-02-17

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 ESP32 Camera Streaming - Docker Build"
echo "========================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. 서버 빌드 (선택사항)
print_step "Step 1: Building camera server (optional)..."
cd esp32-camera-server
mvn clean package -DskipTests
cd "$SCRIPT_DIR"
echo "  ✓ Server built successfully"

# 2. Docker 이미지 빌드
print_step "Step 2: Building Docker image..."
docker build -t esp32-camera-server:latest ./esp32-camera-server
echo "  ✓ Docker image built successfully"

# 3. 성공 메시지
echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Local test:  docker compose up"
echo "  2. AWS deploy:  See DEPLOYMENT.md"
echo ""
