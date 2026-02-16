/**
 * ESP32_Camera_Stream.ino
 * - ESP32-CAM WebSocket client for real-time camera streaming
 * 
 * Hardware: ESP32-CAM (AI-Thinker)
 * Board: ESP32 Wrover Module
 * 
 * Required Libraries:
 * - ESP32 Arduino Core
 * - WebSockets by Markus Sattler (https://github.com/Links2004/arduinoWebSockets)
 * 
 * Connections:
 * - ESP32-CAM uses built-in camera module
 * - Connect FTDI programmer for initial upload
 * - GPIO 0 to GND for programming mode
 * 
 * @author      Sim Si-Geun <sim@lemoncloud.io>
 * @date        2026-02-17
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ========================================
// WiFi Configuration
// ========================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // WiFi SSID로 변경하세요
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // WiFi 비밀번호로 변경하세요

// ========================================
// WebSocket Server Configuration
// ========================================
const char* WS_HOST = "192.168.0.100";  // 서버 IP 주소로 변경하세요
const uint16_t WS_PORT = 8887;
const char* WS_PATH = "/esp32";

// ========================================
// Camera Configuration (AI-Thinker ESP32-CAM)
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
// Global Variables
// ========================================
WebSocketsClient webSocket;
bool isConnected = false;
unsigned long lastFrameTime = 0;
const unsigned long FRAME_INTERVAL = 100; // 100ms = ~10 FPS
unsigned long frameCount = 0;

// ========================================
// Camera Initialization
// ========================================
bool initCamera() {
    Serial.println("Initializing camera...");
    
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
    
    // Frame size and quality settings
    if (psramFound()) {
        config.frame_size = FRAMESIZE_VGA;  // 640x480
        config.jpeg_quality = 10;           // 0-63, lower means higher quality
        config.fb_count = 2;
        Serial.println("PSRAM found - using VGA quality");
    } else {
        config.frame_size = FRAMESIZE_SVGA; // 800x600
        config.jpeg_quality = 12;
        config.fb_count = 1;
        Serial.println("PSRAM not found - using lower quality");
    }
    
    // Initialize camera
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x\n", err);
        return false;
    }
    
    // Camera sensor settings
    sensor_t* s = esp_camera_sensor_get();
    if (s != NULL) {
        // Adjust settings for better performance
        s->set_brightness(s, 0);     // -2 to 2
        s->set_contrast(s, 0);       // -2 to 2
        s->set_saturation(s, 0);     // -2 to 2
        s->set_special_effect(s, 0); // 0 to 6 (0 - No Effect)
        s->set_whitebal(s, 1);       // 0 = disable , 1 = enable
        s->set_awb_gain(s, 1);       // 0 = disable , 1 = enable
        s->set_wb_mode(s, 0);        // 0 to 4
        s->set_exposure_ctrl(s, 1);  // 0 = disable , 1 = enable
        s->set_aec2(s, 0);           // 0 = disable , 1 = enable
        s->set_gain_ctrl(s, 1);      // 0 = disable , 1 = enable
        s->set_agc_gain(s, 0);       // 0 to 30
        s->set_gainceiling(s, (gainceiling_t)0); // 0 to 6
        s->set_bpc(s, 0);            // 0 = disable , 1 = enable
        s->set_wpc(s, 1);            // 0 = disable , 1 = enable
        s->set_raw_gma(s, 1);        // 0 = disable , 1 = enable
        s->set_lenc(s, 1);           // 0 = disable , 1 = enable
        s->set_hmirror(s, 0);        // 0 = disable , 1 = enable
        s->set_vflip(s, 0);          // 0 = disable , 1 = enable
        s->set_dcw(s, 1);            // 0 = disable , 1 = enable
        s->set_colorbar(s, 0);       // 0 = disable , 1 = enable
    }
    
    Serial.println("Camera initialized successfully");
    return true;
}

// ========================================
// WiFi Connection
// ========================================
void connectWiFi() {
    Serial.println();
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("WiFi connected!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        Serial.print("Signal strength (RSSI): ");
        Serial.println(WiFi.RSSI());
    } else {
        Serial.println();
        Serial.println("WiFi connection failed!");
    }
}

// ========================================
// WebSocket Event Handler
// ========================================
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("[WS] Disconnected");
            isConnected = false;
            break;
            
        case WStype_CONNECTED:
            Serial.printf("[WS] Connected to: %s\n", payload);
            isConnected = true;
            frameCount = 0;
            break;
            
        case WStype_TEXT:
            Serial.printf("[WS] Received text: %s\n", payload);
            break;
            
        case WStype_ERROR:
            Serial.println("[WS] Error occurred");
            isConnected = false;
            break;
            
        default:
            break;
    }
}

// ========================================
// Capture and Send Frame
// ========================================
void captureAndSendFrame() {
    if (!isConnected) {
        return;
    }
    
    // Capture frame
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("Camera capture failed");
        return;
    }
    
    // Send frame via WebSocket
    bool success = webSocket.sendBIN(fb->buf, fb->len);
    
    if (success) {
        frameCount++;
        if (frameCount % 30 == 0) { // Log every 30 frames
            Serial.printf("Frame #%lu sent (%u bytes)\n", frameCount, fb->len);
        }
    } else {
        Serial.println("Failed to send frame");
    }
    
    // Return frame buffer
    esp_camera_fb_return(fb);
}

// ========================================
// Setup
// ========================================
void setup() {
    // Disable brownout detector
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
    
    // Initialize serial
    Serial.begin(115200);
    Serial.setDebugOutput(true);
    Serial.println();
    Serial.println("========================================");
    Serial.println("ESP32-CAM WebSocket Stream Client");
    Serial.println("========================================");
    
    // Initialize camera
    if (!initCamera()) {
        Serial.println("Camera initialization failed!");
        Serial.println("System halted.");
        while (true) {
            delay(1000);
        }
    }
    
    // Connect to WiFi
    connectWiFi();
    
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Cannot proceed without WiFi!");
        Serial.println("System halted.");
        while (true) {
            delay(1000);
        }
    }
    
    // Initialize WebSocket client
    Serial.printf("Connecting to WebSocket: ws://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
    webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    
    Serial.println("Setup complete!");
    Serial.println("========================================");
}

// ========================================
// Main Loop
// ========================================
void loop() {
    // Handle WebSocket events
    webSocket.loop();
    
    // Send frames at specified interval
    unsigned long currentTime = millis();
    if (isConnected && (currentTime - lastFrameTime >= FRAME_INTERVAL)) {
        captureAndSendFrame();
        lastFrameTime = currentTime;
    }
    
    // Small delay to prevent watchdog timer issues
    delay(10);
}
