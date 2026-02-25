/**
 * `main.cpp`
 * - ESP32 gimbal firmware entry point
 * - FreeRTOS task initialization and coordination
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#include <Arduino.h>
#include "../include/Config.h"
#include "sensors/MPU6050Sensor.h"
#include "filters/ComplementaryFilter.h"

// ============================================================================
// Global Objects
// ============================================================================

MPU6050Sensor sensor;
ComplementaryFilter filter(COMP_FILTER_ALPHA);

// ============================================================================
// FreeRTOS Task Handles
// ============================================================================

TaskHandle_t sensorTaskHandle = NULL;

// ============================================================================
// Shared Data (Protected by Mutex)
// ============================================================================

SemaphoreHandle_t dataMutex = NULL;
SensorData latestSensorData;
Attitude latestAttitude;

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
// Setup Function
// ============================================================================

void setup() {
    // Initialize serial for debugging
    Serial.begin(115200);
    delay(2000);  // Wait for serial monitor
    
    Serial.println("\n==============================================");
    Serial.println("ESP32 Gimbal Control System - Phase 1");
    Serial.println("==============================================");
    
    // Initialize mutex
    dataMutex = xSemaphoreCreateMutex();
    if (dataMutex == NULL) {
        Serial.println("[Setup] FATAL: Failed to create mutex");
        while (true) { delay(1000); }
    }
    
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
    
    // Create sensor task on Core 0
    Serial.println("\n[Setup] Creating FreeRTOS tasks...");
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
    
    Serial.println("\n[Setup] System initialization complete");
    Serial.println("==============================================\n");
}

// ============================================================================
// Loop Function (runs on Core 1)
// ============================================================================

/**
 * Main loop - print attitude for debugging
 * In Phase 2, this will be replaced with PID control task
 */
void loop() {
    static unsigned long lastPrintTime = 0;
    unsigned long currentTime = millis();
    
    // Print attitude every 500ms
    if (currentTime - lastPrintTime >= 500) {
        lastPrintTime = currentTime;
        
        // Read shared data (thread-safe)
        Attitude attitude;
        if (xSemaphoreTake(dataMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
            attitude = latestAttitude;
            xSemaphoreGive(dataMutex);
            
            // Convert radians to degrees for readability
            float pitchDeg = attitude.pitch * 180.0f / PI;
            float rollDeg = attitude.roll * 180.0f / PI;
            float yawDeg = attitude.yaw * 180.0f / PI;
            
            Serial.printf("[Attitude] Pitch: %6.2f°  Roll: %6.2f°  Yaw: %6.2f°\n",
                pitchDeg, rollDeg, yawDeg);
        }
    }
    
    delay(10);
}
