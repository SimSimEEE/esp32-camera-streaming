/**
 * `TelemetryCollector.cpp`
 * - System telemetry collection implementation
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#include "TelemetryCollector.h"
#include <Arduino.h>
#include <esp_system.h>

// ============================================================================
// Constructor
// ============================================================================
TelemetryCollector::TelemetryCollector()
    : _taskErrors(0)
    , _lastCPUCheckTime(0)
    , _lastIdleTime(0)
{
}

// ============================================================================
// Collect Telemetry Data
// ============================================================================
TelemetryPayload TelemetryCollector::collect(
    float pitch, 
    float roll, 
    float yaw,
    float servoPitch,
    float servoRoll,
    uint32_t loopCount
) {
    TelemetryPayload payload;
    
    // Timestamp
    payload.timestamp = getUptime();
    
    // Attitude
    payload.pitch = pitch;
    payload.roll = roll;
    payload.yaw = yaw;
    
    // Servo positions
    payload.servoPitch = servoPitch;
    payload.servoRoll = servoRoll;
    
    // System metrics
    payload.freeHeap = getFreeHeap();
    payload.cpuLoad = getCPULoad();
    payload.rssi = getWiFiRSSI();
    payload.taskErrors = _taskErrors;
    payload.reserved1 = 0;
    payload.loopCount = loopCount;
    payload.reserved2 = 0;
    
    return payload;
}

// ============================================================================
// Get System Uptime
// ============================================================================
uint32_t TelemetryCollector::getUptime() const {
    return millis();
}

// ============================================================================
// Get Free Heap Memory
// ============================================================================
uint32_t TelemetryCollector::getFreeHeap() const {
    return ESP.getFreeHeap();
}

// ============================================================================
// Get WiFi RSSI
// ============================================================================
int8_t TelemetryCollector::getWiFiRSSI() const {
    if (WiFi.status() == WL_CONNECTED) {
        return static_cast<int8_t>(WiFi.RSSI());
    }
    return -100;  // No signal
}

// ============================================================================
// Get CPU Load Estimate
// ============================================================================
uint8_t TelemetryCollector::getCPULoad() {
    // Simple CPU load estimation based on idle task
    // This is a rough approximation
    
    uint32_t now = millis();
    uint32_t elapsed = now - _lastCPUCheckTime;
    
    if (elapsed < 1000) {
        // Not enough time elapsed for accurate measurement
        return 0;
    }
    
    // Get idle task time (Note: This is a simplified approach)
    // For more accurate measurement, use esp_timer_get_time()
    uint32_t idleTime = esp_timer_get_time() / 1000;  // Convert to ms
    uint32_t idleDelta = idleTime - _lastIdleTime;
    
    // Calculate load percentage
    uint8_t load = 100;
    if (elapsed > 0) {
        uint32_t idlePercent = (idleDelta * 100) / elapsed;
        load = constrain(100 - idlePercent, 0, 100);
    }
    
    // Update for next measurement
    _lastCPUCheckTime = now;
    _lastIdleTime = idleTime;
    
    return load;
}

// ============================================================================
// Increment Error Counter
// ============================================================================
void TelemetryCollector::incrementErrorCount() {
    if (_taskErrors < 255) {
        _taskErrors++;
    }
}

// ============================================================================
// Reset Error Counter
// ============================================================================
void TelemetryCollector::resetErrorCount() {
    _taskErrors = 0;
}
