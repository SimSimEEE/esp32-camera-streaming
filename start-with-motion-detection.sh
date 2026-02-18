#!/bin/bash
# `start-with-motion-detection.sh`
# - ESP32 Camera Streaming System with Motion Detection 시작 스크립트
#
# @author      Sim Woo-Keun <smileteeth14@gmail.com>
# @date        2026-02-19 updated for docker-compose.yml
#
# @copyright   (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.

# Quick start script for entire system including motion detection
echo "🚀 Starting ESP32 Camera Streaming System with Motion Detection"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Building images..."
docker-compose build

echo ""
echo "🎬 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ System started successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access Points:"
echo "  - Web Client: http://localhost"
echo "  - Camera Server WebSocket: ws://localhost:8887"
echo ""
echo "📝 Useful Commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop system: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
echo "🔗 Access Points:"
echo "  - Camera Server: ws://localhost:8887"
echo "  - ESP32 Endpoint: ws://localhost:8887/esp32"
echo "  - Viewer Endpoint: ws://localhost:8887/viewer"
echo ""
echo "📁 Directories:"
echo "  - Logs: ./logs/"
echo "  - Snapshots: ./esp32-motion-detector/snapshots/"
echo ""
echo "📋 Useful Commands:"
echo "  - View logs: docker-compose -f docker-compose-full.yml logs -f"
echo "  - Stop system: docker-compose -f docker-compose-full.yml down"
echo "  - Restart: docker-compose -f docker-compose-full.yml restart"
echo ""
