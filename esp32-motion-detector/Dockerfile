FROM python:3.11-slim

LABEL maintainer="Sim Si-Geun <sim@granule.io>"
LABEL description="ESP32 Camera Motion Detection Service with AI Analysis"

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create snapshot directory
RUN mkdir -p /app/snapshots

# Environment variables (can be overridden)
ENV WEBSOCKET_SERVER=ws://esp32-camera-server:8887
ENV ENABLE_AI=true
ENV SAVE_SNAPSHOTS=true
ENV SNAPSHOT_DIR=/app/snapshots

# Run the service
CMD ["python", "-u", "src/main.py"]
