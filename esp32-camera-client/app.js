/**
 * app.js
 * - ESP32 Camera Stream viewer client application
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-17
 */

class CameraViewer {
    constructor() {
        this.ws = null;
        this.canvas = document.getElementById("videoCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.overlay = document.getElementById("overlay");

        // UI elements
        this.statusText = document.getElementById("statusText");
        this.statusIndicator = document.querySelector(".status-indicator");
        this.connectBtn = document.getElementById("connectBtn");
        this.disconnectBtn = document.getElementById("disconnectBtn");
        this.ledOnBtn = document.getElementById("ledOnBtn");
        this.ledOffBtn = document.getElementById("ledOffBtn");
        this.ledStatus = document.getElementById("ledStatus");
        this.viewerNumber = document.getElementById("viewerNumber");

        // Version elements
        this.clientVersionElement = document.getElementById("clientVersion");
        this.serverVersionElement = document.getElementById("serverVersion");
        this.firmwareVersionElement = document.getElementById("firmwareVersion");

        // Stats
        this.fpsElement = document.getElementById("fps");
        this.resolutionElement = document.getElementById("resolution");
        this.dataReceivedElement = document.getElementById("dataReceived");
        this.frameCountElement = document.getElementById("frameCount");
        this.logContent = document.getElementById("logContent");

        // Metrics
        this.frameCount = 0;
        this.totalDataReceived = 0;
        this.lastFrameTime = Date.now();
        this.fps = 0;
        this.fpsFrameCount = 0;
        this.fpsLastTime = Date.now();

        // Configuration - config.js에서 자동으로 환경별 설정 로드
        this.wsUrl = APP_CONFIG.wsUrl;

        this.initEventListeners();
        this.initVersionInfo();
        this.startFPSCounter();
    }

    initEventListeners = () => {
        this.connectBtn.addEventListener("click", () => this.connect());
        this.disconnectBtn.addEventListener("click", () => this.disconnect());
        this.ledOnBtn.addEventListener("click", () => this.controlLED("ON"));
        this.ledOffBtn.addEventListener("click", () => this.controlLED("OFF"));
    };

    connect = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.addLog("이미 연결되어 있습니다");
            return;
        }

        // Reset metrics on new connection
        this.resetMetrics();

        this.addLog(`서버에 연결 중... ${this.wsUrl}`);

