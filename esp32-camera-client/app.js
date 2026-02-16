/**
 * app.js
 * - ESP32 Camera Stream viewer client application
 * 
 * @author      Sim Si-Geun
 * @date        2026-02-17
 */

class CameraViewer {
    constructor() {
        this.ws = null;
        this.canvas = document.getElementById('videoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlay');
        
        // UI elements
        this.statusText = document.getElementById('statusText');
        this.statusIndicator = document.querySelector('.status-indicator');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        
        // Stats
        this.fpsElement = document.getElementById('fps');
        this.resolutionElement = document.getElementById('resolution');
        this.dataReceivedElement = document.getElementById('dataReceived');
        this.frameCountElement = document.getElementById('frameCount');
        this.logContent = document.getElementById('logContent');
        
        // Metrics
        this.frameCount = 0;
        this.totalDataReceived = 0;
        this.lastFrameTime = Date.now();
        this.fps = 0;
        this.fpsFrameCount = 0;
        this.fpsLastTime = Date.now();
        
        // Configuration - 서버 주소를 환경에 맞게 수정하세요
        this.wsUrl = 'ws://localhost:8887/viewer';
        
        this.initEventListeners();
        this.startFPSCounter();
    }
    
    initEventListeners = () => {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
    };
    
    connect = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.addLog('이미 연결되어 있습니다');
            return;
        }
        
        this.addLog(`서버에 연결 중... ${this.wsUrl}`);
        
        try {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.binaryType = 'arraybuffer';
            
            this.ws.onopen = this.onOpen;
            this.ws.onmessage = this.onMessage;
            this.ws.onerror = this.onError;
            this.ws.onclose = this.onClose;
        } catch (error) {
            this.addLog(`연결 실패: ${error.message}`, 'error');
            this.updateStatus('연결 실패', false);
        }
    };
    
    disconnect = () => {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.addLog('연결을 종료했습니다');
    };
    
    onOpen = (event) => {
        this.addLog('WebSocket 연결 성공!');
        this.updateStatus('연결됨 - ESP32 대기 중', true);
        this.connectBtn.disabled = true;
        this.disconnectBtn.disabled = false;
        this.overlay.innerHTML = '<p>ESP32 카메라 스트림 대기 중...</p>';
    };
    
    onMessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
            this.handleImageFrame(event.data);
        } else {
            // Text message
            this.addLog(`메시지: ${event.data}`);
        }
    };
    
    handleImageFrame = (data) => {
        this.frameCount++;
        this.fpsFrameCount++;
        this.totalDataReceived += data.byteLength;
        
        // Update stats
        this.frameCountElement.textContent = this.frameCount;
        this.dataReceivedElement.textContent = `${(this.totalDataReceived / 1024).toFixed(2)} KB`;
        
        // Hide overlay on first frame
        if (this.frameCount === 1) {
            this.overlay.classList.add('hidden');
            this.updateStatus('스트리밍 중', true);
            this.addLog('스트리밍 시작!');
        }
        
        // Convert ArrayBuffer to Blob and create image
        const blob = new Blob([data], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = () => {
            // Update canvas size if needed
            if (this.canvas.width !== img.width || this.canvas.height !== img.height) {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.resolutionElement.textContent = `${img.width}x${img.height}`;
            }
            
            // Draw image on canvas
            this.ctx.drawImage(img, 0, 0);
            
            // Clean up
            URL.revokeObjectURL(url);
        };
        
        img.onerror = () => {
            this.addLog('이미지 로드 실패', 'error');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    };
    
    onError = (event) => {
        this.addLog('WebSocket 에러 발생', 'error');
        console.error('WebSocket error:', event);
        this.updateStatus('에러 발생', false);
    };
    
    onClose = (event) => {
        this.addLog(`연결 종료 (코드: ${event.code})`);
        this.updateStatus('연결 해제됨', false);
        this.connectBtn.disabled = false;
        this.disconnectBtn.disabled = true;
        this.overlay.classList.remove('hidden');
        this.overlay.innerHTML = '<p>연결이 종료되었습니다</p>';
    };
    
    updateStatus = (text, connected) => {
        this.statusText.textContent = text;
        if (connected) {
            this.statusIndicator.classList.remove('disconnected');
            this.statusIndicator.classList.add('connected');
        } else {
            this.statusIndicator.classList.remove('connected');
            this.statusIndicator.classList.add('disconnected');
        }
    };
    
    addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;
        
        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
        
        // Keep only last 50 entries
        while (this.logContent.children.length > 50) {
            this.logContent.removeChild(this.logContent.firstChild);
        }
    };
    
    startFPSCounter = () => {
        setInterval(() => {
            const now = Date.now();
            const elapsed = (now - this.fpsLastTime) / 1000;
            
            if (elapsed >= 1) {
                this.fps = Math.round(this.fpsFrameCount / elapsed);
                this.fpsElement.textContent = this.fps;
                this.fpsFrameCount = 0;
                this.fpsLastTime = now;
            }
        }, 100);
    };
}

// Initialize viewer when page loads
window.addEventListener('DOMContentLoaded', () => {
    const viewer = new CameraViewer();
    console.log('Camera viewer initialized');
    console.log('Server URL:', viewer.wsUrl);
});
