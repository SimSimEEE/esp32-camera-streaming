/**
 * `main.cpp`
 * - ESP32 gimbal firmware entry point
 * - FreeRTOS task initialization and coordination
 * - Phase 3: WebSocket communication and telemetry
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 * @date        2026-02-25 Phase 3 - WebSocket integration
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#include <Arduino.h>
#include <WiFi.h>
#include "../include/Config.h"
#include "sensors/MPU6050Sensor.h"
#include "filters/ComplementaryFilter.h"
#include "control/PIDController.h"
#include "control/ServoController.h"
#include "network/WebSocketClient.h"
#include "telemetry/TelemetryCollector.h"

// ============================================================================
// Global Objects
// ============================================================================

MPU6050Sensor sensor;
ComplementaryFilter filter(COMP_FILTER_ALPHA);
PIDController pidPitch(PID_KP_PITCH, PID_KI_PITCH, PID_KD_PITCH);
PIDController pidRoll(PID_KP_ROLL, PID_KI_ROLL, PID_KD_ROLL);
ServoController servo;
GimbalWebSocketClient wsClient;
TelemetryCollector telemetry;

// ============================================================================
// FreeRTOS Task Handles
// ============================================================================

TaskHandle_t sensorTaskHandle = NULL;
TaskHandle_t controlTaskHandle = NULL;
TaskHandle_t telemetryTaskHandle = NULL;

// ============================================================================
// Shared Data (Protected by Mutex)
// ============================================================================

SemaphoreHandle_t dataMutex = NULL;
SensorData latestSensorData;
Attitude latestAttitude;

// Target angles (setpoint for PID)
float targetPitch = 0.0f;
float targetRoll = 0.0f;

// Control loop statistics
uint32_t controlLoopCount = 0;

// ============================================================================
// WiFi Connection Helper
// ============================================================================

/**
 * Connect to WiFi network
 * @return true if connected successfully
 */
bool connectWiFi() {
    Serial.println("\n[WiFi] Connecting to WiFi...");
    Serial.printf("  SSID: %s\n", WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    uint32_t startTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - startTime > WIFI_CONNECT_TIMEOUT) {
            Serial.println("[WiFi] Connection timeout");
            return false;
        }
        Serial.print(".");
        delay(500);
    }
    
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.printf("  IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  RSSI: %d dBm\n", WiFi.RSSI());
    
    return true;
}

// ============================================================================
// WebSocket Callback Handlers
// ============================================================================

/**
 * Handle control command from server
 */
void onControlCommand(const ControlPayload& payload) {
    Serial.printf("[WS Callback] Control: pitch=%.2f, roll=%.2f\n",
                 payload.targetPitch, payload.targetRoll);
    
    // Update target angles (thread-safe - single write to float is atomic on ESP32)
    targetPitch = payload.targetPitch;
    targetRoll = payload.targetRoll;
}

/**
 * Handle PID update from server
 */
void onPIDUpdate(const PIDUpdatePayload& payload) {
    const char* axisName = (payload.axis == 0) ? "PITCH" : "ROLL";
    Serial.printf("[WS Callback] PID Update [%s]: Kp=%.3f, Ki=%.3f, Kd=%.3f\n",
                 axisName, payload.kp, payload.ki, payload.kd);
    
    // Update PID gains
    if (payload.axis == 0) {
        // Pitch axis
        pidPitch.setGains(payload.kp, payload.ki, payload.kd);
        pidPitch.setIntegralLimits(payload.integralMin, payload.integralMax);
    } else if (payload.axis == 1) {
        // Roll axis
        pidRoll.setGains(payload.kp, payload.ki, payload.kd);
        pidRoll.setIntegralLimits(payload.integralMin, payload.integralMax);
    }
}

// ============================================================================
// Task 1: Sensor Reading Task (Core 0, 100 Hz)
// ============================================================================

/**
 * Sensor task - reads MPU6050 at 100 Hz and updates complementary filter
 * - Priority: 4 (highest) - time-critical sensor reading
 * - Core: 0 (protocol CPU) - separates sensor I/O from control logic
 * - Interval: 10ms (100 Hz)
 */
