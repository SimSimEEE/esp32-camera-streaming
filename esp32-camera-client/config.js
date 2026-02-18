/**
 * config.js
 * - Camera viewer configuration
 * - 배포 환경에 따라 수정하세요
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-18 updated version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

// ========================================
// 환경별 설정
// ========================================
const CONFIG = {
    // 로컬 개발 환경
    local: {
        wsUrl: "ws://localhost:8887/viewer",
        esp32Endpoint: "ws://localhost:8887/esp32",
        reconnectInterval: 5000, // 재연결 간격 (ms)
        heartbeatInterval: 30000, // Heartbeat 간격 (ms)
    },

    // Docker Compose 환경
    docker: {
        wsUrl: "ws://localhost/ws/viewer",
        esp32Endpoint: "ws://localhost/ws/esp32",
        reconnectInterval: 5000,
        heartbeatInterval: 30000,
    },

    // AWS 클라우드 배포 환경
    // ⚠️ 배포 후 실제 서버 URL로 변경하세요!
    production: {
        wsUrl: "ws://YOUR_SERVER_DOMAIN/ws/viewer", // 예: ws://xxx.awsapprunner.com/ws/viewer
        esp32Endpoint: "ws://YOUR_SERVER_DOMAIN/ws/esp32", // 예: ws://xxx.awsapprunner.com/ws/esp32
        reconnectInterval: 10000, // 프로덕션에서는 재연결 간격을 길게
        heartbeatInterval: 60000, // 프로덕션에서는 heartbeat 간격을 길게
    },
};

// ========================================
// 공통 설정
// ========================================
const COMMON_CONFIG = {
    // UI 설정
    maxReconnectAttempts: 5, // 최대 재연결 시도 횟수 (0 = 무제한)
    showDebugLogs: true, // 디버그 로그 표시

    // 성능 설정
    canvasUpdateInterval: 16, // Canvas 업데이트 간격 (ms) - ~60 FPS
    statsUpdateInterval: 1000, // 통계 업데이트 간격 (ms)

    // 앱 정보
    appName: "ESP32 Camera Viewer",
    appVersion: "1.0.0",
    
    // 컴포넌트 버전 (참고용)
    versions: {
        client: "1.0.0",
        server: "1.0.0",  // 서버로부터 실제 버전 수신
        firmware: "1.0.0", // 서버로부터 실제 버전 수신
    },
};

// ========================================
// 환경 자동 감지
// ========================================
const getCurrentEnvironment = () => {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
        // Docker Compose를 사용 중인지 확인
        if (window.location.port === "80" || window.location.port === "") {
            return "docker";
        }
        return "local";
    }

    return "production";
};

// ========================================
// 설정 내보내기
// ========================================
const ENV = getCurrentEnvironment();
const APP_CONFIG = { ...CONFIG[ENV], ...COMMON_CONFIG };

// 콘솔 로그
if (APP_CONFIG.showDebugLogs) {
    console.log("[CONFIG] ========================================");
    console.log("[CONFIG] " + APP_CONFIG.appName + " v" + APP_CONFIG.appVersion);
    console.log("[CONFIG] ========================================");
    console.log("[CONFIG] Environment:", ENV);
    console.log("[CONFIG] WebSocket URL:", APP_CONFIG.wsUrl);
    console.log("[CONFIG] ESP32 Endpoint:", APP_CONFIG.esp32Endpoint);
    console.log("[CONFIG] Reconnect Interval:", APP_CONFIG.reconnectInterval + "ms");
    console.log("[CONFIG] ========================================");
}
console.log("[CONFIG] ESP32 should connect to:", APP_CONFIG.esp32Endpoint);
