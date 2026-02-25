/**
 * `TelemetryCollector.h`
 * - System telemetry data collection for ESP32 Gimbal
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#ifndef TELEMETRY_COLLECTOR_H
#define TELEMETRY_COLLECTOR_H

#include "../include/Protocol.h"
#include <WiFi.h>

/**
 * TelemetryCollector
 * - Collects system metrics and attitude data
 * - Populates TelemetryPayload structure
 */
class TelemetryCollector {
public:
    /**
     * Constructor
     */
    TelemetryCollector();
    
    /**
     * Collect all telemetry data
     * @param pitch Current pitch angle (degrees)
     * @param roll Current roll angle (degrees)
     * @param yaw Current yaw angle (degrees)
     * @param servoPitch Current servo pitch position (degrees)
     * @param servoRoll Current servo roll position (degrees)
     * @param loopCount Total control loop iterations
     * @return Populated telemetry payload
     */
    TelemetryPayload collect(
        float pitch, 
        float roll, 
        float yaw,
        float servoPitch,
        float servoRoll,
        uint32_t loopCount
    );
    
    /**
     * Get system uptime in milliseconds
     * @return Milliseconds since boot
     */
    uint32_t getUptime() const;
    
    /**
     * Get free heap memory
     * @return Free heap size in bytes
     */
    uint32_t getFreeHeap() const;
    
    /**
     * Get WiFi RSSI
     * @return Signal strength in dBm
     */
    int8_t getWiFiRSSI() const;
    
    /**
     * Get CPU load estimate
     * @return CPU load percentage (0-100)
     */
    uint8_t getCPULoad();
    
    /**
     * Increment task error counter
     */
    void incrementErrorCount();
    
    /**
     * Reset task error counter
     */
    void resetErrorCount();

private:
    uint8_t _taskErrors;
    uint32_t _lastCPUCheckTime;
    uint32_t _lastIdleTime;
};

#endif // TELEMETRY_COLLECTOR_H
