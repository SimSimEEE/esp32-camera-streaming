/**
 * ESP32_Camera_Stream.ino
 * - ESP32-CAM WebSocket client for real-time camera streaming with LED control
 * - Modular architecture: CameraModule + LedModule
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
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 modularized version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// Import configuration
#include "Config.h"

// Import custom modules
#include "CameraModule.h"
#include "LedModule.h"

// ========================================
// Module Instances
// ========================================
CameraModule camera;
LedModule led;

// ========================================
// Global Variables
// ========================================
WebSocketsClient webSocket;
bool isConnected = false;
unsigned long lastFrameTime = 0;
unsigned long frameCount = 0;


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
// Handle Server Commands
// ========================================
void handleCommand(const char* command) {
    if (strcmp(command, "LED_ON") == 0) {
        led.on();
        webSocket.sendTXT(led.getStatusString());
    } else if (strcmp(command, "LED_OFF") == 0) {
        led.off();
        webSocket.sendTXT(led.getStatusString());
    } else if (strcmp(command, "LED_TOGGLE") == 0) {
        led.toggle();
        webSocket.sendTXT(led.getStatusString());
    } else if (strcmp(command, "LED_STATUS") == 0) {
        webSocket.sendTXT(led.getStatusString());
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
            String versionMsg = "FIRMWARE_VERSION:" + String(APP_VERSION);
            webSocket.sendTXT(versionMsg);
            Serial.printf("[WS] Sent firmware version: %s\n", APP_VERSION);
            
            // Send initial LED status to server
            webSocket.sendTXT(led.getStatusString());
            break;
            
        case WStype_TEXT:
            Serial.printf("[WS] Received command: %s\n", payload);
            handleCommand((char*)payload);
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
    
    // Capture frame using camera module
    camera_fb_t* fb = camera.captureFrame();
    if (!fb) {
        Serial.println("[Main] Frame capture failed");
        return;
    }
    
    // Send frame via WebSocket
    bool success = webSocket.sendBIN(fb->buf, fb->len);
    
    if (success) {
        frameCount++;
        if (frameCount % 30 == 0) { // Log every 30 frames
            Serial.printf("[Main] Frame #%lu sent (%u bytes)\n", frameCount, fb->len);
        }
    } else {
        Serial.println("[Main] Failed to send frame");
    }
    
    // Release frame buffer
    camera.releaseFrame(fb);
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
    Serial.println("Modular Architecture: Camera + LED");
    Serial.println("========================================");
    
    // Initialize LED module
    led.init();
    
    // Initialize camera module
    if (!camera.init()) {
        Serial.println("[Main] Camera initialization failed!");
        Serial.println("[Main] System halted.");
        while (true) {
            delay(1000);
        }
    }
    Serial.printf("[Main] Camera ready: %s\n", camera.getFrameSizeName());
    
    // Connect to WiFi
    connectWiFi();
    
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[Main] Cannot proceed without WiFi!");
        Serial.println("[Main] System halted.");
        while (true) {
            delay(1000);
        }
    }
    
    // Initialize WebSocket client
    Serial.printf("[Main] Connecting to WebSocket: ws://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
    webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
    
    Serial.println("[Main] Setup complete!");
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