void sensorTask(void* parameter) {
    const TickType_t xFrequency = pdMS_TO_TICKS(SENSOR_TASK_INTERVAL);
    TickType_t xLastWakeTime = xTaskGetTickCount();
    
    unsigned long lastUpdateTime = millis();
    
    Serial.println("[Task:Sensor] Started on Core 0");
    
    while (true) {
        // Read sensor data
        SensorData data;
        if (sensor.readCalibratedData(data)) {
            // Calculate time delta for filter
            unsigned long currentTime = millis();
            float dt = (currentTime - lastUpdateTime) / 1000.0f;  // Convert to seconds
            lastUpdateTime = currentTime;
            
            // Update complementary filter
            const Attitude& attitude = filter.update(
                data.gyroX, data.gyroY, data.gyroZ,
                data.accelX, data.accelY, data.accelZ,
                dt
            );
            
            // Update shared data (thread-safe)
            if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
                latestSensorData = data;
                latestAttitude = attitude;
                xSemaphoreGive(dataMutex);
            }
        } else {
            Serial.println("[Task:Sensor] Failed to read sensor data");
        }
        
        // Wait for next cycle (100 Hz)
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// ============================================================================
// Task 2: Control Task (Core 1, 50 Hz)
// ============================================================================

/**
 * Control task - PID control loop for gimbal stabilization
 * - Priority: 4 (high) - precise timing for control loop
 * - Core: 1 (app CPU) - separates control from sensor I/O
 * - Interval: 20ms (50 Hz)
 */
void controlTask(void* parameter) {
    const TickType_t xFrequency = pdMS_TO_TICKS(CONTROL_TASK_INTERVAL);
    TickType_t xLastWakeTime = xTaskGetTickCount();
    
    unsigned long lastUpdateTime = millis();
    
    Serial.println("[Task:Control] Started on Core 1");
    
    while (true) {
        // Calculate time delta
        unsigned long currentTime = millis();
        float dt = (currentTime - lastUpdateTime) / 1000.0f;  // Convert to seconds
        lastUpdateTime = currentTime;
        
        // Read current attitude (thread-safe)
        Attitude attitude;
        if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(5)) == pdTRUE) {
            attitude = latestAttitude;
            xSemaphoreGive(dataMutex);
            
            // Convert radians to degrees for PID
            float currentPitch = attitude.pitch * 180.0f / PI;
            float currentRoll = attitude.roll * 180.0f / PI;
            
            // Compute PID output
            float pitchOutput = pidPitch.compute(targetPitch, currentPitch, dt);
            float rollOutput = pidRoll.compute(targetRoll, currentRoll, dt);
            
            // Apply to servos
            servo.setAngles(pitchOutput, rollOutput);
            
            // Increment loop counter
            controlLoopCount++;
        }
        
        // Wait for next cycle (50 Hz)
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// ============================================================================
// Task 3: Telemetry Task (Core 1, 10 Hz)
// ============================================================================

/**
 * Telemetry task - collect system metrics and send via WebSocket
 * - Priority: 1 (low) - not time-critical
 * - Core: 1 (app CPU) - shares with control task
 * - Interval: 100ms (10 Hz)
 */
void telemetryTask(void* parameter) {
    const TickType_t xFrequency = pdMS_TO_TICKS(TELEMETRY_TASK_INTERVAL);
    TickType_t xLastWakeTime = xTaskGetTickCount();
    
    Serial.println("[Task:Telemetry] Started on Core 1");
    
    while (true) {
        // Check WebSocket connection
        if (wsClient.isConnected()) {
            // Read current attitude (thread-safe)
            Attitude attitude;
            if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
                attitude = latestAttitude;
                xSemaphoreGive(dataMutex);
                
                // Convert radians to degrees
                float pitchDeg = attitude.pitch * 180.0f / PI;
                float rollDeg = attitude.roll * 180.0f / PI;
                float yawDeg = attitude.yaw * 180.0f / PI;
                
                // Get servo positions
                float servoPitch = servo.getPitchAngle();
                float servoRoll = servo.getRollAngle();
                
                // Collect telemetry
                TelemetryPayload payload = telemetry.collect(
                    pitchDeg,
                    rollDeg,
                    yawDeg,
                    servoPitch,
                    servoRoll,
                    controlLoopCount
                );
                
                // Send telemetry
                if (!wsClient.sendTelemetry(payload)) {
                    telemetry.incrementErrorCount();
                }
            }
        }
        
        // Wait for next cycle (10 Hz)
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// ============================================================================
// Setup Function
// ============================================================================

void setup() {
    // Initialize serial for debugging
    Serial.begin(115200);
    delay(2000);  // Wait for serial monitor
    
    Serial.println("\n==============================================");
    Serial.println("ESP32 Gimbal Control System - Phase 3");
    Serial.println("PID Control + WebSocket Communication");
    Serial.println("==============================================");
    
    // Initialize mutex
    dataMutex = xSemaphoreCreateMutex();
    if (dataMutex == NULL) {
        Serial.println("[Setup] FATAL: Failed to create mutex");
        while (true) { delay(1000); }
    }
    
    // Connect to WiFi
    if (!connectWiFi()) {
        Serial.println("[Setup] WARNING: WiFi connection failed");
        Serial.println("  Continuing without network connectivity...");
    }
    
    // Initialize WebSocket client
    Serial.println("\n[Setup] Initializing WebSocket client...");
    wsClient.begin(WS_HOST, WS_PORT, WS_ENDPOINT);
    wsClient.onControlCommand(onControlCommand);
    wsClient.onPIDUpdate(onPIDUpdate);
    Serial.println("[Setup] WebSocket client configured");
    
    // Initialize MPU6050 sensor
    Serial.println("\n[Setup] Initializing MPU6050 sensor...");
    if (!sensor.begin(MPU6050_I2C_SDA, MPU6050_I2C_SCL, MPU6050_I2C_FREQ)) {
        Serial.println("[Setup] FATAL: Sensor initialization failed");
        Serial.printf("  Error: %s\n", sensor.getLastError());
        while (true) { delay(1000); }
    }
    
    // Calibrate sensor
    Serial.println("\n[Setup] Calibrating sensor (keep gimbal stationary)...");
    delay(2000);  // Give user time to stabilize
    
    if (!sensor.calibrate(1000)) {
        Serial.println("[Setup] WARNING: Calibration failed, using zero offsets");
    }
    
    // Initialize servo motors
    Serial.println("\n[Setup] Initializing servo motors...");
    if (!servo.begin(SERVO_PITCH_PIN, SERVO_ROLL_PIN, SERVO_PWM_FREQ)) {
        Serial.println("[Setup] FATAL: Servo initialization failed");
        while (true) { delay(1000); }
    }
    
    // Create FreeRTOS tasks
    Serial.println("\n[Setup] Creating FreeRTOS tasks...");
    
    // Task 1: Sensor task on Core 0 (100Hz)
    BaseType_t result = xTaskCreatePinnedToCore(
        sensorTask,              // Task function
        "SensorTask",            // Task name
        TASK_STACK_SENSOR,       // Stack size (2KB)
        NULL,                    // Parameters
        TASK_PRIORITY_SENSOR,    // Priority (2)
        &sensorTaskHandle,       // Task handle
        0                        // Core 0
    );
    
    if (result != pdPASS) {
        Serial.println("[Setup] FATAL: Failed to create sensor task");
        while (true) { delay(1000); }
    }
    
    // Task 2: Control task on Core 1 (50Hz)
    result = xTaskCreatePinnedToCore(
        controlTask,             // Task function
        "ControlTask",           // Task name
        TASK_STACK_CONTROL,      // Stack size (3KB)
        NULL,                    // Parameters
        TASK_PRIORITY_CONTROL,   // Priority (4)
        &controlTaskHandle,      // Task handle
        1                        // Core 1
    );
    
    if (result != pdPASS) {
        Serial.println("[Setup] FATAL: Failed to create control task");
        while (true) { delay(1000); }
    }
    
    // Task 3: Telemetry task on Core 1 (10Hz)
    result = xTaskCreatePinnedToCore(
        telemetryTask,           // Task function
        "TelemetryTask",         // Task name
        TASK_STACK_TELEMETRY,    // Stack size (2KB)
        NULL,                    // Parameters
        TASK_PRIORITY_TELEMETRY, // Priority (1)
        &telemetryTaskHandle,    // Task handle
        1                        // Core 1
    );
    
    if (result != pdPASS) {
        Serial.println("[Setup] FATAL: Failed to create telemetry task");
        while (true) { delay(1000); }
    }
    
    Serial.println("\n[Setup] System initialization complete");
    Serial.println("==============================================\n");
}

// ============================================================================
// Loop Function (runs on Core 1)
// ============================================================================

/**
 * Main loop - WebSocket processing and debug output
 * Phase 3: Process WebSocket events and print status
 */
void loop() {
    static unsigned long lastPrintTime = 0;
    unsigned long currentTime = millis();
    
    // Process WebSocket events
    wsClient.loop();
    
    // Print status every 1000ms
    if (currentTime - lastPrintTime >= 1000) {
        lastPrintTime = currentTime;
        
        // Read shared data (thread-safe)
        Attitude attitude;
        if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            attitude = latestAttitude;
            xSemaphoreGive(dataMutex);
            
            // Convert radians to degrees
            float pitchDeg = attitude.pitch * 180.0f / PI;
            float rollDeg = attitude.roll * 180.0f / PI;
            
            // Get PID outputs
            float pitchOutput = pidPitch.getOutput();
            float rollOutput = pidRoll.getOutput();
            
            // Get servo positions
            float servoPitch = servo.getPitchAngle();
            float servoRoll = servo.getRollAngle();
            
            // Print status
            Serial.println("========================================");
            Serial.printf("[WiFi]    Status: %s, RSSI: %d dBm\n", 
                         WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected",
                         WiFi.RSSI());
            Serial.printf("[WS]      Connected: %s, Sent: %u, Recv: %u\n",
                         wsClient.isConnected() ? "YES" : "NO",
                         wsClient.getMessagesSent(),
                         wsClient.getMessagesReceived());
            Serial.printf("[Current] Pitch: %6.2f°  Roll: %6.2f°\n", pitchDeg, rollDeg);
            Serial.printf("[Target]  Pitch: %6.2f°  Roll: %6.2f°\n", targetPitch, targetRoll);
            Serial.printf("[PID Out] Pitch: %6.2f°  Roll: %6.2f°\n", pitchOutput, rollOutput);
            Serial.printf("[Servo]   Pitch: %6.2f°  Roll: %6.2f°\n", servoPitch, servoRoll);
            Serial.printf("[Loops]   Control: %u\n", controlLoopCount);
            Serial.printf("[Heap]    Free: %d bytes\n", ESP.getFreeHeap());
        }
    }
    
    delay(10);
}
