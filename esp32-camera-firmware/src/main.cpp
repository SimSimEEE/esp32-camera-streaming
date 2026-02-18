/**
 * `main.cpp`
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
 * @author      sim woo keun <sim@granule.io>
 * @date        2026-02-17 initial version (converted to PlatformIO)
 * 
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// Import configuration
#include "Config.h"

// ========================================
// Global Variables
// ========================================
WebSocketsClient webSocket;
bool isConnected = false;
unsigned long lastFrameTime = 0;
unsigned long frameCount = 0;
bool ledState = false; // LED 상태 (false=OFF, true=ON)

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
    config.pin_sccb_sda = SIOD_GPIO_NUM;  // Fixed deprecated name
    config.pin_sccb_scl = SIOC_GPIO_NUM;  // Fixed deprecated name
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 25000000;  // Increased from 20MHz to 25MHz for faster capture
    config.pixel_format = PIXFORMAT_JPEG;
    
    // Frame size and quality settings - Optimized for cloud server (data cost saving)
    if (psramFound()) {
        config.frame_size = FRAMESIZE_HVGA; // 400x296 (good balance)
        config.jpeg_quality = 25;           // 0-63, higher=more compression, 25 saves ~70% bandwidth
        config.fb_count = 2;                // Double buffering sufficient for 15 FPS
        Serial.println("PSRAM found - Cloud-optimized mode (15 FPS, compressed)");
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
    WiFi.setSleep(false);  // Disable WiFi power saving for lower latency
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
            
            // Send firmware version to server
            delay(100); // Short delay to ensure connection is stable
            webSocket.sendTXT(String("FIRMWARE_VERSION:") + String(APP_VERSION));
            Serial.printf("[WS] Sent firmware version: %s\n", APP_VERSION);
            
            // Send current LED status on connect
            webSocket.sendTXT(ledState ? "LED_STATUS:ON" : "LED_STATUS:OFF");
            Serial.println("[LED] Initial LED status sent");
            break;
            
        case WStype_TEXT: {
            Serial.printf("[WS] Received text: %s\n", payload);
            // LED 제어 명령 처리
            String message = String((char*)payload);
            if (message == "LED_ON") {
                digitalWrite(LED_PIN, HIGH);
                ledState = true;
                Serial.println("[LED] LED turned ON");
                webSocket.sendTXT("LED_STATUS:ON");
            } else if (message == "LED_OFF") {
                digitalWrite(LED_PIN, LOW);
                ledState = false;
                Serial.println("[LED] LED turned OFF");
                webSocket.sendTXT("LED_STATUS:OFF");
            } else if (message == "LED_STATUS") {
                // LED 상태 요청
                webSocket.sendTXT(ledState ? "LED_STATUS:ON" : "LED_STATUS:OFF");
            }
            break;
        }
            
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
    
    // Initialize LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);  // LED OFF initially
    Serial.println("LED initialized (GPIO 4)");
    
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
    webSocket.setReconnectInterval(3000);  // Reduced from 5000ms for faster recovery
    webSocket.enableHeartbeat(15000, 3000, 2);  // Enable heartbeat for connection stability
    
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