        try {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.binaryType = "arraybuffer";

            this.ws.onopen = this.onOpen;
            this.ws.onmessage = this.onMessage;
            this.ws.onerror = this.onError;
            this.ws.onclose = this.onClose;
        } catch (error) {
            this.addLog(`연결 실패: ${error.message}`, "error");
            this.updateStatus("연결 실패", false);
        }
    };

    disconnect = () => {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.addLog("연결을 종료했습니다");
    };

    onOpen = (event) => {
        this.addLog("WebSocket 연결 성공!");
        this.updateStatus("연결됨 - ESP32 대기 중", true);
        this.connectBtn.disabled = true;
        this.disconnectBtn.disabled = false;
        this.ledOnBtn.disabled = false;
        this.ledOffBtn.disabled = false;
        this.overlay.classList.remove("hidden");
        this.overlay.innerHTML = "<p>ESP32 카메라 스트림 대기 중...</p>";

        // LED 상태 요청
        setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send("LED_STATUS");
            }
        }, 500);
    };

    onMessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
            this.handleImageFrame(event.data);
        } else {
            // Text message - LED status, control commands, or viewer count
            const message = event.data;
            this.addLog(`메시지: ${message}`);

            // 접속 인원 수 업데이트
            if (message.startsWith("VIEWERS_COUNT:")) {
                const count = parseInt(message.split(":")[1]);
                this.updateViewerCount(count);
            }
            // 버전 정보 수신
            else if (message.startsWith("VERSION_INFO:")) {
                const versionData = message.substring("VERSION_INFO:".length);
                this.updateVersionInfo(versionData);
            }
            // LED 명령 처리 (다른 사용자의 명령도 동기화)
            else if (message === "LED_ON") {
                this.updateLEDStatus("ON");
            } else if (message === "LED_OFF") {
                this.updateLEDStatus("OFF");
            } else if (message.startsWith("LED_STATUS:")) {
                // ESP32로부터의 실제 상태 업데이트
                const status = message.split(":")[1];
                this.updateLEDStatus(status);
            }
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
            this.overlay.classList.add("hidden");
            this.updateStatus("스트리밍 중", true);
            this.addLog("스트리밍 시작!");
        }

        // Convert ArrayBuffer to Blob and create image
        const blob = new Blob([data], { type: "image/jpeg" });
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
            this.addLog("이미지 로드 실패", "error");
            URL.revokeObjectURL(url);
        };

        img.src = url;
    };

    onError = (event) => {
        this.addLog("WebSocket 에러 발생", "error");
        console.error("WebSocket error:", event);
        this.updateStatus("에러 발생", false);
    };

    onClose = (event) => {
        this.addLog(`연결 종료 (코드: ${event.code})`);
        this.updateStatus("연결 해제됨", false);
        this.connectBtn.disabled = false;
        this.disconnectBtn.disabled = true;
        this.ledOnBtn.disabled = true;
        this.ledOffBtn.disabled = true;
        this.ledStatus.textContent = "-";
        this.ledStatus.className = "led-status-text";
        this.overlay.classList.remove("hidden");
        this.overlay.innerHTML = "<p>연결이 종료되었습니다</p>";
    };

    updateStatus = (text, connected) => {
        this.statusText.textContent = text;
        if (connected) {
            this.statusIndicator.classList.remove("disconnected");
            this.statusIndicator.classList.add("connected");
        } else {
            this.statusIndicator.classList.remove("connected");
            this.statusIndicator.classList.add("disconnected");
        }
    };

    resetMetrics = () => {
        this.frameCount = 0;
        this.totalDataReceived = 0;
        this.fps = 0;
        this.fpsFrameCount = 0;
        this.fpsLastTime = Date.now();

        // Update UI
        this.frameCountElement.textContent = "0";
        this.dataReceivedElement.textContent = "0 KB";
        this.fpsElement.textContent = "0";
        this.resolutionElement.textContent = "-";
    };

    addLog = (message, type = "info") => {
        const timestamp = new Date().toLocaleTimeString("ko-KR");
        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;

        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;

        // Keep only last 50 entries
        while (this.logContent.children.length > 50) {
            this.logContent.removeChild(this.logContent.firstChild);
        }
    };

    controlLED = (state) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.addLog("LED 제어 실패: WebSocket 연결 없음", "error");
            return;
        }

        // 버튼 중복 클릭 방지
        this.ledOnBtn.disabled = true;
        this.ledOffBtn.disabled = true;

        const command = state === "ON" ? "LED_ON" : "LED_OFF";
        this.ws.send(command);
        this.addLog(`LED ${state} 명령 전송`);

        // 낙관적 UI 업데이트 (immediate feedback)
        this.updateLEDStatus(state);

        // 버튼 재활성화 (500ms 후)
        setTimeout(() => {
            this.ledOnBtn.disabled = false;
            this.ledOffBtn.disabled = false;
        }, 500);
    };

    updateLEDStatus = (status) => {
        // 상태 표시 업데이트
        this.ledStatus.textContent = status;
        if (status === "ON") {
            this.ledStatus.className = "led-status-text led-on";
            // ON 버튼 강조 (optional visual feedback)
            this.ledOnBtn.style.opacity = "1";
            this.ledOffBtn.style.opacity = "0.7";
        } else if (status === "OFF") {
            this.ledStatus.className = "led-status-text led-off";
            // OFF 버튼 강조
            this.ledOnBtn.style.opacity = "0.7";
            this.ledOffBtn.style.opacity = "1";
        }
    };

    updateViewerCount = (count) => {
        this.viewerNumber.textContent = count;

        // 시각적 피드백 - 숫자가 변경될 때 애니메이션
        this.viewerNumber.style.transform = "scale(1.3)";
        setTimeout(() => {
            this.viewerNumber.style.transform = "scale(1)";
        }, 300);
    };

    initVersionInfo = () => {
        // 클라이언트 버전은 즉시 표시
        this.clientVersionElement.textContent = `v${APP_CONFIG.versions.client}`;
        this.serverVersionElement.textContent = "-";
        this.firmwareVersionElement.textContent = "-";
    };

    updateVersionInfo = (versionData) => {
        try {
            const versions = JSON.parse(versionData);

            if (versions.server) {
                this.serverVersionElement.textContent = `v${versions.server}`;
            }
            if (versions.firmware) {
                this.firmwareVersionElement.textContent = `v${versions.firmware}`;
            }

            this.addLog(
                `버전 정보 수신 - Server: ${versions.server}, Firmware: ${versions.firmware}`,
            );
        } catch (error) {
            console.error("버전 정보 파싱 오류:", error);
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
window.addEventListener("DOMContentLoaded", () => {
    const viewer = new CameraViewer();
    console.log("Camera viewer initialized");
    console.log("Server URL:", viewer.wsUrl);
});
