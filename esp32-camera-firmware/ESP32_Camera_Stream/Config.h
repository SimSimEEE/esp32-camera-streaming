/**
 * `Config.h`
 * - ESP32-CAM configuration constants
 * - 모든 설정값을 한 곳에서 관리
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#ifndef CONFIG_H
#define CONFIG_H

// ========================================
// WiFi Configuration
// ⚠️ 배포 전 반드시 본인의 WiFi 정보로 변경하세요!
// ========================================
#define WIFI_SSID        "DLive_CF84"
#define WIFI_PASSWORD    "BD0982CF83"

// WiFi 연결 설정
#define WIFI_CONNECT_TIMEOUT     20       // WiFi 연결 시도 횟수
#define WIFI_RETRY_DELAY         500      // WiFi 재연결 대기 시간 (ms)

// ========================================
// WebSocket Server Configuration  
// ⚠️ 배포 전 반드시 서버 주소로 변경하세요!
// ========================================
#define WS_HOST          "52.79.241.244"  // 서버 IP 또는 도메인
#define WS_PORT          8887                         // 서버 포트
#define WS_PATH          "/esp32"                     // WebSocket 경로

// WebSocket 연결 설정
#define WS_RECONNECT_INTERVAL    5000     // WebSocket 재연결 간격 (ms)
#define WS_PING_INTERVAL         30000    // Ping 전송 간격 (ms)

// ========================================
// Camera Configuration
// ========================================
// Frame Rate 설정
#define FRAME_INTERVAL   100              // 프레임 전송 간격 (ms) - 100ms = 10 FPS
#define TARGET_FPS       10               // 목표 FPS

// Camera Quality
#define JPEG_QUALITY     12               // JPEG 품질 (0-63, 낮을수록 고품질)
#define FRAME_SIZE       FRAMESIZE_HVGA   // 해상도: HVGA (480x320)

// Available Frame Sizes:
// - FRAMESIZE_QQVGA  (160x120)
// - FRAMESIZE_QVGA   (320x240)
// - FRAMESIZE_HVGA   (480x320)
// - FRAMESIZE_VGA    (640x480)
// - FRAMESIZE_SVGA   (800x600)
// - FRAMESIZE_XGA    (1024x768)
// - FRAMESIZE_SXGA   (1280x1024)

// ========================================
// LED Configuration
// ========================================
#define LED_FLASH_PIN    4                // 내장 플래시 LED (GPIO 4)
#define LED_BUILTIN_PIN  33               // ESP32-CAM 내장 LED (일부 모델)

// ========================================
// Camera Pin Configuration (AI-Thinker ESP32-CAM)
// ⚠️ 다른 ESP32-CAM 모델을 사용하는 경우 핀 설정을 변경하세요!
// ========================================
#define CAMERA_MODEL_AI_THINKER

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ========================================
// Debug Configuration
// ========================================
#define SERIAL_BAUD_RATE  115200          // 시리얼 통신 속도
#define DEBUG_ENABLED     true            // 디버그 로그 활성화

// Debug 매크로
#if DEBUG_ENABLED
  #define DEBUG_PRINT(x)    Serial.print(x)
  #define DEBUG_PRINTLN(x)  Serial.println(x)
  #define DEBUG_PRINTF(...)  Serial.printf(__VA_ARGS__)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(...)
#endif

// ========================================
// System Configuration
// ========================================
#define WATCHDOG_ENABLED  false           // Watchdog 타이머 비활성화 (브라운아웃 방지)

// Memory Configuration
#define USE_PSRAM         true            // PSRAM 사용 여부

// ========================================
// Application Info
// ========================================
#define APP_NAME          "ESP32-CAM Stream"
#define APP_VERSION       "1.0.1"
#define APP_AUTHOR        "Granule Co Ltd"

#endif // CONFIG_H
